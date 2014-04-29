if (typeof require != 'undefined') {
    if (typeof QUnit == 'undefined') {
        QUnit = require('qunit-cli');
    }
    if (typeof Markdown == 'undefined') {
        Markdown = require('../js-markdown-extra.js').Markdown;
    }
}
QUnit.module( "Abbreviation tests" );

/**
 * Test 01 - To retain spaces
 */
QUnit.test( "01 - To retain spaces", function() {
    var input =
        "*[HTML]: Hyper Text Markup Language" + "\n" +
        "\n" +
        "This is an HTML code." + "\n";

    var expected =
        '<p>This is an <abbr title="Hyper Text Markup Language">HTML</abbr> code.</p>' + "\n";

    var result = Markdown(input);
    QUnit.assert.equal(result, expected);
});
