import { SyntaxNode, SyntaxNodeRef } from "@lezer/common"
import { EditorSelection, SelectionRange, Text } from "@codemirror/state"
import { Range } from "./range"
import { scopeNode, ScopeNode } from "./scope"

export interface Identifier {
    identifier(doc: Text): string
}

export interface Node {
    readonly from: number
    readonly to: number
    readonly scope: ScopeNode | null
    readonly selectionRange: SelectionRange
    readonly range: Range
    before(other: Node): boolean
    after(other: Node): boolean
    equals(other: Node): boolean
}

export class BaseNode<T> implements Node {
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

    get selectionRange(): SelectionRange {
        return EditorSelection.range(this.from, this.to)
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

export const sameIdentifier = (doc: Text, id1: Identifier) => (id2: Identifier): boolean => {
    return id1.identifier(doc) == id2.identifier(doc)
}

export const differentNode = (node: Node) => (other: Node): boolean => {
    return !node.equals(other)
}

// Parse key->value[] map from e.g. "k1:v1 v2,k2:v1 v2 v3"
export function parsePropKeyValues(str: string): Map<string, readonly string[]> {
    return new Map(str.split(",")
        .map(kv => kv.split(":") as [string, string | undefined])
        .map(([k, v]) => [k, (v ?? "").split(" ") as readonly string[]])
    )
}
