import { syntaxTree } from "@codemirror/language"
import { EditorState, Extension, Range, StateField } from "@codemirror/state"
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view"
import { definitionNode, useNode } from "./props"

export interface HighlightReferencesConfig {
    definitions?: boolean,
    uses?: boolean
}

const definitionMark = Decoration.mark({ class: "cm-definition" })
const useMark = Decoration.mark({ class: "cm-use" })

function createWidgets(state: EditorState, config: HighlightReferencesConfig): DecorationSet {
    let widgets: Range<Decoration>[] = []
    let cursorNode = syntaxTree(state).resolve(state.selection.main.head, -1)

    if (config.definitions ?? true) {
        const use = useNode(cursorNode, state.doc)
        if (use) {
            console.log("definitions")
            use.visibleDefinitions.forEach(def => {
                widgets.push(Decoration.mark(definitionMark).range(def.from, def.to))
            })
        }
    }

    if (config.uses ?? true) {
        const definition = definitionNode(cursorNode, state.doc)
        if (definition) {
            console.log("uses")
            definition.visibleUses.forEach(use => {
                widgets.push(Decoration.mark(useMark).range(use.from, use.to))
            })
        }
    }
    return Decoration.set(widgets)
}

export function highlightReferences(config: HighlightReferencesConfig = {}): readonly Extension[] {
    return [
        EditorView.baseTheme({
            ".cm-use": { textDecoration: "2px solid underline green" },
            ".cm-definition": { textDecoration: "2px solid underline blue" },
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