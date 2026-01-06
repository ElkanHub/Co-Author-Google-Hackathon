import { model } from '@/lib/ai/google';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { text, context } = await req.json();

        if (!text && !context) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const prompt = `
      You are an expert writing assistant and observer. 
      Analyze the user's current writing to determine their "Intent" and the "Stage" of the document.
      
      User's Text Context:
      """
      ${text || context}
      """

      Return ONLY a JSON object with this structure:
      {
        "stage": "outlining" | "drafting" | "polishing" | "literature_review" | "researching",
        "intent": "string (The comprehensive specific intent, e.g. 'Defining key terms regarding quantum mechanics' or 'Arguing against the null hypothesis')",
        "confidence": number (0.0 to 1.0)
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
