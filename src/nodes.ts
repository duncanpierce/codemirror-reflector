import { SyntaxNodeRef } from "@lezer/common"
import { Text } from "@codemirror/state"
import { definitionNode, scopeNode, useNode } from "./props"
import { searchParentScopes, searchTree } from "./searchTree"

class BaseNode<T> {
    constructor(readonly type: T, readonly nodeRef: SyntaxNodeRef) { }

    get scope(): ScopeNode | null {
        let searchNode = this.nodeRef.node
        while (true) {
            let maybeParentNode = searchNode.parent
            if (maybeParentNode === null) {
                return null
            }
            let maybeScope = scopeNode(maybeParentNode)
            if (maybeScope) {
                return maybeScope
            }
            searchNode = maybeParentNode
        }
    }

    get from(): number {
        return this.nodeRef.from
    }

    get to(): number {
        return this.nodeRef.to
    }

    textIn(doc: Text): string {
        return doc.sliceString(this.from, this.to)
    }

    before(other: Range) {
        return this.to <= other.from
    }

    after(other: Range) {
        return this.from >= other.to
    }
}

export class ScopeType {
    constructor(
        readonly namespace: readonly string[],
        readonly definitionPaths: readonly string[] | undefined,
        readonly usePaths: readonly string[] | undefined
    ) { }

    of(ref: SyntaxNodeRef): ScopeNode {
        return new ScopeNode(this, ref)
    }

    toString(): string {
        return `namespaces:${this.namespace.join(" ")}${this.definitionPaths ? ` definitions:${this.definitionPaths.join(" ")}` : ""}${this.usePaths ? ` uses:${this.usePaths.join(" ")}` : ""}`
    }
}

export class ScopeNode extends BaseNode<ScopeType> {
    uses(doc: Text): readonly UseNode[] {
        return searchTree(this.nodeRef, this.type.usePaths, nodeRef => useNode(nodeRef), nestedScope => nestedScope.undefinedUses(doc))
    }

    undefinedUses(doc: Text): readonly UseNode[] {
        let undefinedUses = searchTree(this.nodeRef, this.type.usePaths, nodeRef => useNode(nodeRef), nestedScope => nestedScope.undefinedUses(doc))
        let definitions = this.definitionsByName(doc)
        return undefinedUses.filter(use => !definitions.has(use.textIn(doc)))
    }

    get definitions(): readonly DefinitionNode[] {
        return searchTree(this.nodeRef, this.type.definitionPaths, nodeRef => definitionNode(nodeRef), nestedScope => [])
    }

    definitionsByName(doc: Text): Map<string, readonly DefinitionNode[]> {
        return Map.groupBy(this.definitions, definition => definition.textIn(doc))
    }

    matchingDefinitions(use: UseNode, doc: Text): readonly DefinitionNode[] {
        return searchParentScopes(this, scope => {
            let relevantDefinitions = scope.definitions.filter(sameName(doc, use))
            return relevantDefinitions.filter(definition => definition.withinScope(use, relevantDefinitions))
        })
    }

    matchingUses(definition: DefinitionNode, doc: Text): readonly UseNode[] {
        return searchParentScopes(this, scope => {
            let relevantDefinitions = scope.definitions.filter(sameName(doc, definition))
            return scope.uses(doc).filter(sameName(doc, definition)).filter(use => definition.withinScope(use, relevantDefinitions))
        })
    }
}

const sameName = (doc: Text, a: Range) => (b: Range): boolean => {
    return doc.sliceString(a.from, a.to) == doc.sliceString(b.from, b.to)
}

export class UseType {
    constructor(readonly namespace: string) { }

    of(ref: SyntaxNodeRef): UseNode {
        return new UseNode(this, ref)
    }

    toString(): string {
        return `namespace:${this.namespace}`
    }
}

export class UseNode extends BaseNode<UseType> {
    matchingDefinitions(doc: Text): readonly DefinitionNode[] {
        return this.scope?.matchingDefinitions(this, doc) ?? []
    }
}

export class DefinitionType {
    constructor(
        readonly namespace: string,
        readonly redefines: boolean
    ) { }

    of(ref: SyntaxNodeRef): DefinitionNode {
        return new DefinitionNode(this, ref)
    }

    toString(): string {
        return `namespace:${this.namespace} redefines:${this.redefines}`
    }
}

export class DefinitionNode extends BaseNode<DefinitionType> {
    matchingUses(doc: Text): readonly UseNode[] {
        return this.scope?.matchingUses(this, doc) ?? []
    }

    withinScope(use: UseNode, peers: readonly DefinitionNode[]): boolean {
        if (!this.type.redefines) return true
        if (use.before(this)) return false
        let nextRedefinition = peers.find(definition => definition.after(this))
        if (nextRedefinition) return use.before(nextRedefinition)
        return true
    }
}

export class StructureType {
    of(ref: SyntaxNodeRef): StructureNode {
        return new StructureNode(this, ref)
    }

    toString(): string {
        return "structure"
    }
}

export class StructureNode extends BaseNode<StructureType> { }

export interface Range {
    readonly from: number,
    readonly to: number
}
