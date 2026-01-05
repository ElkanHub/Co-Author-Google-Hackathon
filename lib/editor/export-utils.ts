import { Editor, JSONContent } from '@tiptap/react'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportToPdf(editor: Editor, filename: string = 'document.pdf') {
    const element = editor.view.dom as HTMLElement
    // Use html2canvas to capture the editor content
    // Note: robust text selection/searchability in PDF requires a different approach (e.g. printing)
    // but for "print-accurate" visual, canvas is often used in client-side only apps.
    // Alternatively, we can use jsPDF's html method.

    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
    })

    // Calculate PDF page size based on standard A4 if needed, for now exact fit
    // For proper A4 pagination, we'd need more logic.
    // Let's settle for a simple 1-page snapshot for MVP or multipage if valid.

    // Better approach for text:
    const pdfDoc = new jsPDF()
    // pdfDoc.html is async
    await pdfDoc.html(element, {
        callback: function (doc) {
            doc.save(filename);
        },
        x: 10,
        y: 10,
        width: 190, // A4 width is ~210mm, minus margins
        windowWidth: element.scrollWidth
    });
}

export function exportToMarkdown(editor: Editor, filename: string = 'document.md') {
    // Tiptap store content as HTML or JSON. 
    // We need a serializer. Tiptap PRO has one, or we use a basic one.
    // For now, let's use a simple HTML to Markdown converter or Tiptap's built-in if available (it isn't by default).
    // TurndownService is a common choice. Since we didn't install turndown, 
    // we can use a basic custom approach or just dump text if structure is complex.
    // WAITING FOR: proper markdown serializer.
    // Actually, Tiptap has `editor.storage.markdown.getMarkdown()` if the extension is installed.
    // But we didn't install `tiptap-markdown`.
    // Let's assume we can get basic text or HTML.

    // Fallback: simple text
    const content = editor.getText()
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    saveAs(blob, filename)
}

export async function exportToDocx(editor: Editor, filename: string = 'document.docx') {
    const json = editor.getJSON()

    // Transform Tiptap JSON to DOCX paragraphs
    // This is a simplified mapping.
    const children = (json.content as JSONContent[])?.map(node => {
        switch (node.type) {
            case 'heading':
                return new Paragraph({
                    text: node.content?.[0]?.text || '',
                    heading: node.attrs?.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
                })
            case 'paragraph':
                return new Paragraph({
                    children: node.content?.map((c: JSONContent) => new TextRun({
                        text: c.text || '',
                        bold: c.marks?.some(m => m.type === 'bold'),
                        italics: c.marks?.some(m => m.type === 'italic'),
                    })) || []
                })
            default:
                return new Paragraph({ text: '' })
        }
    }) || []

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

    // Very basic JSON to LaTeX converter
    let latex = '\\documentclass{article}\n\\usepackage{graphicx}\n\\begin{document}\n\n'

        ; (json.content as JSONContent[])?.forEach(node => {
            switch (node.type) {
                case 'heading':
                    const level = node.attrs?.level === 1 ? 'section' : node.attrs?.level === 2 ? 'subsection' : 'subsubsection'
                    latex += `\\${level}{${node.content?.[0]?.text || ''}}\n\n`
                    break
                case 'paragraph':
                    const text = node.content?.map(c => {
                        let t = c.text || ''
                        if (c.marks?.some(m => m.type === 'bold')) t = `\\textbf{${t}}`
                        if (c.marks?.some(m => m.type === 'italic')) t = `\\textit{${t}}`
                        return t
                    }).join('') || ''
                    latex += `${text}\n\n`
                    break
                case 'image':
                    // LaTeX image handling requires the image file to be accessible or embedded. 
                    // For a single .tex file, we can't easily embed images without base64 packages or zip.
                    // We'll insert a placeholder comment.
                    latex += `% <img src="${node.attrs?.src}" /> (Image export requires bundling)\n\n`
                    break
            }
        })

    latex += '\\end{document}'

    const blob = new Blob([latex], { type: 'application/x-latex;charset=utf-8' })
    saveAs(blob, filename)
}
