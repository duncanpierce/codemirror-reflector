import { SyntaxNode, SyntaxNodeRef } from "@lezer/common"

export function searchTree<T>(nodeRef: SyntaxNodeRef, children: readonly string[] | undefined, searchFunc: (s: SyntaxNode) => (T | undefined)): readonly T[] {
    let node = nodeRef.node
    let c = children ? children.flatMap(type => node.getChildren(type)) : allChildren(node)
    return c.flatMap(child => searchSubTree(child, searchFunc))
}

function searchSubTree<T>(node: SyntaxNode, searchFunc: (s: SyntaxNode) => (T | undefined)): readonly T[] {
    let results = []
    let maybeResult = searchFunc(node)
    if (maybeResult) {
        results.push(maybeResult)
    }
    results.push(...allChildren(node).flatMap(child => searchSubTree(child, searchFunc)))
    return results
}

export function allChildren(node: SyntaxNode): readonly SyntaxNode[] {
    let children = []
    for (let d = node.firstChild; d; d = d.nextSibling) {
        children.push(d)
    }
    return children
}