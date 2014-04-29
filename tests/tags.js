if (typeof require != 'undefined') {
    if (typeof QUnit == 'undefined') {
        QUnit = require('qunit-cli');
    }
    if (typeof Markdown == 'undefined') {
        Markdown = require('../js-markdown-extra.js').Markdown;
    }
}
QUnit.module( "Tags tests" );

/**
 * Test 01 - Raw tags
 */
QUnit.test( "01 - Raw tags", function() {
    var input =
        '<img src="blah.png" class="abc">' + "\n";

    var expected =
        '<p><img src="blah.png" class="abc"></p>' + "\n";

    var result = Markdown(input);
    QUnit.assert.equal(result, expected);
});
