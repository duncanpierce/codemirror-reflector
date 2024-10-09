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