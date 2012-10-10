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
MARKDOWN_PARSER_CLASS = 'MarkdownExtra_Parser';

/**
 * Converts Markdown formatted text to HTML.
 * @param text Markdown text
 * @return HTML
 */
function Markdown($text) {
    //Initialize the parser and return the result of its transform method.
    var parser;
    if('undefined' == typeof arguments.callee.parser) {
        parser = eval("new " + MARKDOWN_PARSER_CLASS + "()");
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
function _preg_quote(text) {
  if(!arguments.callee.sRE) {
    arguments.callee.sRE = /(\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\}\\)/g;
  }
  return text.replace(arguments.callee.sRE, '\\$1');
}

function _str_repeat(str, n) {
    var tmp = str;
    for(var i = 1; i < n; i++) {
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

function _htmlspecialchars_ENT_NOQUOTES(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
        ['stripLinkDefinitions', 20],
        ['runBasicBlockGamut',   30]
    ];

    // These are all the transformations that form block-level
    /// tags like paragraphs, headers, and list items.
    this.block_gamut = [
        ['doHeaders',         10],
        ['doHorizontalRules', 20],
        ['doLists',           40],
        ['doCodeBlocks',      50],
        ['doBlockQuotes',     60],
    ];

    // These are all the transformations that occur *within* block-level
    // tags like paragraphs, headers, and list items.
    this.span_gamut = [
        // Process character escapes, code spans, and inline HTML
        // in one shot.
        ['parseSpan',          -30],
        // Process anchor and image tags. Images must come first,
        // because ![foo][f] looks like an anchor.
        ['doImages',            10],
        ['doAnchors',           20],
        // Make links out of things like `<http://example.com/>`
        // Must come after doAnchors, because you can use < and >
        // delimiters in inline links like [this](<url>).
        ['doAutoLinks',         30],
        ['encodeAmpsAndAngles', 40],
        ['doItalicsAndBold',    50],
        ['doHardBreaks',        60]
    ];

    this.em_relist = [
        ['' , '(?:(^|[^\\*])(\\*)(?=[^\\*])|(^|[^_])(_)(?=[^_]))(?=\\S|$)(?![\\.,:;]\\s)'],
        ['*', '((?:\\S|^)[^\\*])(\\*)(?!\\*)'],
        ['_', '((?:\\S|^)[^_])(_)(?!_)']
    ];
    this.strong_relist = [
        ['' , '(?:(^|[^\\*])(\\*\\*)(?=[^\\*])|(^|[^_])(__)(?=[^_]))(?=\\S|$)(?![\\.,:;]\\s)'],
        ['**', '((?:\\S|^)[^\\*])(\\*\\*)(?!\\*)'],
        ['__', '((?:\\S|^)[^_])(__)(?!_)']
    ];
    this.em_strong_relist = [
        ['' , '(?:(^|[^\\*])(\\*\\*\\*)(?=[^\\*])|(^|[^_])(___)(?=[^_]))(?=\\S|$)(?![\\.,:;]\\s)'],
        ['***', '((?:\\S|^)[^\\*])(\\*\\*\\*)(?!\\*)'],
        ['___', '((?:\\S|^)[^_])(___)(?!_)']
    ];
}

Markdown_Parser.prototype.init = function() {
    // this._initDetab(); // NOTE: JavaScript string length is already based on Unicode
    this.prepareItalicsAndBold();

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
    this.nested_brackets_re =
        _str_repeat('(?:[^\\[\\]]+|\\[', this.nested_brackets_depth) +
        _str_repeat('\\])*', this.nested_brackets_depth);
    this.nested_url_parenthesis_re =
        _str_repeat('(?:[^\\(\\)\\s]+|\\(', this.nested_url_parenthesis_depth) +
        _str_repeat('(?:\\)))*', this.nested_url_parenthesis_depth);

    // Table of hash values for escaped characters:
    var tmp = []
    for(var i = 0; i < this.escape_chars.length; i++) {
        tmp.push(_preg_quote(this.escape_chars.charAt(i)));
    }
    this.escape_chars_re = new RegExp('[' + tmp.join('') + ']');

    // Change to ">" for HTML output.
    this.empty_element_suffix = MARKDOWN_EMPTY_ELEMENT_SUFFIX;
    this.tab_width = MARKDOWN_TAB_WIDTH;

    // Change to `true` to disallow markup or entities.
    this.no_markup = false;
    this.no_entities = false;

    // Predefined urls and titles for reference links and images.
    this.predef_urls = {};
    this.predef_titles = {};

    // Sort document, block, and span gamut in ascendent priority order.
    function cmp_gamut(a, b) {
        a = a[1]; b = b[1];
        return a > b ? 1 : a < b ? -1 : 0;
    }
    this.document_gamut.sort(cmp_gamut);
    this.block_gamut.sort(cmp_gamut);
    this.span_gamut.sort(cmp_gamut);

    // Internal hashes used during transformation.
    this.urls = {};
    this.titles = {};
    this.html_hashes = {};

    // Status flag to avoid invalid nesting.
    this.in_anchor = false;
}

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
    this.urls = {};
    this.titles = {};
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
        var method = this[this.document_gamut[i][0]];
        if(method) {
            text = method.call(this, text);
        }
        else {
            console.log(this.document_gamut[i][0] + ' not implemented');
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
        //console.log(match);
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
        'mg'), function(match, id, url2, url3, title) {
            //console.log(match);
            var link_id = id.toLowerCase();
            var url = url2 ? url2 : url3;
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
        var method = this[this.block_gamut[i][0]];
        if(method) {
            text = method.call(this, text);
        }
        else {
            console.log(this.block_gamut[i][0] + ' not implemented');
        }
    }
    // Finally form paragraph and restore hashed blocks.
    text = this.formParagraphs(text);
    return text;
};

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
        //console.log(match);
        return "\n" + self.hashBlock("<hr" + self.empty_element_suffix) + "\n";
    });
};

/**
 * Run span gamut tranformations.
 */
Markdown_Parser.prototype.runSpanGamut = function(text) {
    for(var i = 0; i < this.span_gamut.length; i++) {
        var method = this[this.span_gamut[i][0]];
        if(method) {
            text = method.call(this, text);
        }
        else {
            console.log(this.span_gamut[i][0] + ' not implemented');
        }
    }
    return text;
};

/**
 * Do hard breaks:
 */
Markdown_Parser.prototype.doHardBreaks = function(text) {
    var self = this;
    return text.replace(/ {2,}\n/, function(match) {
        //console.log(match);
        return self.hashPart("<br" + self.empty_element_suffix + "\n");
    });
};


/**
 * Turn Markdown link shortcuts into XHTML <a> tags.
 */
Markdown_Parser.prototype.doAnchors = function(text) {
    if (this.in_anchor) return text;
    this.in_anchor = true;

    var self = this;

    var _doAnchors_reference_callback = function(match, whole_match, link_text, link_id) {
        //console.log(match);
        if (link_id == "") {
            // for shortcut links like [this][] or [this].
            link_id = link_text;
        }

        // lower-case and turn embedded newlines into spaces
        link_id = link_id.toLowerCase();
        link_id = link_id.replace(/[ ]?\n/, ' ');

        var result;
        if (self.urls[link_id] !== undefined) {
            var url = self.urls[link_id];
            url = self.encodeAttribute(url);

            result = "<a href=\"" + url + "\"";
            if (self.titles[link_id] !== undefined) {
                var title = self.titles[link_id];
                title = self.encodeAttribute(title);
                result +=  " title=\"" + title + "\"";
            }

            var link_text = self.runSpanGamut(link_text);
            result += ">" + link_text + "</a>";
            result = self.hashPart(result);
        }
        else {
            result = whole_match;
        }
        return result;
    };

    //
    // First, handle reference-style links: [link text] [id]
    //
    text = text.replace(new RegExp(
        '(' +					// wrap whole match in $1
          '\\[' +
            '(' + this.nested_brackets_re + ')' +  // link text = $2
          '\\]' +

          '[ ]?' +				// one optional space
          '(?:\\n[ ]*)?' +		// one optional newline followed by spaces

          '\\[' +
            '(.*?)' +		// id = $3
          '\\]' +
        ')'), _doAnchors_reference_callback
    );

    //
    // Next, inline-style links: [link text](url "optional title")
    //
    text = text.replace(new RegExp(
        '(' +				// wrap whole match in $1
          '\\[' +
            '(' + this.nested_brackets_re + ')' +	// link text = $2
          '\\]' +
          '\\(' +			// literal paren
            '[ \\n]*' +
            '(?:' +
                '<(.+?)>' +	// href = $3
            '|' +
                '(' + this.nested_url_parenthesis_re + ')' +	// href = $4
            ')' +
            '[ \\n]*' +
            '(' +			// $5
              '([\'"])' +	// quote char = $6
              '(.*?)' +		// Title = $7
              '\\6' +		// matching quote
              '[ \\n]*' +	// ignore any spaces/tabs between closing quote and )
            ')?' +			// title is optional
          '\\)' +
        ')'), function(match, whole_match, link_text, url3, url4, x0, x1, title) {
            //console.log(match);
            link_text = self.runSpanGamut(link_text);
            var url = url3 ? url3 : url4;

            url = self.encodeAttribute(url);

            var result = "<a href=\"" + url + "\"";
            if (title !== undefined) {
                title = self.encodeAttribute(title);
                result +=  " title=\"" + title + "\"";
            }

            link_text = self.runSpanGamut(link_text);
            result += ">" + link_text + "</a>";

            return self.hashPart(result);
        }
    );

    //
    // Last, handle reference-style shortcuts: [link text]
    // These must come last in case you've also got [link text][1]
    // or [link text](/foo)
    //
    text = text.replace(new RegExp(
        '(' +					//# wrap whole match in $1
          '\\[' +
            ' +([^\\[\\]]+)' +		//# link text = $2; can\'t contain [ or ]
          ' +\\]' +
        ' +)'), _doAnchors_reference_callback
    );

    this.in_anchor = false;
    return text;
};

/**
 * Turn Markdown image shortcuts into <img> tags.
 */
Markdown_Parser.prototype.doImages = function(text) {
    var self = this;

    //
    // First, handle reference-style labeled images: ![alt text][id]
    //
    text = text.replace(new RegExp(
        '(' +				// wrap whole match in $1
          '!\\[' +
            '(' + this.nested_brackets_re + ')' +		// alt text = $2
          '\\]' +

          '[ ]?' +				// one optional space
          '(?:\\n[ ]*)?' +		// one optional newline followed by spaces

          '\\[' +
            '(.*?)' +		// id = $3
          '\\]' +

        ')'
    ), function(match, whole_match, alt_text, link_id) {
        //console.log(match);
        link_id = link_id.toLowerCase();

        if (link_id == "") {
            $link_id = alt_text.toLowerCase(); // for shortcut links like ![this][].
        }

        alt_text = self.encodeAttribute(alt_text);
        var result;
        if (self.urls[link_id] !== undefined) {
            var url = self.encodeAttribute(self.urls[link_id]);
            result = "<img src=\"" + url + "\" alt=\"" + alt_text + "\"";
            if (self.titles[link_id] !== undefined) {
                var title = self.titles[link_id];
                title = self.encodeAttribute(title);
                result +=  " title=\"" + title + "\"";
            }
            result += self.empty_element_suffix;
            result = self.hashPart(result);
        }
        else {
            // If there's no such link ID, leave intact:
            result = whole_match;
        }

        return result;
    });

    //
    // Next, handle inline images:  ![alt text](url "optional title")
    // Don't forget: encode * and _
    //
    text = text.replace(new RegExp(
        '(' + 				// wrap whole match in $1
          '!\\[' +
            '(' + this.nested_brackets_re + ')' +		// alt text = $2
          '\\]' +
          '\\s?' +			// One optional whitespace character
          '\\(' +			// literal paren
            '[ \\n]*' +
            '(?:' +
                '<(\\S*)>' +	// src url = $3
            '|' +
                '(' + this.nested_url_parenthesis_re + ')' +	// src url = $4
            ')' +
            '[ \\n]*' +
            '(' +			// $5
              '([\'"])' +	// quote char = $6
              '(.*?)' +		// title = $7
              '\\6' +		// matching quote
              '[ \\n]*' +
            ')?' +			// title is optional
          '\\)' +
        ')'
    ), function(match, whole_match, alt_text, url3, url4, x5, x6, title) {
        //console.log(match);
        var url = url3 ? url3 : url4;

        alt_text = self.encodeAttribute(alt_text);
        url = self.encodeAttribute(url);
        var result = "<img src=\"" + url + "\" alt=\"" + alt_text + "\"";
        if (title !== undefined) {
            title = self.encodeAttribute(title);
            result +=  " title=\"" + title + "\""; // $title already quoted
        }
        result += self.empty_element_suffix;

        return self.hashPart(result);
    });

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
       //console.log(match);
       // Terrible hack to check we haven't found an empty list item.
        if(line == '-' && span.match(/^-(?: |$)/)) {
            return match;
        }
        var level = line.charAt(0) == '=' ? 1 : 2;
        var block = "<h" + level + ">" + self.runSpanGamut(span) + "</h" + level + ">";
        return "\n" + self.hashBlock(block)  + "\n\n";
    });

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
            //console.log(match);
            var level = hashes.length;
            var block = "<h" + level + ">" + self.runSpanGamut(span) + "</h" + level + ">";
            return "\n" + self.hashBlock(block) + "\n\n";
        }
    );

    return text;
}

/**
 * Form HTML ordered (numbered) and unordered (bulleted) lists.
 */
Markdown_Parser.prototype.doLists = function(text) {
    var less_than_tab = this.tab_width - 1;

    // Re-usable patterns to match list item bullets and number markers:
    var marker_ul_re  = '[\\*\\+-]';
    var marker_ol_re  = '\\d+[\\.]';
    var marker_any_re = "(?:" + marker_ul_re + "|" + marker_ol_re + ")";

    var self = this;
    var _doLists_callback = function(match, list, x2, x3, type) {
        //console.log(match);
        // Re-usable patterns to match list item bullets and number markers:
        var list_type = type.match(marker_ul_re) ? "ul" : "ol";

        var marker_any_re = list_type == "ul" ? marker_ul_re : marker_ol_re;

        list += "\n";
        var result = self.processListItems(list, marker_any_re);

        result = self.hashBlock("<" + list_type + ">\n" + result + "</" + list_type + ">");
        return "\n" + result + "\n\n";
    };

    var markers_relist = [
        [marker_ul_re, marker_ol_re],
        [marker_ol_re, marker_ul_re]
    ];

    for (var i = 0; i < markers_relist.length; i++) {
        var marker_re = markers_relist[i][0];
        var other_marker_re = markers_relist[i][1];
        // Re-usable pattern to match any entirel ul or ol list:
        var whole_list_re =
            '(' +								// $1 = whole list
              '(' +								// $2
                '([ ]{0,' + less_than_tab + '})' +	// $3 = number of spaces
                '(' + marker_re + ')' +			// $4 = first list item marker
                '[ ]+' +
              ')' +
              '[\\s\\S]+?' +
              '(' +								// $5
                  '(?=\\x03)' +  // \z
                '|' +
                  '\\n{2,}' +
                  '(?=\\S)' +
                  '(?!' +						// Negative lookahead for another list item marker
                    '[ ]*' +
                    marker_re + '[ ]+' +
                  ')' +
                '|' +
                  '(?=' +						// Lookahead for another kind of list
                    '\\n' +
                    '\\3' +						// Must have the same indentation
                    other_marker_re + '[ ]+' +
                  ')' +
              ')' +
            ')'; // mx

        // We use a different prefix before nested lists than top-level lists.
        // See extended comment in _ProcessListItems().

        text = this.__wrapSTXETX__(text);
        if (this.list_level) {
            text = text.replace(new RegExp('^' + whole_list_re, "mg"), _doLists_callback);
        }
        else {
            text = text.replace(new RegExp(
                '(?:(?=\\n)\\n|\\x02\\n?)' + // Must eat the newline
                whole_list_re, "mg"
            ), _doLists_callback);
        }
        text = this.__unwrapSTXETX__(text);
    }

    return text;
};

// var $list_level = 0;

/**
 * Process the contents of a single ordered or unordered list, splitting it
 * into individual list items.
 */
Markdown_Parser.prototype.processListItems = function(list_str, marker_any_re) {
    // The $this->list_level global keeps track of when we're inside a list.
    // Each time we enter a list, we increment it; when we leave a list,
    // we decrement. If it's zero, we're not in a list anymore.
    //
    // We do this because when we're not inside a list, we want to treat
    // something like this:
    //
    //    I recommend upgrading to version
    //    8. Oops, now this line is treated
    //    as a sub-list.
    //
    // As a single paragraph, despite the fact that the second line starts
    // with a digit-period-space sequence.
    //
    // Whereas when we're inside a list (or sub-list), that line will be
    // treated as the start of a sub-list. What a kludge, huh? This is
    // an aspect of Markdown's syntax that's hard to parse perfectly
    // without resorting to mind-reading. Perhaps the solution is to
    // change the syntax rules such that sub-lists must start with a
    // starting cardinal number; e.g. "1." or "a.".

    if(this.list_level === undefined) {
        this.list_level = 0;
    }
    this.list_level++;

    // trim trailing blank lines:
    list_str = this.__wrapSTXETX__(list_str);
    var list_str = list_str.replace(/\n{2,}(?=\x03)/m, "\n");
    list_str = this.__unwrapSTXETX__(list_str);

    var self = this;
    list_str = this.__wrapSTXETX__(list_str);
    list_str = list_str.replace(new RegExp(
        '(\\n)?' +							// leading line = $1
        '([ ]*)' +							// leading whitespace = $2
        '(' + marker_any_re +				// list marker and space = $3
            '(?:[ ]+|(?=\\n))' +				// space only required if item is not empty
        ')' +
        '([\\s\\S]*?)' +						// list item text   = $4
        '(?:(\\n+(?=\\n))|\\n)' +				// tailing blank line = $5
        '(?=\\n*(\\x03|\\2(' + marker_any_re + ')(?:[ ]+|(?=\\n))))', "gm"
    ), function(match, leading_line, leading_space, marker_space, item, tailing_blank_line) {
        //console.log(match);
        //console.log(item, [leading_line ? leading_line.length : 0, tailing_blank_line ? tailing_blank_line.length : 0]);
        if (leading_line || tailing_blank_line || item.match(/\n{2,}/)) {
            // Replace marker with the appropriate whitespace indentation
            item = leading_space + _str_repeat(' ', marker_space.length) + item;
            item = self.runBlockGamut(self.outdent(item) + "\n");
        }
        else {
            // Recursion for sub-lists:
            item = self.doLists(self.outdent(item));
            item = item.replace(/\n+$/m, '');
            item = self.runSpanGamut(item);
        }

        return "<li>" + item + "</li>\n";
    });
    list_str = this.__unwrapSTXETX__(list_str);

    this.list_level--;
    return list_str;
}

/**
 *   Process Markdown `<pre><code>` blocks.
 */
Markdown_Parser.prototype.doCodeBlocks = function(text) {
    var self = this;
    text = this.__wrapSTXETX__(text);
    text = text.replace(new RegExp(
        '(?:\\n\\n|(?=\\x02)\\n?)' +
        '(' +	            // $1 = the code block -- one or more lines, starting with a space/tab
          '(?:^' +
            '[ ]{' + this.tab_width + ',}' +  // Lines must start with a tab or a tab-width of spaces
            '.*\\n+' +
          ')+' +
        ')' +
        '((?=[ ]{0,' + this.tab_width + '}\\S)|(?:\\n*(?=\\x03)))',	// Lookahead for non-space at line-start, or end of doc
        'mg'
    ), function(match, codeblock) {
        //console.log(match);
        codeblock = self.outdent(codeblock);
        codeblock = _htmlspecialchars_ENT_NOQUOTES(codeblock);

        // trim leading newlines and trailing newlines
        codeblock = self.__wrapSTXETX__(codeblock);
        codeblock = codeblock.replace(/(?=\x02)\n+|\n+(?=\x03)/g, '');
        codeblock = self.__unwrapSTXETX__(codeblock);

        codeblock = "<pre><code>" + codeblock + "\n</code></pre>";
        return "\n\n" + self.hashBlock(codeblock) + "\n\n";
    });
    text = this.__unwrapSTXETX__(text);
    return text;
};

/**
 * Create a code span markup for $code. Called from handleSpanToken.
 */
Markdown_Parser.prototype.makeCodeSpan = function(code) {
    code = _htmlspecialchars_ENT_NOQUOTES(_trim(code));
    return this.hashPart("<code>" + code + "</code>");
};

/**
 * Prepare regular expressions for searching emphasis tokens in any
 * context.
 */
Markdown_Parser.prototype.prepareItalicsAndBold = function() {
    this.em_strong_prepared_relist = {};
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
            var token_re = new RegExp('(' + token_relist.join('|')  + ')');
            this.em_strong_prepared_relist['rx_' + em + strong] = token_re;
        }
    }
};

Markdown_Parser.prototype.doItalicsAndBold = function(text) {
    var em = '';
    var strong = '';
    var tree_char_em = false;
    var text_stack = [''];
    var token_stack = [];

    while (1) {
        //
        // Get prepared regular expression for seraching emphasis tokens
        // in current context.
        //
        var token_re = this.em_strong_prepared_relist['rx_' + em + strong];

        //
        // Each loop iteration search for the next emphasis token. 
        // Each token is then passed to handleSpanToken.
        //
        var parts = text.match(token_re); //PREG_SPLIT_DELIM_CAPTURE
        if(parts) {
            var left = RegExp.leftContext;
            var right = RegExp.rightContext;
            var pre = "";
            var marker = parts[1];
            for(var mg = 2; mg < parts.length; mg += 2) {
                if(parts[mg] !== undefined) {
                    pre = parts[mg];
                    marker = parts[mg + 1];
                    break;
                }
            }
            //console.log([left + pre, marker]);
            text_stack[0] += left + pre;
            token = marker;
            text = right;
        }
        else {
            text_stack[0] += text;
            // Reached end of text span: empty stack without emitting.
            // any more emphasis.
            while (token_stack.length > 0 && token_stack[0].length > 0) {
                text_stack[1] += token_stack.shift();
                text_stack[0] += text_stack.shift();
            }
            break;
        }

        var tag, span;

        var token_len = token.length;
        if (tree_char_em) {
            // Reached closing marker while inside a three-char emphasis.
            if (token_len == 3) {
                // Three-char closing marker, close em and strong.
                token_stack.shift();
                span = text_stack.shift();
                span = this.runSpanGamut(span);
                span = "<strong><em>" + span + "</em></strong>";
                text_stack[0] += this.hashPart(span);
                em = '';
                strong = '';
            } else {
                // Other closing marker: close one em or strong and
                // change current token state to match the other
                token_stack[0] = _str_repeat(token.charAt(0), 3 - token_len);
                tag = token_len == 2 ? "strong" : "em";
                span = text_stack[0];
                span = this.runSpanGamut(span);
                span = "<" + tag + ">" + span + "</" + tag + ">";
                text_stack[0] = this.hashPart(span);
                if(tag == 'strong') { strong = ''; } else { em = ''; }
            }
            tree_char_em = false;
        } else if (token_len == 3) {
            if (em != '') {
                // Reached closing marker for both em and strong.
                // Closing strong marker:
                for (var i = 0; i < 2; ++i) {
                    var shifted_token = token_stack.shift();
                    tag = shifted_token.length == 2 ? "strong" : "em";
                    span = text_stack.shift();
                    span = this.runSpanGamut(span);
                    span = "<" + tag + ">" + span + "</" + tag + ">";
                    text_stack[0] = this.hashPart(span);
                    if(tag == 'strong') { strong = ''; } else { em = ''; }
                }
            } else {
                // Reached opening three-char emphasis marker. Push on token 
                // stack; will be handled by the special condition above.
                em = token.charAt(0);
                strong = em + em;
                token_stack.unshift(token);
                text_stack.unshift('');
                tree_char_em = true;
            }
        } else if (token_len == 2) {
            if (strong != '') {
                // Unwind any dangling emphasis marker:
                if (token_stack[0].length == 1) {
                    text_stack[1] += token_stack.shift();
                    text_stack[0] += text_stack.shift();
                }
                // Closing strong marker:
                token_stack.shift();
                span = text_stack.shift();
                span = this.runSpanGamut(span);
                span = "<strong>" + span + "</strong>";
                text_stack[0] += this.hashPart(span);
                strong = '';
            } else {
                token_stack.unshift(token);
                text_stack.unshift('');
                strong = token;
            }
        } else {
            // Here $token_len == 1
            if (em != '') {
                if (token_stack[0].length == 1) {
                    // Closing emphasis marker:
                    token_stack.shift();
                    span = text_stack.shift();
                    span = this.runSpanGamut(span);
                    span = "<em>" + span + "</em>";
                    text_stack[0] += this.hashPart(span);
                    em = '';
                } else {
                    text_stack[0] += token;
                }
            } else {
                token_stack.unshift(token);
                text_stack.unshift('');
                em = token;
            }
        }
    }
    return text_stack[0];
};


Markdown_Parser.prototype.doBlockQuotes = function(text) {
    var self = this;
    text = text.replace(new RegExp(
        '('+								// Wrap whole match in $1
          '(?:'+
            '^[ ]*>[ ]?'+			// ">" at the start of a line
              '.+\\n'+					// rest of the first line
            '(.+\\n)*'+					// subsequent consecutive lines
            '\\n*'+						// blanks
          ')+'+
        ')', 'mg'
    ), function(match, bq) {
        //console.log(match);
        // trim one level of quoting - trim whitespace-only lines
        bq = bq.replace(/^[ ]*>[ ]?|^[ ]+$/mg, '');
        bq = self.runBlockGamut(bq);		// recurse

        bq = bq.replace(/^/mg, "  ");
        // These leading spaces cause problem with <pre> content, 
        // so we need to fix that:
        bq = bq.replace(/(\\s*<pre>[\\s\\S]+?<\/pre>)/mg, function(match, pre) {
            //console.log(match);
            pre = pre.replace(/^  /m, '');
            return pre;
        });

        return "\n" + self.hashBlock("<blockquote>\n" + bq + "\n</blockquote>") + "\n\n";
    });
    return text;
}

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

    var grafs = text.split(/\n{2,}/m);
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
 * Encode text for a double-quoted HTML attribute. This function
 * is *not* suitable for attributes enclosed in single quotes.
 */
Markdown_Parser.prototype.encodeAttribute = function(text) {
    text = this.encodeAmpsAndAngles(text);
    text = text.replace(/"/g, '&quot;');
    return text;
};

/**
 * Smart processing for ampersands and angle brackets that need to 
 * be encoded. Valid character entities are left alone unless the
 * no-entities mode is set.
 */
Markdown_Parser.prototype.encodeAmpsAndAngles = function(text) {
    if (this.no_entities) {
        text = text.replace(/&/g, '&amp;');
    } else {
        // Ampersand-encoding based entirely on Nat Irons's Amputator
        // MT plugin: <http://bumppo.net/projects/amputator/>
        text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/, '&amp;');
    }
    // Encode remaining <'s
    text = text.replace(/</g, '&lt;');

    return text;
};

Markdown_Parser.prototype.doAutoLinks = function(text) {
    var self = this;
    text = text.replace(/<((https?|ftp|dict):[^'">\s]+)>/i, function(match, address) {
        //console.log(match);
        var url = self.encodeAttribute(address);
        var link = "<a href=\"" + url + "\">" + url + "</a>";
        return self.hashPart(link);
    });

    // Email addresses: <address@domain.foo>
    text = text.replace(new RegExp(
        '<' +
        '(?:mailto:)?' +
        '(' +
            '(?:' +
                '[-!#$%&\'*+/=?^_`.{|}~\w\x80-\xFF]+' +
            '|' +
                '".*?"' +
            ')' +
            '\@' +
            '(?:' +
                '[-a-z0-9\x80-\xFF]+(\.[-a-z0-9\x80-\xFF]+)*\.[a-z]+' +
            '|' +
                '\[[\d.a-fA-F:]+\]' +	// IPv4 & IPv6
            ')' +
        ')' +
        '>', 'i'
    ), function(match, address) {
        //console.log(match);
        var link = self.encodeEmailAddress(address);
        return self.hashPart(link);
    });

    return text;
};

/**
 *  Input: an email address, e.g. "foo@example.com"
 *
 *  Output: the email address as a mailto link, with each character
 *      of the address encoded as either a decimal or hex entity, in
 *      the hopes of foiling most address harvesting spam bots. E.g.:
 *
 *    <p><a href="&#109;&#x61;&#105;&#x6c;&#116;&#x6f;&#58;&#x66;o&#111;
 *        &#x40;&#101;&#x78;&#97;&#x6d;&#112;&#x6c;&#101;&#46;&#x63;&#111;
 *        &#x6d;">&#x66;o&#111;&#x40;&#101;&#x78;&#97;&#x6d;&#112;&#x6c;
 *        &#101;&#46;&#x63;&#111;&#x6d;</a></p>
 *
 *   Based by a filter by Matthew Wickline, posted to BBEdit-Talk.
 *   With some optimizations by Milian Wolff.
 */
Markdown_Parser.prototype.encodeEmailAddress = function(addr) {
    var addr = "mailto:" + addr;
    // TODO: later
    /*
    var chars = [];
    for(var i = 0; i < addr.length; i++) {
        chars.push(addr.charAt(i));
    }
    var seed = Math.floor(Math.abs(_crc32(addr) / addr.length)); // # Deterministic seed.

    for(var i = 0; i < chars.length; i++) {
        var c = chars[i];
        var ord = c.charCodeAt(0);
        // Ignore non-ascii chars.
        if(ord < 128) {
            var r = (seed * (1 + i)) % 100; // Pseudo-random function.
            // roughly 10% raw, 45% hex, 45% dec
            // '@' *must* be encoded. I insist.
            if(r > 90 && c != '@') { /* do nothing * / }
            else if(r < 45) { chars[i] = '&#x' + _dechex(ord) + ';'; }
            else            { chars[i] = '&#' + ord + ';'; }
        }
    }
    */
    addr = chars.join('');
    
    var text = addr.substr(7); // text without `mailto:`
    addr = "<a href=\"" + addr + "\">" + text + "</a>";

    return addr;
};

/**
 * Take the string $str and parse it into tokens, hashing embeded HTML,
 * escaped characters and handling code spans.
*/
Markdown_Parser.prototype.parseSpan = function(str) {
    var output = '';

    var span_re = new RegExp(
            '(' +
                '\\\\' + this.escape_chars_re +
            '|' +
                '([^`\\\\]?)' +     // $2
                '(`+)' +					// $3 // code span marker
        (this.no_markup ? '' : (
            '|' +
                '<!--.*?-->' +		// comment
            '|' +
                '<\\?.*?\\?>|<%.*?%>' +		// processing instruction
            '|' +
                '<[/!$]?[-a-zA-Z0-9:_]+' +	// regular tags
                '(?=' +
                    '\\s' +
                    '(?=[^"\'>]+|"[^"]*"|\'[^\']*\')*' +
                ')?' +
                '>'
        )) +
            ')'
    );

    while(1) {
        //
        // Each loop iteration seach for either the next tag, the next 
        // openning code span marker, or the next escaped character. 
        // Each token is then passed to handleSpanToken.
        //
        var parts = str.match(span_re); //PREG_SPLIT_DELIM_CAPTURE
        if(parts) {
            output += RegExp.leftContext + (RegExp.$2 ? RegExp.$2 : '');
            var r = this.handleSpanToken(RegExp.$3 ? RegExp.$3 : RegExp.lastMatch, RegExp.rightContext);
            output = r[0];
            str = r[1];
        }
        else {
            output += str;
            break;
        }
    }
    return output;
};


/**
 * Handle $token provided by parseSpan by determining its nature and 
 * returning the corresponding value that should replace it.
*/
Markdown_Parser.prototype.handleSpanToken = function(token, str) {
    //console.log([token, str]);
    switch (token.charAt(0)) {
        case "\\":
            return [this.hashPart("&#" + token.charCodeAt(1) + ";"), str];
        case "`":
            // Search for end marker in remaining text.
            if (str.match(new RegExp('^(.*?[^`])' + _preg_quote(token) + '(?!`)(.*)$', 'm'))) {
                str = RegExp.$2;
                var codespan = this.makeCodeSpan(RegExp.$1);
                return [this.hashPart(codespan), str];
            }
            return [token, str]; // return as text since no ending marker found.
        default:
            return [this.hashPart(token), str];
    }
};

/**
 * Remove one level of line-leading tabs or spaces
 */
Markdown_Parser.prototype.outdent = function(text) {
    return text.replace(new RegExp('^(\\t|[ ]{1,' + this.tab_width + '})', 'mg'), '');
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
    return text.replace(/(.)\x1A[0-9]+\1/g, function(match) {
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
    this.predef_abbr = {};

    // Extra variables used during extra transformations.
    this.footnotes = {};
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
    this.em_relist = [
        ['' , '(?:(^|[^\\*])(\\*)(?=[^\\*])|(^|[^a-zA-Z0-9_])(_)(?=[^_]))(?=\\S|$)(?![\\.,:;]\\s)'],
        ['*', '((?:\\S|^)[^\\*])(\\*)(?!\\*)'],
        ['_', '((?:\\S|^)[^_])(_)(?![a-zA-Z0-9_])']
    ];
    this.strong_relist = [
        ['' , '(?:(^|[^\\*])(\\*\\*)(?=[^\\*])|(^|[^a-zA-Z0-9_])(__)(?=[^_]))(?=\\S|$)(?![\\.,:;]\\s)'],
        ['**', '((?:\\S|^)[^\\*])(\\*\\*)(?!\\*)'],
        ['__', '((?:\\S|^)[^_])(__)(?![a-zA-Z0-9_])']
    ];
    this.em_strong_relist = [
        ['' , '(?:(^|[^\\*])(\\*\\*\\*)(?=[^\\*])|(^|[^a-zA-Z0-9_])(___)(?=[^_]))(?=\\S|$)(?![\\.,:;]\\s)'],
        ['***', '((?:\\S|^)[^\\*])(\\*\\*\\*)(?!\\*)'],
        ['___', '((?:\\S|^)[^_])(___)(?![a-zA-Z0-9_])']
    ];

    // Add extra escapable characters before parent constructor 
    // initialize the table.
    this.escape_chars += ':|';

    // Insert extra document, block, and span transformations. 
    // Parent constructor will do the sorting.
    this.document_gamut.push(['doFencedCodeBlocks',  5]);
    this.document_gamut.push(['stripFootnotes',     15]);
    this.document_gamut.push(['stripAbbreviations', 25]);
    this.document_gamut.push(['appendFootnotes',    50]);

    this.block_gamut.push(['doFencedCodeBlocks',  5]);
    this.block_gamut.push(['doTables',           15]);
    this.block_gamut.push(['doDefLists',         45]);

    this.span_gamut.push(['doFootnotes',      5]);
    this.span_gamut.push(['doAbbreviations', 70]);
}
MarkdownExtra_Parser.prototype = new Markdown_Parser();

/**
 * Setting up Extra-specific variables.
 */
MarkdownExtra_Parser.prototype.setup = function() {
    this.constructor.prototype.setup.call(this);

    this.footnotes = {};
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
    this.footnotes = {};
    this.footnotes_ordered = [];
    this.abbr_desciptions = {};
    this.abbr_word_re = '';

    this.constructor.prototype.teardown.call(this);
};

/**
 * Form HTML tables.
 */
MarkdownExtra_Parser.prototype.doTables = function(text) {
    var self = this;

    var less_than_tab = this.tab_width - 1;

    var _doTable_callback = function(match, head, underline, content) {
        //console.log(match);
        // Remove any tailing pipes for each line.
        head = head.replace(/[|] *$/m, '');
        underline = underline.replace(/[|] *$/m, '');
        content = content.replace(/[|] *$/m, '');

        var attr = [];

        // Reading alignement from header underline.
        var separators = underline.split(/[ ]*[|][ ]*/);
        for(var n = 0; n < separators.length; n++) {
            var s = separators[n];
            if (s.match(/^ *-+: *$/))       { attr[n] = ' align="right"'; }
            else if (s.match(/^ *:-+: *$/)) { attr[n] = ' align="center"'; }
            else if (s.match(/^ *:-+ *$/))  { attr[n] = ' align="left"'; }
            else                            { attr[n] = ''; }
        }

        // Parsing span elements, including code spans, character escapes, 
        // and inline HTML tags, so that pipes inside those gets ignored.
        head = self.parseSpan(head);
        var headers = head.split(/ *[|] */);
        var col_count = headers.length;

        // Write column headers.
        var text = "<table>\n";
        text += "<thead>\n";
        text += "<tr>\n";
        for(var n = 0; n < headers.length; n++) {
            var header = headers[n];
            text += "  <th" + attr[n] + ">" + self.runSpanGamut(_trim(header)) + "</th>\n";
        }
        text += "</tr>\n";
        text += "</thead>\n";

        // Split content by row.
        var rows = _trim(content, "\n").split("\n");

        text += "<tbody>\n";
        for(var i = 0; i < rows.length; i++) {
            var row = rows[i];
            // Parsing span elements, including code spans, character escapes, 
            // and inline HTML tags, so that pipes inside those gets ignored.
            row = self.parseSpan(row);

            // Split row by cell.
            var row_cells = row.split(/ *[|] */, col_count);
            while(row_cells.length < col_count) { row_cells.push(''); }

            text += "<tr>\n";
            for(var n = 0; n < row_cells.length; n++) {
                var cell = row_cells[n];
                text += "  <td" + attr[n] + ">" + self.runSpanGamut(_trim(cell)) + "</td>\n";
            }
            text += "</tr>\n";
        }
        text += "</tbody>\n";
        text += "</table>";

        return self.hashBlock(text) + "\n";
    }

    text = this.__wrapSTXETX__(text);

    //
    // Find tables with leading pipe.
    //
    //	| Header 1 | Header 2
    //	| -------- | --------
    //	| Cell 1   | Cell 2
    //	| Cell 3   | Cell 4
    //
    text = text.replace(new RegExp(
        '^' +							// Start of a line
        '[ ]{0,' + less_than_tab + '}' +	// Allowed whitespace.
        '[|]' +							// Optional leading pipe (present)
        '(.+)\\n' +						// $1: Header row (at least one pipe)

        '[ ]{0,' + less_than_tab + '}' +	// Allowed whitespace.
        '[|]([ ]*[-:]+[-| :]*)\\n' +	// $2: Header underline

        '(' +							// $3: Cells
            '(?:' +
                '[ ]*' +				// Allowed whitespace.
                '[|].*\\n' +			// Row content.
            ')*' +
        ')' +
        '(?=\\n|\\x03)',					// Stop at final double newline.
        'mg'
    ), function(match, head, underline, content) {
        // Remove leading pipe for each row.
        content = content.replace(/^ *[|]/m, '');

        return _doTable_callback.call(this, match, head, underline, content);
    });

    //
    // Find tables without leading pipe.
    //
    //	Header 1 | Header 2
    //	-------- | --------
    //	Cell 1   | Cell 2
    //	Cell 3   | Cell 4
    //
    text = text.replace(new RegExp(
        '^' +							// Start of a line
        '[ ]{0,' + less_than_tab + '}' +	// Allowed whitespace.
        '(\\S.*[|].*)\\n' +				// $1: Header row (at least one pipe)

        '[ ]{0,' + less_than_tab + '}' +	// Allowed whitespace.
        '([-:]+[ ]*[|][-| :]*)\\n' +	// $2: Header underline

        '(' +							// $3: Cells
            '(?:' +
                '.*[|].*\\n' +		// Row content
            ')*' +
        ')' +
        '(?=\\n|\\x03)',					// Stop at final double newline.
        'mg'
    ), _doTable_callback);

    text = this.__unwrapSTXETX__(text);

    return text;
}

/**
 * Form HTML definition lists.
 */
MarkdownExtra_Parser.prototype.doDefLists = function(text) {
    var self = this;

    var less_than_tab = this.tab_width - 1;

    // Re-usable pattern to match any entire dl list:
    var whole_list_re = '(?:' +
        '(' +								// $1 = whole list
          '(' +								// $2
            '[ ]{0,' + less_than_tab + '}' +
            '((?:.*\\S.*\\n)+)' +				// $3 = defined term
            '\\n?' +
            '[ ]{0,' + less_than_tab + '}:[ ]+' + // colon starting definition
          ')' +
          '([\\s\\S]+?)' +
          '(' +								// $4
              '(?=\\0x03)' + // \z
            '|' +
              '\\n{2,}' +
              '(?=\\S)' +
              '(?!' +						// Negative lookahead for another term
                '[ ]{0,' + less_than_tab + '}' +
                '(?:\\S.*\\n )+?' +			// defined term
                '\\n?' +
                '[ ]{0,' + less_than_tab + '}:[ ]+' + // colon starting definition
              ')' +
              '(?!' +						// Negative lookahead for another definition
                '[ ]{0,' + less_than_tab + '}:[ ]+' + // colon starting definition
              ')' +
          ')' +
        ')' +
    ')'; // mx

    text = this.__wrapSTXETX__(text);
    text = text.replace(new RegExp(
        '(\\x02\\n?|\\n\\n)' +
        whole_list_re, 'mg'
    ), function(match, pre, list) {
        //console.log(match);
        // Re-usable patterns to match list item bullets and number markers:
        // [portiong note] changed to list = $2 in order to reserve previously \n\n.

        // Turn double returns into triple returns, so that we can make a
        // paragraph for the last item in a list, if necessary:
        var result = _trim(self.processDefListItems(list));
        result = "<dl>\n" + result + "\n</dl>";
        return pre + self.hashBlock(result) + "\n\n";
    });
    text = this.__unwrapSTXETX__(text);

    return text;
}

/**
 * Process the contents of a single definition list, splitting it
 * into individual term and definition list items.
 */
MarkdownExtra_Parser.prototype.processDefListItems = function(list_str) {
    var self = this;

    less_than_tab = this.tab_width - 1;

    list_str = this.__wrapSTXETX__(list_str);

    // trim trailing blank lines:
    list_str = list_str.replace(/\n{2,}(?=\\x03)/, "\n");

    // Process definition terms.
    list_str = list_str.replace(new RegExp(
        '(\\x02\\n?|\\n\\n+)' +					// leading line
        '(' +								// definition terms = $1
            '[ ]{0,' + less_than_tab + '}' + // leading whitespace
            '(?![:][ ]|[ ])' +				// negative lookahead for a definition 
                                        //   mark (colon) or more whitespace.
            '(?:\\S.*\\n)+?' +				// actual term (not whitespace).
        ')' +			
        '(?=\\n?[ ]{0,3}:[ ])',				// lookahead for following line feed 
                                        //   with a definition mark.
        'mg'
    ), function(match, pre, terms_str) {
        // [portiong note] changed to list = $2 in order to reserve previously \n\n.
        var terms = _trim(terms_str).split("\n");
        var text = '';
        for (var i = 0; i < terms.length; i++) {
            var term = terms[i];
            term = self.runSpanGamut(_trim(term));
            text += "\n<dt>" + term + "</dt>";
        }
        return text + "\n";
    });

    // Process actual definitions.
    list_str = list_str.replace(new RegExp(
        '\\n(\\n+)?' +						// leading line = $1
        '(' +								// marker space = $2
            '[ ]{0,' + less_than_tab + '}' +	// whitespace before colon
            '[:][ ]+' +						// definition mark (colon)
        ')' +
        '([\\s\\S]+?)' +						// definition text = $3
        '(?=\\n+' + 						// stop at next definition mark,
            '(?:' +							// next term or end of text
                '[ ]{0,' + less_than_tab + '}[:][ ]|' +
                '<dt>|\\x03' + // \z
            ')' +
        ')', 'mg'
    ), function(match, leading_line, marker_space, def) {
        if (leading_line || def.match(/\n{2,}/)) {
            // Replace marker with the appropriate whitespace indentation
            def = _str_repeat(' ', marker_space.length) + def;
            def = self.runBlockGamut(self.outdent(def + "\n\n"));
            def = "\n" + def + "\n";
        }
        else {
            def = _rtrim(def);
            def = self.runSpanGamut(self.outdent(def));
        }

        return "\n<dd>"  + def + "</dd>\n";
    });

    list_str = this.__unwrapSTXETX__(list_str);

    return list_str;
}

/**
 * Adding the fenced code block syntax to regular Markdown:
 *
 * ~~~
 * Code block
 * ~~~
 */
MarkdownExtra_Parser.prototype.doFencedCodeBlocks = function(text) {
    var self = this;

    var less_than_tab = this.tab_width;

    text = this.__wrapSTXETX__(text);
    text = text.replace(new RegExp(
        '(?:\\n|\\x02)' +
        // 1: Opening marker
        '(' +
            '~{3,}' + // Marker: three tilde or more.
        ')' +
        '[ ]*\\n' + // Whitespace and newline following marker.
        // 2: Content
        '(' +
            '[\\s\\S]*\\n'+
            // [incompatible] '(?>' +
            // [incompatible]     '(?!\\1[ ]*\\n)' +	// Not a closing marker.
            // [incompatible]     '.*\\n+' +
            // [incompatible] ')+' +
        ')' +
        // Closing marker.
        '\\1[ ]*\\n', "mg"
    ), function(match, m1, codeblock) {
        codeblock = _htmlspecialchars_ENT_NOQUOTES(codeblock);
        codeblock = codeblock.replace(/^\n+/, function(match) {
            return _str_repeat("<br" + self.empty_element_suffix, match.length);
        });
        codeblock = "<pre><code>" + codeblock + "</code></pre>";
        return "\n\n" + self.hashBlock(codeblock) + "\n\n";
    });
    text = this.__unwrapSTXETX__(text);

    return text;
}

/**
 * Params:
 * $text - string to process with html <p> tags
 */
MarkdownExtra_Parser.prototype.formParagraphs = function(text) {

    // Strip leading and trailing lines:
    text = this.__wrapSTXETX__(text);
    text = text.replace(/(?:\x02)\n+|\n+(?:\x03)/g, "");
    text = this.__unwrapSTXETX__(text);

    var grafs = text.split(/\n{2,}/m);
    //preg_split('/\n{2,}/', $text, -1, PREG_SPLIT_NO_EMPTY);

    //
    // Wrap <p> tags and unhashify HTML blocks
    //
    for(var i = 0; i < grafs.length; i++) {
        var value = grafs[i];
        if(value == "") {
            // [porting note]
            // This case is replacement for PREG_SPLIT_NO_EMPTY.
            continue;
        }
        value = _trim(this.runSpanGamut(value));

        // Check if this should be enclosed in a paragraph.
        // Clean tag hashes & block tag hashes are left alone.
        var is_p = !value.match(/^B\x1A[0-9]+B|^C\x1A[0-9]+C$/);

        if (is_p) {
            value = "<p>" + value + "</p>";
        }
        grafs[i] = value;
    }

    // Join grafs in one text, then unhash HTML tags. 
    text = grafs.join("\n\n");

    // Finish by removing any tag hashes still present in $text.
    text = this.unhash(text);

    return text;
}

// ### Footnotes

/**
 * Strips link definitions from text, stores the URLs and titles in
 * hash references.
 */
MarkdownExtra_Parser.prototype.stripFootnotes = function(text) {
    var self = this;

    var less_than_tab = this.tab_width - 1;

    // Link defs are in the form: [^id]: url "optional title"
    text = text.replace(new RegExp(
        '^[ ]{0,' + less_than_tab + '}\\[\\^(.+?)\\][ ]?:' +	// note_id = $1
          '[ ]*' +
          '\\n?' +					// maybe *one* newline
        '(' +						// text = $2 (no blank lines allowed)
            '(?:' +
                '.+' +				// actual text
            '|' +
                '\\n' +				// newlines but 
                '(?!\\[\\^.+?\\]:\\s)' + // negative lookahead for footnote marker.
                '(?!\\n+[ ]{0,3}\\S)' + // ensure line is not blank and followed 
                                // by non-indented content
            ')*' +
        ')', "mg"
    ), function(match, m1, m2) {
        var note_id = self.fn_id_prefix + m1;
        self.footnotes[note_id] = self.outdent(m2);
        return ''; //# String that will replace the block
    });
    return text;
};

/**
 * Replace footnote references in $text [^id] with a special text-token 
 * which will be replaced by the actual footnote marker in appendFootnotes.
 */
MarkdownExtra_Parser.prototype.doFootnotes = function(text) {
    if (!this.in_anchor) {
        text = text.replace(/\[\^(.+?)\]/g, "F\x1Afn:$1\x1A:");
    }
    return text;
};

/**
 * Append footnote list to text.
 */
MarkdownExtra_Parser.prototype.appendFootnotes = function(text) {
    var self = this;

    var _appendFootnotes_callback = function(match, m1) {
        var node_id = self.fn_id_prefix + m1;

        // Create footnote marker only if it has a corresponding footnote *and*
        // the footnote hasn't been used by another marker.
        if (node_id in self.footnotes) {
            // Transfert footnote content to the ordered list.
            self.footnotes_ordered.push([node_id, self.footnotes[node_id]]);
            delete self.footnotes[node_id];

            var num = self.footnote_counter++;
            var attr = " rel=\"footnote\"";
            if (self.fn_link_class != "") {
                var classname = self.fn_link_class;
                classname = self.encodeAttribute(classname);
                attr += " class=\"" + classname + "\"";
            }
            if (self.fn_link_title != "") {
                var title = self.fn_link_title;
                $title = self.encodeAttribute(title);
                attr += " title=\"" + title +"\"";
            }

            attr = attr.replace(/%%/g, num);
            node_id = self.encodeAttribute(node_id);

            return "<sup id=\"fnref:" + node_id + "\">" +
                "<a href=\"#fn:" + node_id + "\"" + attr + ">" + num + "</a>" +
                "</sup>";
        }

        return "[^" + m1 + "]";
    };

    text = text.replace(/F\x1Afn:(.*?)\x1A:/g, _appendFootnotes_callback);

    if (this.footnotes_ordered.length > 0) {
        text += "\n\n";
        text += "<div class=\"footnotes\">\n";
        text += "<hr" + this.empty_element_suffix  + "\n";
        text += "<ol>\n\n";

        var attr = " rev=\"footnote\"";
        if (this.fn_backlink_class != "") {
            var classname = this.fn_backlink_class;
            classname = this.encodeAttribute(classname);
            attr += " class=\"" + classname + "\"";
        }
        if (this.fn_backlink_title != "") {
            var title = this.fn_backlink_title;
            title = this.encodeAttribute(title);
            attr += " title=\"" + title + "\"";
        }
        var num = 0;

        while (this.footnotes_ordered.length > 0) {
            var head = this.footnotes_ordered.shift();
            var note_id = head[0];
            var footnote = head[1];

            footnote += "\n"; // Need to append newline before parsing.
            footnote = this.runBlockGamut(footnote + "\n");
            footnote = footnote.replace(/F\x1Afn:(.*?)\x1A:/g, _appendFootnotes_callback);

            attr = attr.replace(/%%/g, ++num);
            note_id = this.encodeAttribute(note_id);

            // Add backlink to last paragraph; create new paragraph if needed.
            var backlink = "<a href=\"#fnref:" + note_id + "\"" + attr + ">&#8617;</a>";
            if (footnote.match(/<\/p>$/)) {
                footnote = footnote.substr(0, footnote.length - 4) + "&#160;" + backlink + "</p>";
            } else {
                footnote += "\n\n<p>" + backlink + "</p>";
            }

            text += "<li id=\"fn:" + note_id + "\">\n";
            text += footnote + "\n";
            text += "</li>\n\n";
        }

        text += "</ol>\n";
        text += "</div>";
    }
    return text;
};

//### Abbreviations ###

/**
 * Strips abbreviations from text, stores titles in hash references.
 */
MarkdownExtra_Parser.prototype.stripAbbreviations = function(text) {
    var self = this;

    var less_than_tab = this.tab_width - 1;

    // Link defs are in the form: [id]*: url "optional title"
    text = text.replace(new RegExp(
        '^[ ]{0,' + less_than_tab + '}\\*\\[(.+?)\\][ ]?:' +	// abbr_id = $1
        '(.*)',					// text = $2 (no blank lines allowed)
        "m"
    ), function(match, abbr_word, abbr_desc) {
        if (self.abbr_word_re != '') {
            self.abbr_word_re += '|';
        }
        self.abbr_word_re += _preg_quote(abbr_word);
        self.abbr_desciptions[abbr_word] = _trim(abbr_desc);
        return ''; // String that will replace the block
    });
    return text;
};

/**
 * Find defined abbreviations in text and wrap them in <abbr> elements.
 */
MarkdownExtra_Parser.prototype.doAbbreviations = function(text) {
    var self = this;

    if (this.abbr_word_re) {
        // cannot use the /x modifier because abbr_word_re may 
        // contain significant spaces:
        text = text.replace(new RegExp(
            '(^|[^\\w\\x1A])' +
            '(' + this.abbr_word_re + ')' +
            '(?![\\w\\x1A])'
        ), function(match, prev, abbr) {
            if (abbr in self.abbr_desciptions) {
                var desc = self.abbr_desciptions[abbr];
                if (!desc || desc == "") {
                    return self.hashPart("<abbr>" + abbr + "</abbr>");
                } else {
                    var desc = self.encodeAttribute(desc);
                    return self.hashPart("<abbr title=\"" + desc + "\">" + abbr + "</abbr>");
                }
            } else {
                return match;
            }
        });
    }
    return text;
};


