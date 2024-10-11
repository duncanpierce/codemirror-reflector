import { LanguageSupport, LRLanguage } from "@codemirror/language"
import { parser } from "./miniscript"
import { styleTags, tags } from "@lezer/highlight"

const styles = styleTags({
    "Function Var Return": tags.keyword,
    "FunctionDefinition": tags.definition(tags.variableName),
    "GlobalVariableDefinition ParameterDefinition LocalVariableDefinition": tags.local(tags.variableName),
    "VariableUse": tags.variableName,
    "FunctionUse": tags.function(tags.variableName),

    "Comment": tags.lineComment,
    "Number": tags.number,
    "String": tags.string,
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
        commentTokens: { line: "#" },
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