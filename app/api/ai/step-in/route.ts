import { model } from '@/lib/ai/google';
import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/security';

export async function POST(req: NextRequest) {
    try {
        const { text, stage } = await req.json();

        // Security Check
        const textCheck = validateRequest(text);
        if (!textCheck.isValid) return NextResponse.json({ error: textCheck.error }, { status: 400 });

        const safeText = textCheck.sanitizedText;

        // 1. Instruction Parsing
        // We look for "Instructions" heading. In Tiptap it might be "Instructions" or "# Instructions" 
        // depending on how they copy text. getText() usually gives plain text.
        const instructionRegex = /(?:^|\n)(?:#+|Instructions:?)\s*(.*)(?:\n|$)/i;
        const match = safeText?.match(instructionRegex);

        if (!match || !match[1].trim()) {
            return NextResponse.json({
                error: "No instructions found. Please add an 'Instructions' heading at the top of your document.",
                missingInstructions: true
            }, { status: 400 });
        }

        const instructions = match[1].trim();

        const agentSystemPrompt = `
      You are the "Step In" mode of an autonomous co-author. 
      The user is in the "${stage}" stage.
      
      Instructions from the user: "${instructions}"
      
      Current Text Content:
      """
      ${safeText}
      """
      
      Your goal is to take over the writing process and fulfill the user's instructions perfectly.
      Follow this agentic loop:
      1. **Plan**: Develop a clear execution plan.
      2. **Execute**: Rewrite/Continue the content.
      3. **Evaluate**: Score your work and find weak points.
      4. **Refine**: Make final adjustments.
      
      Output a valid JSON object with the following structure:
      {
        "plan": "Detailed markdown of your plan.",
        "execution": "The final revised content in HTML format. Preserve structure with tags like <p>, <h2>, <ul>, etc. DO NOT include the instructions heading itself in the output, just the body content.",
        "evaluation": {
            "score": 0-100,
            "alignment": "How well it aligns with instructions.",
            "weakPoints": "What could be better.",
            "critique": "Self-critique markdown."
        },
        "explanation": "Final explanation of changes made."
      }

      Strict Constraints:
      - Mirror the user's writing style.
      - No robotic/generic AI language.
      - **No emojis.**
      - Adapt to the user's proficiency level.
      - **Produce HTML output exclusively** for the "execution" field.
      - If user instructions imply changing existing text, do so. If they imply continuing, do so.
    `;

        const result = await model.generateContent(agentSystemPrompt);
        const response = await result.response;
        const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const output = JSON.parse(jsonString);

        return NextResponse.json(output);

    } catch (error: any) {
        console.error('Error in Step In API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
