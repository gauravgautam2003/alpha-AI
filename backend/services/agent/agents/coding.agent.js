import { checkAgentLimit } from "../config/agentLimit.js";
import { getModel } from "../config/llmModels.js";
import { deductCredits } from "../utils/deductCredits.js";

export const codingAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "coding");

        const intentLLM = await getModel("intent", state.plan);
        const llm = await getModel("coding", state.plan);

        // -----------------------------
        // 1. INTENT CLASSIFICATION
        // -----------------------------
        const intentRes = await intentLLM.invoke(`
You are an intent classifier for a senior software engineering assistant.
Analyze the user's request and classify it into exactly ONE of these categories:
- CODE_GENERATION (User wants a complete app, website, widget, script, component, or full multi-file solution)
- CODE_REVIEW (User wants code analyzed for bugs, security, best practices)
- DEBUGGING (User wants help fixing an error, crash, stack trace, or bug)
- OPTIMIZATION (User wants performance, memory, or architectural optimization)
- CONVERSION (User wants code translated from one language/framework to another)
- DOCUMENTATION (User wants README, API docs, or code explanations)

Return ONLY the classification keyword in uppercase. No punctuation or markdown.

User request:
${state.prompt}
`);

        const rawIntent = Array.isArray(intentRes?.content)
            ? intentRes.content.map((part) => (typeof part === "string" ? part : part?.text || "")).join("")
            : String(intentRes?.content ?? "");

        const intentUpper = rawIntent.trim().toUpperCase();
        const isCodeGeneration =
            intentUpper.includes("CODE_GENERATION") ||
            /(build|create|generate|make|develop|write|code)\s+(a|an|the|me)?\s*(app|website|page|game|clone|component|ui|dashboard|system|script|tool)/i.test(
                state.prompt
            );

        // -----------------------------
        // 2. FULL PROJECT CODE GENERATION
        // -----------------------------
        if (isCodeGeneration) {
            const prompt = `
You are Alpha AI's Principal Full-Stack Software Engineer.
Build a complete, production-grade, highly polished, working software solution based on the user's request.

CRITICAL IMPLEMENTATION RULES:
- Design: Modern, responsive, stunning visual aesthetics with sleek typography, smooth animations, and zero broken assets.
- Completeness: All HTML, CSS, and JS must be completely written out. Never write "// TODO" or "// Add logic here".
- Resilience: Validate inputs, handle loading and error states, and prevent edge-case failures.
- Output Format: You MUST output STRICT VALID JSON matching this exact structure:
{
  "files": [
    { 
      "name": "index.html",
      "content": "<!DOCTYPE html>..."
    },
    { 
      "name": "style.css",
      "content": "/* complete modern styles */..."
    },
    { 
      "name": "script.js",
      "content": "// complete interactive logic..."
    }
  ]
}

STRICT INSTRUCTION: Return ONLY the JSON object. Do not wrap in conversational text.

User Request:
${state.prompt}
`;

            const response = await llm.invoke(prompt);
            const rawContent = Array.isArray(response?.content)
                ? response.content.map((part) => (typeof part === "string" ? part : part?.text || "")).join("")
                : String(response?.content ?? "");

            const cleanText = rawContent
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .trim();

            const jsonStart = cleanText.indexOf("{");
            const jsonEnd = cleanText.lastIndexOf("}");
            const candidateJson = jsonStart >= 0 && jsonEnd > jsonStart ? cleanText.slice(jsonStart, jsonEnd + 1) : cleanText;

            let data;
            try {
                data = JSON.parse(candidateJson);
                await deductCredits(state.userId, "coding");

                if (Array.isArray(data?.files) && data.files.length > 0) {
                    return {
                        ...state,
                        aiResponse: "✨ **Project code generated successfully.** Explore and run the generated files in your project workspace.",
                        artifacts: [
                            {
                                id: Date.now(),
                                type: "Project",
                                files: data.files,
                                title: state.prompt.slice(0, 50)
                            }
                        ]
                    };
                }
            } catch (jsonErr) {
                console.warn("Project JSON extraction fallback to direct markdown response");
            }
        }

        // -----------------------------
        // 3. CODE REVIEW, DEBUGGING & EXPLANATION
        // -----------------------------
        const response = await llm.invoke(`
You are Alpha AI's Senior Software Engineer & Code Architect.
Your task is to provide an in-depth, production-grade technical solution.

Guidelines:
1. Root Cause Analysis: Clearly identify underlying issues, inefficiencies, or edge cases.
2. Production Code: Provide clean, idiomatic, fully working code blocks with proper syntax highlighting.
3. Security & Scalability: Adhere to OWASP security guidelines, error handling, and optimal complexity.
4. Step-by-Step Explanation: Walk through why this solution works and how to verify it.

User Request:
${state.prompt}
`);

        const data = Array.isArray(response?.content)
            ? response.content.map((part) => (typeof part === "string" ? part : part?.text || "")).join("")
            : String(response?.content ?? "");

        await deductCredits(state.userId, "coding");

        return {
            ...state,
            aiResponse: data,
            artifacts: []
        };
    } catch (error) {
        console.error("Coding agent error:", error?.message || error);
        return {
            ...state,
            aiResponse: error?.data?.message || error?.message || "❌ Coding agent encountered an error. Please try again.",
            artifacts: []
        };
    }
};