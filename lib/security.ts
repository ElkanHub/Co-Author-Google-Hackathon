export interface SecurityCheckResult {
    isValid: boolean;
    error?: string;
    sanitizedText?: string;
}

const MAX_INPUT_LENGTH = 100000; // 100k chars ~ 25k tokens. Safe for context but prevents DoS.

// Basic Jailbreak / Injection patterns
const MALICIOUS_PATTERNS = [
    /ignore previous instructions/i,
    /system override/i,
    /roleplay as unmoderated/i,
    /ignore all rules/i,
    /bypass safety/i
];

/**
 * Sanitizes input text to prevent simple DoS and generic injection.
 */
export function sanitizeInput(text: string | null | undefined): string {
    if (!text) return "";

    // 1. Trim
    let sanitized = text.trim();

    // 2. Remove null bytes (common attack vector)
    sanitized = sanitized.replace(/\0/g, '');

    // 3. Length Limit (DoS Protection)
    if (sanitized.length > MAX_INPUT_LENGTH) {
        // Truncate instead of throwing, to keep app functional for long docs
        sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
    }

    return sanitized;
}

/**
 * Scans for malicious intent or safety violations.
 */
export function validateRequest(text: string): SecurityCheckResult {
    if (!text) return { isValid: true, sanitizedText: "" };

    const sanitized = sanitizeInput(text);

    // 1. Check for Malicious Patterns
    for (const pattern of MALICIOUS_PATTERNS) {
        if (pattern.test(sanitized)) {
            console.warn(`[Security] Blocked input matching pattern: ${pattern}`);
            return {
                isValid: false,
                error: "Request blocked by security policy (Potential Injection Detected)."
            };
        }
    }

    // 2. Additional checks can go here (e.g. PII scanning if needed later)

    return { isValid: true, sanitizedText: sanitized };
}
