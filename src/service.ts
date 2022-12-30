import type { Capabilities, Options, Services } from "@wdio/types";
import fs = require("fs");
import globby = require("globby");
const axios = require("axios");
import {
  getTestRailConfig,
  getAuthorization,
  getTestRunId,
} from "../bin/get-config.cjs";
import { findCases } from "../bin/find-cases.cjs";
import path = require("path");
import TestRailReporter = require("./reporter.js");

class TestrailWorkerService implements Services.ServiceInstance {
  options;
  private testRailInfo;

  constructor(serviceOptions, capabilities, config) {
    this.options = serviceOptions;
    this.testRailInfo = getTestRailConfig(process.env);
    axios.defaults.baseURL = `${this.testRailInfo.host}index.php?/api/v2`;
    const authorization = getAuthorization(this.testRailInfo);
    axios.defaults.headers.common["Content-Type"] = "application/json";
    axios.defaults.headers.common["Authorization"] = authorization;
  }

  async findSpecs(pattern) {
    // @ts-ignore
    return globby(pattern, {
      absolute: true,
    });
  }

  async post(endpoint: string, body: object) {
    try {
      const response = await axios.post(endpoint, body);
      return response.data;
    } catch (error) {
      console.error("Error: %s", JSON.stringify(error.body));
    }
  }

  async startRun({ config, testRailInfo, name, description, caseIds }) {
    // only output the run ID to the STDOUT, everything else is logged to the STDERR
    console.error(
      "creating new TestRail run for project %s",
      testRailInfo.projectId
    );
    if (caseIds && caseIds.length > 0) {
      console.error("With %d case IDs", caseIds.length);
    }

    const addRunUrl = `/add_run/${testRailInfo.projectId}`;

    const json: {
      name: string;
      description: string;
      include_all?: boolean;
      case_ids?: unknown[];
      suite_id?: number;
    } = {
      name,
      description,
    };
    if (caseIds && caseIds.length > 0) {
      const uniqueCaseIds = [...new Set(caseIds)];
      json.include_all = false;
      json.case_ids = uniqueCaseIds;
    }

    let suiteId = config["suite"] || testRailInfo.suiteId;
    if (suiteId) {
      // let the user pass the suite ID like the TestRail shows it "S..."
      // or just the number
      if (suiteId.startsWith("S")) {
        suiteId = suiteId.substring(1);
      }
      json.suite_id = Number(suiteId);
    }

    const run = await this.post(addRunUrl, json);
    const runId = run.id.toString();
    console.log("Creating run...");
    const filename = path.join(process.cwd(), "runId.txt");
    fs.writeFileSync(filename, runId);
  }

  async createRun(config) {
    const runName = config["name"] || "Automation run";
    const description = config["description"] || "";
    let tagged;
    let negativeTagged = [];
    if (config["tags"]) {
      tagged = config["tags"]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (config["excludeTags"]) {
      negativeTagged = config["excludeTags"]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (config["spec"] || config["specs"]) {
      let specs = [];
      if (config["specs"]) {
        specs = await this.findSpecs(config["specs"]);
      } else {
        specs = await this.findSpecs(config["spec"]);
      }
      const caseIds = await findCases(
        specs,
        fs.readFileSync,
        tagged,
        negativeTagged
      );

      if (config["dry"]) {
        console.log("Dry run, not starting a new run");
      } else {
        const testRailInfo = getTestRailConfig(process.env);
        await this.startRun({
          config,
          testRailInfo,
          name: runName,
          description,
          caseIds,
        });
      }
    } else {
      const testRailInfo = getTestRailConfig(process.env);
      // start a new test run for all test cases
      // @ts-ignore
      await this.startRun({
        config,
        testRailInfo,
        name: runName,
        description,
      });
    }
  }

  async onPrepare(config, capabilities) {
    if (config["testrail"]) {
      await this.createRun(config);
    }
  }

  beforeSession(
    config: Omit<Options.Testrunner, "capabilities">,
    capabilities: Capabilities.RemoteCapability,
    specs: string[],
    cid: string
  ): void {
    let tagExp = "";
    let notTagExp = "";
    let tags = false;
    let onlyNegative = false;
    if (config["tags"]) {
      const tagged = config["tags"].replaceAll(",", "|");
      tagExp = `.*?(${tagged})`;
      tags = true;
    }
    if (config["excludeTags"]) {
      const excludeTags = config["excludeTags"].replaceAll(",", "|");
      notTagExp = `(?!(.*(${excludeTags})))`;
      if (!tags) {
        onlyNegative = true;
      }
      tags = true;
    }
    const expression = tags
      ? `${onlyNegative ? "^(?!.*-@)|" : ""}-@${notTagExp}${tagExp}`
      : ".*";
    let mochaDefault = { ...config.mochaOpts, grep: expression };
    config.mochaOpts = mochaDefault;
    if (config["testrail"]) {
      config.reporters.push([TestRailReporter, {}]);
    }
  }

  async onComplete(exitCode, config, capabilities) {
    if (config["closeRun"] && exitCode === 0) {
      console.log("Closing run...");
      const runId = getTestRunId();
      const closeRunUrl = `/close_run/${runId}`;
      await this.post(closeRunUrl, {});
    }
  }
}
export = TestrailWorkerService;
