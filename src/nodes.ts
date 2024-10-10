import { SyntaxNodeRef } from "@lezer/common"
import { Text } from "@codemirror/state"
import { definition, definitionNode, scopeNode, useNode } from "./props"
import { searchParentScopes, searchTree } from "./searchTree"


class BaseNode<T> {
    constructor(readonly type: T, readonly nodeRef: SyntaxNodeRef) {}

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
}

export class ScopeType {
    readonly namespace: readonly string[]
    readonly definitionPaths: readonly string[] | undefined
    readonly usePaths: readonly string[] | undefined

    constructor(namespace: readonly string[], definitionPaths: readonly string[] | undefined, usePaths: readonly string[] | undefined) {
        this.namespace = namespace
        this.definitionPaths = definitionPaths
        this.usePaths = usePaths
    }

    of(ref: SyntaxNodeRef): ScopeNode {
        return new ScopeNode(this, ref)
    }

    toString(): string {
        return `namespaces:${this.namespace.join(" ")}${this.definitionPaths ? ` definitions:${this.definitionPaths.join(" ")}` : ""}${this.usePaths ? ` uses:${this.usePaths.join(" ")}` : ""}`
    }
}

export class ScopeNode extends BaseNode<ScopeType> {

    constructor(type: ScopeType, ref: SyntaxNodeRef) {
        super(type, ref)
    }

    uses(doc: Text): readonly UseNode[] {
        return searchTree(this.nodeRef, this.type.usePaths, nodeRef => useNode(nodeRef), nestedScope => nestedScope.undefinedUses(doc))
    }

    undefinedUses(doc: Text): readonly UseNode[] {
        let undefinedUses = searchTree(this.nodeRef, this.type.usePaths, nodeRef => useNode(nodeRef), nestedScope => nestedScope.undefinedUses(doc))
        let definitions = Map.groupBy(this.definitions, definition => definition.textIn(doc))
        return undefinedUses.filter(use => !definitions.has(use.textIn(doc)))
    }

    get definitions(): readonly DefinitionNode[] {
        return searchTree(this.nodeRef, this.type.definitionPaths, nodeRef => definitionNode(nodeRef), nestedScope => [])
    }

    matchingDefinitions(use: UseNode, doc: Text): readonly DefinitionNode[] {
        let text = use.textIn(doc)
        return searchParentScopes(this, scope => scope.definitions.filter(d => d.textIn(doc) === text))
    }

    matchingUses(definition: DefinitionNode, doc: Text): readonly UseNode[] {
        let text = definition.textIn(doc)
        return searchParentScopes(this, scope => scope.uses(doc).filter(d => d.textIn(doc) === text))
    }
}

export class UseType {
    private namespace: string

    constructor(namespace: string) {
        this.namespace = namespace
    }

    of(ref: SyntaxNodeRef): UseNode {
        return new UseNode(this, ref)
    }

    toString(): string {
        return `namespace:${this.namespace}`
    }
}

export class UseNode extends BaseNode<UseType> {

    constructor(type: UseType, ref: SyntaxNodeRef) {
        super(type, ref)
    }

    matchingDefinitions(doc: Text): readonly DefinitionNode[] {
        return this.scope?.matchingDefinitions(this, doc) ?? []
    }
}

export class DefinitionType {
    readonly namespace: string
    readonly rules: readonly string[]

    constructor(namespace: string, rules: readonly string[]) {
        this.namespace = namespace
        this.rules = rules
    }

    of(ref: SyntaxNodeRef): DefinitionNode {
        return new DefinitionNode(this, ref)
    }

    toString(): string {
        return `namespace:${this.namespace} rules:${this.rules.join(" ")}`
    }
}

export class DefinitionNode extends BaseNode<DefinitionType> {

    constructor(type: DefinitionType, ref: SyntaxNodeRef) {
        super(type, ref)
    }

    matchingUses(doc: Text): readonly UseNode[] {
        return this.scope?.matchingUses(this, doc) ?? []
    }
}

export class Range {
    readonly from: number
    readonly to: number

    constructor(from: number, to: number) {
        this.from = from
        this.to = to
    }
}

