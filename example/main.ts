import { drawSelection, EditorView, keymap } from "@codemirror/view"
import { EditorState } from "@codemirror/state"
import { autocompletion, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete"
import { defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands"
import { lintGutter, lintKeymap } from "@codemirror/lint"
import { defaultHighlightStyle, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language"
import { miniscript } from "./miniscript-language"
import { treeView } from "./treeview"
import { highlightProps } from "../src/highlightProps"
import { highlightReferences } from "../src/highlightReferences"
import { error, hint, info, warning, lintStructure, multipleDefinitions, undefinedUse, unusedDefinition, first, all, matchContext, remove, following, removeStructure } from "../src/lint"
import { history } from "@codemirror/commands"

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
    c = c * 2;
    var c; # redeclare c
    c = a / b;
    var d;
    d = baz(c); # call another function, declared later
    return c + x; # this refers to the second c and x from a higher scope
}
    
var x;

func baz(n) {
    var z; # unused variable
    return n * 2 + x;
}
`

let editorView = new EditorView({
    parent: editorElement,
    state: EditorState.create({
        doc: startingDoc,
        extensions: [
            miniscript(),
            history(),
            lintGutter(),
            drawSelection(), // include this to allow Reflector to show multiple selections; TODO include in Reflector extension
            EditorState.allowMultipleSelections.of(true), // TODO include in Reflector extension
            indentOnInput(),
            indentUnit.of("    "),
            autocompletion(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...completionKeymap,
                ...lintKeymap,
                ...historyKeymap,
                indentWithTab,
            ]),
            // treeView(document.querySelector('#debug')!),
            // highlightProps,
            highlightReferences(),

            // TODO this structural information should be in languageData
            lintStructure({
                errorNodes: first(
                    matchContext(["FunctionDeclaration"], error("Function name and parameters required")),
                    matchContext(["FunctionScope"], error("Braces and function body required")),
                    error("Syntax error"),
                ),
                allNodes: all(
                    unusedDefinition(removeStructure), 
                    undefinedUse(), 
                    multipleDefinitions()
                ),
                nodeTypes: {
                    Comment: following("Statement", hint(
                        "Commenting statements is discouraged",
                    )),
                    // TODO it would be nice to be able to define an Alt-Enter action/command without having to create a Diagnostic
                }
            })
        ],
    }),
})