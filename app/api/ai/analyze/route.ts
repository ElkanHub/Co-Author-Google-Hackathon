import { model } from '@/lib/ai/google';
import { NextRequest, NextResponse } from 'next/server';

import { validateRequest } from '@/lib/security';

export async function POST(req: NextRequest) {
    try {
        const { text, context, previousSuggestions } = await req.json();

        // Security Check
        const { isValid, error, sanitizedText } = validateRequest(text || context);
        if (!isValid) {
            return NextResponse.json({ error }, { status: 400 });
        }

        // Use sanitized text
        const safeText = sanitizedText || "";
        const safeContext = validateRequest(context).sanitizedText || "";

        if (!safeText && !safeContext) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const prompt = `
      You are "The Mature AI" co-author. 
      Adapt your English to the user’s proficiency level (simple, standard, or advanced).
      Do not use complex or academic language unless it is clear from the user’s writing that they are an advanced English speaker.
      Your Goal: Only interrupt if you have a high-value, specific intervention.
      
      Core Philosophy: SILENCE IS INTELLIGENCE. 
      If the user is writing well, or if your suggestion is generic (e.g., "Good flow"), do NOT interrupt.
      
      LAYER 6 (JUSTIFICATION):
      Before generating, you must justify: "Why is this worth interrupting the user RIGHT NOW?"
      Valid reasons:
      - "Claim made without citation"
      - "Section is unusually short or abrupt"
      - "Logic gap detected in the last argument"
      - "User has just finished a section and it needs review"
      
      Invalid reasons:
      - "Just checking in"
      - "General praise"
      - "Summarizing what they just wrote" (unless complex)
      
      User's Text Context:
      """
      ${text || context}
      """

      Previous Suggestions (Do NOT repeat these):
      """
      ${JSON.stringify(previousSuggestions || [])}
      """

      Return ONLY a JSON object:
      {
        "stage": "outlining" | "drafting" | "polishing" | "researching",
        "section": "intro" | "body" | "conclusion" | "unknown",
        "intent": "string (Specific intent)",
        "confidence": number (0.0 to 1.0),
        "should_generate": boolean (TRUE if justification is valid & high-value. FALSE if silent.),
        "feedback_needed": boolean (TRUE if proposal is >200 words or changes direction),
        "justification": "string (Internal reasoning)"
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
