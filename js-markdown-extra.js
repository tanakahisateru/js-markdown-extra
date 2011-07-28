/*
js-markdown-extra
-----------------

ver 1.0 
based on PHP Markdown Extra 1.01

* [これは何？](#whats)
* [デモ](#demo)
* [ダウンロード](#download)
* [使い方](#howtouse)
* [使用上の注意](#notice)
* [既知の不具合](#bug)
* [コピーライト](#copyright)
* [ライセンス](#license)
* [免責](#agreement)
* [連絡先](#contact)
* [更新履歴](#history)

### これは何？ ### {#whats}

js-markdown-extraはPHP Markdown ExtraをJavaScript上で再現しようとしたものです。

正規表現に互換性が無い為に完全に再現できませんでしたが、
単純なmarkdown文法ならば、問題無く変換してくれます。
**たぶん**。

### デモ ### {#demo}

実際に試すことができます。

[デモページ](demo.html)

### ダウンロード ### {#download}

[js-markdown-extra.js](js-markdown-extra.js)

### 使い方 ### {#howtouse}

htmlのhead内でスクリプトを読み込ませた後、任意の箇所でMarkdown関数を呼び出してください。

	//例 :
	var html = Markdown( text );

### 使用上の注意 #### {#notice}

PHP Markdown Extraを互換性の無い正規表現で不完全に再現しようとしているので、
入力したテキスト次第では正規表現で無限にループしてしまう可能性があります。
できるだけタスクマネージャ等を起動しておいて、
いつでも殺せるようにしてください。**デュアルコア超推奨**。

### 既知の不具合 ### {#bug}

* 強調の処理が怪しい。
* 不完全な構文を処理させようとすると固まる可能性有り。
* リンクを記述する際、ブラケットの2段以上のネストに未対応。（ほぼ仕様）

### コピーライト ### {#copyright}

* [Markdown](http://daringfireball.net/projects/markdown/)
* [PHP Markdown & PHP Markdown Extra](http://www.michelf.com/projects/php-markdown/)
* [js-markdown](http://rephrase.net/box/js-markdown/)

### ライセンス ### {#license}

BSDに基づくオープンソースウェアです。

著作権表示を怠らなければ自由に改変・配布・組み込み等を行うことができます。

### 免責 ### {#agreement}

このスクリプトを利用して発生した障害・損失に関して当方は一切責任を負いません。

### 連絡先 ### {#contact}

<http://bmky.net/>

ページ下部のフォームよりメッセージを送信してください。
メールアドレス等を併せて記入して頂ければ可能な限り返信します。

もし変換エラーを見つけた場合は、変換前の文章と併せて、
どのように誤変換されてしまったかを明記して送って頂けると助かります。

ただし、[PHP Markdown Extraのデモページ](http://www.michelf.com/projects/php-markdown/dingus/)で変換できなかったものは、こちらでも変換できないようにするつもりです。

### 更新履歴 ### {#history}

1.1 - 2008-05-31
: リンクを参照スタイルで記述する場合、
  title部分を省略するかダブルクオートのみで空になっていると
  正しく変換できなかったのを修正。（指摘して頂きました）

1.0 - 2006-07-08
: リリース
*/

 

Array.prototype._pad = function( size, value ) {
	while( this.length < size )
		this.push( value );
}
String.prototype._r = function( num ) {
	for( var i = 0, buf = ""; i < num; i++ ) buf += this;
	return buf;
}
String.prototype._trim = function( charlist ) {
	var chars = charlist || " \t\n\r";
	return this.replace(
		new RegExp( ).compile( "^[" + chars + "]*|[" + chars + "]*$", "g" ), "" );
}
String.prototype._rtrim = function( charlist ) {
	var chars = charlist || " \t\n\r";
	return this.replace(
		new RegExp( ).compile( "[" + chars + "]*$", "g" ), "" );
}

var md_urls = new Object;
var md_titles = new Object;
var md_html_blocks = new Object;
var md_html_hashes = new Object;
var md_list_level = 0;


var md_empty_element_suffix = " />";
var md_tab_width = 4;
var md_less_than_tab = md_tab_width - 1;


var md_block_tags = 'p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|form|fieldset|iframe|hr|legend';
var md_context_block_tags = "script|noscript|math|ins|del";
var md_contain_span_tags = "p|h[1-6]|li|dd|dt|td|th|legend";
var md_clean_tags = "script|math";
var md_auto_close_tags = 'hr|img';

/*
var md_nested_brackets_depth = 6;
var md_nested_brackets =
	  '(?:[^\\[\\]]+|\\['._r( md_nested_brackets_depth )
	+ '\\])+'._r( md_nested_brackets_depth )
	;
*/
var md_nested_brackets = '.*?(?:\\[.*?\\])?.*?';


function Markdown( text ) {
	md_urls = new Object;
	md_titles = new Object;
	md_html_blocks = new Object;
	md_html_hashes = new Object;
	
	text = text.replace( /\r\n|\r/g, "\n" );
	text += "\n\n";
	text = _Detab( text );
	text = _HashHTMLBlocks( text );
	text = text.replace( /^[ \t]+$/gm, "" );
	text = _StripLinkDefinitions( text );
	text = _RunBlockGamut( text, false );
	text = _UnescapeSpecialChars( text );
	
	return text + "\n";
}


var md_flag_StripLinkDefinitions_Z = "9082c5d1b2ef05415b0a1d3e43c2d7a6";
var md_reg_StripLinkDefinitions = new RegExp( ).compile(
  '^[ ]{0,' + md_less_than_tab + '}\\[(.+)\\]:'
+ 	'[ \\t]*'
+ 	'\\n?'
+ 	'[ \\t]*'
+ '<?(\\S+?)>?'
+ 	'[ \\t]*'
+ 	'\\n?'
+ 	'[ \\t]*'
+ '(?:'
+ 	'(?=\\s)[\\s\\S]'
+ 	'["(]'
+ 	'(.*?)'
+ 	'[")]'
+ 	'[ \\t]*'
+ ')?'
+ '(?:\\n+|' + md_flag_StripLinkDefinitions_Z + ')'
, "gm" );
function _StripLinkDefinitions( text ) {
	text += md_flag_StripLinkDefinitions_Z;
	var reg = md_reg_StripLinkDefinitions;

	text = text.replace( reg, function( $0, $1, $2, $3 ) {
		var link_id = $1.toLowerCase( );
		md_urls[link_id] = _EncodeAmpsAndAngles( $2 );
		if( $3 != "" && $3 != undefined )
			md_titles[link_id] = $3.replace( /\"/, "&quot;" );
		return "";
	} );
	
	return text.replace( md_flag_StripLinkDefinitions_Z, "" );
}


function _HashHTMLBlocks( text ) {
	text = _HashHTMLBlocks_InMarkdown( text )[0];
	return text;
}

function _HashHTMLBlocks_InMarkdown( text, indent, enclosing_tag, md_span ) {
	indent			= indent || 0;
	enclosing_tag	= enclosing_tag || "";
	md_span			= md_span || false;
	
	if( text === "" ) return new Array( "", "" );
	
	var newline_match_before = /(?:^\n?|\n\n)*$/g;
	var newline_match_after = /^(?:[ ]*<!--.*?-->)?[ ]*\n/g;
	
	var block_tag_match = new RegExp(
	  '('
	+ 	'</?'
	+ 	'(?:'
	+ 		md_block_tags + '|'
	+ 		md_context_block_tags + '|'
	+ 		md_clean_tags + '|'
	+ 		'(?!\\s)' + enclosing_tag
	+ 	')'
	+ 	'\\s*'
	+ 	'(?:'
	+ 		'".*?"|'
	+ 		'\'.*?\'|'
	+ 		'.+?'
	+ 	')*?'
	+ 	'>'
	+ '|'
	+ 	'<!--.*?-->'
	+ '|'
	+ 	'<\\?.*?\\?>'
	+ '|'
	+ 	'<!\\[CDATA\\[.*?\\]\\]>'
	+ ')'
	);
	
	var depth = 0;
	var parsed = "";
	var block_text = "";
	
	do {
		var r = text.match( block_tag_match );
		
		if( r == null ) {
			if( md_span )
				parsed += text.replace( /\n\n/g, "\n" );
			else
				parsed += text;
			text = "";
			break;
		}
		
		var parts = new Array( RegExp.leftContext, RegExp.lastMatch || RegExp.$1, RegExp.rightContext );
		
		if( md_span )
			parts[0] = parts[0].replace( /\n\n/g, "\n" );
		
		parsed += parts[0];
		
		var tag = parts[1];
		text = parts[2];
		
		var matches = parsed.match( /(^\n|\n\n)((.\n?)+?)$/ );
		if(
			matches != null &&
			(
			matches[1].match( new RegExp( ).compile(
				'^[ ]{' + ( indent + 4 ) + '}.*(\\n[ ]{' + ( indent + 4 ) + '}.*)*' + '(?!\\n)$/'
				), "gm" ) ||
			matches[1].match( /^(?:[^`]+|(`+)(?:[^`]+|(?!\1[^`])`)*?\1(?!`))*$/ ) == null
			)
		)
		{
			parsed += tag.charAt( 0 );
			text = tag.substr( 1 ) + text;
		}
		else if(
			tag.match( new RegExp( ).compile( '^<(?:' + md_block_tags + ')\\b' )
				|| (
				   tag.match( new RegExp( ).compile( '^<(?:' + md_context_block_tags + ')\\b' ) )
				&& parsed.match( newline_match_before )
				&& text.match( newline_match_after )
					)
				)
			)
		{
			var parsed_array = _HashHTMLBlocks_InHTML( tag + text, _HashHTMLBlocks_HashBlock, true );
			block_text = parsed_array[0];
			text = parsed_array[1];
			
			parsed += "\n\n" + block_text + "\n\n";
		}
		else if ( tag.match( new RegExp( ).compile( '^<(?:' + md_clean_tags + ')\\b' ) )
			|| tag.charAt( 1 ) == '!' || tag.charAt( 1 ) == '?' )
		{
			var parsed_array = _HashHTMLBlocks_InHTML( tag + text, _HashHTMLBlocks_HashClean, false );
			block_text = parsed_array[0];
			text = parsed_array[1];
			parsed += block_text;
		}
		else if ( enclosing_tag !== '' &&
			tag.match( new RegExp( ).compile( '^</?(?:' + enclosing_tag + ')\\b' ) ) )
		{
			if ( tag.charAt( 1 ) == '/' ) depth--;
			else if ( tag.charAt( tag.length - 2 ) != '/' ) depth++;
			
			if( depth < 0 ) {
				text = tag + text;
				break;
			}
			
			parsed += tag;
		}
		else {
			parsed += tag;
		}
	} while ( depth >= 0 );
	
	return new Array( parsed, text );
}


var md_reg_HashHTMLBlocks = new RegExp( ).compile(
  '('
+ 	'</?'
+ 		'[\\w:$]+'
+ 		'\\s*'
+ 		'(?:'
+ 			'"[\\s\\S]*?"|'
+ 			'\'[\\s\\S]*?\'|'
+ 			'[\\s\\S]+?'
+ 		')*?'
+ 	'>'
+ '|'
+ 	'<!--[\\s\\S]*?-->'
+ '|'
+ 	'<\\?[\\s\\S]*?\\?>'
+ '|'
+ 	'<!\\[CDATA\\[[\\s\\S]*?\\]\\]>'
+ ')'
);
function _HashHTMLBlocks_InHTML( text, hash_function, md_attr ) {
	if( text === '' ) return new Array( '', '' );
	
	var markdown_attr_match = new RegExp( ).compile(
	  '\\s*'
	+ 'markdown'
	+ '\\s*=\\s*'
	+ '(["\'])'
	+ '(.*?)'
	+ '\\1'
	);
	
	var original_text = text;
	
	var depth = 0;
	var block_text = "";
	var parsed = "";
	
	var base_tag_name = "";
	var matches = text.match( /^<([\w:$]*)\b/ );
	if( matches != null ) base_tag_name = matches[1];
	
	do {
		var r = text.match( md_reg_HashHTMLBlocks );
		
		if( r == null ) {
			return new Array( original_text.substr( 0, 1 ), original_text.substr( 1 ) );
		}
		
		var parts = new Array( RegExp.leftContext, RegExp.lastMatch || RegExp.$1, RegExp.rightContext );
		
		block_text += parts[0];
		var tag = parts[1];
		text = parts[2];
		
		if( tag.match( new RegExp( ).compile( '^</?(?:' + md_auto_close_tags + ')\\b' ) ) ||
			tag.charAt( 1 ) == '!' || tag.charAt( 1 ) == '?' )
		{
			block_text += tag;
		}
		else {
			if( tag.match( new RegExp( ).compile( '^</?' + base_tag_name + '\\b' ) ) ) {
				if( tag.charAt( 1 ) == '/' ) depth--;
				else if( tag.charAt( tag.length - 2 ) != '/' ) depth++;
			}
			
			var attr_matches = tag.match( markdown_attr_match );
			if ( md_attr && attr_matches != null
				&& attr_matches[2].match( /^(?:1|block|span)$/ ) )
			{
				tag = tag.replace( markdown_attr_match, '' );
				
				var md_mode = attr_matches[2];
				var span_mode = ( md_mode == 'span' ||
							md_mode != 'block' &&
							tag.match( '^<(?:' + md_contain_span_tags + ')\\b' ) != null );
				
				var matches = block_text.match( /(?:^|\n)([ ]*?)(?![ ]).*?$/ );
				var indent = matches[1].length;
				
				block_text += tag;
				parsed += hash_function( block_text, span_mode );
				
				matches = tag.match( /^<([\w:$]*)\b/ );
				var tag_name = matches[1];
				
				var parsed_array = _HashHTMLBlocks_InMarkdown( text, indent, tag_name, span_mode );
				block_text = parsed_array[0];
				text = parsed_array[1];
				
				if ( indent > 0 ) {
					block_text = block_text.replace( new RegExp( ).compile( '^[ ]{1,' + indent + '}', "gm" ), "" );
				}
				
				if( !span_mode ) parsed += "\n\n" + block_text + "\n\n";
				else parsed += block_text;
				
				block_text = "";
			}
			else {
				block_text += tag;
			}
		}
		
	}
	while( depth > 0 );
	
	parsed += hash_function( block_text );
	
	return new Array( parsed, text );
}

function _HashHTMLBlocks_HashBlock( text ) {
	var key = _md5( text );
	md_html_hashes[key] = text;
	md_html_blocks[key] = text;
	return key;
}
function _HashHTMLBlocks_HashClean( text ) {
	var key = _md5( text );
	md_html_hashes[key] = text;
	return key;
}

function _HashBlock( text ) {
	text = _UnhashTags( text );
	
	return _HashHTMLBlocks_HashBlock( text );
}

function _RunBlockGamut( text, hash_html_blocks ) {
	hash_html_blocks = ( hash_html_blocks == undefined );
	if ( hash_html_blocks ) {
		text = _HashHTMLBlocks( text );
	}
	text = _DoHeaders( text );
	text = _DoTables( text );
	
	text = text
		.replace( /^[ ]{0,2}([ ]?\*[ ]?){3,}[ \t]*$/gm, _HashBlock( "\n<hr" + md_empty_element_suffix + "\n" ) )
		.replace( /^[ ]{0,2}([ ]?-[ ]?){3,}[ \t]*$/gm, _HashBlock( "\n<hr" + md_empty_element_suffix + "\n" ) )
		.replace( /^[ ]{0,2}([ ]?_[ ]?){3,}[ \t]*$/gm, _HashBlock( "\n<hr" + md_empty_element_suffix + "\n" ) )
	;
	
	text = _DoLists( text );
	text = _DoDefLists( text );
	text = _DoCodeBlocks( text );
	text = _DoBlockQuotes( text );
	text = _FormParagraphs( text );
	
	return text;
}

function _RunSpanGamut( text ) {
	text = _DoCodeSpans( text );
	text = _EscapeSpecialChars( text );
	text = _DoImages( text );
	text = _DoAnchors( text );
	text = _DoAutoLinks( text );
	text = _EncodeAmpsAndAngles( text );
	text = _DoItalicsAndBold( text );
	text = text.replace( /[ ]{2,}\n/g, "<br" + md_empty_element_suffix + "\n" );
	
	return text;
}

function _EscapeSpecialChars( text ) {
	var tokens = _TokenizeHTML( text );
	
	var text = "";
	
	for( var i = 0, len = tokens.length; i < len; i++ ) {
		var cur_token = tokens[i];
		if( cur_token[0] == 'tag' ) {
			cur_token[1] = _EscapeItalicsAndBold( cur_token[1] );
			text += cur_token[1];
		} else {
			var t = cur_token[1];
			t = _EncodeBackslashEscapes( t );
			text += t;
		}
	}
	return text;
}


var md_reg_DoAnchors1 = new RegExp( ).compile(
  '('
+ 	'\\['
+ 		'(' + md_nested_brackets + ')'
+ 	'\\]'
+ 	'[ ]?'
+ 	'(?:\\n[ ]*)?'
+ 	'\\['
+ 		'([\\s\\S]*?)'
+ 	'\\]'
+ ')'
, "g" );
var md_reg_DoAnchors2 = new RegExp( ).compile(
  '('
+ 	'\\['
+ 		'(' + md_nested_brackets + ')'
+ 	'\\]'
+ 	'\\('
+ 		'[ \\t]*'
+ 		'<?(.*?)>?'
+ 		'[ \\t]*'
+ 		'('
+ 			'([\'"])'
+ 			'(.*?)'
+ 			'\\5'
+ 		')?'
+ 	'\\)'
+ ')'
, "g" );

function _DoAnchors( text ) {
	var reg = md_reg_DoAnchors1;
	text = text.replace( reg, _DoAnchors_reference_callback );

	var reg = md_reg_DoAnchors2;
	text = text.replace( reg, _DoAnchors_inline_callback );

	return text;
}
function _DoAnchors_reference_callback( $0, $1, $2, $3 ) {
	var whole_match = $1;
	var link_text = $2;
	var link_id = $3.toLowerCase( );
	var result = "";
	
	if( link_id == "" ) {
		link_id = link_text.toLowerCase( );
	}
	
	if( md_urls[link_id] ) {
		var url = md_urls[link_id];
		url = _EscapeItalicsAndBold( url );
		
		result = '<a href="' + url + '"';
		if ( md_titles[link_id] ) {
			var title = md_titles[link_id];
			title = _EscapeItalicsAndBold( title );
			result +=  ' title="' + title + '"';
		}
		result += ">" + link_text + "</a>";
	}
	else {
		result = whole_match;
	}
	
	return result;
}
function _DoAnchors_inline_callback( $0, $1, $2, $3, $4, $5, $6 ) {
	var whole_match = $1;
	var link_text = $2;
	var url = $3;
	var title = $6;

	var url = _EscapeItalicsAndBold( url );
	var result = '<a href="' + url + '"';
	
	if( title ) {
		title = title.replace( '"', '&quot;' );
		title = _EscapeItalicsAndBold( title );
		result +=  ' title="' + title + '"';
	}
	
	result += ">" + link_text + "</a>";

	return result;
}

 

 

 

var md_reg_DoImages1 = new RegExp( ).compile(
  '('
+ 	'!\\['
+ 		'(' + md_nested_brackets + ')'
+ 	'\\]'
+ 	'[ ]?'
+ 	'(?:\\n[ ]*)?'
+ 	'\\['
+ 		'(.*?)'
+ 	'\\]'
+ ')'
, "g" );

var md_reg_DoImages2 = new RegExp( ).compile(
  '('
+ 	'!\\['
+ 		'(' + md_nested_brackets + ')'
+ 	'\\]'
+ 	'\\('
+ 		'[ \\t]*'
+ 		'<?(\\S+?)>?'
+ 		'[ \\t]*'
+ 		'('
+ 			'([\'"])'
+ 			'(.*?)'
+ 			'\\5'
+ 			'[ \\t]*'
+ 		')?'
+ 	'\\)'
+ ')'
, "g" );
function _DoImages( text ) {
	var reg = md_reg_DoImages1;
	text = text.replace( reg, _DoImages_reference_callback );
	
	var reg = md_reg_DoImages2;
	text = text.replace( reg, _DoImages_inline_callback );
	
	return text;
}
function _DoImages_reference_callback( $0, $1, $2, $3 ) {
	var whole_match = $1;
	var alt_text = $2;
	var link_id = $3.toLowerCase( );
	var result = "";
	
	if ( link_id == "" ) {
		link_id = alt_text.toLowerCase( );
	}
	
	alt_text = alt_text.replace( /\"/, '&quot;' );
	if( md_urls[link_id] ) {
		var url = md_urls[link_id];
		url = _EscapeItalicsAndBold( url );
		result = '<img src="' + url + '" alt="' + alt_text + '"';
		if( md_titles[link_id] ) {
			var title = md_titles[link_id];
			title = _EscapeItalicsAndBold( title );
			result +=  ' title="' + title + '"';
		}
		result += md_empty_element_suffix;
	}
	else {
		result = whole_match;
	}
	
	return result;
}
function _DoImages_inline_callback( $0, $1, $2, $3, $4, $5, $6 ) {
	var whole_match = $1;
	var alt_text = $2;
	var url = $3;
	var title = '';
	if( $6 ) title = $6;
	
	var alt_text = alt_text.replace( '"', '&quot;' );
	title = title.replace( '"', '&quot;' );
	var url = _EscapeItalicsAndBold( url );
	var result = '<img src="' + url + '" alt="' + alt_text + '"';
	if( title ) {
		title = _EscapeItalicsAndBold( title );
		result += ' title="' + title + '"';
	}
	result += md_empty_element_suffix;
	
	return result;
}

 

var md_reg_DoHeaders1 = /(^.+?)(?:[ ]+\{#([-_:a-zA-Z0-9]+)\})?[ \t]*\n=+[ \t]*\n+/gm;
var md_reg_DoHeaders2 = /(^.+?)(?:[ ]+\{#([-_:a-zA-Z0-9]+)\})?[ \t]*\n-+[ \t]*\n+/gm;
var md_reg_DoHeaders3 = new RegExp( ).compile(
  '^(#{1,6})'
+ '[ \\t]*'
+ '(.+?)'
+ '[ \\t]*'
+ '#*'
+ '(?:[ ]+\\{#([-_:a-zA-Z0-9]+)\\}[ ]*)?'
+ '\\n+'
, "gm" );
function _DoHeaders( text ) {
	var reg = md_reg_DoHeaders1;
	text = text.replace( reg, function( $0, $1, $2 ) {
				var str = '<h1';
				str += ( $2 ) ? ' id=\"' + _UnslashQuotes( $2 ) + '\"' : "";
				str += ">" + _RunSpanGamut( _UnslashQuotes( $1 ) ) + "</h1>";
				return _HashBlock( str ) + "\n\n";
			} );
	var reg = md_reg_DoHeaders2;
	text = text.replace( reg, function( $0, $1, $2 ) {
				var str = '<h2';
				str += ( $2 ) ? ' id=\"' + _UnslashQuotes( $2 ) + '\"' : "";
				str += ">" + _RunSpanGamut( _UnslashQuotes( $1 ) ) + "</h2>";
				return _HashBlock( str ) + "\n\n";
			} );
	
	var reg = md_reg_DoHeaders3;
	text = text.replace( reg, function( $0, $1, $2, $3 ) {
				var str = "<h" + $1.length;
				str += ( $3 ) ? ' id=\"' + _UnslashQuotes( $3 ) + '\"' : "";
				str += ">" + _RunSpanGamut( _UnslashQuotes( $2 ) );
				str += "</h" + $1.length + ">";
				return _HashBlock( str ) + "\n\n";
			} );
	
	return text;
}


var md_flag_DoTables = "9882b282ede0f5af55034471410cfc46";
var md_reg_DoTables1 = new RegExp( ).compile(
  '^'
+ '[ ]{0,' + md_less_than_tab + '}'
+ '[|]'
+ '(.+)\\n'
+ '[ ]{0,' + md_less_than_tab + '}'
+ '[|]([ ]*[-:]+[-| :]*)\\n'
+ '('
+ 	'(?:'
+ 		'[ ]*'
+ 		'[|].*\\n'
+ 	')*'
+ ')'
+ '(?=\\n|' + md_flag_DoTables + ')'//Stop at final double newline.
, "gm" );
var md_reg_DoTables2 = new RegExp( ).compile(
  '^'
+ '[ ]{0,' + md_less_than_tab + '}'
+ '(\\S.*[|].*)\\n'
+ '[ ]{0,' + md_less_than_tab + '}'
+ '([-:]+[ ]*[|][-| :]*)\\n'
+ '('
+ 	'(?:'
+ 		'.*[|].*\\n'
+ 	')*'
+ ')'
+ '(?=\\n|' + md_flag_DoTables + ')'
, "gm" );
function _DoTables( text ) {
	
	text += md_flag_DoTables;
	var reg = md_reg_DoTables1;
	
	text = text.replace( reg, function( $0, $1, $2, $3 ) {
		$3 = $3.replace( /^[ ]*[|]/gm, '' );
		return _DoTable_callback( $0, $1, $2, $3 );
	} );
	
	text = text.replace( md_flag_DoTables, "" );
	
	text += md_flag_DoTables;
	var reg = md_reg_DoTables2;
	
	text = text.replace( reg, _DoTable_callback );
	
	text = text.replace( md_flag_DoTables, "" );
	
	return text;
}

function _DoTable_callback( $0, $1, $2, $3 ) {
	var head		= $1;
	var underline	= $2;
	var content		= $3;
	
	head		= head.replace( /[|][ ]*$/gm, '' );
	underline	= underline.replace( /[|][ ]*$/gm, '' );
	content		= content.replace( /[|][ ]*$/gm, '' );
	
	var separators	= underline.split( /[ ]*[|][ ]*/ );
	
	var attr = new Array( );
	
	for( var i = 0, len = separators.length; i < len; i++ ) {
		var separator = separators[i];
		if ( separator.match( /^[ ]*-+:[ ]*$/ ) ) attr.push( ' align="right"' );
		else if ( separator.match( /^[ ]*:-+:[ ]*$/ ) ) attr.push( ' align="center"' );
		else if ( separator.match( /^[ ]*:-+[ ]*$/ ) ) attr.push( ' align="left"' );
		else attr.push( '' );
	}
	
	head		= _DoCodeSpans( head );
	
	var headers		= head.split( /[ ]*[|][ ]*/ );
	var col_count	= headers.length;
	
	var text = "<table>\n";
	text += "<thead>\n";
	text += "<tr>\n";
	
	for( var i = 0, len = headers.length; i < len; i++ )
		text += "  <th" + attr[i] + ">" + _RunSpanGamut( headers[i]._trim(  ) ) + "</th>\n";
	
	text += "</tr>\n";
	text += "</thead>\n";
	
	var rows = content._trim( "\n" ).split( /\n/ );
	
	text += "<tbody>\n";
	
	for( var i = 0, len = rows.length; i < len; i++ ) {
		var row = rows[i];
		
		var row = _DoCodeSpans( row );
		var row_cells = row.split( /[ ]*[|][ ]*/, col_count );
		row_cells._pad( col_count, "" );
		
		text += "<tr>\n";
		for( var x = 0, len2 = row_cells.length; x < len2; x++ )
			text += "  <td" + attr[x] + ">" + _RunSpanGamut( row_cells[x]._trim( ) ) + "</td>\n";
		
		text += "</tr>\n";
	}
	text += "</tbody>\n</table>";
	
	return _HashBlock( text ) + "\n";
}

 

 

var md_flag_DoLists_z = "8ac2ec5b90470262b84a9786e56ff2bf";

function _DoLists( text ) {
	var md_marker_ul = '[*+-]';
	var md_marker_ol = '\\d+[.]';
	var md_markers = new Array( md_marker_ul, md_marker_ol );
	
	
	for( var i = 0, len = md_markers.length; i < len; i++ ) {
		var marker = md_markers[i];
		
		if ( md_list_level )
			var prefix = '(^)';
		else
			var prefix = '(?:(\\n\\n)|^\\n?)';
		
		text = text + md_flag_DoLists_z;
		var reg = new RegExp( prefix +
		  '('
		+ 	'('
		+ 		'[ ]{0,' + md_less_than_tab + '}'
		+ 		'(' + marker + ')'
		+ 		'[ \\t]+'
		+ 	')'
		+ 	'(?:[\\s\\S]+?)'
		+ 	'('
		+ 			md_flag_DoLists_z
		+ 		'|'
		+ 			'\\n{2,}'
		+ 			'(?=\\S)'
		+ 			'(?!'
		+ 				'[ \\t]*'
		+ 				marker + '[ \\t]+'
		+ 			')'
		+ 	')'
		+ ')'
		, "gm" );
		
		text = text.replace( reg, function( $0, $1, $2, $3, $4 ) {
			$2 = $2.replace( md_flag_DoLists_z, "" );
			var list = $2;
			var list_type = $4.match( new RegExp( ).compile( md_marker_ul ) ) != null ? "ul" : "ol";
			var marker = ( list_type == "ul" ? md_marker_ul : md_marker_ol );
			
			list = list.replace( /\n{2,}/g, "\n\n\n" );
			var result = _ProcessListItems( list, marker );
			
			result = "<" + list_type + ">\n" + result + "</" + list_type + ">";
			$1 = ( $1 ) ? $1 : "";
			return $1 + "\n" + _HashBlock( result ) + "\n\n";
		} );
		
		text = text.replace( md_flag_DoLists_z, "" )
	}
	
	return text;
}

 

var md_flag_ProcessListItems_z = "ae279c3e92b456b96f62b8cf03bbad88";
function _ProcessListItems( list_str, marker_any ) {
	md_list_level++;
	
	list_str = list_str.replace( /\n{2,}$/g, "\n" );
	list_str += md_flag_ProcessListItems_z;
	
	var reg = new RegExp(
	  '(\\n)?'
	+ '(^[ \\t]*)'
	+ '(' + marker_any + ')[ \\t]+'
	+ '(([\\s\\S]+?)'
	+ '(\\n{1,2}))'
	+ '(?=\\n*(' + md_flag_ProcessListItems_z + '|\\2(' + marker_any + ')[ \\t]+))'
	, "gm" );
	list_str = list_str.replace( reg, function ( $0, $1, $2, $3, $4 ) {
		var item = $4;
		
		if( $1 || item.match( /\n{2,}/ ) ) {
			item = _RunBlockGamut( _Outdent( item ) );
		}
		else {
			item = _DoLists( _Outdent( item ) );
			item = item.replace( /\n+$/, "" );
			item = _RunSpanGamut( item );
		}
		
		return "<li>" + item + "</li>\n";
	} );
	
	md_list_level--;
	return list_str.replace( md_flag_ProcessListItems_z, "" );
}

 


var md_reg_DoDefLists = new RegExp( ).compile(
  '(?:(\\n\\n)|^\\n?)'
+ '('
+ 	'('
+ 		'[ ]{0,' + md_less_than_tab + '}'
+ 		'((\\S.*\\n)+)'
+ 		'\\n?'
+ 		'[ ]{0,' + md_less_than_tab + '}:[ ]+'
+ 	')'
+ 	'(?:[\\s\\S]+?)'
+ 	'('
+ 		'$'
+ 		'|'
+ 		'\\n{2,}'
+ 		'(?=\\S)'
+ 		'(?!'
+ 			'[ ]{0,' + md_less_than_tab + '}'
+ 			'(?:\\S.*\\n)+?'
+ 			'\\n?'
+ 			'[ ]{0,' + md_less_than_tab + '}:[ ]+'
+ 		')'
+ 		'(?!'
+ 			'[ ]{0,' + md_less_than_tab + '}:[ ]+'
+ 		')'
+ 	')'
+ ')'
, "g" );
function _DoDefLists( text ) {
	
	var reg = md_reg_DoDefLists;
	
	text = text.replace( reg, function( $0, $1, $2, $3, $4, $5 ) {
		var result = _ProcessDefListItems( $2 )._trim( );
		result = "<dl>\n" + result + "\n</dl>";
		if( !$1 ) $1 = "";
		return $1 + _HashBlock( result ) + "\n\n";
	} );
	
	return text;
}

var md_reg_ProcessDefListItems1 = new RegExp( ).compile(
		  '(?:\\n\\n+|^\\n?)'
		+ '('
		+	'[ ]{0,' + md_less_than_tab + '}'
		+	'(?![:][ ]|[ ])'
		+	'(?:\\S.*\\n)+?'
		+ ')'
		+ '(?=\\n?[ ]{0,3}:[ ])'
	, "g" );
var md_reg_ProcessDefListItems2 = new RegExp( ).compile(
		  '\\n(\\n+)?'
		+ '[ ]{0,' + md_less_than_tab + '}'
		+ '[:][ ]+'
		+ '([\\s\\S]+?)'
		+ '(?=\\n+'
		+ 	'(?:'
		+ 		'[ ]{0,' + md_less_than_tab + '}[:][ ]|<dt>|$'
		+ 	')'
		+ ')'
	, "g" );
function _ProcessDefListItems( list_str ) {
	
	list_str = list_str.replace( /\n{2,}$/, "\n" );
	
	var reg = md_reg_ProcessDefListItems1;
	list_str = list_str.replace( reg, function( $0, $1 ) {
		var terms = $1._trim( ).split( /\n/ );
		var text = '';
		for( var i = 0, len = terms.length; i < len; i++ ) {
			var term = terms[i];
			term = _RunSpanGamut( term._trim( ) );
			text += "\n<dt>" + term + "</dt>";
		}
		return text + "\n";
	} );
	
	var reg = md_reg_ProcessDefListItems2;
	list_str = list_str.replace( reg, function( $0, $1, $2 ) {
		var leading_line = $1;
		var def = $2;
		
		if ( leading_line || def.match( /\n{2,}/ ) ) {
			def = _RunBlockGamut( _Outdent( def + "\n\n" ) );
			def = "\n" + def + "\n";
		}
		else {
			def = def._rtrim( );
			def = _RunSpanGamut( _Outdent( def ) );
		}
		
		return "\n<dd>" + def + "</dd>\n";
	} );
	
	return list_str;
}

 


var md_flag_DoCodeBlocks_A = "36efa4d78857300a";
var md_flag_DoCodeBlocks_Z = "8eae6c6133167566";

var md_reg_DoCodeBlocks = new RegExp( ).compile(
  '(?:\\n\\n|' + md_flag_DoCodeBlocks_A + ')'
+ '('
	+ '(?:'
		+ '(?:[ ]{' + md_tab_width + '}|\\t)'
		+ '.*\\n+'
	+ ')+'
+ ')'
+ '((?=^[ ]{0,' + md_tab_width + '}\\S)|' + md_flag_DoCodeBlocks_Z + ')'
, "gm" );
function _DoCodeBlocks( text ) {
	text = md_flag_DoCodeBlocks_A + text + md_flag_DoCodeBlocks_Z;
	var reg = md_reg_DoCodeBlocks;
	text = text.replace( reg, _DoCodeBlocks_callback );
	text = text
		.replace( md_flag_DoCodeBlocks_A, "" )
		.replace( md_flag_DoCodeBlocks_Z, "" )
		;
	return text;
}
function _DoCodeBlocks_callback( $0, $1 ) {
	var codeblock = $1;
	codeblock = _EncodeCode( _Outdent( codeblock ) );
	codeblock = codeblock.replace( /^\n+|\s+$/g, '' );
	
	var result = "<pre><code>" + codeblock + "\n</code></pre>";
	
	return "\n\n" + _HashBlock( result ) + "\n\n";
}

 

 


var md_reg_DoCodeSpans = new RegExp( ).compile(
  '(?:(?!\\\\)(^|[\\s\\S])?)'
+ '(`+)'
+ '([\\s\\S]+?(?!`)[\\s\\S])'
+ '\\2'
+ '(?!`)'
, "g" );
function _DoCodeSpans( text ) {
	var reg = md_reg_DoCodeSpans;
	
	text = text.replace( reg, _DoCodeSpans_callback );
	
	return text;
}

 


var md_reg_DoCodeSpans_callback = /^[ \t]*|[ \t]*$/g;
function _DoCodeSpans_callback( $0, $1, $2, $3 ) {
	var c = $3;
	c = c.replace( md_reg_DoCodeSpans_callback, '' );
	c = _EncodeCode( c );
	
	return $1 + "<code>" + c + "</code>";
}


function _EncodeCode( str ) {
	str = str
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' );
	
	return _EscapeRegExpChars( str );
}

 

 

var md_reg_DoItalicsAndBold_1 = new RegExp( ).compile(
	  '(((?!\\w)([\\s\\S]))?__)'
	+ '(?=\\S)'
	+ '(?!__)'
	+ '('
	+ 	'('
	+		'[^_]+?'
	+		'|'
	+		'(?![a-zA-Z0-9])[\\s\\S]?_(?=\\S)(?!_)[\\s\\S]+?(?=\\S)[\\s\\S]_(?![a-zA-Z0-9])'
	+	')+?'
	+ ')'
	+ '__'
	+ '(?!\\w)'
	, "g" );
var md_reg_DoItalicsAndBold_2 = new RegExp( ).compile(
	  '(((?!\\*\\*)([\\s\\S]{2}))?\\*\\*)'
	+ '(?=\\S)'
	+ '(?!\\*\\*)'
	+ '('
	+ 	'('
	+		'[^\\*]+?'
	+		'|'
	+		'\\*(?=\\S)(?!\\*)([\\s\\S]+?)(?=\\S)[\\s\\S]\\*'
	+	')+?'
	+ '(?=\\S)\\S)'
	+ '\\*\\*'
	, "g" );
var md_reg_DoItalicsAndBold_3 = new RegExp( ).compile(
	  '(((?!\\w)[\\s\\S]|^)_)'
	+ '(?=\\S)'
	+ '(?!_)'
	+ '('
	+ 	'[\\s\\S]+?'
	+ ')'
	+ '_'
	+ '(?!\\w)'
	, "g" );
var md_reg_DoItalicsAndBold_4 = new RegExp( ).compile(
	  '(((?!\\*)[\\s\\S]|^)\\*)'
	+ '(?=\\S)'
	+ '(?!\\*)'
	+ '('
	+ 	'[\\s\\S]+?'
	+ ')'
	+ '\\*'
	, "g" );

var md_reg_DoItalicsAndBold_5 = /(?:___|\*\*\*)([\s\S]+?)(?:___|\*\*\*)/g;

function _DoItalicsAndBold( text ) {
	var reg = md_reg_DoItalicsAndBold_5;
	text = text.replace( reg, "<strong><em>$1</em></strong>" );
	
	var reg = md_reg_DoItalicsAndBold_1;
	text = text.replace( reg, "$3<strong>$4</strong>" );
	
	var reg = md_reg_DoItalicsAndBold_2;
	text = text.replace( reg, "$3<strong>$4</strong>" );
	
	var reg = md_reg_DoItalicsAndBold_3;
	text = text.replace( reg, "$2<em>$3</em>" );
	
	var reg = md_reg_DoItalicsAndBold_4;
	text = text.replace( reg, "$2<em>$3</em>" );
	
	return text;
}

 

 

var md_reg_DoBlockQuotes = new RegExp( ).compile(
  '('
+	'('
+		'^[ \\t]*>[ \\t]?'
+			'.+\\n'
+		'(.+\\n)*'
+		'\\n*'
+	')+'
+ ')'
, "gm" );

function _DoBlockQuotes( text ) {
	var reg = md_reg_DoBlockQuotes;
	text = text.replace( reg, _DoBlockQuotes_callback );
	return text;
}

 

 

var md_reg_DoBlockQuotes_callback_1 = /^[ \t]*>[ \t]?/gm;
var md_reg_DoBlockQuotes_callback_2 = /^[ \t]+$/gm;
var md_reg_DoBlockQuotes_callback_3 = /^/gm;
var md_reg_DoBlockQuotes_callback_4 = /(\s*<pre>.+?<\/pre>)/;
function _DoBlockQuotes_callback( $0, $1 ) {
	var bq = $1;
	bq = bq.replace( md_reg_DoBlockQuotes_callback_1, '' );
	bq = bq.replace( md_reg_DoBlockQuotes_callback_2, '' );
	bq = _RunBlockGamut( bq );

	bq = bq.replace( md_reg_DoBlockQuotes_callback_3, "  " );
	bq = bq.replace( md_reg_DoBlockQuotes_callback_4, _DoBlockQuotes_callback2 );

	return _HashBlock( "<blockquote>\n" + bq + "\n</blockquote>" ) + "\n\n";
}
function _DoBlockQuotes_callback2( $0, $1 ) {
	var pre = $1;
	pre = pre.replace( /^[ ][ ]/gm, '' );
	return pre;
}


function _FormParagraphs( text ) {
	text = text.replace( /^\n+|\n+$/g, "" );
	
	var grafs = text.split( /\n{2,}/ );
	
	for( var i = 0, len = grafs.length; i < len; i++ ) {
		var value = _RunSpanGamut( grafs[i] )._trim( );
		
		var clean_key = value;
		var block_key = value.substr( 0, 32 );
		
		var is_p = ( md_html_blocks[block_key] == undefined
					&& md_html_hashes[clean_key] == undefined );
		
		if( is_p ) value = "<p>" + value + "</p>";
		
		grafs[i] = value;
	}
	
	text = grafs.join( "\n\n" );
	text = _UnhashTags( text );
	
	return text;
}

function _EncodeAmpsAndAngles( text ) {

	return text
		.replace( /&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g, '&amp;' )
		.replace( /<(?![a-z\/?\$!])/gi, "&lt;" )
	;
}

 

 

var md_reg_esc_backslash = /\\\\/g;
var md_reg_esc_backquote = /\\\`/g;
var md_reg_esc_asterisk  = /\\\*/g;
var md_reg_esc_underscore= /\\\_/g;
var md_reg_esc_lbrace    = /\\\{/g;
var md_reg_esc_rbrace    = /\\\}/g;
var md_reg_esc_lbracket  = /\\\[/g;
var md_reg_esc_rbracket  = /\\\]/g;
var md_reg_esc_lparen    = /\\\(/g;
var md_reg_esc_rparen    = /\\\)/g;
var md_reg_esc_hash      = /\\\#/g;
var md_reg_esc_period    = /\\\./g;
var md_reg_esc_exclamation = /\\\!/g;
var md_reg_esc_colon     = /\\\:/g;
function _EncodeBackslashEscapes( text ) {
	return text
	.replace( md_reg_esc_backslash,		"7f8137798425a7fed2b8c5703b70d078" )
	.replace( md_reg_esc_backquote,		"833344d5e1432da82ef02e1301477ce8" )
	.replace( md_reg_esc_asterisk,		"3389dae361af79b04c9c8e7057f60cc6" )
	.replace( md_reg_esc_underscore,	"b14a7b8059d9c055954c92674ce60032" )
	.replace( md_reg_esc_lbrace,		"f95b70fdc3088560732a5ac135644506" )
	.replace( md_reg_esc_rbrace,		"cbb184dd8e05c9709e5dcaedaa0495cf" )
	.replace( md_reg_esc_lbracket,		"815417267f76f6f460a4a61f9db75fdb" )
	.replace( md_reg_esc_rbracket,		"0fbd1776e1ad22c59a7080d35c7fd4db" )
	.replace( md_reg_esc_lparen,		"84c40473414caf2ed4a7b1283e48bbf4" )
	.replace( md_reg_esc_rparen,		"9371d7a2e3ae86a00aab4771e39d255d" )
	.replace( md_reg_esc_hash,			"01abfc750a0c942167651c40d088531d" )
	.replace( md_reg_esc_period,		"5058f1af8388633f609cadb75a75dc9d" )
	.replace( md_reg_esc_exclamation,	"9033e0e305f247c0c3c80d0c7848c8b3" )
	.replace( md_reg_esc_colon,			"853ae90f0351324bd73ea615e6487517" )
	;
}

 

 

var md_reg_DoAutoLinks_1 = /<((https?|ftp):[^'">\s]+)>/gi;
var md_reg_DoAutoLinks_2 = new RegExp( ).compile(
	'<'
	+ '(?:mailto:)?'
	+ '('
	+ 	'[-.\\w]+'
	+ 	'@'
	+ 	'[-a-z0-9]+(\\.[-a-z0-9]+)*\\.[a-z]+'
	+ ')'
	+ '>'
	, "gi" );

function _DoAutoLinks( text ) {
	text = text.replace( md_reg_DoAutoLinks_1, '<a href="$1">$1</a>' );
	
	var reg = md_reg_DoAutoLinks_2;
	text = text.replace( reg, function( $0, $1 ) {
		return _EncodeEmailAddress(
			_UnescapeSpecialChars( _UnslashQuotes( $1 ) )
		);
	} );

	return text;
}

function _EncodeEmailAddress( addr ) {
	addr = "mailto:" + addr;
	var length = addr.length;
	
	addr = addr.replace( /([^:])/g, _EncodeEmailAddress_callback );
	
	addr = '<a href="' + addr + '">' + addr + "</a>";
	addr = addr.replace( /\">.+?:/g, '">' );
	
	return addr;
}
function _EncodeEmailAddress_callback( $0, $1 ) {

	var str = $1;
	var r = Math.round( Math.random( ) * 100 );
	if( r > 90 && str != '@' ) return str;
	else if( r < 45 ) return '&#x' + str.charCodeAt( 0 ).toString( 16 ) + ';';
	else return '&#' + str.charCodeAt( 0 ) + ';';
}

var md_reg_md5_backslash   = /7f8137798425a7fed2b8c5703b70d078/g;
var md_reg_md5_backquote   = /833344d5e1432da82ef02e1301477ce8/g;
var md_reg_md5_asterisk    = /3389dae361af79b04c9c8e7057f60cc6/g;
var md_reg_md5_underscore  = /b14a7b8059d9c055954c92674ce60032/g;
var md_reg_md5_lbrace      = /f95b70fdc3088560732a5ac135644506/g;
var md_reg_md5_rbrace      = /cbb184dd8e05c9709e5dcaedaa0495cf/g;
var md_reg_md5_lbracket    = /815417267f76f6f460a4a61f9db75fdb/g;
var md_reg_md5_rbracket    = /0fbd1776e1ad22c59a7080d35c7fd4db/g;
var md_reg_md5_lparen      = /84c40473414caf2ed4a7b1283e48bbf4/g;
var md_reg_md5_rparen      = /9371d7a2e3ae86a00aab4771e39d255d/g;
var md_reg_md5_hash        = /01abfc750a0c942167651c40d088531d/g;
var md_reg_md5_period      = /5058f1af8388633f609cadb75a75dc9d/g;
var md_reg_md5_exclamation = /9033e0e305f247c0c3c80d0c7848c8b3/g;
var md_reg_md5_colon       = /853ae90f0351324bd73ea615e6487517/g;

function _UnescapeSpecialChars( text ) {
	return text
	.replace( md_reg_md5_backslash,   "\\" )
	.replace( md_reg_md5_backquote,   "`" )
	.replace( md_reg_md5_asterisk,    "*" )
	.replace( md_reg_md5_underscore,  "_" )
	.replace( md_reg_md5_lbrace,      "{" )
	.replace( md_reg_md5_rbrace,      "}" )
	.replace( md_reg_md5_lbracket,    "[" )
	.replace( md_reg_md5_rbracket,    "]" )
	.replace( md_reg_md5_lparen,      "(" )
	.replace( md_reg_md5_rparen,      ")" )
	.replace( md_reg_md5_hash,        "#" )
	.replace( md_reg_md5_period,      "." )
	.replace( md_reg_md5_exclamation, "!" )
	.replace( md_reg_md5_colon,       ":" )
	;
}

function _UnhashTags( text ) {
	for( var key in md_html_hashes ) {
		text = text.replace( new RegExp( ).compile( key, "g" ), md_html_hashes[key] );
	}
	return text;
}
function _TokenizeHTML( str ) {
	var index = 0;
	var tokens = new Array( );
	
	var reg = new RegExp( ).compile(
	  '(?:<!(?:--[\\s\\S]*?--\\s*)+>)|'
	+ '(?:<\\?[\\s\\S]*?\\?>)|'
	+ '(?:<[/!$]?[-a-zA-Z0-9:]+\\b([^"\'>]+|"[^"]*"|\'[^\']*\')*>)'
	, "g" );
	
	while( reg.test( str ) ) {
		var txt = RegExp.leftContext;
		var tag = RegExp.lastMatch;
		
		tokens.push( [ "text", txt ] );
		tokens.push( [ "tag", tag ] );
		
		str = str.replace( txt, "" );
		str = str.replace( tag, "" );
	}
	
	if( str != "" ) {
		tokens.push( [ "text", str ] );
	}
	
	return tokens;
}

var md_reg_Outdent = new RegExp( ).compile( '^(\\t|[ ]{1,' + md_tab_width + '})', "gm" );
function _Outdent( text ) {
	return text.replace( md_reg_Outdent, "" );
}

function _Detab( text ) {
	text = text.replace( /(.*?)\t/g,
		function( match, substr ) {
			return substr += " "._r( ( md_tab_width - substr.length % md_tab_width ) );
		});
	return text;
}

function _UnslashQuotes( text ) {
	return text.replace( '\"', '"' );
}

var md_reg_backslash = /\\/g;
var md_reg_backquote = /\`/g;
var md_reg_asterisk  = /\*/g;
var md_reg_underscore= /\_/g;
var md_reg_lbrace    = /\{/g;
var md_reg_rbrace    = /\}/g;
var md_reg_lbracket  = /\[/g;
var md_reg_rbracket  = /\]/g;
var md_reg_lparen    = /\(/g;
var md_reg_rparen    = /\)/g;
var md_reg_hash      = /\#/g;
var md_reg_period    = /\./g;
var md_reg_exclamation = /\!/g;
var md_reg_colon     = /\:/g;
function _EscapeRegExpChars( text ) {
	return text
	.replace( md_reg_backslash,   "7f8137798425a7fed2b8c5703b70d078" )
	.replace( md_reg_backquote,   "833344d5e1432da82ef02e1301477ce8" )
	.replace( md_reg_asterisk,    "3389dae361af79b04c9c8e7057f60cc6" )
	.replace( md_reg_underscore,  "b14a7b8059d9c055954c92674ce60032" )
	.replace( md_reg_lbrace,      "f95b70fdc3088560732a5ac135644506" )
	.replace( md_reg_rbrace,      "cbb184dd8e05c9709e5dcaedaa0495cf" )
	.replace( md_reg_lbracket,    "815417267f76f6f460a4a61f9db75fdb" )
	.replace( md_reg_rbracket,    "0fbd1776e1ad22c59a7080d35c7fd4db" )
	.replace( md_reg_lparen,      "84c40473414caf2ed4a7b1283e48bbf4" )
	.replace( md_reg_rparen,      "9371d7a2e3ae86a00aab4771e39d255d" )
	.replace( md_reg_hash,        "01abfc750a0c942167651c40d088531d" )
	.replace( md_reg_period,      "5058f1af8388633f609cadb75a75dc9d" )
	.replace( md_reg_exclamation, "9033e0e305f247c0c3c80d0c7848c8b3" )
	.replace( md_reg_colon,       "853ae90f0351324bd73ea615e6487517" )
	;
}

function _EscapeItalicsAndBold( text ) {
	return text
	.replace( md_reg_asterisk,    "3389dae361af79b04c9c8e7057f60cc6" )
	.replace( md_reg_underscore,  "b14a7b8059d9c055954c92674ce60032" )
	;
}

var md_md5cnt = 0;
function _md5( ) {
	var key = "a3e597688f51d1fc" + ( md_md5cnt++ ) + "ce22217bb70243be";
	return key;
}