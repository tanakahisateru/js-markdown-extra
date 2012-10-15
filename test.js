console.log(require('./js-markdown-extra.js').Markdown(
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
    '`&lt;code&gt;` spans are delimited  ' + "\n" +
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
    '& < "aaa" \`aaa\` \\' + "\n" +
    '' + "\n" +
    'Inline HTML' + "\n" +
    '-----------------' + "\n" +
    '' + "\n" +
    '<p>' + "\n" +
    'HTML is represented as is.&lt;br>' + "\n" +
    '<del>The &lt;strong>quick brown fox</strong> jumps over the lazy dog.&lt;/del>' + "\n" +
    '</p>' + "\n" +
    '' + "\n" +
    '<div>' + "\n" +
    'Regularly Markdown syntax ignored in HTML.&lt;br/>' + "\n" +
    '[Google](http://www.google.co.jp/)' + "\n" +
    '</div>' + "\n" +
    '' + "\n" +
    '<div markdown="1">' + "\n" +
    'Markdow enabled inside HTML when marked by markdown="1" attribute.  ' + "\n" +
    '[Google](http://www.google.co.jp/)' + "\n" +
    '</div>' + "\n" +
    ""
));


