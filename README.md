#Testrail Reporter for Mocha

Pushes test results into Testrail system.

## Installation

```shell
$ npm install mocha-testrail-reporter-tags --save-dev
```

## Environment variables

When running the Cypress tests on CI, you need to provide the TestRail server variables through the [process (OS) environment variables](https://en.wikipedia.org/wiki/Environment_variable). The following variables should be set:

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

## Usage
Ensure that your testrail installation API is enabled and generate your API keys. See http://docs.gurock.com/

npx testrail-start-run \
  --name "test run" \
  --description "test run description" \
  --spec "cypress/integration/featureA/**.js"
  
Run mocha with `mocha-testrail-reporter-tags`:

```shell
$ mocha test --reporter mocha-testrail-reporter-tags
```

or use a mocha.options file
```shell
mocha --opts mocha-testrail.opts build/test
--recursive
--reporter mocha-testrail-reporter-tags
--no-exit
```


Mark your mocha test names with ID of Testrail test cases. Ensure that your case ids are well distinct from test descriptions.
 
```Javascript
it("C123 C124 Authenticate with invalid user", () => {})
it("Authenticate a valid user C321", () => {})
```

Only passed or failed tests will be published. Skipped or pending tests will not be published resulting in a "Pending" status in testrail test run.

## Build and test locally

### Setup testrail test server

- Start a new TestRail trial from https://www.gurock.com/testrail/test-management/
- Enable API under https://XXX.testrail.io/index.php?/admin/site_settings&tab=8
- Add a new project (Use multiple test suites to manage cases)
- Add a new test suite (ids: 1)
- Add at least 4 test cases (ids: C1, C2, C3, C4, etc)
- Once setup, set your environment variables - recommend using .env file in the root folder
  - TESTRAIL_DOMAIN=XXX.testrail.io 
  - TESTRAIL_USERNAME=XXX 
  - TESTRAIL_PASSWORD=XXX 
  - TESTRAIL_PROJECTID=1 
  - TESTRAIL_SUITEID=1 
  - TESTRAIL_ASSIGNEDTOID=1
- Execute the build and test commands (unit and integration tests)
- Execute the e2e test (requires build and .env file)

### Build and test
```
npm run clean
npm run build
npm run test
```

## References
- http://mochajs.org/#mochaopts
- https://github.com/mochajs/mocha/wiki/Third-party-reporters
- http://docs.gurock.com/testrail-api2/start

Acknowledgments

* [Gleb Bahmutov](https://github.com/bahmutov), owner of the [find-test-names](https://github.com/bahmutov/find-test-names) repository that was forked.

* [Pierre Awaragi](https://github.com/awaragi), owner of the [mocha-testrail-reporter](https://github.com/awaragi/mocha-testrail-reporter).