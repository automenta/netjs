//TODO convert to Mocha and remove qunit dependency

var testrunner = require("qunit");

var coverage = false;

testrunner.setup({
    log: {
        summary: true,            
        errors: true, // log expected and actual values for failed tests
        coverage: coverage, // log coverage
        globalCoverage: coverage // log global coverage (all files)
    },
    coverage: coverage
});


testrunner.run({
    code: "util/util.js",
    tests: [ "client/test/test_object.js", "client/test/test_ontology.js" ]
}, function(err, report) {
    console.dir(report);
});
