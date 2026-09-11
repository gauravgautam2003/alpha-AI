import { checkAgentLimit } from "../config/agentLimit.js";
import { getModel } from "../config/llmModels.js";
import { deductCredits } from "../utils/deductCredits.js";

export const codingAgent = async (state) => {
    try {

        const intentLLM = await getModel("intent");
        await checkAgentLimit(state.userId, "coding")

        const llm = await getModel("coding");

        // -----------------------------
        // 1. INTENT CLASSIFICATION
        // -----------------------------
        const intentRes = await intentLLM.invoke(`
You are an intent classifier for a coding agent.

Return exactly one value:
     CODE_GENERATION, 
     CODE_REVIEW,
     DEBUGGING, 
     OPTIMIZATION,
     CONVERSION, 
     DOCUMENTATION.

No extra text.

User request:
${state.prompt}
`);

        const intent = intentRes.content.trim();

        // -----------------------------
        // 2. CODE GENERATION
        // -----------------------------
        if (intent === "CODE_GENERATION") {
            const prompt = `
You are a senior software engineer responsible for producing correct, maintainable, secure code.
Build the smallest complete solution that satisfies the request. Follow the requested stack and existing conventions; if no stack is specified, use simple HTML, CSS, and JavaScript.

Implementation rules:
- Solve the root problem with the smallest maintainable design.
- Keep imports, APIs, state flow, and file references internally consistent.
- Make forms, buttons, loading states, errors, and responsive layouts functional.
- Avoid unnecessary dependencies, fake data, placeholder behavior, broken imports, and secrets.
- Prefer accessible semantic HTML and clear naming.
- Preserve existing public APIs unless the request requires a breaking change.
- Validate input at boundaries and handle expected failure states.
- Do not claim that code was executed, tested, or deployed unless that actually happened.
- Return valid JSON only in this format:
{
  "files": [
        { 
            "name": "index.html",
            "content": "..."
        },
        { 
            "name": "style.css",
            "content": "..."
        },
        { 
            "name": "script.js",
            "content": "..."
        }
    ]
}
No markdown, no code fences, and no extra text outside the JSON object.

User request:
${state.prompt}
`;

            const response = await llm.invoke(prompt);

            let data;

            try {
                data = JSON.parse(response.content);
                await deductCredits(state.userId, "coding")

            } catch (error) {
                console.error("Invalid JSON returned by coding model:", error);

                return {
                    ...state,
                    aiResponse: "Failed to generate valid project code.",
                    artifacts: []
                };
            }

            return {
                ...state,
                aiResponse: "Code Generated Successfully.",
                artifacts: [
                    {
                        id: Date.now(),
                        type: "Project",
                        files: data.files || [],
                        title: state.prompt
                    }
                ]
            };
        }

        // -----------------------------
        // 3. OTHER CODING INTENTS
        // -----------------------------
        const response = await llm.invoke(`
You are a senior software engineer performing a careful code change.
The request is classified as: ${intent}.

Solve the root cause, preserve existing behavior outside the requested scope, and provide a practical maintainable solution. Check edge cases and security implications. Do not invent APIs, credentials, test results, or files. Return concise Markdown with: diagnosis, solution, implementation, and verification steps when useful.

User request:
${state.prompt}
`);

        const data = response.content;
        await deductCredits(state.userId, "coding")

        return {
            ...state,
            aiResponse: data,
            artifacts: []
        };
    } catch (error) {
        return {
            ...state,
            aiResponse: error?.data?.message || "coding agent error",
            artifacts: []
        };
    }
};