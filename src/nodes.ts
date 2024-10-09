import { SyntaxNodeRef } from "@lezer/common"
import { Text } from "@codemirror/state"

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

export class ScopeNode {
    readonly nodeRef: SyntaxNodeRef
    readonly doc: Text
    readonly type: ScopeType

    constructor(type: ScopeType, ref: SyntaxNodeRef, doc: Text) {
        this.type = type
        this.nodeRef = ref
        this.doc = doc
    }

    get parentScope(): ScopeNode | null {
        return null
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

export class UseNode {
    readonly nodeRef: SyntaxNodeRef
    readonly doc: Text
    readonly type: UseType

    constructor(type: UseType, ref: SyntaxNodeRef, doc: Text) {
        this.type = type
        this.nodeRef = ref
        this.doc = doc
    }

    get allDefinitions(): readonly DefinitionNode[] {
        return []
    }

    get visibleDefinitions(): readonly DefinitionNode[] {
        return []
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

export class DefinitionNode {
    readonly nodeRef: SyntaxNodeRef
    readonly doc: Text
    readonly type: DefinitionType

    constructor(type: DefinitionType, ref: SyntaxNodeRef, doc: Text) {
        this.type = type
        this.nodeRef = ref
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

