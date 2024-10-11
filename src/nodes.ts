import { SyntaxNode, SyntaxNodeRef } from "@lezer/common"
import { Text } from "@codemirror/state"
import { definitionNode, scopeNode, useNode } from "./props"
import { allChildren, searchParentScopes, searchSubTree, searchTree } from "./searchTree" 
import { Range } from "./range"

class BaseNode<T> implements Node {
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

    get node(): SyntaxNode {
        return this.nodeRef.node
    }

    get from(): number {
        return this.nodeRef.from
    }

    get to(): number {
        return this.nodeRef.to
    }

    before(other: Node) {
        return this.to <= other.from
    }

    after(other: Node) {
        return this.from >= other.to
    }

    get range(): Range {
        return new Range(this.from, this.to)
    }

    equals(other: Node): boolean {
        return this.from == other.from && this.to == other.to
    }
}

export class IdentifierNode<T> extends BaseNode<T> implements Identifier {
    identifier(doc: Text): string {
        return doc.sliceString(this.from, this.to)
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
    get inScopeRange(): Range {
        return new Range(this.from, this.to)
    }

    uses(doc: Text): readonly UseNode[] {
        return searchTree(this.nodeRef, this.type.usePaths, useNode, nestedScope => nestedScope.undefinedUses(doc))
    }

    undefinedUses(doc: Text): readonly UseNode[] {
        let undefinedUses = searchTree(this.nodeRef, this.type.usePaths, useNode, nestedScope => nestedScope.undefinedUses(doc))
        let definitions = this.definitionsByName(doc)
        return undefinedUses.filter(use => !definitions.has(use.identifier(doc)))
    }

    get definitions(): readonly DefinitionNode[] {
        return searchTree(this.nodeRef, this.type.definitionPaths, definitionNode, nestedScope => [])
    }

    nestedDefinitions(doc: Text): readonly DefinitionNode[] {
        return allChildren(this.node).flatMap(child => searchSubTree(child, definitionNode, scope => scope.nestedDefinitions(doc)))
    }

    definitionsByName(doc: Text): Map<string, readonly DefinitionNode[]> {
        return Map.groupBy(this.definitions, definition => definition.identifier(doc))
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

const sameName = (doc: Text, id1: Identifier) => (id2: Identifier): boolean => {
    return id1.identifier(doc) == id2.identifier(doc)
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

export class UseNode extends IdentifierNode<UseType> {
    matchingDefinitions(doc: Text): readonly DefinitionNode[] {
        return this.scope?.matchingDefinitions(this, doc) ?? []
    }
}

export class DefinitionType {
    constructor(
        readonly namespace: string,
        readonly overridePrevious: boolean,
        readonly wholeScope: boolean
    ) { }

    of(ref: SyntaxNodeRef): DefinitionNode {
        return new DefinitionNode(this, ref)
    }

    toString(): string {
        return `namespace:${this.namespace} redefines:${this.overridePrevious}`
    }
}

export class DefinitionNode extends IdentifierNode<DefinitionType> {
    matchingUses(doc: Text): readonly UseNode[] {
        return this.scope?.matchingUses(this, doc) ?? []
    }

    withinScope(node: Node, sameNamedDefinitions: readonly DefinitionNode[]): boolean {
        if (!this.type.overridePrevious) return true
        if (node.before(this)) return false
        let nextRedefinition = sameNamedDefinitions.find(definition => definition.after(this))
        if (nextRedefinition) return node.before(nextRedefinition)
        return true
    }

    inScopeRanges(doc: Text): readonly Range[] {
        let scope = this.scope
        if (!scope) return []
        if (this.type.wholeScope) return [scope.inScopeRange]
        let maybeOverridingDefinition = scope.definitions.find(otherDef => otherDef.overrides(doc, this))
        if (maybeOverridingDefinition) return [new Range(this.to, maybeOverridingDefinition.from)]
        return [new Range(this.from, scope.inScopeRange.to)]
    }

    inScopeRangesWithoutShadows(doc: Text): readonly Range[] {
        let ranges = this.inScopeRanges(doc)
        let shadowedRanges = this.shadowingDefinitions(doc).flatMap(d => d.inScopeRanges(doc))
        return ranges.flatMap(range => range.subtractAll(shadowedRanges))
    }

    shadowingDefinitions(doc: Text): readonly DefinitionNode[] {
        return this.scope?.nestedDefinitions(doc).filter(d => !d.equals(this) && sameName(doc, this)(d)) ?? []
    }

    overrides(doc: Text, other: DefinitionNode): boolean {
        return this.type.overridePrevious && this.identifier(doc) == other.identifier(doc) && other.before(this)
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

export interface Identifier {
    identifier(doc: Text): string
}

export interface Node {
    readonly from: number
    readonly to: number
    readonly scope: ScopeNode | null
    before(other: Node): boolean
    after(other: Node): boolean
}
