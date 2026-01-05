import { Extension } from '@tiptap/core'
import { Transaction, EditorState } from '@tiptap/pm/state'
import { Node } from '@tiptap/pm/model'

export interface IndentOptions {
    types: string[]
    minLevel: number
    maxLevel: number
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        indent: {
            indent: () => ReturnType
            outdent: () => ReturnType
        }
    }
}

export const Indent = Extension.create<IndentOptions>({
    name: 'indent',

    addOptions() {
        return {
            types: ['paragraph', 'heading', 'listItem'],
            minLevel: 0,
            maxLevel: 8,
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    indent: {
                        default: 0,
                        renderHTML: (attributes) => {
                            if (attributes.indent === 0) {
                                return {}
                            }
                            return {
                                style: `margin-left: ${attributes.indent * 2}em`,
                            }
                        },
                        parseHTML: (element) => {
                            const marginLeft = element.style.marginLeft
                            return marginLeft ? parseInt(marginLeft) / 2 : 0
                        },
                    },
                },
            },
        ]
    },

    addCommands() {
        return {
            indent:
                () =>
                    ({ tr, state, dispatch }: { tr: Transaction; state: EditorState; dispatch: ((tr: Transaction) => void) | undefined }) => {
                        const { selection } = state
                        tr.setSelection(selection)
                        tr.doc.nodesBetween(selection.from, selection.to, (node: Node, pos: number) => {
                            if (this.options.types.includes(node.type.name)) {
                                const indent = node.attrs.indent || 0
                                if (indent < this.options.maxLevel) {
                                    if (node.type.name === 'listItem') {
                                        // Delegate to sinkListItem behavior or just add margin?
                                        // For simplicity in this "hackathon" speed mode, we just add the attribute
                                        // But often list items need specific sinkListItem command. 
                                        // We will rely on the margin for consistency across all blocks.
                                    }
                                    tr.setNodeMarkup(pos, undefined, {
                                        ...node.attrs,
                                        indent: indent + 1,
                                    })
                                }
                            }
                        })
                        if (dispatch) dispatch(tr)
                        return true
                    },
            outdent:
                () =>
                    ({ tr, state, dispatch }: { tr: Transaction; state: EditorState; dispatch: ((tr: Transaction) => void) | undefined }) => {
                        const { selection } = state
                        tr.setSelection(selection)
                        tr.doc.nodesBetween(selection.from, selection.to, (node: Node, pos: number) => {
                            if (this.options.types.includes(node.type.name)) {
                                const indent = node.attrs.indent || 0
                                if (indent > this.options.minLevel) {
                                    tr.setNodeMarkup(pos, undefined, {
                                        ...node.attrs,
                                        indent: indent - 1,
                                    })
                                }
                            }
                        })
                        if (dispatch) dispatch(tr)
                        return true
                    },
        }
    },

    addKeyboardShortcuts() {
        return {
            Tab: () => this.editor.commands.indent(),
            'Shift-Tab': () => this.editor.commands.outdent(),
        }
    },
})
