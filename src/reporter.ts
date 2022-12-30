import { titleToCaseIds } from "./shared";
import { StatusP, TestRailResult } from "./testrail.interface";
import WDIOReporter, { TestStats } from "@wdio/reporter";
const SpecReporter = require("@wdio/spec-reporter").default;
const axios = require("axios");
import {
  getAuthorization,
  getTestRailConfig,
  getTestRunId,
} from "../bin/get-config.cjs";

class TestRailReporter extends WDIOReporter {
  private testRailInfo;
  private runId: number;
  private sync: boolean;
  private results;

  constructor(options) {
    super(options);
    this.results = [];
    this.sync = false;

    this.testRailInfo = getTestRailConfig(process.env);
    axios.defaults.baseURL = `${this.testRailInfo.host}index.php?/api/v2`;
    const authorization = getAuthorization(this.testRailInfo);
    axios.defaults.headers.common["Content-Type"] = "application/json";
    axios.defaults.headers.common["Authorization"] = authorization;
  }

  onRunnerStart() {
    this.runId = getTestRunId();
  }

  onTestEnd(testStats: TestStats): void {
    let caseIds = titleToCaseIds(testStats.title);
    if (caseIds.length > 0) {
      caseIds.forEach((caseId) => {
        this.results.push({
          case_id: caseId,
          status_id: StatusP[testStats.state],
          comment: `${testStats.title} (${testStats.duration}ms)`,
        });
      });
    }
  }

  get isSynchronised() {
    return this.sync;
  }

  async post(endpoint: string, body: object) {
    try {
      const response = await axios.post(endpoint, body);
      return response.data;
    } catch (error) {
      console.error("Error: %s", JSON.stringify(error.body));
    }
  }

  async onRunnerEnd(runner) {
    if (this.runId != 0 && this.results.length > 0) {
      await this.post(`/add_results_for_cases/${this.runId}`, {
        results: this.results,
      });
      this.sync = true;
    }
  }
}
export = TestRailReporter;
