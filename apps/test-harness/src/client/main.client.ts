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
if (!testezInstance.IsA("ModuleScript")) {
  error("[test-harness] Expected ReplicatedStorage/node_modules/@rbxts/testez to be a ModuleScript.");
}

const TestEZ = require(testezInstance) as TestEZModule;

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
