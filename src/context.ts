import { Action, Diagnostic } from "@codemirror/lint"
import { SyntaxNodeRef, SyntaxNode } from "@lezer/common"
import { Text } from "@codemirror/state"
import { ScopeNode, scopeNode } from "./scope"
import { UseNode, useNode } from "./use"
import { DefinitionNode, definitionNode } from "./definition"


export type Severity = "hint" | "info" | "warning" | "error"
export type ContextualAction = (c: DiagnosticContext) => Action

export class DiagnosticContext {
    private _diagnostics: Diagnostic[] = []

    constructor(
        readonly doc: Text,
        readonly nodeRef: SyntaxNodeRef,
    ) { }

    get node(): SyntaxNode {
        return this.nodeRef.node
    }
    
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

    diagnostic(severity: Severity, message: string, actions: readonly ContextualAction[] = []): void {
        this._diagnostics.push({ from: this.nodeRef.from, to: this.nodeRef.to, message: message, severity: severity, actions: actions.map(a => a(this)) })
    }

    hint(message: string, actions: readonly ContextualAction[] = []): void {
        this.diagnostic("hint", message, actions)
    }

    info(message: string, actions: readonly ContextualAction[] = []): void {
        this.diagnostic("info", message, actions)
    }

    warning(message: string, actions: readonly ContextualAction[] = []): void {
        this.diagnostic("warning", message, actions)
    }

    error(message: string, actions: readonly ContextualAction[] = []): void {
        this.diagnostic("error", message, actions)
    }

    clearDiagnostics(): void {
        this._diagnostics = []
    }
}
