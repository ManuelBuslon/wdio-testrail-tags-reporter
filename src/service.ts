import type { Capabilities, Options, Services } from "@wdio/types";
import * as arg from "arg";

class TestrailWorkerService implements Services.ServiceInstance {
  async onPrepare(config, capabilities) {
    const args = arg(
      {
        "--spec": String,
        "--name": String,
        "--description": String,
        "--tagged": String,
        "--notTagged": String,
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
    console.log("Generating run...");
    console.log(config);
    console.log(capabilities);
    console.log(args);
  }

  onComplete(exitCode, config, capabilities) {
    console.log("Closing run...");
  }
}
export = TestrailWorkerService;
