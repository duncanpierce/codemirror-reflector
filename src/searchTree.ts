import { SyntaxNode, SyntaxNodeRef } from "@lezer/common"
import { ScopeNode, StructureNode } from "./nodes"
import { scopeNode } from "./props"

export function searchParentScopes<T>(scope: ScopeNode, scopeFunc: (s: ScopeNode) => readonly T[]): readonly T[] {
    let search: ScopeNode | null = scope
    while (search) {
        let results = scopeFunc(search)
        if (results.length > 0) {
            return results
        }
        search = search.scope
    }
    return []
}

export function searchTree<T>(
    nodeRef: SyntaxNodeRef,
    children: readonly string[] | undefined,
    findFunc: (s: SyntaxNode) => (T | undefined),
    scopeFunc: (s: ScopeNode) => readonly T[]
): readonly T[] {
    let node = nodeRef.node
    let c = children ? children.flatMap(type => node.getChildren(type)) : allChildren(node)
    return c.flatMap(child => searchSubTree(child, findFunc, scopeFunc))
}

export function searchSubTree<T>(
    node: SyntaxNode,
    findFunc: (s: SyntaxNode) => (T | undefined),
    scopeFunc: (s: ScopeNode) => readonly T[]
): readonly T[] {
    let maybeScope = scopeNode(node)
    if (maybeScope) {
        return scopeFunc(maybeScope)
    }
    let results = []
    let maybeResult = findFunc(node)
    if (maybeResult) {
        results.push(maybeResult)
    }
    results.push(...allChildren(node).flatMap(child => searchSubTree(child, findFunc, scopeFunc)))
    return results
}

export function allChildren(node: SyntaxNode): readonly SyntaxNode[] {
    let children = []
    for (let d = node.firstChild; d; d = d.nextSibling) {
        children.push(d)
    }
    return children
}

export function findEnclosingNodeOfType(nodeType: string, nodeRef: SyntaxNodeRef): SyntaxNode | null {
    return findEnclosingNode(searchNode => searchNode.type.name === nodeType, nodeRef)
}

export function findEnclosingNode(found: (searchNode: SyntaxNodeRef) => boolean, nodeRef: SyntaxNodeRef): SyntaxNode | null {
    let search: SyntaxNode | null = nodeRef.node
    while (search) {
        if (found(search)) {
            return search
        }
        search = search.parent
    }
    return null
}
