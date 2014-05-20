var testrunner = require("qunit");

testrunner.setup({
    log: {
        summary: true,            
        errors: true, // log expected and actual values for failed tests
        coverage: true, // log coverage
        globalCoverage: true // log global coverage (all files)
    },
    coverage: false
});

// using testrunner callback
testrunner.run({
    code: "client/util.js",
    tests: [ "client/test/test_object.js", "client/test/test_ontology.js" ]
}, function(err, report) {
    console.dir(report);
});