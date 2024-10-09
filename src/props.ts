import { NodeProp, SyntaxNode } from '@lezer/common'
import { DefinitionType, ScopeType, UseType } from './nodes'

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
            kv.get("rules") ?? []
        )
    }
})

export const use = new NodeProp<UseType>({
    deserialize(str) {
        let kv = parseKeyValues(str)
        return new UseType((kv.get("namespace") ?? ["identifier"])[0])
    }
})

// Parse key->value[] map from e.g. "k1:v1 v2,k2:v1 v2 v3"
function parseKeyValues(str: string): Map<string, readonly string[]> {
    return new Map(str.split(",")
        .map(kv => kv.split(":") as [string, string | undefined])
        .map(([k, v]) => [k, (v ?? "").split(" ") as readonly string[]])
    )
}