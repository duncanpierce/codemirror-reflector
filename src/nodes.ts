import { SyntaxNode } from "@lezer/common"

export class Scope {
    readonly namespace: readonly string[]
    readonly definitionPaths: readonly string[] | undefined
    readonly usePaths: readonly string[] | undefined

    constructor(namespace: readonly string[], definitionPaths: readonly string[] | undefined, usePaths: readonly string[] | undefined) {
        this.namespace = namespace
        this.definitionPaths = definitionPaths
        this.usePaths = usePaths
    }

    of(node: SyntaxNode, doc: Text): ScopeNode {
        return new ScopeNode(this, node, doc)
    }

    toString(): string {
        return `namespaces:${this.namespace.join(" ")}${this.definitionPaths ? ` definitions:${this.definitionPaths.join(" ")}` : ""}${this.usePaths ? ` uses:${this.usePaths.join(" ")}` : ""}`
    }
}

export class ScopeNode {
    readonly node: SyntaxNode
    readonly doc: Text
    readonly scope: Scope

    constructor(scope: Scope, node: SyntaxNode, doc: Text) {
        this.scope = scope
        this.node = node
        this.doc = doc
    }

    get allUses(): readonly UseNode[] {
        return []
    }

    get visibleUses(): readonly UseNode[] {
        return []
    }

    get allDefinitions(): readonly DefinitionNode[] {
        return []
    }

    get visibleDefinitions(): readonly DefinitionNode[] {
        return []
    }
}

export class Use {
    private namespace: string

    constructor(namespace: string) {
        this.namespace = namespace
    }

    of(node: SyntaxNode, doc: Text): UseNode {
        return new UseNode(this, node, doc)
    }

    toString(): string {
        return `namespace:${this.namespace}`
    }
}

export class UseNode {
    readonly node: SyntaxNode
    readonly doc: Text
    readonly use: Use

    constructor(use: Use, node: SyntaxNode, doc: Text) {
        this.use = use
        this.node = node
        this.doc = doc
    }

    get allDefinitions(): readonly DefinitionNode[] {
        return []
    }

    get visibleDefinitions(): readonly DefinitionNode[] {
        return []
    }
}

export class Definition {
    readonly namespace: string
    readonly rules: readonly string[]

    constructor(namespace: string, rules: readonly string[]) {
        this.namespace = namespace
        this.rules = rules
    }

    of(node: SyntaxNode, doc: Text): DefinitionNode {
        return new DefinitionNode(this, node, doc)
    }

    toString(): string {    
        return `namespace:${this.namespace} rules:${this.rules.join(" ")}`
    }
}

export class DefinitionNode {
    readonly node: SyntaxNode
    readonly doc: Text
    readonly definition: Definition

    constructor(definition: Definition, node: SyntaxNode, doc: Text) {
        this.definition = definition
        this.node = node
        this.doc = doc
    }

    // All the document ranges in which this definition is in scope
    get allInScopeRanges(): readonly Range[] {
        return []
    }

    get allUses(): readonly UseNode[] {
        return []
    }

    get visibleUses(): readonly UseNode[] {
        return []
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
