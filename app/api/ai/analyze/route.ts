import { model } from '@/lib/ai/google';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { text, context, previousSuggestions } = await req.json();

        if (!text && !context) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const prompt = `
      You are an expert writing assistant and observer. 
      Analyze the user's current writing to determine their "Intent", the "Stage", and the "Section".
      
      User's Text Context:
      """
      ${text || context}
      """

      Previous Suggestions (Do NOT repeat these):
      """
      ${JSON.stringify(previousSuggestions || [])}
      """

      Return ONLY a JSON object with this structure:
      {
        "stage": "outlining" | "drafting" | "polishing" | "researching",
        "section": "intro" | "body" | "conclusion" | "unknown",
        "intent": "string (Specific intent, e.g. 'Defining key terms')",
        "confidence": number (0.0 to 1.0),
        "should_generate": boolean (true if new helpful info can be provided, false if redundant or user is doing well),
        "feedback_needed": boolean (true if the task is large and needs confirmation, e.g. generating a full outline)
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        const intentData = JSON.parse(jsonString);

        return NextResponse.json(intentData);

    } catch (error: any) {
        console.error('Error in AI Analysis:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
