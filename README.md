# Testrail Reporter for WebdriverIO



Pushes test results into TestRail.



## Installation



`$ npm install wdio-testrail-tags-reporter --save-dev`



## Environment variables



You need to provide the TestRail server variables through the [process (OS) environment variables](https://en.wikipedia.org/wiki/Environment_variable). The following variables should be set:



    TESTRAIL_HOST=

    TESTRAIL_USERNAME=`
    `; The user password or API key for the user. API key is preferred

    TESTRAIL_PASSWORD=

    TESTRAIL_PROJECTID=
    ; Optional: If you use suites, add a suite ID (with S or without)

    TESTRAIL_SUITEID=...



Import this library in your wdio.conf.js



    const { 

    TestrailService

    } = require("wdio-testrail-tags-reporter");`



Your services should look like this:



`services: [[TestrailService, {}]],`



## Usage



Ensure that your TestRail installation API is enabled and generate your API keys. See [https://support.gurock.com/hc/en-us/articles/7077039051284-Accessing-the-TestRail-API#authentication-0-0](http://docs.gurock.com/)



    npx wdio run config/wdio.app.conf.ts \

    --name "Android automation run - Real device" \

    --description "test run description" \

    --spec "src/specs/**.ts" \

    --testrail



- The testrail tag is optional and should only be used if you want to use TestRail integration.

- If you had to stop the execution (hence, the run was not closed), you can run back the execution on the same TestRail run with --dry. This will report the results to the latest open run.

- User --closeRun to close the run after finishing the tests

Mark your tests names with the IDs of TestRail test cases. Ensure that your test case IDs are separated with a blank space from the test description.



### Examples



    it("C123 C124 Authenticate with invalid user", () => {})

    it("Authenticate a valid user C321", () => {})




Only passed or failed tests will be published. Skipped or pending tests will not be published resulting in a "Pending" status in the TestRail test run.



## Tags



It is possible to use tags for positive or negative matching of tests with the --tags and --excludeTags parameters



### Examples



`it("C321 Authenticate a valid user -@ Smoke", () => {})`



    --tags Smoke,Development

    --excludeTags Production,Bug



For more information about tags refer to [Tags system](https://github.com/ManuelBuslon/find-test-names/tree/mocha-version)



### Build and test



    npm run clean 

    npm run build



## References



- [http://mochajs.org/#mochaopts](http://mochajs.org/#mochaopts)

- [https://github.com/mochajs/mocha/wiki/Third-party-reporters](https://github.com/mochajs/mocha/wiki/Third-party-reporters)

- [http://docs.gurock.com/testrail-api2/start](http://docs.gurock.com/testrail-api2/start)



Acknowledgments



- [Gleb Bahmutov](https://github.com/bahmutov), owner of the [find-test-names](https://github.com/bahmutov/find-test-names).

- [Pierre Awaragi](https://github.com/awaragi), owner of the [mocha-testrail-reporter](https://github.com/awaragi/mocha-testrail-reporter).