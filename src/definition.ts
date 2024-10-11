import { NodeProp, SyntaxNode, SyntaxNodeRef } from "@lezer/common"
import { Text } from "@codemirror/state"
import { Range } from "./range"
import { IdentifierNode, parsePropKeyValues, sameIdentifier } from "./nodes"
import { UseNode } from "./use"
import { Node } from "./nodes"

export const definition = new NodeProp<DefinitionType>({
    deserialize(str) {
        let kv = parsePropKeyValues(str)
        return new DefinitionType(
            (kv.get("namespace") || ["identifier"])[0],
            kv.has("overridePrevious"),
            kv.has("wholeScope"),
        )
    }
})

export function definitionNode(ref: SyntaxNodeRef): DefinitionNode | undefined {
    return ref.type.prop(definition)?.of(ref)
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

    conflictingDefinitions(doc: Text): readonly DefinitionNode[] {
        return this.scope?.conflictingDefinitions(doc, this) ?? []
    }

    withinScope(node: Node, sameNamedDefinitions: readonly DefinitionNode[]): boolean {
        if (!this.type.overridePrevious) return true
        if (node.before(this)) return false
        let nextRedefinition = sameNamedDefinitions.find(definition => definition.after(this))
        if (nextRedefinition) return node.before(nextRedefinition)
        return true
    }

    overrides(doc: Text, other: DefinitionNode): boolean {
        return this.type.overridePrevious && this.identifier(doc) == other.identifier(doc) && other.before(this)
    }
}
