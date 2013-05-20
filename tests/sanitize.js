if (typeof require != 'undefined') {
    if (typeof QUnit == 'undefined') {
        QUnit = require('qunit-cli');
    }
    if (typeof Markdown == 'undefined') {
        Markdown = require('../js-markdown-extra.js').Markdown;
    }
}
QUnit.module( "Code Block Unit tests" );

/**
 * Test 01 - Indent
 */
QUnit.test( "01 - Indent code block", function() {
    var input =
        "foo" + "\n" +
        "\n" +
        "    <script>console.log('heya');</script>" + "\n";

    var expected =
        "<p>foo</p>" + "\n" +
        "\n" +
        "<pre><code>&lt;script&gt;console.log('heya');&lt;/script&gt;" + "\n" +
        "</code></pre>" + "\n";

    var result = Markdown(input);
    QUnit.assert.equal(result, expected);
});

/**
 * Test 02 - Fenced code block
 */
QUnit.test( "02 - Fenced code block", function() {
    var input =
        "foo" + "\n" +
        "\n" +
        "~~~~" + "\n" +
        "<script>console.log('heya');</script>"  + "\n" +
        "~~~~" + "\n";

    var expected =
        "<p>foo</p>" + "\n" +
        "\n" +
        "<pre><code>&lt;script&gt;console.log('heya');&lt;/script&gt;" + "\n" +
        "</code></pre>" + "\n";

    var result = Markdown(input);
    QUnit.assert.equal(result, expected);
});

/**
 * Test 03 - Inline code
 */
QUnit.test( "03 - Inline code", function() {
    var input = "`<script></script>`" + "\n";

    var expected = "<p><code>&lt;script&gt;&lt;/script&gt;</code></p>" + "\n";

    var result = Markdown(input);
    QUnit.assert.equal(result, expected);
});

