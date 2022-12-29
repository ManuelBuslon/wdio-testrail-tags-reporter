#!/usr/bin/env node

// @ts-check

import { getAuthorization } from "./get-config.cjs";

const arg = require("arg");
const { getTestRunId, getTestRailConfig } = require("./get-config.cjs");

const args = arg(
  {
    "--run": Number,
    "--force": Boolean,
    "--configFile": String,
  },
  { permissive: true }
);

let runId;

if (args["--run"]) {
  runId = args["--run"];
} else {
  const runIdStr = args._[0];
  if (!runIdStr) {
    runId = getTestRunId(null);
  } else {
    runId = parseInt(runIdStr, 10);
  }
}

if (!runId) {
  console.error("Usage: testrail-close-run.js --run <number runId> [--force]");
  console.error("or pass it in the file runId.txt");
  process.exit(1);
}

const testRailInfo = getTestRailConfig(process.env);

closeTestRun(runId, testRailInfo).then((json) => {
  console.log("Closed run %d", json.id);
  console.log("name: %s", json.name);
  console.log("description: %s", json.description);
  console.log("passed tests: %d", json.passed_count);
  console.log("failed tests: %d", json.failed_count);
  console.log("blocked (pending) tests: %d", json.blocked_count);
  // untested count should be zero if all tests are done
  // or could be positive number if "--force" was used
  console.log("untested: %d", json.untested_count);
});

async function closeTestRun(runId, testRailInfo) {
  console.log(
    "closing the TestRail run %d for project %s",
    runId,
    testRailInfo.projectId
  );
  const closeRunUrl = `${testRailInfo.host}/index.php?/api/v2/close_run/${runId}`;
  const authorization = getAuthorization(testRailInfo);

  // @ts-ignore
  const json = await got(closeRunUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization,
    },
    json: {
      name: "Started run",
      description: "Checking...",
    },
  }).json();

  return json;
}
