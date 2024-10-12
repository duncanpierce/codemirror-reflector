# Reflector

*Refactoring, smart navigation and code assistance for [CodeMirror](https://codemirror.net/)*

Reflector is a CodeMirror extension that allows [language packages](https://codemirror.net/examples/lang-package/) to provide **refactoring**, code **navigation** and **linting** features.

**It is a promising proof-of-concept but not a stable API you should rely on and the claimed features aren't ready to use**


## Features

* rename variable
* go to definition
* find usages
* highlight undefined variable
* highlight unused function
* and more....


## How it works

There are 2 pieces: the Reflector extension (this repository) and some additional [nodeProps](https://lezer.codemirror.net/docs/ref/#common.NodeProp) the Lezer [LRParser](https://lezer.codemirror.net/docs/ref/#lr.LRParser) grammar must be tagged with in order to use some of the refactoring features. These node props provide Reflector with some understanding of the structure of the language---particularly the relationships between scopes, uses and definitions of identifiers.

Reflector uses core CodeMirror features to drive the cursor or selection to other parts of the file when you use navigation or refactoring features.

It plugs into CodeMirror's [Lint](https://codemirror.net/docs/ref/#lint) extension and uses it to display problems and suggestions it has found. It also provides [Autocomplete](https://codemirror.net/docs/ref/#autocomplete) suggestions using the identifiers that are in scope.

Finally, it provides an additional set of editing commands and a [Keymap](https://codemirror.net/docs/ref/#commands) that makes them available in the editor.


## Understanding the code

This repository contains an [example language definition](https://github.com/duncanpierce/codemirror-reflector/tree/main/example) which I'm using to explore and demonstrate the features I'm trying to implement. The other main folder is the source code, which [implements the refactoring and navigation features](https://github.com/duncanpierce/codemirror-reflector/tree/main/src).