import { syntaxTree } from "@codemirror/language"
import { Range } from "@codemirror/state"
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view"
import { scopeNode } from "./scope"
import { useNode } from "./use"
import { definitionNode } from "./definition"

const definitionMark = Decoration.mark({ class: "cm-definition-prop" })
const useMark = Decoration.mark({ class: "cm-use-prop" })

const highlightReflectorPropsTheme = EditorView.baseTheme({
    ".cm-definition-prop": { textDecoration: "2px solid underline blue" },
    ".cm-use-prop": { textDecoration: "2px solid underline green" },
    ".cm-scope-prop": { color: "red", fontWeight: "bold" },
})

export const highlightReflectorPropsPlugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet

    constructor(view: EditorView) {
        this.decorations = createWidgets(view)
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || syntaxTree(update.state) != syntaxTree(update.startState)) {
            this.decorations = createWidgets(update.view)
        }
    }
}, {
    decorations: v => v.decorations,
})

export const highlightReflectorProps = [highlightReflectorPropsPlugin, highlightReflectorPropsTheme]

function createWidgets(view: EditorView): DecorationSet {
    let widgets: Range<Decoration>[] = []
    for (let { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from, to,
            enter: ref => {
                if (scopeNode(ref)) {
                    widgets.push(ScopeWidget.create("{", ref.from))
                }
                if (useNode(ref)) {
                    let widget = Decoration.mark(useMark).range(ref.from, ref.to)
                    widgets.push(widget)
                }
                if (definitionNode(ref)) {
                    let widget = Decoration.mark(definitionMark).range(ref.from, ref.to)
                    widgets.push(widget)
                }
            },
            leave: ref => {
                if (scopeNode(ref)) {
                    widgets.push(ScopeWidget.create("}", ref.to))
                }
            }
        })
    }
    return Decoration.set(widgets)
}

class ScopeWidget extends WidgetType {
    constructor(private text: string) {
        super()
    }

    toDOM(view: EditorView): HTMLElement {
        let element = document.createElement("span")
        element.className = "cm-scope-prop"
        element.textContent = this.text
        return element
    }

    eq(other: ScopeWidget) {
        return true
    }

    ignoreEvent(event: Event): boolean {
        return false
    }

    static create(text: string, pos: number) {
        return Decoration.widget({ widget: new ScopeWidget(text), side: -1, block: false }).range(pos)
    }
}