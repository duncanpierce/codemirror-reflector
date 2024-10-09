import { NodeProp, SyntaxNode } from '@lezer/common'
import { Definition, Scope, Use } from './nodes'

export const scope = new NodeProp<Scope>({
    deserialize(str) {
        let kv = parseKeyValues(str)
        return new Scope(
            kv.get("namespaces") ?? ["identifier"],
            kv.get("definitions"),
            kv.get("uses")
        )
    }
})

export const definition = new NodeProp<Definition>({
    deserialize(str) {
        let kv = parseKeyValues(str)
        return new Definition(
            (kv.get("namespace") || ["identifier"])[0],
            kv.get("rules") ?? []
        )
    }
})

export const use = new NodeProp<Use>({
    deserialize(str) {
        let kv = parseKeyValues(str)
        return new Use((kv.get("namespace") ?? ["identifier"])[0])
    }
})

// Parse key->value[] map from e.g. "k1:v1 v2,k2:v1 v2 v3"
function parseKeyValues(str: string): Map<string, readonly string[]> {
    return new Map(str.split(",")
        .map(kv => kv.split(":") as [string, string | undefined])
        .map(([k, v]) => [k, (v ?? "").split(" ") as readonly string[]])
    )
}