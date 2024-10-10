# Reflector

*Refactoring, smart navigation and code assistance for [CodeMirror](https://codemirror.net/)*

Reflector is a CodeMirror extension that allows [language packages](https://codemirror.net/examples/lang-package/) to provide **refactoring**, code **navigation** and **linting** features.


## Features

* rename variable
* go to definition
* find usages
* highlight undefined variable
* highlight unused function
* and more....


## How it works

There are 2 pieces: the Reflector extension (this repository) and some additional [nodeProps](https://lezer.codemirror.net/docs/ref/#common.NodeProp) the Lezer [LRParser](https://lezer.codemirror.net/docs/ref/#lr.LRParser) grammar must be tagged with in order to use the refactoring features. These node props provide Reflector with some understanding of the structure of the language.

Reflector uses core CodeMirror features to drive the cursor or selection to other parts of the file when you use navigation or refactoring features.

It plugs into CodeMirror's [Lint](https://codemirror.net/docs/ref/#lint) extension and uses it to display problems and suggestions it has found. It also provides [Autocomplete](https://codemirror.net/docs/ref/#autocomplete) suggestions using the identifiers that are in scope.

Finally, it provides an additional set of editing commands and a [Keymap](https://codemirror.net/docs/ref/#commands) that makes them available in the editor.