import { NodeProp } from '@lezer/common'

export class Scope {
    private namespaces: readonly string[]
    private definitionChildren: readonly string[] | undefined
    private useChildren: readonly string[] | undefined

    constructor(namespaces: readonly string[], definitionChildren: readonly string[] | undefined, useChildren: readonly string[] | undefined) {
        this.namespaces = namespaces
        this.definitionChildren = definitionChildren
        this.useChildren = useChildren
    }

    toString(): string {
        return `namespaces:${this.namespaces.join(" ")}${this.definitionChildren ? ` definitions:${this.definitionChildren.join(" ")}` : ""}${this.useChildren ? ` uses:${this.useChildren.join(" ")}` : ""}`
    }
}

export class Use {
    private namespace: string

    constructor(namespace: string) {
        this.namespace = namespace
    }

    toString(): string {
        return `namespace:${this.namespace}`
    }
}

export class Definition {
    private namespace: string
    private rules: readonly string[]

    constructor(namespace: string, rules: readonly string[]) {
        this.namespace = namespace
        this.rules = rules
    }

    toString(): string {    
        return `namespace:${this.namespace} rules:${this.rules.join(" ")}`
    }
}

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