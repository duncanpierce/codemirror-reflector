import { syntaxTree } from "@codemirror/language"
import { EditorState, Extension, Range, Text } from "@codemirror/state"
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view"
import { SyntaxNode, Tree } from "@lezer/common"
import { useNode } from "./use"
import { definitionNode } from "./definition"

export interface HighlightIdentifiersConfig {
    afterCursor?: boolean,
    definitions?: boolean,
    uses?: boolean,
    selfMark?: boolean,
}

const definitionMark = Decoration.mark({ class: "cm-highlight-definition" })
const useMark = Decoration.mark({ class: "cm-highlight-use" })
const unmatchedDefinitionMark = Decoration.mark({ class: "cm-highlight-unmatched-definition" })
const unmatchedUseMark = Decoration.mark({ class: "cm-highlight-unmatched-use" })

function createWidgets(state: EditorState, config: HighlightIdentifiersConfig): DecorationSet {
    let widgets: Range<Decoration>[] = []

    if (config.definitions ?? true) {
        let use = cursorNode(config.afterCursor ?? true, state, useNode)
        if (use) {
            let matches = use.matchingDefinitions(state.doc)
            matches.forEach(def => {
                widgets.push(Decoration.mark(definitionMark).range(def.from, def.to))
            })
            if (config.selfMark ?? true) {
                let selfMark = matches.length > 0 ? useMark : unmatchedUseMark
                widgets.push(Decoration.mark(selfMark).range(use.from, use.to))
            }
        }
    }

    if (config.uses ?? true) {
        let definition = cursorNode(config.afterCursor ?? true, state, definitionNode)
        if (definition) {
            let matches = definition.matchingUses(state.doc)
            matches.forEach(use => {
                widgets.push(Decoration.mark(useMark).range(use.from, use.to))
            })
            if (config.selfMark ?? true) {
                let selfMark = matches.length > 0 ? definitionMark : unmatchedDefinitionMark
                widgets.push(Decoration.mark(selfMark).range(definition.from, definition.to))
            }
        }
    }

    return Decoration.set(widgets, true)
}

export function highlightIdentifiers(config: HighlightIdentifiersConfig = {}): readonly Extension[] {
    return [
        EditorView.baseTheme({
            ".cm-highlight-use": { backgroundColor: "#32c07052" },
            ".cm-highlight-definition": { backgroundColor: "#3270c052" },
            ".cm-highlight-unmatched-definition": { backgroundColor: "#bb555544" },
            ".cm-highlight-unmatched-use": { backgroundColor: "#bb555544" },
        }),

        ViewPlugin.fromClass(class {
            decorations: DecorationSet

            constructor(view: EditorView) {
                this.decorations = createWidgets(view.state, config)
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged || syntaxTree(update.state) != syntaxTree(update.startState) || update.selectionSet) {
                    this.decorations = createWidgets(update.view.state, config)
                }
            }
        }, {
            decorations: v => v.decorations,
        })
    ]
}

function cursorNode<T>(afterCursor: boolean, state: EditorState, tryWrap: (node: SyntaxNode, doc: Text) => T | undefined): T | undefined {
    let tree = syntaxTree(state)
    let cursorPos = state.selection.main.head
    let left = tryDirection(tree, state.doc, cursorPos, -1, tryWrap)
    if (left) return left
    if (!afterCursor) return
    return tryDirection(tree, state.doc, cursorPos, 1, tryWrap)
}

function tryDirection<T>(tree: Tree, doc: Text, pos: number, direction: -1 | 1, tryWrap: (node: SyntaxNode, doc: Text) => T | undefined): T | undefined {
    let cursorNode = tree.resolve(pos, direction)
    return tryWrap(cursorNode, doc)
}