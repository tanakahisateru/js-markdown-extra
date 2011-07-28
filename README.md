# js-markdown-extra

ver 1.0  
based on PHP Markdown Extra 1.01

* [What's this?](#whats)
* [Demo](#demo)
* [How to use](#howtouse)
* [Notice](#notice)
* [Known issues](#bug)
* [Copyright](#copyright)
* [License](#license)
* [Agreement](#agreement)
* [Contact](#contact)
* [History](#history)

### What's this? ### {#whats}

js-markdown-extra is a experimental JapaScript port of PHP Markdown Extra.

[PHP Markdown Extra demo](http://www.michelf.com/projects/php-markdown/dingus/)

I couldn't retain complete comaptibility because of difference between PHP's
regular expression and JavaScript's one, but it can convert most of simple
markdown text.
**perhaps**.

### Demo ### {#demo}

You can try in your hand.

[Demo page](http://bmky.net/product/files/js-markdown-extra/demo.html)

### How to use ### {#howtouse}

Load this script in HTML and call ```Markdown``` function.

```javascript
	//example :
	var html = Markdown( text );
```

### Notice #### {#notice}

It has possibility of entering infinite loop by some user input because
I try to port PHP Markdown Extra with incompatible regular expression test.
Please stand by to kill your browser process. **I prefer mutch to use it
under dual core CPU**

### Known issues ### {#bug}

* Emphasis or strong syntax may have a bug.
* Possible to freeze when incomplete syntax.
* Bracket nesting more than twice for link is unsupported. (is as standard spec)

### Copyright ### {#copyright}

* [Markdown](http://daringfireball.net/projects/markdown/)
* [PHP Markdown & PHP Markdown Extra](http://www.michelf.com/projects/php-markdown/)
* [js-markdown](http://rephrase.net/box/js-markdown/)

### License ### {#license}

This software is based on BSD license.

Free for modification, redistribution and embedding if copyright included.

### Agreement ### {#agreement}

Shall we not be liable for any damages caused by this software.

### History ### {#history}

1.1 - 2008-05-31
: BUGFIX: Reference syntax with empty title. (Thanks to reporter)

1.0 - 2006-07-08
: 1st release.
