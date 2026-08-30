import { getModel } from "../config/llmModels.js";

export const codingAgent = async (state) => {
    const intentLLM = await getModel("intent");
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
You are an expert software engineer and code generator.
Build clean, secure, working code for the request.
Use the requested stack when specified; otherwise default to HTML, CSS, and JavaScript.

Rules:
- Prefer simple, maintainable, production-ready code.
- Do not add unnecessary libraries or files.
- Ensure functionality works and forms/buttons/actions behave correctly.
- Keep UI responsive and professional.
- Use real image URLs only when needed.
- Avoid placeholders, fake data, broken imports, and secrets.
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
    },
  ]
}
No markdown, no code fences, no extra text.

User request:
${state.prompt}
`;

        const response = await llm.invoke(prompt);

        let data;

        try {
            data = JSON.parse(response.content);
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
You are an expert software engineer.
The request is classified as: ${intent}.

Solve it clearly and correctly. Use the root cause, fix the issue, and keep the solution practical and maintainable. Do not invent APIs or credentials. Return concise markdown with overview, solution, code, and conclusion when useful.

User request:
${state.prompt}
`);

    const data = response.content;

    return {
        ...state,
        aiResponse: data,
        artifacts: []
    };
};