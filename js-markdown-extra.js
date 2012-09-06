/*!
 * Copyright (c) 2006 js-markdown-extra developers
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var MARKDOWN_VERSION = "1.0.1o";
var MARKDOWNEXTRA_VERSION = "1.2.5";

// Global default settings:

/** Change to ">" for HTML output */
var MARKDOWN_EMPTY_ELEMENT_SUFFIX = " />";

/** Define the width of a tab for code blocks. */
var MARKDOWN_TAB_WIDTH = 4;

/** Optional title attribute for footnote links and backlinks. */
var MARKDOWN_FN_LINK_TITLE     = "";
var MARKDOWN_FN_BACKLINK_TITLE = "";

/** Optional class attribute for footnote links and backlinks. */
var MARKDOWN_FN_LINK_CLASS     = "";
var MARKDOWN_FN_BACKLINK_CLASS = "";

/** Change to false to remove Markdown from posts and/or comments. */
var MARKDOWN_WP_POSTS    = true;
var MARKDOWN_WP_COMMENTS = true;

/** Standard Function Interface */
MARKDOWN_PARSER_CLASS = function() {
    return new Markdown_Parser();
    //return new MarkdownExtra_Parser();
};

/**
 * Converts Markdown formatted text to HTML.
 * @param text Markdown text
 * @return HTML
 */
function Markdown($text) {
    //Initialize the parser and return the result of its transform method.
    var parser;
    if('undefined' == typeof arguments.callee.parser) {
        parser = MARKDOWN_PARSER_CLASS();
        parser.init();
        arguments.callee.parser = parser;
    }
    else {
        parser = arguments.callee.parser;
    }
    // Transform text using parser.
    return parser.transform($text);
}

/**
 *
 */
function _preg_quot(text) {
  if(!arguments.callee.sRE) {
    arguments.callee.sRE = /(\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\}\\)/g;
  }
  return text.replace(arguments.callee.sRE, '\\$1');
}

function _str_repeat(str, n) {
    var tmp = "";
    for(var i = 0; i < n; i++) {
        tmp += str;
    }
    return tmp;
}

function _trim(target, charlist) {
    var chars = charlist || " \t\n\r";
    return target.replace(
        new RegExp("^[" + chars + "]*|[" + chars + "]*$", "g"), ""
    );
}

function _rtrim(target, charlist) {
    var chars = charlist || " \t\n\r";
    return target.replace(
        new RegExp( "[" + chars + "]*$", "g" ), ""
    );
}


/**
 * Constructor function. Initialize appropriate member variables.
 */
function Markdown_Parser() {
    
    this.nested_brackets_depth = 6;
    this.nested_url_parenthesis_depth = 4;
    this.escape_chars = "\\`*_{}[]()>#+-.!";

    // Document transformations
    this.document_gamut = [
        // Strip link definitions, store in hashes.
        [this.stripLinkDefinitions, 20],
        [this.runBasicBlockGamut,   30]
    ];

    // These are all the transformations that form block-level
    /// tags like paragraphs, headers, and list items.
    this.block_gamut = [
        [this.doHeaders,         10],
        [this.doHorizontalRules, 20],
        [this.doLists,           40],
        [this.doCodeBlocks,      50],
        [this.doBlockQuotes,     60],
    ];

    // These are all the transformations that occur *within* block-level
    // tags like paragraphs, headers, and list items.
    this.span_gamut = [
        // Process character escapes, code spans, and inline HTML
        // in one shot.
        [this.parseSpan,          -30],
        // Process anchor and image tags. Images must come first,
        // because ![foo][f] looks like an anchor.
        [this.doImages,            10],
        [this.doAnchors,           20],
        // Make links out of things like `<http://example.com/>`
        // Must come after doAnchors, because you can use < and >
        // delimiters in inline links like [this](<url>).
        [this.doAutoLinks,         30],
        [this.encodeAmpsAndAngles, 40],
        [this.doItalicsAndBold,    50],
        [this.doHardBreaks,        60]
    ];

    /*
    this.em_relist = [
        ['' , /(?:(?<!\*)\*(?!\*)|(?<!_)_(?!_))(?=\S|$)(?![\.,:;]\s)/],
        ['*', /(?<=\S|^)(?<!\*)\*(?!\*)/],
        ['_', /(?<=\S|^)(?<!_)_(?!_)/]
    ];
    this.strong_relist = [
        [''  , /(?:(?<!\*)\*\*(?!\*)|(?<!_)__(?!_))(?=\S|$)(?![\.,:;]\s)/],
        ['**', /(?<=\S|^)(?<!\*)\*\*(?!\*)/],
        ['__', /(?<=\S|^)(?<!_)__(?!_)/]
    ];
    this.em_strong_relist = [
        [''   , /(?:(?<!\*)\*\*\*(?!\*)|(?<!_)___(?!_))(?=\S|$)(?![\.,:;]\s)/],
        ['***', /(?<=\S|^)(?<!\*)\*\*\*(?!\*)/],
        ['___', /(?<=\S|^)(?<!_)___(?!_)/]
    ];
    */
}

Markdown_Parser.prototype.init = function() {
    // this._initDetab(); // NOTE: JavaScript string length is already based on Unicode
    // this.prepareItalicsAndBold(); // NOTE: JavaScript can't use backword reading in regexp

    // Regex to match balanced [brackets].
    // Needed to insert a maximum bracked depth while converting to PHP.
    // NOTE: JavaScript doesn't have so faster option for RegExp
    //this.nested_brackets_re = new RegExp(
    //    str_repeat('(?>[^\\[\\]]+|\\[', this.nested_brackets_depth) +
    //    str_repeat('\\])*', this.nested_brackets_depth)
    //);
    // NOTE: JavaScript doesn't have so faster option for RegExp
    //this.nested_url_parenthesis_re = new RegExp(
    //    str_repeat('(?>[^()\\s]+|\\(', this.nested_url_parenthesis_depth) +
    //    str_repeat('(?>\\)))*', this.nested_url_parenthesis_depth)
    //);
    this.nested_brackets_re = new RegExp(
        _str_repeat('(?:[^\\[\\]]+|\\[', this.nested_brackets_depth) +
        _str_repeat('\\])*', this.nested_brackets_depth)
    );
    this.nested_url_parenthesis_re = new RegExp(
        _str_repeat('(?:[^()\\s]+|\\(', this.nested_url_parenthesis_depth) +
        _str_repeat('(?:\\)))*', this.nested_url_parenthesis_depth)
    );

    // Table of hash values for escaped characters:
    var tmp = []
    for(var i = 0; i < this.escape_chars.length; i++) {
        tmp.push(_preg_quot(this.escape_chars.charAt(i)));
    }
    this.escape_chars_re = new RegExp('[' + tmp.join('') + ']');

    // Change to ">" for HTML output.
    this.empty_element_suffix = MARKDOWN_EMPTY_ELEMENT_SUFFIX;
    this.tab_width = MARKDOWN_TAB_WIDTH;

    // Change to `true` to disallow markup or entities.
    this.no_markup = false;
    this.no_entities = false;

    // Predefined urls and titles for reference links and images.
    this.predef_urls = [];
    this.predef_titles = [];

    // Sort document, block, and span gamut in ascendent priority order.
    function cmp_gamut(a, b) {
        a = a[1]; b = b[1];
        return a > b ? 1 : a < b ? -1 : 0;
    }
    this.document_gamut.sort(cmp_gamut);
    this.block_gamut.sort(cmp_gamut);
    this.span_gamut.sort(cmp_gamut);

    // Internal hashes used during transformation.
    this.urls = [];
    this.titles = [];
    this.html_hashes = {};

    // Status flag to avoid invalid nesting.
    this.in_anchor = false;
}

/**
 * Prepare regular expressions for searching emphasis tokens in any
 * context.
 */
Markdown_Parser.prototype.prepareItalicsAndBold = function() {
    this.em_strong_prepared_relist = [];
    for(var i = 0; i < this.em_relist.length; i++) {
        var em = this.em_relist[i][0];
        var em_re = this.em_relist[i][1];
        for(var j = 0; j < this.strong_relist.length; j++) {
            var strong = this.strong_relist[j][0];
            var strong_re = this.strong_relist[j][1];
            // Construct list of allowed token expressions.
            var token_relist = [];
            for(var k = 0; k < this.em_strong_relist.length; k++) {
                var em_strong = this.em_strong_relist[k][0];
                var em_strong_re = this.em_strong_relist[k][1];
                if(em + strong == em_strong) {
                    token_relist.push(em_strong_re);
                }
            }
            token_relist.push(em_re);
            token_relist.push(strong_re);

            // Construct master expression from list.
            var token_re = '{(' + token_relist.join('|')  + ')}';
            this.em_strong_prepared_relist.push(
                [em + strong, token_re]
            );
        }
    }
};

/**
 * [porting note]
 * JavaScript's RegExp doesn't have escape code \A and \Z.
 * So multiline pattern can't match start/end of text. Instead
 * wrap whole of text with STX(02) and ETX(03).
 */
Markdown_Parser.prototype.__wrapSTXETX__ = function(text) {
    if(text.charAt(0) != '\x02') { text = '\x02' + text; }
    if(text.charAt(text.length - 1) != '\x03') { text = text + '\x03'; }
    return text;
};

/**
 * [porting note]
 * Strip STX(02) and ETX(03).
 */
Markdown_Parser.prototype.__unwrapSTXETX__ = function(text) {
    if(text.charAt(0) == '\x02') { text = text.substr(1); }
    if(text.charAt(text.length - 1) == '\x03') { text = text.substr(0, text.length - 1); }
    return text;
};

/**
 * Called before the transformation process starts to setup parser 
 * states.
 */
Markdown_Parser.prototype.setup = function() {
    // Clear global hashes.
    this.urls = this.predef_urls;
    this.titles = this.predef_titles;
    this.html_hashes = {};

    this.in_anchor = false;
}

/**
 * Called after the transformation process to clear any variable 
 * which may be taking up memory unnecessarly.
 */
Markdown_Parser.prototype.teardown = function() {
    this.urls = [];
    this.titles = [];
    this.html_hashes = {};
};

/**
 * Main function. Performs some preprocessing on the input text
 * and pass it through the document gamut.
 */
Markdown_Parser.prototype.transform = function(text) {
    this.setup();

    // Remove UTF-8 BOM and marker character in input, if present.
    text = text.replace(/^\xEF\xBB\xBF|\x1A/, "");

    // Standardize line endings:
    //   DOS to Unix and Mac to Unix
    text = text.replace(/\r\n?/, "\n", text);

    // Make sure $text ends with a couple of newlines:
    text += "\n\n";

    // Convert all tabs to spaces.
    text = this.detab(text);

    // Turn block-level HTML blocks into hash entries
    text = this.hashHTMLBlocks(text);

    // Strip any lines consisting only of spaces and tabs.
    // This makes subsequent regexen easier to write, because we can
    // match consecutive blank lines with /\n+/ instead of something
    // contorted like /[ ]*\n+/ .
    text = text.replace(/^[ ]+$/m, "");

    // Run document gamut methods.
    for(var i = 0; i < this.document_gamut.length; i++) {
        var method = this.document_gamut[i][0];
        if(method) {
            text = method.call(this, text);
        }
    }

    this.teardown();

    return text + "\n";
};

Markdown_Parser.prototype.hashHTMLBlocks = function(text) {
    if(this.no_markup) { return text; }

    var less_than_tab = this.tab_width - 1;

    // Hashify HTML blocks:
    // We only want to do this for block-level HTML tags, such as headers,
    // lists, and tables. That's because we still want to wrap <p>s around
    // "paragraphs" that are wrapped in non-block-level tags, such as anchors,
    // phrase emphasis, and spans. The list of tags we're looking for is
    // hard-coded:
    //
    // *  List "a" is made of tags which can be both inline or block-level.
    //    These will be treated block-level when the start tag is alone on 
    //    its line, otherwise they're not matched here and will be taken as 
    //    inline later.
    // *  List "b" is made of tags which are always block-level;

    var block_tags_a_re = 'ins|del';
    var block_tags_b_re = 'p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|address|' +
                          'script|noscript|form|fieldset|iframe|math';

    // Regular expression for the content of a block tag.
    var nested_tags_level = 4;
    var attr =
        '(?:'                + // optional tag attributes
            '\\s'            + // starts with whitespace
            '(?:'            +
                '[^>"/]+'    + // text outside quotes
            '|'              +
                '/+(?!>)'    + // slash not followed by ">"
            '|'              +
                '"[^"]*"'    + // text inside double quotes (tolerate ">")
            '|'              +
                '\'[^\']*\'' + // text inside single quotes (tolerate ">")
            ')*'             +
        ')?';
    var content =
        _str_repeat(
            '(?:'                  +
                '[^<]+'            + // content without tag
            '|'                    +
                '<\\2'             + // nested opening tag
                attr               + // attributes
                '(?:'              +
                    '/>'           +
                '|'                +
                    '>',
            nested_tags_level
        )                          + // end of opening tag
        '.*?'                      + // last level nested tag content
        _str_repeat(
                   '</\\2\\s*>'     + // closing nested tag
                ')'                +
                '|'                +
                    '<(?!/\\2\\s*>)' + // other tags with a different name
            ')*',
            nested_tags_level
        );

    var content2 = content.replace('\\2', '\\3');

    // First, look for nested blocks, e.g.:
    //   <div>
    //     <div>
    //       tags for inner block must be indented.
    //     </div>
    //   </div>
    //
    // The outermost tags must start at the left margin for this to match, and
    // the inner nested divs must be indented.
    // We need to do this before the next, more liberal match, because the next
    // match will start at the first `<div>` and stop at the first `</div>`.
    var all = new RegExp('(?:' +
        '(?:' +
            '(?:\\n\\n)' +		// Starting after a blank line
            '|' +				// or
            '(?:\\x02)\\n?' +		// the beginning of the doc
        ')' +
        '(' +						// save in $1

        // Match from `\n<tag>` to `</tag>\n`, handling nested tags 
        // in between.
            '[ ]{0,' + less_than_tab + '}' +
            '<(' + block_tags_b_re + ')' + // start tag = $2
            attr + '>' +			// attributes followed by > and \n
            content +		// content, support nesting
            '</\\2>' +				// the matching end tag
            '[ ]*' +				 // trailing spaces/tabs
            '(?=\\n+|\\n*\\x03)' +	// followed by a newline or end of document

        '|' + // Special version for tags of group a.

            '[ ]{0,' + less_than_tab + '}' +
            '<(' + block_tags_a_re + ')' + // start tag = $3
            attr + '>[ ]*\\n' +	// attributes followed by >
            content2 + 		// content, support nesting
            '</\\3>' +				// the matching end tag
            '[ ]*' +				// trailing spaces/tabs
            '(?=\\n+|\\n*\\x03)' +	// followed by a newline or end of document

        '|' + // Special case just for <hr />. It was easier to make a special 
              // case than to make the other regex more complicated.

            '[ ]{0,' + less_than_tab + '}' +
            '<(hr)' +				// start tag = $2
            attr+			// attributes
            '/?>' +					// the matching end tag
            '[ ]*' +
            '(?=\\n{2,}|\\n*\\x03)' +		// followed by a blank line or end of document

        '|' + // Special case for standalone HTML comments:

            '[ ]{0,' + less_than_tab + '}' +
            '(?:' + //'(?s:' +
                '<!-- .*? -->' +
            ')' +
            '[ ]*' +
            '(?=\\n{2,}|\\n*\\x03)' +		// followed by a blank line or end of document

        '|' + // PHP and ASP-style processor instructions (<? and <%)

            '[ ]{0,' + less_than_tab + '}' +
            '(?:' + //'(?s:' +
                '<([?%])' +			// $2
                '.*?' +
                '\\2>' +
            ')' +
            '[ ]*' +
            '(?=\\n{2,}|\\n*\\x03)' +		// followed by a blank line or end of document

        ')' +
    ')', 'mig');
    // FIXME: JS doesnt have enough escape sequence \A nor \Z.

    var self = this;
    text = this.__wrapSTXETX__(text);
    text = text.replace(all, function(match, text) {
        console.log(match);
        var key  = self.hashBlock(text);
        return "\n\n" + key + "\n\n";
    });
    text = this.__unwrapSTXETX__(text);
    return text;
};

/**
 * Called whenever a tag must be hashed when a function insert an atomic 
 * element in the text stream. Passing $text to through this function gives
 * a unique text-token which will be reverted back when calling unhash.
 *
 * The boundary argument specify what character should be used to surround
 * the token. By convension, "B" is used for block elements that needs not
 * to be wrapped into paragraph tags at the end, ":" is used for elements
 * that are word separators and "X" is used in the general case.
 */
Markdown_Parser.prototype.hashPart = function(text, boundary) {
    if(boundary === undefined) {
        boundary = 'X';
    }
    // Swap back any tag hash found in text so we do not have to `unhash`
    // multiple times at the end.
    text = this.unhash(text);

    console.log(text);

    // Then hash the block.
    if(arguments.callee.i === undefined) {
        arguments.callee.i = 0;
    }
    var key = boundary + "\x1A" + (++arguments.callee.i) + boundary;
    this.html_hashes[key] = text;
    return key; // String that will replace the tag.
};

/**
 * Shortcut function for hashPart with block-level boundaries.
 */
Markdown_Parser.prototype.hashBlock = function(text) {
    return this.hashPart(text, 'B');
};

/**
 * Strips link definitions from text, stores the URLs and titles in
 * hash references.
 */
Markdown_Parser.prototype.stripLinkDefinitions = function(text) {
    var less_than_tab = this.tab_width - 1;
    var self = this;
    // Link defs are in the form: ^[id]: url "optional title"
    text = this.__wrapSTXETX__(text);
    text = text.replace(new RegExp(
        '^[ ]{0,' + less_than_tab + '}\\[(.+)\\][ ]?:' + // id = $1
            '[ ]*'+
                '\\n?' + // maybe *one* newline
                '[ ]*' +
            '(?:' +
                '<(.+?)>' + // url = $2
            '|' +
                '(\\S+?)' +			// url = $3
            ')' +
            '[ ]*' +
            '\\n?' +				// maybe one newline
            '[ ]*' +
            '(?:' +
                //'(?=\\s)' +			// lookbehind for whitespace
                '["\\(]' +
                '(.*?)' +			// title = $4
                '["\\)]' +
                '[ ]*' +
            ')?' +	// title is optional
            '(?:\\n+|\\n*(?=\\x03))',
        'm'), function(match, id, url2, url3, title) {
            console.log(match);
            var link_id = id.toLowerCase();
            var url = url2 == '' ? url3 : url2;
            self.urls[link_id] = url;
            self.titles[link_id] = title;
            return ''; // String that will replace the block
        }
    );
    text = this.__unwrapSTXETX__(text);
    return text;
}

/**
 * Run block gamut tranformations.
 */
Markdown_Parser.prototype.runBlockGamut = function(text) {
    // We need to escape raw HTML in Markdown source before doing anything 
    // else. This need to be done for each block, and not only at the 
    // begining in the Markdown function since hashed blocks can be part of
    // list items and could have been indented. Indented blocks would have 
    // been seen as a code block in a previous pass of hashHTMLBlocks.
    text = this.hashHTMLBlocks(text);
    return this.runBasicBlockGamut(text);
};

/**
 * Run block gamut tranformations, without hashing HTML blocks. This is 
 * useful when HTML blocks are known to be already hashed, like in the first
 * whole-document pass.
 */
Markdown_Parser.prototype.runBasicBlockGamut = function(text) {
    for(var i = 0; i < this.block_gamut.length; i++) {
        var method = this.block_gamut[i][0];
        if(method) {
            text = method.call(this, text);
        }
    }
    // Finally form paragraph and restore hashed blocks.
    text = this.formParagraphs(text);
    return text;
};

Markdown_Parser.prototype.doHeaders = function(text) {
    var self = this;
    // Setext-style headers:
    //    Header 1
    //    ========
    //
    //    Header 2
    //    --------
    //
    text = text.replace(/^(.+?)[ ]*\n(=+|-+)[ ]*\n+/mg, function(match, span, line) {
            console.log(match);
           // Terrible hack to check we haven't found an empty list item.
            if(line == '-' && span.match(/^-(?: |$)/)) {
                return match;
            }
            var level = line.charAt(0) == '=' ? 1 : 2;
            var block = "<h" + level + ">" + self.runSpanGamut(span) + "</h" + level + ">";
            return "\n" + self.hashBlock(block)  + "\n\n";
        }
    );

    // atx-style headers:
    //  # Header 1
    //  ## Header 2
    //  ## Header 2 with closing hashes ##
    //  ...
    //  ###### Header 6
    //
    text = text.replace(new RegExp(
        '^(\\#{1,6})' + // $1 = string of #\'s
        '[ ]*'       +
        '(.+?)'      + // $2 = Header text
        '[ ]*'       +
        '\\#*'        + // optional closing #\'s (not counted)
        '\\n+',
        'mg'), function(match, hashes, span) {
            console.log(match);
            var level = hashes.length;
            var block = "<h" + level + ">" + self.runSpanGamut(span) + "</h" + level + ">";
            return "\n" + self.hashBlock(block) + "\n\n";
        }
    );

    return text;
}

/**
 * Do Horizontal Rules:
 */
Markdown_Parser.prototype.doHorizontalRules = function(text) {
    var self = this;
    return text.replace(new RegExp(
        '^[ ]{0,3}'    + // Leading space
        '([-\\*_])'      + // $1: First marker
        '(?:'          + // Repeated marker group
            '[ ]{0,2}' + // Zero, one, or two spaces.
            '\\1'       + // Marker character
        '){2,}'        + // Group repeated at least twice
        '[ ]*'         + //Tailing spaces
        '$'            , // End of line.
    'mg'), function(match) {
        console.log(match);
        return "\n" + self.hashBlock("<hr" + self.empty_element_suffix) + "\n";
    });
};

/**
 * Run span gamut tranformations.
 */
Markdown_Parser.prototype.runSpanGamut = function(text) {
    for(var i = 0; i < this.span_gamut.length; i++) {
        var method = this.span_gamut[i][0];
        if(method) {
            text = method.call(this, text);
        }
    }
    return text;
};



/**
 * Params:
 * $text - string to process with html <p> tags
 */
Markdown_Parser.prototype.formParagraphs = function(text) {

    // Strip leading and trailing lines:
    text = this.__wrapSTXETX__(text);
    text = text.replace(/(?:\x02)\n+|\n+(?:\x03)/g, "");
    text = this.__unwrapSTXETX__(text);
    // [porting note]
    // below may be faster than js regexp.
    //for(var s = 0; s < text.length && text.charAt(s) == "\n"; s++) { }
    //text = text.substr(s);
    //for(var e = text.length; e > 0 && text.charAt(e - 1) == "\n"; e--) { }
    //text = text.substr(0, e);

    var grafs = text.split(/\n{2,}/);
    //preg_split('/\n{2,}/', $text, -1, PREG_SPLIT_NO_EMPTY);

    //
    // Wrap <p> tags and unhashify HTML blocks
    //
    for(var i = 0; i < grafs.length; i++) {
        var value = grafs[i];
        if(value == "") {
            // [porting note]
            // This case is replacement for PREG_SPLIT_NO_EMPTY.
        }
        else if (!value.match(/^B\x1A[0-9]+B$/)) {
            // Is a paragraph.
            value = this.runSpanGamut(value);
            value = value.replace(/^([ ]*)/, "<p>");
            value += "</p>";
            grafs[i] = this.unhash(value);
        }
        else {
            // Is a block.
            // Modify elements of @grafs in-place...
            var graf = value;
            var block = this.html_hashes[graf];
            graf = block;
            //if (preg_match('{
            //	\A
            //	(							# $1 = <div> tag
            //	  <div  \s+
            //	  [^>]*
            //	  \b
            //	  markdown\s*=\s*  ([\'"])	#	$2 = attr quote char
            //	  1
            //	  \2
            //	  [^>]*
            //	  >
            //	)
            //	(							# $3 = contents
            //	.*
            //	)
            //	(</div>)					# $4 = closing tag
            //	\z
            //	}xs', $block, $matches))
            //{
            //	list(, $div_open, , $div_content, $div_close) = $matches;
            //
            //	# We can't call Markdown(), because that resets the hash;
            //	# that initialization code should be pulled into its own sub, though.
            //	$div_content = $this->hashHTMLBlocks($div_content);
            //	
            //	# Run document gamut methods on the content.
            //	foreach ($this->document_gamut as $method => $priority) {
            //		$div_content = $this->$method($div_content);
            //	}
            //
            //	$div_open = preg_replace(
            //		'{\smarkdown\s*=\s*([\'"]).+?\1}', '', $div_open);
            //
            //	$graf = $div_open . "\n" . $div_content . "\n" . $div_close;
            //}
            grafs[i] = graf;
        }
    }

    return grafs.join("\n\n");
}

/**
 * Remove one level of line-leading tabs or spaces
 */
Markdown_Parser.prototype.outdent = function(text) {
    return text.replace(new RegExp('^(\\t|[ ]{1,' + this,tab_width + '})', 'm'), '');
};


//# String length function for detab. `_initDetab` will create a function to 
//# hanlde UTF-8 if the default function does not exist.
//var $utf8_strlen = 'mb_strlen';

/**
 * Replace tabs with the appropriate amount of space.
 */
Markdown_Parser.prototype.detab = function(text) {
    // For each line we separate the line in blocks delemited by
    // tab characters. Then we reconstruct every line by adding the 
    // appropriate number of space between each blocks.
    var self = this;
    return text.replace(/^.*\t.*$/m, function(line) {
        //$strlen = $this->utf8_strlen; # strlen function for UTF-8.
        // Split in blocks.
        var blocks = line.split("\t");
        // Add each blocks to the line.
        line = blocks.shift(); // Do not add first block twice.
        for(var i = 0; i < blocks.length; i++) {
            var block = blocks[i];
            // Calculate amount of space, insert spaces, insert block.
            var amount = self.tab_width - line.length % self.tab_width;
            line += _str_repeat(" ", amount) + block;
        }
        return line;
    });
};

/**
 * Swap back in all the tags hashed by _HashHTMLBlocks.
 */
Markdown_Parser.prototype.unhash = function(text) {
    var self = this;
    return text.replace(/(.)\x1A[0-9]+\1/, function(match) {
        return self.html_hashes[match];
    });
};
/*-------------------------------------------------------------------------*/

/**
 * Constructor function. Initialize the parser object.
 */
function MarkdownExtra_Parser() {
    // Prefix for footnote ids.
    this.fn_id_prefix = "";

    // Optional title attribute for footnote links and backlinks.
    this.fn_link_title = MARKDOWN_FN_LINK_TITLE;
    this.fn_backlink_title = MARKDOWN_FN_BACKLINK_TITLE;

    // Optional class attribute for footnote links and backlinks.
    this.fn_link_class = MARKDOWN_FN_LINK_CLASS;
    this.fn_backlink_class = MARKDOWN_FN_BACKLINK_CLASS;

    // Predefined abbreviations.
    this.predef_abbr = [];

    // Extra variables used during extra transformations.
    this.footnotes = [];
    this.footnotes_ordered = [];
    this.abbr_desciptions = {};
    this.abbr_word_re = '';

    // Give the current footnote number.
    this.footnote_counter = 1;

    // ### HTML Block Parser ###

    // Tags that are always treated as block tags:
    this.block_tags_re = /p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|address|form|fieldset|iframe|hr|legend/;

    // Tags treated as block tags only if the opening tag is alone on it's line:
    this.context_block_tags_re = /script|noscript|math|ins|del/;

    // Tags where markdown="1" default to span mode:
    this.contain_span_tags_re = /p|h[1-6]|li|dd|dt|td|th|legend|address/;

    // Tags which must not have their contents modified, no matter where 
    // they appear:
    this.clean_tags_re = /script|math/;

    // Tags that do not need to be closed.
    this.auto_close_tags_re = /hr|img/;

    // Redefining emphasis markers so that emphasis by underscore does not
    // work in the middle of a word.
    /*
    this.em_relist = [
        ['' , /(?:(?<!\*)\*(?!\*)|(?<![a-zA-Z0-9_])_(?!_))(?=\S|$)(?![\.,:;]\s)/],
        ['*', /(?<=\S|^)(?<!\*)\*(?!\*)/],
        ['_', /(?<=\S|^)(?<!_)_(?![a-zA-Z0-9_])/]
    ];
    this.strong_relist = [
        [''  , /(?:(?<!\*)\*\*(?!\*)|(?<![a-zA-Z0-9_])__(?!_))(?=\S|$)(?![\.,:;]\s)/],
        ['**', /(?<=\S|^)(?<!\*)\*\*(?!\*)/],
        ['__', /(?<=\S|^)(?<!_)__(?![a-zA-Z0-9_])/]
    ];
    this.em_strong_relist = [
        [''   , /(?:(?<!\*)\*\*\*(?!\*)|(?<![a-zA-Z0-9_])___(?!_))(?=\S|$)(?![\.,:;]\s)/],
        ['***', /(?<=\S|^)(?<!\*)\*\*\*(?!\*)/],
        ['___', /(?<=\S|^)(?<!_)___(?![a-zA-Z0-9_])/]
    ];
    */
}
MarkdownExtra_Parser.prototype = new Markdown_Parser();

MarkdownExtra_Parser.prototype.init = function() {
    // Add extra escapable characters before parent constructor 
    // initialize the table.
    this.escape_chars += ':|';

    // Insert extra document, block, and span transformations. 
    // Parent constructor will do the sorting.
    this.document_gamut.push([this.doFencedCodeBlocks,  5]);
    this.document_gamut.push([this.stripFootnotes,     15]);
    this.document_gamut.push([this.stripAbbreviations, 25]);
    this.document_gamut.push([this.appendFootnotes,    50]);

    this.block_gamut.push([this.doFencedCodeBlocks,  5]);
    this.block_gamut.push([this.doTables,           15]);
    this.block_gamut.push([this.doDefLists,         45]);

    this.span_gamut.push([this.doFootnotes,      5]);
    this.span_gamut.push([this.doAbbreviations, 70]);

    this.constructor.prototype.init.call(this);
};

/**
 * Setting up Extra-specific variables.
 */
MarkdownExtra_Parser.prototype.setup = function() {
    this.constructor.prototype.setup.call(this);

    this.footnotes = [];
    this.footnotes_ordered = [];
    this.abbr_desciptions = {};
    this.abbr_word_re = '';
    this.footnote_counter = 1;

    for(var abbr_word in this.predef_abbr) {
        var abbr_desc = this.predef_abbr[abbr_word];
        if(this.abbr_word_re != '') {
            this.abbr_word_re += '|';
        }
        this.abbr_word_re += _preg_quote(abbr_word); // ?? str -> re?
        this.abbr_desciptions[abbr_word] = _trim(abbr_desc);
    }
};

/**
 * Clearing Extra-specific variables.
 */
MarkdownExtra_Parser.prototype.teardown = function() {
    this.footnotes = [];
    this.footnotes_ordered = [];
    this.abbr_desciptions = {};
    this.abbr_word_re = '';

    this.constructor.prototype.teardown.call(this);
};

