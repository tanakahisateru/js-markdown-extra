if (typeof require != 'undefined') {
    if (typeof QUnit == 'undefined') {
        QUnit = require('qunit-cli');
    }
    if (typeof Markdown == 'undefined') {
        Markdown = require('../js-markdown-extra.js').Markdown;
    }
}
QUnit.module( "ALL Syntax test" );

/**
 * ALL
 */
QUnit.test("ALL", function() {
    var input =
        'Syntax Cheatsheet' + "\n" +
        '========================================' + "\n" +
        '' + "\n" +
        'PHRASE EMPHASIS' + "\n" +
        '---------------' + "\n" +
        '*italic*   **bold**  ' + "\n" +
        '_italic_   __bold__' + "\n" +
        '' + "\n" +
        'this_text_is_normal  ' + "\n" +
        '_this text_is italic_' + "\n" +
        '' + "\n" +
        'LINKS' + "\n" +
        '---------------' + "\n" +
        'Inline:' + "\n" +
        'An [example](http://url.com/ "Title")' + "\n" +
        '' + "\n" +
        'Reference-style labels (titles are optional):' + "\n" +
        'An [example][id] or [id]. Then, anywhere  ' + "\n" +
        'else in the doc, define the link:' + "\n" +
        '' + "\n" +
        '  [id]: http://example.com/  "Title"' + "\n" +
        '' + "\n" +
        'IMAGES' + "\n" +
        '---------------' + "\n" +
        'Inline (titles are optional):  ' + "\n" +
        '![alt text](/path/img.jpg "Title")' + "\n" +
        '' + "\n" +
        'Reference-style:  ' + "\n" +
        '![alt text][imgid]' + "\n" +
        '' + "\n" +
        '  [imgid]: /url/to/img.jpg "Title"' + "\n" +
        '' + "\n" +
        'HEADERS' + "\n" +
        '---------------' + "\n" +
        'Setext-style:' + "\n" +
        'Header 1' + "\n" +
        '========' + "\n" +
        '' + "\n" +
        'Header 2 {#headers-1-2}' + "\n" +
        '--------' + "\n" +
        '' + "\n" +
        'atx-style (closing #\'s are optional):' + "\n" +
        '' + "\n" +
        '# Header 1 #' + "\n" +
        '' + "\n" +
        '## Header 2 ##  {#headers-2-2}' + "\n" +
        '' + "\n" +
        '###### Header 6' + "\n" +
        '' + "\n" +
        'LISTS' + "\n" +
        '---------------' + "\n" +
        'Ordered, without paragraphs:' + "\n" +
        '' + "\n" +
        '1.  Foo' + "\n" +
        '2.  Bar' + "\n" +
        '' + "\n" +
        'Unordered, with paragraphs:' + "\n" +
        '' + "\n" +
        '*   A list item.' + "\n" +
        '' + "\n" +
        '    With multiple paragraphs.' + "\n" +
        '' + "\n" +
        '*   Bar' + "\n" +
        '' + "\n" +
        'You can nest them:' + "\n" +
        '' + "\n" +
        '*   Abacus' + "\n" +
        '    * ass' + "\n" +
        '*   Bastard' + "\n" +
        '    1.  bitch' + "\n" +
        '    2.  bupkis' + "\n" +
        '        * BELITTLER' + "\n" +
        '    3. burper' + "\n" +
        '*   Cunning' + "\n" +
        '' + "\n" +
        'BLOCKQUOTES' + "\n" +
        '---------------' + "\n" +
        '> Email-style angle brackets' + "\n" +
        '> are used for blockquotes.' + "\n" +
        '' + "\n" +
        '> > And, they can be nested.' + "\n" +
        '' + "\n" +
        '> #### Headers in blockquotes' + "\n" +
        '> ' + "\n" +
        '> * You can quote a list.' + "\n" +
        '> * Etc.' + "\n" +
        '' + "\n" +
        'CODE SPANS' + "\n" +
        '---------------' + "\n" +
        '`<code>` spans are delimited  ' + "\n" +
        'by backticks. `A` can be code.' + "\n" +
        '' + "\n" +
        'You can include literal backticks' + "\n" +
        'like `` `this` ``.' + "\n" +
        '' + "\n" +
        'PREFORMATTED CODE BLOCKS' + "\n" +
        '---------------' + "\n" +
        'Indent every line of a code block by at least 4 spaces or 1 tab.' + "\n" +
        '' + "\n" +
        'This is a normal paragraph.' + "\n" +
        '' + "\n" +
        '    This is a preformatted' + "\n" +
        '    code block.' + "\n" +
        '' + "\n" +
        'Fenced code block enables writing code block without indent.' + "\n" +
        '' + "\n" +
        '~~~~' + "\n" +
        'This is also preformatted' + "\n" +
        '' + "\n" +
        '   code block.' + "\n" +
        '~~~~' + "\n" +
        '' + "\n" +
        'HORIZONTAL RULES' + "\n" +
        '---------------' + "\n" +
        'Three or more dashes or asterisks:' + "\n" +
        '' + "\n" +
        '---' + "\n" +
        '' + "\n" +
        '* * *' + "\n" +
        '' + "\n" +
        '- - - -' + "\n" +
        '' + "\n" +
        'MANUAL LINE BREAKS' + "\n" +
        '---------------' + "\n" +
        'End a line with two or more spaces:' + "\n" +
        '' + "\n" +
        'Roses are red,   ' + "\n" +
        'Violets are blue.' + "\n" +
        '' + "\n" +
        '- - - - - - - - - - - - - - - - - - - -' + "\n" +
        '' + "\n" +
        'Footnotes' + "\n" +
        '---------------' + "\n" +
        'This footnote will appear at the bottom of the document[^1].' + "\n" +
        '' + "\n" +
        'The footnote doesn\'t have to be a number[^nonumber].' + "\n" +
        '' + "\n" +
        '[^1]: Told you it\'d be here at the bottom.' + "\n" +
        '[^nonumber]: See, not a number.' + "\n" +
        '             Though it does appear as a number in the html\'s ordered list.' + "\n" +
        '' + "\n" +
        'Table' + "\n" +
        '-----------------' + "\n" +
        '' + "\n" +
        '|a |b |c' + "\n" +
        '|--|--|--' + "\n" +
        '|1 |2 |3' + "\n" +
        '' + "\n" +
        'or' + "\n" +
        '' + "\n" +
        'a |b |c' + "\n" +
        '--|--|--' + "\n" +
        '1 |2 |3' + "\n" +
        '' + "\n" +
        'alignment' + "\n" +
        '' + "\n" +
        '  rigt|left  | center' + "\n" +
        '-----:|:-----|:------:' + "\n" +
        ' 0001 | 2    | 003' + "\n" +
        '   4  | 0005 |  6' + "\n" +
        '' + "\n" +
        'Definition list' + "\n" +
        '-----------------' + "\n" +
        '' + "\n" +
        'term' + "\n" +
        ' : definithion' + "\n" +
        '' + "\n" +
        'term' + "\n" +
        ' : definithion' + "\n" +
        '   is here' + "\n" +
        '' + "\n" +
        'term' + "\n" +
        ' : definithion' + "\n" +
        '' + "\n" +
        '   can have multi paragraph' + "\n" +
        '' + "\n" +
        'Auto link' + "\n" +
        '-----------------' + "\n" +
        '' + "\n" +
        '<http://foo.com/>  ' + "\n" +
        '<mailto:foo@bar.com>' + "\n" +
        '' + "\n" +
        'Encode' + "\n" +
        '-----------------' + "\n" +
        '' + "\n" +
        '& < "aaa" \\`aaa\\` \\\\' + "\n" +
        '' + "\n" +
        'Inline HTML' + "\n" +
        '-----------------' + "\n" +
        '' + "\n" +
        '<p>' + "\n" +
        'HTML is represented as is.<br>' + "\n" +
        '<del>The <strong>quick brown fox</strong> jumps over the lazy dog.</del>' + "\n" +
        '</p>' + "\n" +
        '' + "\n" +
        '<div>' + "\n" +
        'Regularly Markdown syntax ignored in HTML.<br/>' + "\n" +
        '[Google](http://www.google.co.jp/)' + "\n" +
        '</div>' + "\n" +
        '' + "\n" +
        '<div markdown="1">' + "\n" +
        'Markdow enabled inside HTML when marked by markdown="1" attribute.  ' + "\n" +
        '[Google](http://www.google.co.jp/)' + "\n" +
        '</div>' + "\n" +
        "";

    var expected =
        '<h1>Syntax Cheatsheet</h1>'+"\n"+
        ''+"\n"+
        '<h2>PHRASE EMPHASIS</h2>'+"\n"+
        ''+"\n"+
        '<p><em>italic</em>   <strong>bold</strong><br />'+"\n"+
        '<em>italic</em>   <strong>bold</strong></p>'+"\n"+
        ''+"\n"+
        '<p>this_text_is_normal<br />'+"\n"+
        '<em>this text_is italic</em></p>'+"\n"+
        ''+"\n"+
        '<h2>LINKS</h2>'+"\n"+
        ''+"\n"+
        '<p>Inline:'+"\n"+
        'An <a href="http://url.com/" title="Title">example</a></p>'+"\n"+
        ''+"\n"+
        '<p>Reference-style labels (titles are optional):'+"\n"+
        'An <a href="http://example.com/" title="Title">example</a> or <a href="http://example.com/" title="Title">id</a>. Then, anywhere<br />'+"\n"+
        'else in the doc, define the link:</p>'+"\n"+
        ''+"\n"+
        '<h2>IMAGES</h2>'+"\n"+
        ''+"\n"+
        '<p>Inline (titles are optional):<br />'+"\n"+
        '<img src="/path/img.jpg" alt="alt text" title="Title" /></p>'+"\n"+
        ''+"\n"+
        '<p>Reference-style:<br />'+"\n"+
        '<img src="/url/to/img.jpg" alt="alt text" title="Title" /></p>'+"\n"+
        ''+"\n"+
        '<h2>HEADERS</h2>'+"\n"+
        ''+"\n"+
        '<p>Setext-style:</p>'+"\n"+
        ''+"\n"+
        '<h1>Header 1</h1>'+"\n"+
        ''+"\n"+
        '<h2 id="headers-1-2">Header 2</h2>'+"\n"+
        ''+"\n"+
        '<p>atx-style (closing #\'s are optional):</p>'+"\n"+
        ''+"\n"+
        '<h1>Header 1</h1>'+"\n"+
        ''+"\n"+
        '<h2 id="headers-2-2">Header 2</h2>'+"\n"+
        ''+"\n"+
        '<h6>Header 6</h6>'+"\n"+
        ''+"\n"+
        '<h2>LISTS</h2>'+"\n"+
        ''+"\n"+
        '<p>Ordered, without paragraphs:</p>'+"\n"+
        ''+"\n"+
        '<ol>'+"\n"+
        '<li>Foo</li>'+"\n"+
        '<li>Bar</li>'+"\n"+
        '</ol>'+"\n"+
        ''+"\n"+
        '<p>Unordered, with paragraphs:</p>'+"\n"+
        ''+"\n"+
        '<ul>'+"\n"+
        '<li><p>A list item.</p>'+"\n"+
        ''+"\n"+
        '<p>With multiple paragraphs.</p></li>'+"\n"+
        '<li><p>Bar</p></li>'+"\n"+
        '</ul>'+"\n"+
        ''+"\n"+
        '<p>You can nest them:</p>'+"\n"+
        ''+"\n"+
        '<ul>'+"\n"+
        '<li>Abacus'+"\n"+
        '<ul>'+"\n"+
        '<li>ass</li>'+"\n"+
        '</ul>'+"\n"+
        ''+"\n"+
        '</li>'+"\n"+
        '<li>Bastard'+"\n"+
        '<ol>'+"\n"+
        '<li>bitch</li>'+"\n"+
        '<li>bupkis'+"\n"+
        '<ul>'+"\n"+
        '<li>BELITTLER</li>'+"\n"+
        '</ul>'+"\n"+
        ''+"\n"+
        '</li>'+"\n"+
        '<li>burper</li>'+"\n"+
        '</ol>'+"\n"+
        ''+"\n"+
        '</li>'+"\n"+
        '<li>Cunning</li>'+"\n"+
        '</ul>'+"\n"+
        ''+"\n"+
        '<h2>BLOCKQUOTES</h2>'+"\n"+
        ''+"\n"+
        '<blockquote>'+"\n"+
        '  <p>Email-style angle brackets'+"\n"+
        '  are used for blockquotes.</p>'+"\n"+
        '  '+"\n"+
        '  <blockquote>'+"\n"+
        '    <p>And, they can be nested.</p>'+"\n"+
        '  </blockquote>'+"\n"+
        '  '+"\n"+
        '  <h4>Headers in blockquotes</h4>'+"\n"+
        '  '+"\n"+
        '  <ul>'+"\n"+
        '  <li>You can quote a list.</li>'+"\n"+
        '  <li>Etc.</li>'+"\n"+
        '  </ul>'+"\n"+
        '</blockquote>'+"\n"+
        ''+"\n"+
        '<h2>CODE SPANS</h2>'+"\n"+
        ''+"\n"+
        '<p><code>&lt;code&gt;</code> spans are delimited<br />'+"\n"+
        'by backticks. <code>A</code> can be code.</p>'+"\n"+
        ''+"\n"+
        '<p>You can include literal backticks'+"\n"+
        'like <code>`this`</code>.</p>'+"\n"+
        ''+"\n"+
        '<h2>PREFORMATTED CODE BLOCKS</h2>'+"\n"+
        ''+"\n"+
        '<p>Indent every line of a code block by at least 4 spaces or 1 tab.</p>'+"\n"+
        ''+"\n"+
        '<p>This is a normal paragraph.</p>'+"\n"+
        ''+"\n"+
        '<pre><code>This is a preformatted'+"\n"+
        'code block.'+"\n"+
        '</code></pre>'+"\n"+
        ''+"\n"+
        '<p>Fenced code block enables writing code block without indent.</p>'+"\n"+
        ''+"\n"+
        '<pre><code>This is also preformatted'+"\n"+
        ''+"\n"+
        '   code block.'+"\n"+
        '</code></pre>'+"\n"+
        ''+"\n"+
        '<h2>HORIZONTAL RULES</h2>'+"\n"+
        ''+"\n"+
        '<p>Three or more dashes or asterisks:</p>'+"\n"+
        ''+"\n"+
        '<hr />'+"\n"+
        ''+"\n"+
        '<hr />'+"\n"+
        ''+"\n"+
        '<hr />'+"\n"+
        ''+"\n"+
        '<h2>MANUAL LINE BREAKS</h2>'+"\n"+
        ''+"\n"+
        '<p>End a line with two or more spaces:</p>'+"\n"+
        ''+"\n"+
        '<p>Roses are red,<br />'+"\n"+
        'Violets are blue.</p>'+"\n"+
        ''+"\n"+
        '<hr />'+"\n"+
        ''+"\n"+
        '<h2>Footnotes</h2>'+"\n"+
        ''+"\n"+
        '<p>This footnote will appear at the bottom of the document<sup id="fnref:1"><a href="#fn:1" rel="footnote">1</a></sup>.</p>'+"\n"+
        ''+"\n"+
        '<p>The footnote doesn\'t have to be a number<sup id="fnref:nonumber"><a href="#fn:nonumber" rel="footnote">2</a></sup>.</p>'+"\n"+
        ''+"\n"+
        '<h2>Table</h2>'+"\n"+
        ''+"\n"+
        '<table>'+"\n"+
        '<thead>'+"\n"+
        '<tr>'+"\n"+
        '  <th>a</th>'+"\n"+
        '  <th>b</th>'+"\n"+
        '  <th>c</th>'+"\n"+
        '</tr>'+"\n"+
        '</thead>'+"\n"+
        '<tbody>'+"\n"+
        '<tr>'+"\n"+
        '  <td>1</td>'+"\n"+
        '  <td>2</td>'+"\n"+
        '  <td>3</td>'+"\n"+
        '</tr>'+"\n"+
        '</tbody>'+"\n"+
        '</table>'+"\n"+
        ''+"\n"+
        '<p>or</p>'+"\n"+
        ''+"\n"+
        '<table>'+"\n"+
        '<thead>'+"\n"+
        '<tr>'+"\n"+
        '  <th>a</th>'+"\n"+
        '  <th>b</th>'+"\n"+
        '  <th>c</th>'+"\n"+
        '</tr>'+"\n"+
        '</thead>'+"\n"+
        '<tbody>'+"\n"+
        '<tr>'+"\n"+
        '  <td>1</td>'+"\n"+
        '  <td>2</td>'+"\n"+
        '  <td>3</td>'+"\n"+
        '</tr>'+"\n"+
        '</tbody>'+"\n"+
        '</table>'+"\n"+
        ''+"\n"+
        '<p>alignment</p>'+"\n"+
        ''+"\n"+
        '<table>'+"\n"+
        '<thead>'+"\n"+
        '<tr>'+"\n"+
        '  <th align="right">rigt</th>'+"\n"+
        '  <th align="left">left</th>'+"\n"+
        '  <th align="center">center</th>'+"\n"+
        '</tr>'+"\n"+
        '</thead>'+"\n"+
        '<tbody>'+"\n"+
        '<tr>'+"\n"+
        '  <td align="right">0001</td>'+"\n"+
        '  <td align="left">2</td>'+"\n"+
        '  <td align="center">003</td>'+"\n"+
        '</tr>'+"\n"+
        '<tr>'+"\n"+
        '  <td align="right">4</td>'+"\n"+
        '  <td align="left">0005</td>'+"\n"+
        '  <td align="center">6</td>'+"\n"+
        '</tr>'+"\n"+
        '</tbody>'+"\n"+
        '</table>'+"\n"+
        ''+"\n"+
        '<h2>Definition list</h2>'+"\n"+
        ''+"\n"+
        '<dl>'+"\n"+
        '<dt>term</dt>'+"\n"+
        '<dd>definithion</dd>'+"\n"+
        ''+"\n"+
        '<dt>term</dt>'+"\n"+
        '<dd>definithion'+"\n"+
        'is here</dd>'+"\n"+
        ''+"\n"+
        '<dt>term</dt>'+"\n"+
        '<dd>'+"\n"+
        '<p>definithion</p>'+"\n"+
        ''+"\n"+
        '<p>can have multi paragraph</p>'+"\n"+
        '</dd>'+"\n"+
        '</dl>'+"\n"+
        ''+"\n"+
        '<h2>Auto link</h2>'+"\n"+
        ''+"\n"+
        '<p><a href="http://foo.com/">http://foo.com/</a><br />'+"\n"+
        '<a href="m&#97;&#105;&#108;&#116;&#111;&#58;&#x66;&#x6f;&#x6f;&#x40;&#x62;&#x61;&#x72;.&#99;&#111;&#109;">&#x66;&#x6f;&#x6f;&#x40;&#x62;&#x61;&#x72;.&#99;&#111;&#109;</a></p>'+"\n"+
        ''+"\n"+
        '<h2>Encode</h2>'+"\n"+
        ''+"\n"+
        '<p>&amp; &lt; "aaa" &#96;aaa&#96; &#92;</p>'+"\n"+
        ''+"\n"+
        '<h2>Inline HTML</h2>'+"\n"+
        ''+"\n"+
        '<p>'+"\n"+
        'HTML is represented as is.<br>'+"\n"+
        '<del>The <strong>quick brown fox</strong> jumps over the lazy dog.</del>'+"\n"+
        '</p>'+"\n"+
        ''+"\n"+
        '<div>'+"\n"+
        'Regularly Markdown syntax ignored in HTML.<br/>'+"\n"+
        '[Google](http://www.google.co.jp/)'+"\n"+
        '</div>'+"\n"+
        ''+"\n"+
        '<div>'+"\n"+
        ''+"\n"+
        '<p>Markdow enabled inside HTML when marked by markdown="1" attribute.<br />'+"\n"+
        '<a href="http://www.google.co.jp/">Google</a></p>'+"\n"+
        ''+"\n"+
        '</div>'+"\n"+
        ''+"\n"+
        '<div class="footnotes">'+"\n"+
        '<hr />'+"\n"+
        '<ol>'+"\n"+
        ''+"\n"+
        '<li id="fn:1">'+"\n"+
        '<p>Told you it\'d be here at the bottom.&#160;<a href="#fnref:1" rev="footnote">&#8617;</a></p>'+"\n"+
        '</li>'+"\n"+
        ''+"\n"+
        '<li id="fn:nonumber">'+"\n"+
        '<p>See, not a number.'+"\n"+
        '         Though it does appear as a number in the html\'s ordered list.&#160;<a href="#fnref:nonumber" rev="footnote">&#8617;</a></p>'+"\n"+
        '</li>'+"\n"+
        ''+"\n"+
        '</ol>'+"\n"+
        '</div>'+"\n"+
        "";

    var result = Markdown(input);
    QUnit.assert.equal(result, expected);
});

/**
 * Bold
 */
QUnit.test("Bold", function() {
    var input =
        '*italic*   **bold**  ' + "\n" +
        '_italic_   __bold__' + "\n" +
        '' + "\n" +
        'this_text_is_normal  ' + "\n" +
        '_this text_is italic_' + "\n" +
        "";

    var expected =
        '<p><em>italic</em>   <strong>bold</strong><br />'+"\n"+
        '<em>italic</em>   <strong>bold</strong></p>'+"\n"+
        ''+"\n"+
        '<p>this_text_is_normal<br />'+"\n"+
        '<em>this text_is italic</em></p>'+"\n"+
        "";

    var result = Markdown(input);
    QUnit.assert.equal(result, expected);
});

/**
 * Auto Link
 */
QUnit.test("Auto Link", function() {
    var input =
        '<http://foo.com/>  ' + "\n" +
        '<mailto:foo@bar.com>' + "\n" +
        "";

    var expected =
        '<p><a href="http://foo.com/">http://foo.com/</a><br />'+"\n"+
        '<a href="m&#97;&#105;&#108;&#116;&#111;&#58;&#x66;&#x6f;&#x6f;&#x40;&#x62;&#x61;&#x72;.&#99;&#111;&#109;">&#x66;&#x6f;&#x6f;&#x40;&#x62;&#x61;&#x72;.&#99;&#111;&#109;</a></p>'+"\n"+
        "";

    var result = Markdown(input);
    QUnit.assert.equal(result, expected);
});
