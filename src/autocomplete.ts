import { CompletionContext } from "@codemirror/autocomplete"
import { syntaxTree } from "@codemirror/language"
import { findScope } from "./searchTree"

export function identifierCompletions(c: CompletionContext) {
    let word = c.matchBefore(/\w*/)
    if (word == null || (word.from == word.to && !c.explicit)) return null
    let node = syntaxTree(c.state).resolve(word.from, 1)
    let scope = findScope(node)
    if (!scope) return null
    return {
        from: word.from,
        options: scope.availableDefinitionIdentifiers(c.state.doc).values().map(i => ({ label: i, apply: i, type: "variable" })), // TODO should use definition's type
    }
}
