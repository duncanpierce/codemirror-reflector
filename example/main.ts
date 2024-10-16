import { drawSelection, EditorView, keymap } from "@codemirror/view"
import { EditorState } from "@codemirror/state"
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete"
import { defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands"
import { lintGutter, lintKeymap } from "@codemirror/lint"
import { defaultHighlightStyle, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language"
import { miniscript } from "./miniscript-language"
import { highlightIdentifiers } from "../src/highlightIdentifiers"
import { error, hint, lintStructure, multipleDefinitions, undefinedUse, unusedDefinition, first, all, matchContext, remove, following, insertBefore } from "../src/lint"
import { history } from "@codemirror/commands"
import { enclosingNodeOfType } from "../src/searchTree"
import { highlightReflectorProps } from "../src/highlightReflectorProps"
import { reflectorKeymap } from "../src/commands"

const editorElement = document.querySelector('#editor')!

let startingDoc =
    `func foo(a, b) {
    var c;
    c = a + b;
    return c;
}
    
func bar(a, b, b, c, d) {
    foo(a, c, x);
    var c;
    c = a * b;
    c = c * 2;
    var x;
    var c;
    c = a / b;
    var d;
    d = baz(c);
    return c + x;
}
    
var x;

func baz(n) {
    var z;
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
            closeBrackets(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...completionKeymap,
                ...lintKeymap,
                ...historyKeymap,
                ...closeBracketsKeymap,
                indentWithTab,
                ...reflectorKeymap,
            ]),
            // treeView(document.querySelector('#debug')!),
            // highlightReflectorProps,
            highlightIdentifiers({
                definitions: true,
                uses: true,
                selfMark: true,
            }),

            // TODO this structural information should be in languageData
            lintStructure({
                errorNodes: first(
                    matchContext(["FunctionDeclaration"], error("Function name and parameters required")),
                    matchContext(["FunctionScope"], error("Braces and function body required")),
                    error("Syntax error"),
                ),
                allNodes: all(
                    multipleDefinitions()
                ),
                nodeTypes: {
                    Comment: following("Statement", hint("Commenting statements is discouraged")),
                    LocalVariableDefinition: unusedDefinition(
                        remove(enclosingNodeOfType("Statement"), "Delete unused local variable")
                    ),
                    GlobalVariableDefinition: unusedDefinition(
                        remove(enclosingNodeOfType("GlobalVariableDeclaration"), "Delete unused global variable")
                    ),
                    FunctionDefinition: unusedDefinition(
                        remove(enclosingNodeOfType("FunctionDeclaration"), "Delete unused function")
                    ),
                    ParameterDefinition: unusedDefinition(
                        // no action because we can't remove parameter from callers yet
                    ),
                    VariableUse: undefinedUse(
                        insertBefore("Statement", "var $$;\n", "Create local variable"),
                        insertBefore("FunctionDeclaration", "var $$;\n\n", "Create global variable"),
                        // TODO append function parameter is harder because we don't know whether to insert a `,` or not
                    ),
                    FunctionUse: undefinedUse(
                        insertBefore("FunctionDeclaration", "func $$() {\n}\n\n", "Create function")
                    ),
                    // TODO it would be nice to be able to define an Alt-Enter action/command without having to create a Diagnostic
                }
            })
        ],
    }),
})