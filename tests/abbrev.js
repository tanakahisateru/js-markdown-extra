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


/**
 * Test 02 - Use twice
 */
QUnit.test( "02 - Use twice", function() {
    var input =
        "*[CMS]: Content Management System" + "\n" +
        "*[HTML]: Hyper Text Markup Language" + "\n" +
        "\n" +
        "CMS generates HTML pages." + "\n";

    var expected =
        '<p><abbr title="Content Management System">CMS</abbr> generates <abbr title="Hyper Text Markup Language">HTML</abbr> pages.</p>' + "\n";

    var result = Markdown(input);
    QUnit.assert.equal(result, expected);
});
