#Testrail Reporter for wdio

Pushes test results into Testrail system.

## Installation

```shell
$ npm install wdio-testrail-tags-reporter --save-dev
```

## Environment variables

You need to provide the TestRail server variables through the [process (OS) environment variables](https://en.wikipedia.org/wiki/Environment_variable). The following variables should be set:

```
TESTRAIL_HOST=
TESTRAIL_USERNAME=
; the user password or API key for the user
; API key is preferred
TESTRAIL_PASSWORD=
; Note: the project ID is not very sensitive value
TESTRAIL_PROJECTID=
; if you use suites, add a suite ID (with S or without)
TESTRAIL_SUITEID=...
```

Import this library in you wdio.conf.js

    const { 
        TestrailReporter, 
        TestrailService,
        } = require("wdio-testrail-tags-reporter");

Your reporters should look like this:

    reporters: ["spec", [TestrailReporter, {}]],

Your services should look like this:

    services: [[TestrailService, {}]],

## Usage

It is possible to use tags for positive or negative matching of tests with the --tags and --excludeTags parameters

    --tags Smoke,Development
    --excludeTags Production,Bug

[Tags system](https://github.com/ManuelBuslon/find-test-names/tree/mocha-version)

Ensure that your testrail installation API is enabled and generate your API keys. See http://docs.gurock.com/
  
    npx wdio run config/wdio.app.conf.ts \
        --name "Android automation run - Real device" \
        --description "test run description" \
        --spec "src/specs/**.ts" \
        --testrail

* The testrail tag is optional and should only be used if you want to use testrail integration.

* If you want to use testrail but not create a run you can include --dry

Mark your tests names with ID of Testrail test cases. Ensure that your case ids are well distinct from test descriptions.
 
```Javascript
it("C123 C124 Authenticate with invalid user", () => {})
it("Authenticate a valid user C321 -@ Smoke", () => {})
```

Only passed or failed tests will be published. Skipped or pending tests will not be published resulting in a "Pending" status in testrail test run.

### Build and test
```
npm run clean
npm run build
```

## References
- http://mochajs.org/#mochaopts
- https://github.com/mochajs/mocha/wiki/Third-party-reporters
- http://docs.gurock.com/testrail-api2/start

Acknowledgments

* [Gleb Bahmutov](https://github.com/bahmutov), owner of the [find-test-names](https://github.com/bahmutov/find-test-names) repository that was forked.

* [Pierre Awaragi](https://github.com/awaragi), owner of the [mocha-testrail-reporter](https://github.com/awaragi/mocha-testrail-reporter).