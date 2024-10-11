import { NodeProp, SyntaxNode, SyntaxNodeRef } from "@lezer/common"
import { BaseNode, parsePropKeyValues, sameName } from "./nodes"
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

    uses(doc: Text): readonly UseNode[] {
        return searchTree(this.nodeRef, this.type.usePaths, useNode, nestedScope => nestedScope.undefinedUses(doc))
    }

    undefinedUses(doc: Text): readonly UseNode[] {
        let undefinedUses = searchTree(this.nodeRef, this.type.usePaths, useNode, nestedScope => nestedScope.undefinedUses(doc))
        let definitions = this.definitionsByName(doc)
        return undefinedUses.filter(use => !definitions.has(use.identifier(doc)))
    }

    get definitions(): readonly DefinitionNode[] {
        return searchTree(this.nodeRef, this.type.definitionPaths, definitionNode, nestedScope => [])
    }

    nestedDefinitions(doc: Text): readonly DefinitionNode[] {
        return allChildren(this.node).flatMap(child => searchSubTree(child, definitionNode, scope => scope.nestedDefinitions(doc)))
    }

    definitionsByName(doc: Text): Map<string, readonly DefinitionNode[]> {
        return Map.groupBy(this.definitions, definition => definition.identifier(doc))
    }

    matchingDefinitions(use: UseNode, doc: Text): readonly DefinitionNode[] {
        return searchParentScopes(this, scope => {
            let relevantDefinitions = scope.definitions.filter(sameName(doc, use))
            return relevantDefinitions.filter(definition => definition.withinScope(use, relevantDefinitions))
        })
    }

    matchingUses(definition: DefinitionNode, doc: Text): readonly UseNode[] {
        return searchParentScopes(this, scope => {
            let relevantDefinitions = scope.definitions.filter(sameName(doc, definition))
            return scope.uses(doc).filter(sameName(doc, definition)).filter(use => definition.withinScope(use, relevantDefinitions))
        })
    }
}
