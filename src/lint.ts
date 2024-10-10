import { syntaxTree } from "@codemirror/language"
import { Action, Diagnostic, linter } from "@codemirror/lint"
import { EditorView } from "codemirror"
import { SyntaxNodeRef } from "@lezer/common"
import { Text } from "@codemirror/state"
import { DefinitionNode, ScopeNode, UseNode } from "./nodes"
import { definitionNode, scopeNode, useNode } from "./props"

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

export function unusedDefinition(c: DiagnosticContext) {
    let definitionNode = c.definitionNode
    if (definitionNode) {
        if (definitionNode.matchingUses(c.doc).length === 0) {
            c.hint(`'${c.text}' is never used`)
        }
    }
}

export function undefinedUse(c: DiagnosticContext) {
    let useNode = c.useNode
    if (useNode) {
        if (useNode.matchingDefinitions(c.doc).length === 0) {
            c.error(`'${c.text}' has not been defined`)
        }
    }
}

export function multipleDefinitions(c: DiagnosticContext) {
    let definitionNode = c.definitionNode
    if (definitionNode) {
        let scope = definitionNode.scope
        if (scope && scope.definitionsByText(c.doc).get(c.text)!.length > 1) {
            c.error(`'${c.text}' is defined more than once`)
        }
    }
}

export const alwaysOK = (c: DiagnosticContext) => { }

export const error = (message: string) => (c: DiagnosticContext) => {
    c.error(message)
}

export const warning = (message: string) => (c: DiagnosticContext) => {
    c.warning(message)
}

export const info = (message: string) => (c: DiagnosticContext) => {
    c.info(message)
}

export const hint = (message: string) => (c: DiagnosticContext) => {
    c.hint(message)
}

export const matchContext = (context: readonly string[], lint: NodeLinter) => (c: DiagnosticContext) => {
    if (c.nodeRef.matchContext(context)) {
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
