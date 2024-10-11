import { NodeProp, SyntaxNode, SyntaxNodeRef } from "@lezer/common"
import { Text } from "@codemirror/state"
import { IdentifierNode, parsePropKeyValues } from "./nodes"
import { DefinitionNode } from "./definition"

export const use = new NodeProp<UseType>({
    deserialize(str) {
        let kv = parsePropKeyValues(str)
        return new UseType((kv.get("namespace") ?? ["identifier"])[0])
    }
})

export function useNode(ref: SyntaxNodeRef): UseNode | undefined {
    return ref.type.prop(use)?.of(ref)
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
