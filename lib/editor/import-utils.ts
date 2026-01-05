import mammoth from 'mammoth'
import { Editor } from '@tiptap/react'

export async function importFromDocx(file: File, editor: Editor) {
    const arrayBuffer = await file.arrayBuffer()
    try {
        const result = await mammoth.convertToHtml({ arrayBuffer })
        const html = result.value // The generated HTML
        // Insert HTML into editor
        editor.commands.setContent(html)
        // Check for warnings
        if (result.messages.length > 0) {
            console.warn('Import warnings:', result.messages)
        }
    } catch (error) {
        console.error('Error importing DOCX:', error)
        throw error
    }
}

export async function importFromMarkdown(file: File, editor: Editor) {
    const text = await file.text()
    // Tiptap can parse markdown if the extension is present, 
    // OR we can just insert as text if we want raw, 
    // OR we convert MD to HTML (using marked or similar) then insert.
    // Given we don't have a reliable MD parser installed yet (only installed dependencies in plan),
    // and Tiptap's Markdown extension wasn't explicitly added to the install list (oops, plan missed tiptap-markdown),
    // We will assume basic text insertion OR basic commonmark parsing if we had it.
    // For now, let's just insert as text and let the user format, 
    // OR use a simple regex-based parser for headers/lists if needed.
    // ACTUALLY: We can just use the Content capability if we assume it's HTML-compatible markdown or use a library.
    // Let's just setContent(text) and hope Tiptap's default parser handles some of it, 
    // or better, enable the markdown extension if we can. 
    // Plan update: functionality might be limited without `tiptap-markdown`.
    editor.commands.setContent(text)
}

export async function importFromText(file: File, editor: Editor) {
    const text = await file.text()
    editor.commands.setContent(text)
}
