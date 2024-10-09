import { LanguageSupport, LRLanguage } from "@codemirror/language"
import { parser } from "./miniscript"
import { styleTags, tags } from "@lezer/highlight"
import { StructureSpec, unusedDefinition, multipleDefinitions, undefinedUse } from "../src/OLDstructure.js"

const styles = styleTags({
    "Function Var Return": tags.keyword,
    "FunctionDeclaration/Identifier VariableDeclaration/Identifier": tags.definition(tags.variableName),
    "FormalParameters/Identifier": tags.local(tags.variableName),
    Identifier: tags.variableName,
    Comment: tags.lineComment,

    Number: tags.number,
    String: tags.string,
})

const structure: StructureSpec = {
    defaultSyntaxErrorMessage: "Syntax error",
    scopes: [
        {
            kind: "Global variable",
            scope: "Program",
            definitions: {
                "VariableDeclaration": {
                    "Identifier": { checkFor: [unusedDefinition, multipleDefinitions] }
                }
            },
            uses: {
                "FunctionDeclaration/FunctionBody": {
                    "Identifier": { checkFor: [undefinedUse] }
                }
            }
        },
        {
            kind: "Function",
            scope: "Program",
            definitions: {
                "FunctionDeclaration": {
                    "Identifier": { checkFor: [unusedDefinition, multipleDefinitions] }
                }
            },
            uses: {
                "FunctionDeclaration/FunctionBody": {
                    "FunctionCall/Identifier": { checkFor: [undefinedUse] }
                }
            }
        },
        {
            kind: "Function parameter",
            scope: "FunctionDeclaration",
            definitions: {
                "FormalParameters": {
                    "Identifier": { checkFor: [unusedDefinition, multipleDefinitions] }
                },
            },
            uses: {
                "FunctionBody": {
                    "Expression/Identifier": { checkFor: [undefinedUse] }
                }
            }
        },
        {
            kind: "Local variable",
            scope: "FunctionBody",
            definitions: {
                "VariableDeclaration": {
                    "Identifier": { checkFor: [unusedDefinition] }
                }
            },
            uses: {
                "": { // TODO how do we say that a variable can be redefined and subsequent uses will only find the redefinition?
                    "Expression/Identifier": { checkFor: [undefinedUse] }
                }
            }
        },
    ]
}

const miniscriptLanguage = LRLanguage.define({
    name: "miniscript",
    parser: parser.configure({
        props: [
            styles,
        ]
    }),
    languageData: {
        closeBrackets: { brackets: ["(", "{"] },
        commentTokens: { line: "//" },
        structure
    }
})


export function miniscript() {
    return new LanguageSupport(
        miniscriptLanguage,
        [
            // miniscriptLanguage.data.of(completions),
            // linter(lint)
        ]
    )
}