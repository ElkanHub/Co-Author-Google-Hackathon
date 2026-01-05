import { Editor, JSONContent } from '@tiptap/react'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportToPdf(editor: Editor, filename: string = 'document.pdf') {
    const element = editor.view.dom as HTMLElement
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
    })

    await pdf.html(element, {
        callback: function (doc) {
            doc.save(filename);
        },
        x: 20,
        y: 20,
        width: 400, // Approximate width to fit A4 with margins
        windowWidth: element.scrollWidth
    });
}

export function exportToMarkdown(editor: Editor, filename: string = 'document.md') {
    const json = editor.getJSON()
    let markdown = ''

    const serializeNode = (node: JSONContent, parentType?: string): string => {
        if (!node.type) return ''

        switch (node.type) {
            case 'doc':
                return node.content?.map(c => serializeNode(c)).join('\n\n') || ''
            case 'heading':
                const level = node.attrs?.level || 1
                return `${'#'.repeat(level)} ${node.content?.map(c => serializeNode(c)).join('') || ''}`
            case 'paragraph':
                return node.content?.map(c => serializeNode(c)).join('') || ''
            case 'text':
                let text = node.text || ''
                if (node.marks) {
                    node.marks.forEach(mark => {
                        if (mark.type === 'bold') text = `**${text}**`
                        if (mark.type === 'italic') text = `*${text}*`
                        if (mark.type === 'strike') text = `~~${text}~~`
                        if (mark.type === 'code') text = `\`${text}\``
                    })
                }
                return text
            case 'bulletList':
                return node.content?.map(c => serializeNode(c, 'bulletList')).join('\n') || ''
            case 'orderedList':
                return node.content?.map((c, i) => serializeNode(c, 'orderedList')).join('\n') || ''
            case 'listItem':
                const symbol = parentType === 'orderedList' ? `1.` : '-'
                return `${symbol} ${node.content?.map(c => serializeNode(c)).join('')}`
            case 'blockquote':
                return `> ${node.content?.map(c => serializeNode(c)).join('')}`
            case 'codeBlock':
                return `\`\`\`${node.attrs?.language || ''}\n${node.content?.map(c => serializeNode(c)).join('')}\n\`\`\``
            case 'image':
                return `![${node.attrs?.alt || ''}](${node.attrs?.src})`
            case 'hardBreak':
                return '  \n'
            default:
                return ''
        }
    }

    markdown = serializeNode(json)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    saveAs(blob, filename)
}

export async function exportToDocx(editor: Editor, filename: string = 'document.docx') {
    const json = editor.getJSON()

    const processNode = (node: JSONContent): Paragraph[] => {
        if (!node.type) return []

        switch (node.type) {
            case 'heading':
                return [new Paragraph({
                    text: node.content?.[0]?.text || '',
                    heading: node.attrs?.level === 1 ? HeadingLevel.HEADING_1 :
                        node.attrs?.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
                    alignment: node.attrs?.textAlign === 'center' ? AlignmentType.CENTER :
                        node.attrs?.textAlign === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT
                })]
            case 'paragraph':
                return [new Paragraph({
                    children: node.content?.map((c: JSONContent) => new TextRun({
                        text: c.text || '',
                        bold: c.marks?.some(m => m.type === 'bold'),
                        italics: c.marks?.some(m => m.type === 'italic'),
                        strike: c.marks?.some(m => m.type === 'strike'),
                    })) || [],
                    alignment: node.attrs?.textAlign === 'center' ? AlignmentType.CENTER :
                        node.attrs?.textAlign === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT
                })]
            case 'bulletList':
                return (node.content || []).flatMap(li =>
                    (li.content || []).flatMap(p =>
                        new Paragraph({
                            children: (p.content || []).map((c: JSONContent) => new TextRun({
                                text: c.text || '',
                                bold: c.marks?.some(m => m.type === 'bold'),
                                italics: c.marks?.some(m => m.type === 'italic'),
                            })),
                            bullet: { level: 0 } // Basic bullet support
                        })
                    )
                )
            case 'orderedList':
                return (node.content || []).flatMap(li =>
                    (li.content || []).flatMap(p =>
                        new Paragraph({
                            children: (p.content || []).map((c: JSONContent) => new TextRun({
                                text: c.text || '',
                                bold: c.marks?.some(m => m.type === 'bold'),
                                italics: c.marks?.some(m => m.type === 'italic'),
                            })),
                            // Numbering requires more complex setup in docx, fallback to clean paragraphs for now or use bullets
                            bullet: { level: 0 }
                        })
                    )
                )
            default:
                // Handle nested recursion for wrappers if needed, but for now flat map top levels
                if (node.content) {
                    return node.content.flatMap(processNode)
                }
                return []
        }
    }

    const children = (json.content as JSONContent[]).flatMap(processNode)

    const doc = new Document({
        sections: [{
            properties: {},
            children: children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
}

export function exportToLatex(editor: Editor, filename: string = 'document.tex') {
    const json = editor.getJSON()
    let latex = '\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{graphicx}\n\\usepackage{hyperref}\n\n\\begin{document}\n\n'

    const escapeLatex = (str: string) => {
        return str.replace(/([#$%&_{}])/g, '\\$1')
    }

    const processContent = (nodes: JSONContent[]): string => {
        let output = ''
        nodes.forEach(node => {
            switch (node.type) {
                case 'heading':
                    const level = node.attrs?.level === 1 ? 'section' : node.attrs?.level === 2 ? 'subsection' : 'subsubsection'
                    output += `\\${level}{${escapeLatex(node.content?.[0]?.text || '')}}\n\n`
                    break
                case 'paragraph':
                    const text = node.content?.map(c => {
                        let t = escapeLatex(c.text || '')
                        if (c.marks?.some(m => m.type === 'bold')) t = `\\textbf{${t}}`
                        if (c.marks?.some(m => m.type === 'italic')) t = `\\textit{${t}}`
                        if (c.marks?.some(m => m.type === 'code')) t = `\\texttt{${t}}`
                        return t
                    }).join('') || ''
                    // Append blank line for paragraph break
                    if (text.trim()) output += `${text}\n\n`
                    break
                case 'bulletList':
                    output += '\\begin{itemize}\n'
                    node.content?.forEach(li => {
                        output += `  \\item ${processContent(li.content || [])}`
                    })
                    output += '\\end{itemize}\n\n'
                    break
                case 'orderedList':
                    output += '\\begin{enumerate}\n'
                    node.content?.forEach(li => {
                        output += `  \\item ${processContent(li.content || [])}`
                    })
                    output += '\\end{enumerate}\n\n'
                    break
                case 'blockquote':
                    output += '\\begin{quote}\n'
                    output += processContent(node.content || [])
                    output += '\\end{quote}\n\n'
                    break
                case 'image':
                    output += `\\begin{figure}[h]\n\\centering\n\\includegraphics[width=\\linewidth]{${node.attrs?.src}}\n\\caption{${node.attrs?.alt || 'Image'}}\n\\end{figure}\n\n`
                    break
            }
        })
        return output
    }

    latex += processContent(json.content || [])
    latex += '\\end{document}'

    const blob = new Blob([latex], { type: 'application/x-latex;charset=utf-8' })
    saveAs(blob, filename)
}
