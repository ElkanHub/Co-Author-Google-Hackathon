import { model } from '@/lib/ai/google';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { intent, text, stage } = await req.json();

        const prompt = `
      You are an autonomous co-author. The user is currently in the "${stage}" stage.
      Their specific intent is: "${intent}".
      
      Based on the text below, generate a helpful "Intelligence Card" content. 
      Do NOT just summarize. Provide value: finding gaps, suggesting sources (use placeholders like [Source 1]), or drafting next steps.
      Adapt your English to the user’s proficiency level (simple, standard, or advanced).
      Do not use complex or academic language unless it is clear from the user’s writing that they are an advanced English speaker.
      
      Structure your response as a valid JSON object:
      {
         "type": "suggestion" | "analysis" | "citation" | "feedback",
         "reason": "Why you generated this (e.g. 'Noticed a lack of cited sources in this paragraph')",
         "content": "The actual helpful text content, formatted in Markdown."
      }

      User Text:
      """
      ${text}
      """
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const generation = JSON.parse(jsonString);

        return NextResponse.json(generation);

    } catch (error: any) {
        console.error('Error in AI Generation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
