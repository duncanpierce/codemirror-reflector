import { syntaxTree } from "@codemirror/language"
import { EditorSelection, SelectionRange, StateCommand } from "@codemirror/state"
import { useNode } from "./use"
import { definitionNode } from "./definition"
import { EditorView } from "codemirror"
import { KeyBinding } from "@codemirror/view"

// TODO this emulates a renaming imperfectly: it's just multiple selections, so you need `Esc` to finish renaming, rather than `Enter`
// There is no check for creating a conflicting name and no way to back out other than Undo
export const selectMatchingIdentifiers: StateCommand = ({ state, dispatch }) => {
    let node = syntaxTree(state).resolve(state.selection.main.head, -1)
    let maybeDefinitionNode = definitionNode(node)
    if (!maybeDefinitionNode) return false
    let matchingUses = maybeDefinitionNode.matchingUses(state.doc)
    if (matchingUses.length > 0) {
        dispatch(state.update({
            selection: EditorSelection.create([maybeDefinitionNode.selectionRange, ...matchingUses.map(use => use.selectionRange)]),
        }))
        return true
    }
    return false
}

export const goToDefinition: StateCommand = ({ state, dispatch }) => {
    let node = syntaxTree(state).resolve(state.selection.main.head, -1)
    let maybeUseNode = useNode(node)
    if (!maybeUseNode) return false
    let matchingDefinitions = maybeUseNode.matchingDefinitions(state.doc)
    if (matchingDefinitions.length > 0) {
        dispatch(state.update({
            selection: EditorSelection.create([matchingDefinitions[0].selectionRange]),
        }))
        return true
    }
    return false
}

export const reflectorKeymap: readonly KeyBinding[] = [
    { key: "Mod-'", run: selectMatchingIdentifiers, shift: goToDefinition },
]