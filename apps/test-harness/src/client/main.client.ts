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
    run: (roots: Array<Instance>, reporter?: Reporter) => RunResults;
  };
  Reporters: {
    TextReporter: Reporter;
  };
};

const ReplicatedStorage = game.GetService("ReplicatedStorage");
const testezInstance = ReplicatedStorage.WaitForChild("node_modules").WaitForChild("@rbxts").WaitForChild("testez");

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

const results = TestEZ.TestBootstrap.run([testsRoot], TestEZ.Reporters.TextReporter);
if (results.failureCount > 0) {
  warn(
    `[test-harness] TestEZ failures detected. failed=${results.failureCount}, passed=${results.successCount}, skipped=${results.skippedCount}`,
  );

  for (const message of results.errors) {
    warn(message);
  }

  error(`[test-harness] Failing run because ${results.failureCount} test(s) failed.`);
}

print(`[test-harness] TestEZ passed. passed=${results.successCount}, skipped=${results.skippedCount}`);
