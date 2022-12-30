#!/usr/bin/env node

// @ts-check
const fs = require("fs");
const arg = require("arg");
const got = require("got");
const globby = require("globby");
const { getTestRailConfig, getAuthorization } = require("./get-config.cjs");
const { findCases } = require("./find-cases.cjs");

const args = arg(
  {
    "--spec": String,
    "--name": String,
    "--description": String,
    "--suite": String,
    // find the specs automatically using
    "--find-specs": Boolean,
    // filter all found specs by the given tag(s)
    "--tags": String,
    "--excludeTags": String,
    // do not open the test run, just find everything
    "--dry": Boolean,
    // aliases
    "-s": "--spec",
    "-n": "--name",
    "-d": "--description",
    "-st": "--suite",
  },
  { permissive: true }
);
// optional arguments
const runName = args["--name"] || args._[0];
const description = args["--description"] || args._[1];

function findSpecs(pattern) {
  // @ts-ignore
  return globby(pattern, {
    absolute: true,
  });
}

async function getTestSuite(suiteId, testRailInfo) {
  const getSuiteUrl = `${testRailInfo.host}/index.php?/api/v2/get_cases/${testRailInfo.projectId}&suite_id=${suiteId}`;
  const authorization = getAuthorization(testRailInfo);

  // @ts-ignore
  const json = await got(getSuiteUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization,
    },
  }).json();

  return json;
}

async function startRun({ testRailInfo, name, description, caseIds }) {
  // only output the run ID to the STDOUT, everything else is logged to the STDERR
  console.error(
    "creating new TestRail run for project %s",
    testRailInfo.projectId
  );
  if (caseIds && caseIds.length > 0) {
    console.error("With %d case IDs", caseIds.length);
  }

  const addRunUrl = `${testRailInfo.host}/index.php?/api/v2/add_run/${testRailInfo.projectId}`;
  const authorization = getAuthorization(testRailInfo);

  const json = {
    name,
    description,
  };
  if (caseIds && caseIds.length > 0) {
    const uniqueCaseIds = [...new Set(caseIds)];
    json.include_all = false;
    json.case_ids = uniqueCaseIds;
  }

  let suiteId = args["--suite"] || testRailInfo.suiteId;
  if (suiteId) {
    // let the user pass the suite ID like the TestRail shows it "S..."
    // or just the number
    if (suiteId.startsWith("S")) {
      suiteId = suiteId.substring(1);
    }
    json.suite_id = Number(suiteId);
    // simply print all test cases
    await getTestSuite(suiteId, testRailInfo);
  }

  // @ts-ignore
  return got(addRunUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization,
    },
    json,
  })
    .json()
    .then(
      (json) => {
        process.stdout.write(`${json.id}`);
      },
      (error) => {
        console.error("Could not create a new TestRail run");
        console.error("Response: %s", error.name);
        console.error("Please check your TestRail configuration");
        if (json.case_ids) {
          console.error("and the case IDs: %s", json.case_ids);
        }
        process.exit(1);
      }
    );
}

if (args["--find-specs"]) {
  const specs = findSpecs(args["--find-specs"]);

  let tagged;
  let negativeTagged = [];
  if (args["--tags"]) {
    tagged = args["--tags"]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (args["--excludeTags"]) {
    negativeTagged = args["--excludeTags"]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const caseIds = findCases(specs, fs.readFileSync, tagged, negativeTagged);

  if (args["--dry"]) {
    console.log("Dry run, not starting a new run");
  } else {
    const testRailInfo = getTestRailConfig(process.env);
    startRun({ testRailInfo, name: runName, description, caseIds });
  }
} else if (args["--spec"]) {
  findSpecs(args["--spec"]).then((specs) => {
    const caseIds = findCases(specs, fs.readFileSync, [], []);

    const testRailInfo = getTestRailConfig(process.env);
    startRun({ testRailInfo, name: runName, description, caseIds });
  });
} else {
  const testRailInfo = getTestRailConfig(process.env);
  // start a new test run for all test cases
  // @ts-ignore
  startRun({ testRailInfo, name: runName, description });
}
