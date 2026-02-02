import { cacheManager } from '@/lib/ai/google';
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
        const safeContext = sanitizedText || "";

        if (!safeContext) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const systemPrompt = `
      You are "The Mature AI" co-author. 
      Adapt your English to the user’s proficiency level (simple, standard, or advanced).
      Do not use complex or academic language unless it is clear from the user’s writing that they are an advanced English speaker.
      
      Your Goal: proactive but disciplined. 
      Core Philosophy: VALUE IS INTELLIGENCE.
      
      Do not interrupt with empty praise ("Good job").
      DO interrupt if you can advance the user's thinking, suggest a direction, or provide a necessary fact.
      
      LAYER 6 (JUSTIFICATION):
      Before generating, you must justify: "Does this add concrete value to the user's current thought?"
      
      Valid reasons to interrupt:
      - "Claim made without citation - I can suggest one"
      - "Section is unusually short - I can suggest expansion"
      - "Logic gap detected - I can bridge it"
      - "User is stating a fact - I can add a supporting statistic"
      - "User paused at a transition - I can suggest the next logical topic"
      
      Invalid reasons (Stay Silent):
      - "General praise"
      - "Summarizing obvious text"
      - "Banal encouragement"
      
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

        // The manager handles caching the context if large enough
        // It returns a standard GenerateContentResult
        const result = await cacheManager.generateWithCache(systemPrompt, safeContext);

        const response = await result.response;
        const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        const intentData = JSON.parse(jsonString);

        return NextResponse.json(intentData);

    } catch (error: any) {
        console.error('Error in AI Analysis:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
