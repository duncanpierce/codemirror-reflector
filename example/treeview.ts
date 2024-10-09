import { SelectionRange, Text } from "@codemirror/state"
import { NodeProp, SyntaxNode } from "@lezer/common"
import { EditorView } from "@codemirror/view"
import { syntaxTree } from "@codemirror/language"
import { definition, scope, use } from "../src/props"


function visitTree(element: HTMLElement, doc: Text, mainSelection: SelectionRange, node: SyntaxNode, indent: number = 0) {
    let classes: string[] = []
    if (node.firstChild !== null) {
        classes.push("tree")
    }

    if (node.from < mainSelection.from && node.to > mainSelection.to) {
        classes.push('selection')
    }

    if (node.type.isError) {
        classes.push('error')
    }

    // Demo path matching
    if (node.matchContext(["SubExpression", ""])) {
        classes.push('context-match')
    }

    // Demo name/group matching (group in this case)
    if (node.type.is("Bracket")) {
        classes.push('bracket')
    }

    // Demo retrieving a node prop
    let prop = node.type.prop(NodeProp.openedBy)
    if (prop) {
        classes.push('has-prop')
    }

    // Demo getting children (using a group in this case)
    if (node.getChildren("Bracket")?.length) {
        classes.push('matching-children')
    }

    let content = doc.sliceString(node.from, node.to).replace(/\n/g, ' ↵ ')

    let scope = node.type.prop(scope)?.toString()
    let use = node.type.prop(use)?.toString()
    let definition = node.type.prop(definition)?.toString()
    let props = (scope !== undefined ? `scope=${scope}` : "") + (use !== undefined ? ` use=${use}` : "") + (definition !== undefined ? ` definition=${definition}` : "")

    element.innerHTML += `
    <div class="${classes.join(' ')}">
        <span class="indent">${'&nbsp;'.repeat(indent * 2)}</span>
        <span class="node-name">${node.name}</span>
        <span class="props">${props}</span>
        <span class="content">${content}</span>
    </div>`
    for (let child = node.firstChild; child; child = child.nextSibling) {
        visitTree(element, doc, mainSelection, child, indent + 1)
    }
}

export const treeView = (element: HTMLElement) => EditorView.updateListener.of((update) => {
    if (update.docChanged || update.selectionSet) {
        let tree = syntaxTree(update.state)
        element.innerHTML = ''
        visitTree(element, update.state.doc, update.state.selection.main, tree.topNode)
    }
})
