import { syntaxTree } from "@codemirror/language"
import { Action, Diagnostic, linter } from "@codemirror/lint"
import { EditorView } from "codemirror"
import { SyntaxNodeRef } from "@lezer/common"
import { Text } from "@codemirror/state"
import { DefinitionNode, ScopeNode, UseNode } from "./nodes"
import { definitionNode, scopeNode, useNode } from "./props"
import { findEnclosingNodeOfType, findEnclosingStructure } from "./searchTree"

export const lintStructure = (spec: LintSpec) => linter((view: EditorView): readonly Diagnostic[] => {
    let diagnostics: Diagnostic[] = []
    let nodeLinters = new Map<string, NodeLinter>()
    if (spec.nodeTypes) {
        for (let nodeName in spec.nodeTypes) {
            nodeLinters.set(nodeName, spec.nodeTypes[nodeName])
        }
    }

    syntaxTree(view.state).iterate({
        enter: nodeRef => {
            const specificLinter = nodeRef.type.isError && spec.errorNodes ? spec.errorNodes : nodeLinters.get(nodeRef.type.name) ?? alwaysOK
            const generalLinter = spec.allNodes ?? alwaysOK;
            [specificLinter, generalLinter].forEach(lint => {
                let c = new DiagnosticContext(view.state.doc, nodeRef.node)
                lint(c)
                diagnostics.push(...c.diagnostics)
            })
        }
    })
    return diagnostics
})

export const unusedDefinition = (...actions: readonly Action[]) => (c: DiagnosticContext) => {
    let definitionNode = c.definitionNode
    if (definitionNode) {
        if (definitionNode.matchingUses(c.doc).length === 0) {
            c.hint(`'${c.text}' is never used`, actions)
        }
    }
}

export const undefinedUse = (...actions: readonly Action[]) => (c: DiagnosticContext) => {
    let useNode = c.useNode
    if (useNode) {
        if (useNode.matchingDefinitions(c.doc).length === 0) {
            c.error(`'${c.text}' has not been defined`, actions)
        }
    }
}

export const multipleDefinitions = (...actions: readonly Action[]) => (c: DiagnosticContext) => {
    let definitionNode = c.definitionNode
    if (definitionNode) {
        let scope = definitionNode.scope
        if (scope && scope.definitionsByName(c.doc).get(c.text)!.length > 1) {
            c.error(`'${c.text}' is defined more than once`, actions)
        }
    }
}

export const alwaysOK = (c: DiagnosticContext) => { }

export const error = (message: string, ...actions: readonly Action[]) => (c: DiagnosticContext) => {
    c.error(message, actions)
}

export const warning = (message: string, ...actions: readonly Action[]) => (c: DiagnosticContext) => {
    c.warning(message, actions)
}

export const info = (message: string, ...actions: readonly Action[]) => (c: DiagnosticContext) => {
    c.info(message, actions)
}

export const hint = (message: string, ...actions: readonly Action[]) => (c: DiagnosticContext) => {
    c.hint(message, actions)
}

export const matchContext = (context: readonly string[], lint: NodeLinter) => (c: DiagnosticContext) => {
    if (c.nodeRef.matchContext(context)) {
        lint(c)
    }
}

export const following = (nodeType: string, lint: NodeLinter) => (c: DiagnosticContext) => {
    if (c.nodeRef.node.prevSibling?.type.is(nodeType)) {
        lint(c)
    }
}

export const first = (...linters: readonly NodeLinter[]) => stepThrough(c => c.hasDiagnostics, ...linters)
export const all = (...linters: readonly NodeLinter[]) => stepThrough(c => false, ...linters)

export const stepThrough = (stop: (c: DiagnosticContext) => boolean, ...linters: readonly NodeLinter[]) => (c: DiagnosticContext) => {
    for (let lint of linters) {
        lint(c)
        if (stop(c)) return
    }
}

export function remove(nodeType: string, name: string): Action {
    return {
        name,
        apply: function (view: EditorView, from: number, to: number): void {
            let tree = syntaxTree(view.state)
            let node = findEnclosingNodeOfType(nodeType, tree.resolve(from, 1))
            if (node) view.dispatch(view.state.update({ changes: { from: node.from, to: node.to, insert: "" } }))
        }
    }
}

export const removeStructure: Action = {
    name: "Remove",
    apply: function (view: EditorView, from: number, to: number): void {
        let tree = syntaxTree(view.state)
        let node = findEnclosingStructure(tree.resolve(from, 1))
        if (node) view.dispatch(view.state.update({ changes: { from: node.from, to: node.to, insert: "" } }))
    }
}

export type Severity = "hint" | "info" | "warning" | "error"

export class DiagnosticContext {
    private _diagnostics: Diagnostic[] = []

    constructor(
        readonly doc: Text,
        readonly nodeRef: SyntaxNodeRef,
    ) { }

    get text(): string {
        return this.doc.sliceString(this.nodeRef.from, this.nodeRef.to)
    }

    get scopeNode(): ScopeNode | undefined {
        return scopeNode(this.nodeRef)
    }

    get useNode(): UseNode | undefined {
        return useNode(this.nodeRef)
    }

    get definitionNode(): DefinitionNode | undefined {
        return definitionNode(this.nodeRef)
    }

    get diagnostics(): readonly Diagnostic[] {
        return this._diagnostics
    }

    get hasDiagnostics(): boolean {
        return this._diagnostics.length > 0
    }

    diagnostic(severity: Severity, message: string, actions: readonly Action[] = []): void {
        this._diagnostics.push({ from: this.nodeRef.from, to: this.nodeRef.to, message: message, severity: severity, actions: actions })
    }

    hint(message: string, actions: readonly Action[] = []): void {
        this.diagnostic("hint", message, actions)
    }

    info(message: string, actions: readonly Action[] = []): void {
        this.diagnostic("info", message, actions)
    }

    warning(message: string, actions: readonly Action[] = []): void {
        this.diagnostic("warning", message, actions)
    }

    error(message: string, actions: readonly Action[] = []): void {
        this.diagnostic("error", message, actions)
    }

    clearDiagnostics(): void {
        this._diagnostics = []
    }
}

export type NodeLinter = (item: DiagnosticContext) => void

export interface LintSpec {
    readonly defaultSyntaxErrorMessage?: string
    readonly allNodes?: NodeLinter,
    readonly errorNodes?: NodeLinter,
    readonly nodeTypes?: { [nodeType: string]: NodeLinter }
}

export interface NodeLintSpec {
    readonly context?: readonly string[]
    readonly linter?: NodeLinter
}
