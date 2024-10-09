import { SyntaxNodeRef } from "@lezer/common"
import { Text } from "@codemirror/state"
import { definition, definitionNode, scopeNode, useNode } from "./props"
import { searchTree } from "./searchTree"


class BaseNode<T> {
    readonly nodeRef: SyntaxNodeRef
    readonly doc: Text
    readonly type: T

    constructor(type: T, ref: SyntaxNodeRef, doc: Text) {
        this.type = type
        this.nodeRef = ref
        this.doc = doc
    }

    get scope(): ScopeNode | null {
        let searchNode = this.nodeRef.node
        while (true) {
            let maybeParentNode = searchNode.parent
            if (maybeParentNode === null) {
                return null
            }
            let maybeScope = scopeNode(maybeParentNode, this.doc)
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

    get text(): string {
        return this.doc.sliceString(this.from, this.to)
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

    of(ref: SyntaxNodeRef, doc: Text): ScopeNode {
        return new ScopeNode(this, ref, doc)
    }

    toString(): string {
        return `namespaces:${this.namespace.join(" ")}${this.definitionPaths ? ` definitions:${this.definitionPaths.join(" ")}` : ""}${this.usePaths ? ` uses:${this.usePaths.join(" ")}` : ""}`
    }
}

export class ScopeNode extends BaseNode<ScopeType> {

    constructor(type: ScopeType, ref: SyntaxNodeRef, doc: Text) {
        super(type, ref, doc)
    }

    get uses(): readonly UseNode[] {
        return []
    }

    get definitions(): readonly DefinitionNode[] {
        return []
    }

    matchingDefinitions(use: UseNode): readonly DefinitionNode[] {
        let text = use.text
        let results = searchTree<DefinitionNode>(this.nodeRef, this.type.definitionPaths, nodeRef => {
            let d = definitionNode(nodeRef, this.doc)
            return d && d.text === text ? d : undefined
        })
        console.log(results)
        return results
    }

    matchingUses(definition: DefinitionNode): readonly UseNode[] {
        let text = definition.text
        let results = searchTree<UseNode>(this.nodeRef, this.type.definitionPaths, nodeRef => {
            let u = useNode(nodeRef, this.doc)
            return u && u.text === text ? u : undefined
        })
        console.log(results)
        return results
    }
}

export class UseType {
    private namespace: string

    constructor(namespace: string) {
        this.namespace = namespace
    }

    of(ref: SyntaxNodeRef, doc: Text): UseNode {
        return new UseNode(this, ref, doc)
    }

    toString(): string {
        return `namespace:${this.namespace}`
    }
}

export class UseNode extends BaseNode<UseType> {

    constructor(type: UseType, ref: SyntaxNodeRef, doc: Text) {
        super(type, ref, doc)
    }

    get matchingDefinitions(): readonly DefinitionNode[] {
        // TODO try parent scopes if not found in the first one
        return this.scope?.matchingDefinitions(this) ?? []
    }
}

export class DefinitionType {
    readonly namespace: string
    readonly rules: readonly string[]

    constructor(namespace: string, rules: readonly string[]) {
        this.namespace = namespace
        this.rules = rules
    }

    of(ref: SyntaxNodeRef, doc: Text): DefinitionNode {
        return new DefinitionNode(this, ref, doc)
    }

    toString(): string {
        return `namespace:${this.namespace} rules:${this.rules.join(" ")}`
    }
}

export class DefinitionNode extends BaseNode<DefinitionType> {

    constructor(type: DefinitionType, ref: SyntaxNodeRef, doc: Text) {
        super(type, ref, doc)
    }

    // All the document ranges in which this definition is in scope
    get allInScopeRanges(): readonly Range[] {
        return []
    }

    get matchingUses(): readonly UseNode[] {
        // TODO try parent scopes if not found in the first one
        return this.scope?.matchingUses(this) ?? []
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

