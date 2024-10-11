import { syntaxTree } from "@codemirror/language"
import { Action, Diagnostic, linter } from "@codemirror/lint"
import { EditorView } from "codemirror"
import { findEnclosingNodeOfType, Locator } from "./searchTree"
import { ContextualAction, DiagnosticContext } from "./context"
import { SyntaxNodeRef } from "@lezer/common"


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

export const unusedDefinition = (...actions: readonly ContextualAction[]) => (c: DiagnosticContext) => {
    let definitionNode = c.definitionNode
    if (definitionNode) {
        if (definitionNode.matchingUses(c.doc).length === 0) {
            c.hint(`'${c.text}' is never used`, actions)
        }
    }
}

export const undefinedUse = (...actions: readonly ContextualAction[]) => (c: DiagnosticContext) => {
    let useNode = c.useNode
    if (useNode) {
        if (useNode.matchingDefinitions(c.doc).length === 0) {
            c.error(`'${c.text}' has not been defined`, actions)
        }
    }
}

export const multipleDefinitions = (...actions: readonly ContextualAction[]) => (c: DiagnosticContext) => {
    let definitionNode = c.definitionNode
    if (definitionNode) {
        if (definitionNode.conflictingDefinitions(c.doc).length > 1) {
            c.error(`'${c.text}' is defined more than once`, actions)
        }
    }
}

export const alwaysOK = (c: DiagnosticContext) => { }

export const error = (message: string, ...actions: readonly ContextualAction[]) => (c: DiagnosticContext) => {
    c.error(message, actions)
}

export const warning = (message: string, ...actions: readonly ContextualAction[]) => (c: DiagnosticContext) => {
    c.warning(message, actions)
}

export const info = (message: string, ...actions: readonly ContextualAction[]) => (c: DiagnosticContext) => {
    c.info(message, actions)
}

export const hint = (message: string, ...actions: readonly ContextualAction[]) => (c: DiagnosticContext) => {
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

export const remove = (locate: Locator, name: string) => (c:DiagnosticContext): Action => {
    return {
        name,
        apply: function (view: EditorView, from: number, to: number): void {
            let node = locate(c.nodeRef)
            if (node) view.dispatch(view.state.update({ changes: { from: node.from, to: node.to, insert: "" } }))
        }
    }
}

export const insertBefore = (nodeType: string, template: string, name: string) => (c: DiagnosticContext): Action => {
    return {
        name,
        apply: function (view: EditorView, from: number, to: number): void {
            let node = findEnclosingNodeOfType(nodeType, c.nodeRef)
            if (node) view.dispatch(view.state.update({ changes: { from: node.from, insert: template.replaceAll("$$", c.text) } }))
        }
    }
}

// export const insertParameter = (nodeType: string, name: string) => (c: DiagnosticContext): Action => {
//     return {
//         name,
//         apply: function (view: EditorView, from: number, to: number): void {
//             let tree = syntaxTree(view.state)
//             let node = findEnclosingNodeOfType(nodeType, tree.resolve(from, 1))
//             if (node) view.dispatch(view.state.update({ changes: { from: node.from, insert: template.replaceAll("$$", c.text) } }))
//         }
//     }
// }

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
