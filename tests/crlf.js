if (typeof require != 'undefined') {
    if (typeof QUnit == 'undefined') {
        QUnit = require('qunit-cli');
    }
    if (typeof Markdown == 'undefined') {
        Markdown = require('../js-markdown-extra.js').Markdown;
    }
}
QUnit.module( "CRLF Unit tests" );

/**
 * Test 01 - LF
 */
QUnit.test( "01 - LF", function() {

    var input =
        'Syntax Cheatsheet' + "\n" +
        '========================================' + "\n" +
        'PHRASE EMPHASIS' + "\n" +
        '---------------' + "\n" +
        '*italic*   **bold**' + "\n" +  
        '_italic_   __bold__' + "\n" +
        'Header 1' + "\n" +
        '========' + "\n" +
        'Header 2' + "\n" +
        '--------' + "\n" +
        '# Header 1 #' + "\n" +
        '## Header 2 ##' + "\n" +
        '###### Header 6' + "\n";

    var expected = '<h1>Syntax Cheatsheet<\/h1>\n\n<h2>PHRASE EMPHASIS<\/h2>\n\n<p><em>italic<\/em>   <strong>bold<\/strong>\n<em>italic<\/em>   <strong>bold<\/strong><\/p>\n\n<h1>Header 1<\/h1>\n\n<h2>Header 2<\/h2>\n\n<h1>Header 1<\/h1>\n\n<h2>Header 2<\/h2>\n\n<h6>Header 6<\/h6>\n';

    var result = Markdown(input);
    QUnit.assert.equal(result, expected);
});

/**
 * Test 02 - CRLF
 */
QUnit.test( "02 - CRLF", function() {

    var input =
        'Syntax Cheatsheet' + "\r\n" +
        '========================================' + "\r\n" +
        'PHRASE EMPHASIS' + "\r\n" +
        '---------------' + "\r\n" +
        '*italic*   **bold**' + "\r\n" +  
        '_italic_   __bold__' + "\r\n" +
        'Header 1' + "\r\n" +
        '========' + "\r\n" +
        'Header 2' + "\r\n" +
        '--------' + "\r\n" +
        '# Header 1 #' + "\r\n" +
        '## Header 2 ##' + "\r\n" +
        '###### Header 6' + "\r\n";

    var expected = '<h1>Syntax Cheatsheet<\/h1>\n\n<h2>PHRASE EMPHASIS<\/h2>\n\n<p><em>italic<\/em>   <strong>bold<\/strong>\n<em>italic<\/em>   <strong>bold<\/strong><\/p>\n\n<h1>Header 1<\/h1>\n\n<h2>Header 2<\/h2>\n\n<h1>Header 1<\/h1>\n\n<h2>Header 2<\/h2>\n\n<h6>Header 6<\/h6>\n';

    var result = Markdown(input);
    QUnit.assert.equal(result, expected);
});
