import { getModel } from "../config/llmModels.js"

export const codingAgent = async (state) => {
    const intentLLM = await getModel("intent")
    const llm = await getModel("coding")
    const intentRes = await intentLLM.invoke(`
        you are an intent clasifier.

        Returns ONLY one of these values.

        CODE_GENERATION
        CODE_REVIEW
        DEBUGGING
        OPTIMIZATION
        CONVERSION
        DOCUMENTATION

        User Requests:
        ${state.prompt}
    `)

    const intent = intentRes.content

    if(intent == "CODE_GENERATION") {
        const prompt = `
            You are alpha ai agent.

            Genrate the requested project.

            Default stack:
                - HTML
                - CSS
                - JavaScript

            Use React / Next.js / Vue ONLY if explicitly requested. 
            
            Rules:

                - Responsive,
                - Modern UI,
                - CSS Variables,
                - Flexbox/Grid,
                - Smooth Scroll,
                - Hover Effects,
                - Beautiful Spacing,
                - Single page unless user asks otherwise.

            IMAGES:
            
                Always use real unsplash images.

                Never use Placeholders.
                
            Return ONLY valid JSON.
            
            Schema:

            {
                "files": [
                    {
                        "name" : "index.html",
                        "content" : "..."
                    },
                    {
                        "name" : "style.css",
                        "content" : "..."
                    },
                    {
                        "name" : "script.js",
                        "content" : "..."
                    },
                ]
            }

            Rules:

                - Output must start with {
                - Output must end with }
                - No markdown
                - No extra text
                - No \'\'\'
                - Never mention intent

            User Request:
                ${state.prompt}    
        `

        const response = await llm.invoke(prompt)
        const data = JSON.parse(response.content)

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
        }
    }

    const response = await llm.invoke(`
        The user's request is:

        ${intent}

        Return Markdown only.

        Use headings like.

        # Overview
        ## Explanation
        ## Problems
        ## Improvements
        ## Best Practices
        ## Optimized Code (if needed)

        User Request:

        ${state.prompt}
    `)

    const data = response.content
    return {
        ...state,
        aiResponse: data,
        artifacts: []
    }
}
