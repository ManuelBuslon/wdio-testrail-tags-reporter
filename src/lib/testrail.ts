import request = require("unirest");
import { TestRailOptions, TestRailResult } from "./testrail.interface";
import {
  getAuthorization,
  getTestRailConfig,
  getTestRunId,
} from "./get-config";

/**
 * TestRail basic API wrapper
 */
export class TestRail {
  private base: String;

  constructor(private options: TestRailOptions) {
    // check if all required options are specified
    ["username", "password", "domain", "projectId", "projectId"].forEach(
      (option) => {
        if (!options[option]) {
          throw new Error(`Missing required option ${option}`);
        }
      }
    );

    // compute base url
    this.base = `https://${options.domain}/index.php`;
  }

  private _post(api: String, body: any, callback: Function, error?: Function) {
    const testRailInfo = getTestRailConfig(process.env);
    const authorization = getAuthorization(testRailInfo);
    request("POST", this.base)
      .query(`/api/v2/${api}`)
      .headers({
        "content-type": "application/json",
        authorization,
      })
      .type("json")
      .send(body)
      .end((res) => {
        if (res.error) {
          console.log("Error: %s", JSON.stringify(res.body));
          if (error) {
            error(res.error);
          } else {
            throw new Error(res.error);
          }
        }
        callback(res.body);
      });
  }

  private _get(api: String, callback: Function, error?: Function): void {
    const testRailInfo = getTestRailConfig(process.env);
    const authorization = getAuthorization(testRailInfo);
    request("GET", this.base)
      .query(`/api/v2/${api}`)
      .headers({
        "content-type": "application/json",
        authorization,
      })
      .type("json")
      .end((res) => {
        if (res.error) {
          console.log("Error: %s", JSON.stringify(res.body));
          if (error) {
            error(res.error);
          } else {
            throw new Error(res.error);
          }
        }
        callback(res.body);
      });
  }

  /**
   * Fetchs test cases from projet/suite based on filtering criteria (optional)
   * @param {{[p: string]: number[]}} filters
   * @param {Function} callback
   */
  public fetchCases(
    filters?: { [key: string]: number[] },
    callback?: Function
  ): void {
    let filter = "";
    if (filters) {
      for (let key in filters) {
        if (filters.hasOwnProperty(key)) {
          filter += "&" + key + "=" + filters[key].join(",");
        }
      }
    }

    this._get(
      `get_cases/${this.options.projectId}&suite_id=${this.options.suiteId}${filter}`,
      (body) => {
        if (callback) {
          callback(body.cases);
        }
      }
    );
  }

  /**
   * Publishes results of execution of an automated test run
   * @param {string} name
   * @param {string} description
   * @param {TestRailResult[]} results
   * @param {Function} callback
   */
  public publish(results: TestRailResult[], callback?: Function): void {
    console.log(`Publishing ${results.length} test result(s) to ${this.base}`);

    const runId = getTestRunId();
    console.log(`Results published to ${this.base}?/runs/view/${runId}`);
    this._post(
      `add_results_for_cases/${runId}`,
      {
        results: results,
      },
      (body) => {
        // execute callback if specified
        if (callback) {
          callback(body);
        }
      }
    );
  }
}
