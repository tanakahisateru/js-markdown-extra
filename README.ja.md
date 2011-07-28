# js-markdown-extra

ver 1.0  
based on PHP Markdown Extra 1.01

### これは何？ ###

js-markdown-extraはPHP Markdown ExtraをJavaScript上で再現しようとしたものです。

[PHP Markdown Extraのデモページ](http://www.michelf.com/projects/php-markdown/dingus/)

正規表現に互換性が無い為に完全に再現できませんでしたが、
単純なmarkdown文法ならば、問題無く変換してくれます。
**たぶん**。

### デモ ###

実際に試すことができます。

[デモページ](http://bmky.net/product/files/js-markdown-extra/demo.html)

### 使い方 ###

htmlのhead内でスクリプトを読み込ませた後、任意の箇所で```Markdown```関数を呼び出してください。

```javascript
	//例 :
	var html = Markdown( text );
```

### 使用上の注意 ###

PHP Markdown Extraを互換性の無い正規表現で不完全に再現しようとしているので、
入力したテキスト次第では正規表現で無限にループしてしまう可能性があります。
できるだけタスクマネージャ等を起動しておいて、
いつでも殺せるようにしてください。**デュアルコア超推奨**。

### 既知の不具合 ###

* 強調の処理が怪しい。
* 不完全な構文を処理させようとすると固まる可能性有り。
* リンクを記述する際、ブラケットの2段以上のネストに未対応。（ほぼ仕様）

### コピーライト ###

* [Markdown](http://daringfireball.net/projects/markdown/)
* [PHP Markdown & PHP Markdown Extra](http://www.michelf.com/projects/php-markdown/)
* [js-markdown](http://rephrase.net/box/js-markdown/)

### ライセンス ###

BSDに基づくオープンソースウェアです。

著作権表示を怠らなければ自由に改変・配布・組み込み等を行うことができます。

### 免責 ###

このスクリプトを利用して発生した障害・損失に関して当方は一切責任を負いません。

### 更新履歴 ###

#### 1.1 - 2008-05-31
  リンクを参照スタイルで記述する場合、
  title部分を省略するかダブルクオートのみで空になっていると
  正しく変換できなかったのを修正。（指摘して頂きました）

#### 1.0 - 2006-07-08
  リリース
