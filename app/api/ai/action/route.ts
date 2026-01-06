import { model } from '@/lib/ai/google';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { action, selection, context } = await req.json();

        // Construct a specific prompt based on the action
        const systemPrompt = `
      You are an expert academic co-author.
      The user wants you to perform the following action: "${action}".
      
      Target Text: "${selection}"
      Context (surrounding text): "${context}"

      Generate a helpful response formatted as a JSON object matching this structure:
      {
         "type": "suggestion" | "analysis" | "citation" | "feedback" | "action",
         "reason": "Brief explanation of why you generated this",
         "content": "The content of your response (e.g. the paraphrased text, citation, or analysis) in Markdown."
      }

      Specific Instructions per Action:
      - Cite: Provide a proper citation (APA/MLA style) or suggest where to find one. Type: "action".
      - Paraphrase: Rewrite the text to be clearer and more academic. Type: "action".
      - Summarize: Provide a concise summary. Type: "action".
      - Expand: expand on the concepts in the text. Type: "action".
      - Analyze: Analyze the arguments/logic. Type: "action".
      - Counterarguments: Provide potential counterarguments. Type: "action".
      - Suggest sources: Suggest real or likely sources for this claim. Type: "action".
      - Define terms: Define key technical terms found in the text. Type: "action".
    `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const textResponse = response.text();

        // Clean up markdown code blocks if present
        const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        let generation;
        try {
            generation = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON", textResponse);
            // Fallback
            generation = {
                type: 'action',
                reason: 'Error parsing AI response',
                content: textResponse
            };
        }

        return NextResponse.json(generation);

    } catch (error: any) {
        console.error('Error in AI Action:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
