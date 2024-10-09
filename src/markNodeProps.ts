import { syntaxTree } from "@codemirror/language"
import { Range } from "@codemirror/state"
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view"
import { definition, scope, use } from "./nodeProps"

const scopeMark = Decoration.mark({ class: "cm-scope" })
const definitionMark = Decoration.mark({ class: "cm-definition" })
const useMark = Decoration.mark({ class: "cm-use" })

const markNodePropsTheme = EditorView.baseTheme({
    ".cm-definition": { textDecoration: "2px solid underline blue" },
    ".cm-use": { textDecoration: "2px solid underline green" },
    ".cm-scope": { border: "2px solid red" }
})

export const markNodePropsPlugin = ViewPlugin.fromClass(class {
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

export const markNodeProps = [markNodePropsPlugin, markNodePropsTheme]

function createWidgets(view: EditorView): DecorationSet {
    let widgets: Range<Decoration>[] = []
    for (let { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from, to,
            enter: node => {
                let scopeProp = node.type.prop(scope)
                let useProp = node.type.prop(use)
                let definitionProp = node.type.prop(definition)
                if (scopeProp) {
                    widgets.push(ScopeWidget.create("[", node.from))
                }
                if (useProp) {
                    let widget = Decoration.mark(useMark).range(node.from, node.to)
                    widgets.push(widget)
                }
                if (definitionProp) {
                    let widget = Decoration.mark(definitionMark).range(node.from, node.to)
                    widgets.push(widget)
                }
            },
            leave: node => {
                let scopeProp = node.type.prop(scope)
                if (scopeProp) {
                    widgets.push(ScopeWidget.create("]", node.to))
                }
            }
        })
    }
    return Decoration.set(widgets)
}

class ScopeWidget extends WidgetType {
    private text: string

    constructor(text: string) {
        super()
        this.text = text
    }

    toDOM(view: EditorView): HTMLElement {
        let element = document.createElement("span")
        element.className = "cm-scope"
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