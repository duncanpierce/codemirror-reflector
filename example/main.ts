import { drawSelection, EditorView, keymap } from "@codemirror/view"
import { EditorState } from "@codemirror/state"
import { autocompletion, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete"
import { defaultKeymap } from "@codemirror/commands"
import { lintGutter, lintKeymap } from "@codemirror/lint"
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { miniscript } from "./miniscript-language"
import { treeView } from "./treeview"
import { markNodeProps } from "../src/markNodeProps"

const editorElement = document.querySelector('#editor')!

let startingDoc =
    `func foo(a, b) {
    var c; # declare c
    c = a + b; # assign to c
    return c;
}
    
func bar(a, b) {
    var c;
    c = a * b;
    var c; # redeclare c
    c = a / b;
    var d;
    d = baz(c); # call another function, declared later
    return c; # this refers to the second c
}
    
var x;

func baz(n) {
    return n * 2 + x;
}
`

let editorView = new EditorView({
    parent: editorElement,
    state: EditorState.create({
        doc: startingDoc,
        extensions: [
            miniscript(),
            lintGutter(),
            drawSelection(), // include this to allow Reflector to show multiple selections; TODO include in Reflector extension
            EditorState.allowMultipleSelections.of(true), // TODO include in Reflector extension
            autocompletion(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...completionKeymap,
                ...lintKeymap,
            ]),
            treeView(document.querySelector('#debug')!),
            markNodeProps,
        ],
    }),
})