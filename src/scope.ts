import { NodeProp, SyntaxNode, SyntaxNodeRef } from "@lezer/common"
import { BaseNode, differentNode, parsePropKeyValues, sameIdentifier } from "./nodes"
import { allChildren, searchParentScopes, searchSubTree, searchTree } from "./searchTree"
import { Range } from "./range"
import { Text } from "@codemirror/state"
import { UseNode, useNode } from "./use"
import { definitionNode, DefinitionNode } from "./definition"

export const scope = new NodeProp<ScopeType>({
    deserialize(str) {
        let kv = parsePropKeyValues(str)
        return new ScopeType(
            kv.get("namespaces") ?? ["identifier"],
            kv.get("definitions"),
            kv.get("uses")
        )
    }
})

export function scopeNode(ref: SyntaxNodeRef): ScopeNode | undefined {
    return ref.type.prop(scope)?.of(ref)
}

export class ScopeType {
    constructor(
        readonly namespace: readonly string[],
        readonly definitionPaths: readonly string[] | undefined,
        readonly usePaths: readonly string[] | undefined
    ) { }

    of(ref: SyntaxNodeRef): ScopeNode {
        return new ScopeNode(this, ref)
    }

    toString(): string {
        return `namespaces:${this.namespace.join(" ")}${this.definitionPaths ? ` definitions:${this.definitionPaths.join(" ")}` : ""}${this.usePaths ? ` uses:${this.usePaths.join(" ")}` : ""}`
    }
}

export class ScopeNode extends BaseNode<ScopeType> {
    get inScopeRange(): Range {
        return new Range(this.from, this.to)
    }

    matchingDefinitions(use: UseNode, doc: Text): readonly DefinitionNode[] {
        return searchParentScopes(this, scope => {
            let sameIdentifierDefinitions = scope.allDefinitions.filter(sameIdentifier(doc, use))
            return sameIdentifierDefinitions.filter(definition => definition.withinScope(use, sameIdentifierDefinitions))
        })
    }

    availableDefinitionIdentifiers(doc: Text): Set<string> {
        let results: string[] = []
        let search: ScopeNode | null = this
        while (search) {
            results.push(...search.allDefinitions.map(d => d.identifier(doc)))
            search = search.scope
        }
        return new Set<string>(results)
    }

    get allDefinitions(): readonly DefinitionNode[] {
        return searchTree(this.nodeRef, this.type.definitionPaths, definitionNode)
    }

    get usesDirectlyInThisScope(): readonly UseNode[] {
        return searchTree(this.nodeRef, this.type.usePaths, useNode, nestedScope => [])
    }

    matchingUses(definition: DefinitionNode, doc: Text): readonly UseNode[] {
        return searchTree(this.nodeRef, this.type.usePaths, useNode)
            .filter(sameIdentifier(doc, definition))
            .filter(use => use.matchingDefinitions(doc).some(d => d.equals(definition)))
    }

    conflictingDefinitions(doc: Text, definition: DefinitionNode): readonly DefinitionNode[] {
        let sameIdentifierDefinitions = this.allDefinitions.filter(sameIdentifier(doc, definition))
        return sameIdentifierDefinitions.filter(d => d.withinScope(definition, sameIdentifierDefinitions))
    }
}
