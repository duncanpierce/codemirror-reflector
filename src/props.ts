import { NodeProp, SyntaxNode, SyntaxNodeRef } from '@lezer/common'
import { DefinitionNode, DefinitionType, ScopeNode, ScopeType, StructureNode, StructureType, UseNode, UseType } from './nodes'
import { Text } from "@codemirror/state"

export const scope = new NodeProp<ScopeType>({
    deserialize(str) {
        let kv = parseKeyValues(str)
        return new ScopeType(
            kv.get("namespaces") ?? ["identifier"],
            kv.get("definitions"),
            kv.get("uses")
        )
    }
})

export const definition = new NodeProp<DefinitionType>({
    deserialize(str) {
        let kv = parseKeyValues(str)
        return new DefinitionType(
            (kv.get("namespace") || ["identifier"])[0],
            kv.has("overridePrevious"),
            kv.has("wholeScope"),
        )
    }
})

export const use = new NodeProp<UseType>({
    deserialize(str) {
        let kv = parseKeyValues(str)
        return new UseType((kv.get("namespace") ?? ["identifier"])[0])
    }
})

export const structure = new NodeProp<StructureType>({
    deserialize(str) {
        return new StructureType()
    }
})


// Parse key->value[] map from e.g. "k1:v1 v2,k2:v1 v2 v3"
function parseKeyValues(str: string): Map<string, readonly string[]> {
    return new Map(str.split(",")
        .map(kv => kv.split(":") as [string, string | undefined])
        .map(([k, v]) => [k, (v ?? "").split(" ") as readonly string[]])
    )
}

export function scopeNode(ref: SyntaxNodeRef): ScopeNode | undefined {
    return ref.type.prop(scope)?.of(ref)
}

export function useNode(ref: SyntaxNodeRef): UseNode | undefined {
    return ref.type.prop(use)?.of(ref)
}

export function definitionNode(ref: SyntaxNodeRef): DefinitionNode | undefined {
    return ref.type.prop(definition)?.of(ref)
}

export function structureNode(ref: SyntaxNodeRef): StructureNode | undefined {
    return ref.type.prop(structure)?.of(ref)
}