type RunResults = {
  errors: ReadonlyArray<string>;
  failureCount: number;
  skippedCount: number;
  successCount: number;
};

type Reporter = {
  report: (results: RunResults) => void;
};

type TestEZModule = {
  TestBootstrap: {
    getModules: (
      self: unknown,
      root: Instance,
    ) => Array<{
      method: Callback;
      path: Array<string>;
      pathStringForSorting: string;
    }>;
  };
  TestPlanner: {
    createPlan: (
      modules: Array<{
        method: Callback;
        path: Array<string>;
        pathStringForSorting: string;
      }>,
    ) => object;
  };
  TestRunner: {
    runPlan: (plan: object) => RunResults;
  };
  Reporters: {
    TextReporter: Reporter;
  };
};

const VERBOSE = false;

type TestEZModuleRecord = {
  method: Callback;
  path: Array<string>;
  pathStringForSorting: string;
};

const getFirstLine = (message: string): string => {
  const lines = message.split("\n");
  return lines[0] ?? "";
};

const trimWhitespace = (value: string): string => {
  const [trimmedLeft] = value.gsub("^%s+", "");
  const [trimmed] = (trimmedLeft as string).gsub("%s+$", "");
  return trimmed as string;
};

const stripInternalPrefixes = (value: string): string => {
  const [withoutPlayerPrefix] = value.gsub("^Players%.[^%.]+%.PlayerScripts%.TestHarness%.", "");
  const [withoutPlayerScriptsPrefix] = (withoutPlayerPrefix as string).gsub("^PlayerScripts%.TestHarness%.", "");
  const [withoutHarnessPrefix] = (withoutPlayerScriptsPrefix as string).gsub("^TestHarness%.", "");

  return withoutHarnessPrefix as string;
};

const normalizePathLikeSegment = (value: string): string => {
  const stripped = stripInternalPrefixes(value);
  const [testsPath] = stripped.gsub("^tests%.", "tests/");
  const [slashPath] = (testsPath as string).gsub("%.", "/");

  return slashPath as string;
};

const parseFailureSummary = (errorMessage: string): string => {
  const firstLine = trimWhitespace(getFirstLine(errorMessage));
  const strippedLine = stripInternalPrefixes(firstLine);

  const [firstColonIndex] = string.find(strippedLine, ":", 1, true);
  const secondColonResult =
    firstColonIndex !== undefined ? string.find(strippedLine, ":", firstColonIndex + 1, true) : undefined;
  const [secondColonIndex] = secondColonResult ?? [];

  if (
    firstColonIndex !== undefined &&
    secondColonIndex !== undefined &&
    firstColonIndex > 1 &&
    secondColonIndex > firstColonIndex + 1
  ) {
    const rawPath = trimWhitespace(string.sub(strippedLine, 1, firstColonIndex - 1));
    const lineCandidate = trimWhitespace(string.sub(strippedLine, firstColonIndex + 1, secondColonIndex - 1));
    const message = trimWhitespace(string.sub(strippedLine, secondColonIndex + 1));
    const lineNumber = tonumber(lineCandidate);

    if (rawPath !== "" && lineNumber !== undefined && message !== "") {
      return `${normalizePathLikeSegment(rawPath)}:${lineCandidate}: ${message}`;
    }
  }

  return normalizePathLikeSegment(strippedLine);
};

const getFailureSummaries = (errors: ReadonlyArray<string>): Array<string> => {
  const summaries: Array<string> = [];
  const seen = new Set<string>();

  for (const errorMsg of errors) {
    const normalized = parseFailureSummary(errorMsg);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      summaries.push(normalized);
    }
  }

  return summaries;
};

const ReplicatedStorage = game.GetService("ReplicatedStorage");
const RunService = game.GetService("RunService");
const Workspace = game.GetService("Workspace");
const testezInstance = ReplicatedStorage.WaitForChild("node_modules").WaitForChild("@rbxts").WaitForChild("testez");

const TEST_HARNESS_STATUS_ATTRIBUTE = "TestHarnessStatus";
const TEST_HARNESS_FAILURE_ATTRIBUTE = "TestHarnessFailure";

const waitForRuntimeReady = () => {
  const timeoutSeconds = 5;
  const startedAt = os.clock();

  while (os.clock() - startedAt < timeoutSeconds) {
    const camera = Workspace.CurrentCamera;
    if (camera && camera.ViewportSize.X > 0 && camera.ViewportSize.Y > 0) {
      break;
    }

    RunService.Heartbeat.Wait();
  }

  RunService.Heartbeat.Wait();
};

const resolveTestEZModule = (instance: Instance): ModuleScript | undefined => {
  if (instance.IsA("ModuleScript")) {
    return instance;
  }

  if (!instance.IsA("Folder")) {
    return undefined;
  }

  const directInit = instance.FindFirstChild("init");
  if (directInit?.IsA("ModuleScript")) {
    return directInit;
  }

  const srcChild = instance.FindFirstChild("src");
  if (srcChild?.IsA("ModuleScript")) {
    return srcChild;
  }

  if (!srcChild?.IsA("Folder")) {
    return undefined;
  }

  const srcInit = srcChild.FindFirstChild("init");
  if (srcInit?.IsA("ModuleScript")) {
    return srcInit;
  }

  return undefined;
};

const testezModule = resolveTestEZModule(testezInstance);
if (!testezModule) {
  error("[test-harness] Could not resolve TestEZ ModuleScript from ReplicatedStorage/node_modules/@rbxts/testez.");
}

const TestEZ = require(testezModule) as TestEZModule;

const parent = script.Parent;
if (!parent) {
  error("[test-harness] Test runner script must have a parent instance.");
}

const testsRoot = parent.FindFirstChild("tests");
if (!testsRoot) {
  error("[test-harness] Expected script.Parent.tests to exist.");
}

waitForRuntimeReady();

ReplicatedStorage.SetAttribute(TEST_HARNESS_STATUS_ATTRIBUTE, "running");
ReplicatedStorage.SetAttribute(TEST_HARNESS_FAILURE_ATTRIBUTE, "");

let finalStatus = "passed";
let finalFailureMessage = "";

try {
  const modules = TestEZ.TestBootstrap.getModules(TestEZ.TestBootstrap, testsRoot) as Array<TestEZModuleRecord>;

  warn(`[test-harness] Running ${modules.size()} TestEZ module(s).`);

  let results: RunResults = {
    errors: [],
    failureCount: 0,
    skippedCount: 0,
    successCount: 0,
  };

  for (const moduleRecord of modules) {
    if (VERBOSE) {
      warn(`[test-harness] Running module ${moduleRecord.pathStringForSorting}`);
    }

    const plan = TestEZ.TestPlanner.createPlan([moduleRecord]);
    const nextResults = TestEZ.TestRunner.runPlan(plan);
    results = {
      errors: [...results.errors, ...nextResults.errors],
      failureCount: results.failureCount + nextResults.failureCount,
      skippedCount: results.skippedCount + nextResults.skippedCount,
      successCount: results.successCount + nextResults.successCount,
    };

    if (VERBOSE) {
      warn(
        `[test-harness] Finished module ${moduleRecord.pathStringForSorting}. failed=${nextResults.failureCount}, passed=${nextResults.successCount}, skipped=${nextResults.skippedCount}`,
      );
    }
  }

  if (VERBOSE) {
    const [reporterSuccess, reporterError] = pcall(() => {
      TestEZ.Reporters.TextReporter.report(results);
    });
    if (!reporterSuccess) {
      warn(`[test-harness] TextReporter failed: ${tostring(reporterError)}`);
    }
  }

  const totalCount = results.failureCount + results.successCount + results.skippedCount;
  if (totalCount === 0) {
    finalStatus = "failed";
    finalFailureMessage =
      "[test-harness] No tests were discovered. Expected at least one .spec ModuleScript under script.Parent.tests.";
  } else if (results.failureCount > 0) {
    finalStatus = "failed";

    const summaries = getFailureSummaries(results.errors);
    const failureLines = [
      `[test-harness] FAIL failed=${results.failureCount}, passed=${results.successCount}, skipped=${results.skippedCount}`,
    ];

    for (const summary of summaries) {
      failureLines.push(`[test-harness] ${summary}`);
    }

    finalFailureMessage = failureLines.join("\n");

    warn(finalFailureMessage);

    if (VERBOSE) {
      for (const message of results.errors) {
        warn(`[test-harness] Raw error: ${message}`);
      }
    }
  } else {
    warn(`[test-harness] PASS passed=${results.successCount}, skipped=${results.skippedCount}`);
  }
} catch (errorObject) {
  finalStatus = "failed";
  finalFailureMessage = `[test-harness] Unexpected harness error: ${tostring(errorObject)}`;
  warn(finalFailureMessage);
}

ReplicatedStorage.SetAttribute(TEST_HARNESS_STATUS_ATTRIBUTE, finalStatus);
ReplicatedStorage.SetAttribute(TEST_HARNESS_FAILURE_ATTRIBUTE, finalFailureMessage);

if (finalStatus === "failed") {
  error(finalFailureMessage);
}
