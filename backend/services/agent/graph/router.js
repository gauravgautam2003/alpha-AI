import { getModel } from "../config/llmModels.js"

export const router = async (state) => {
    const llm = await getModel("router");

    const prompt = `You are an agent router.

    Available Agents:
        - chat
        - search
        - coding
        - pdf
        - ppt
        - image

    Rules: 
        chat:
            General Conversation,
            explainations,
            learning,
            questions.

        search: 
            Currect events,
            latest information,
            news,
            recents developments,
            internet lookup.
            
        coding:
            generate code,
            debug code,
            build projects,
            architectures,
            api design.
            
        pdf: 
            Questions about generate PDFs or Document context.
            
        ppt: 
            Questions about generate PPTs or ppt context.
        
        image: 
            generate image,
            create image.
            
            
        Return ONLY one word:
        
            chat
            search
            coding
            pdf

        User Query:
            ${state.prompt}    
        `

    const response = await llm.invoke(prompt);
    
    return {
        ...state,
        agent: response.content
                .trim()
                .toLowerCase()
    }
}