import { getModel } from "../config/llmModels.js";

export const router = async (state) => {
    const llm = await getModel("router");

    // Respect manually selected agent
    if (state.agent && state.agent !== "auto") {
        return {
            ...state,
            agent: state.agent
        };
    }

    if(state.file.mimeType == "application/pdf") {
        return {
            ...state,
            agent: "pdfRag"
        }
    }

    
    if(state.file.mimeType.startsWith == "image/") {
        return {
            ...state,
            agent: "imageAnalyzer"
        }
    }


    const prompt = `
You are Alpha AI's professional Agent Router.

Your job is to analyze the user's request and route it to the single
most appropriate AI agent.

==================================================
AVAILABLE AGENTS
==================================================

- chat
- search
- coding
- pdf
- ppt
- image

==================================================
ROUTING RULES
==================================================

CHAT:
Use "chat" for:
- General conversation
- Greetings
- Explanations
- Educational questions
- Learning concepts
- Advice
- Opinions
- Casual questions
- Questions that do not require current web information
- General discussions

SEARCH:
Use "search" for:
- Latest information
- Current events
- Recent news
- Recent developments
- Current prices or availability
- Real-time information
- Internet research
- Web lookup
- Information that may have changed recently
- User explicitly asking to search, research, look up, or browse the web

CODING:
Use "coding" for:
- Generate code
- Write code
- Debug code
- Fix programming errors
- Review code
- Refactor code
- Optimize code
- Build applications
- Build websites
- Build software projects
- APIs
- Backend development
- Frontend development
- Database implementation
- System architecture related to software development
- Programming questions that require implementation

PDF:
Use "pdf" for:
- Generate a PDF
- Create a PDF document
- Create a report as PDF
- Create an ebook
- Create documentation as PDF
- Convert content into a PDF
- Edit or modify a PDF
- Format content for PDF
- Create a resume/document as PDF
- Requests explicitly requiring a PDF file

PPT:
Use "ppt" for:
- Generate a PowerPoint
- Create a PPT
- Create presentation slides
- Make a presentation
- Create a pitch deck
- Convert content into presentation slides
- Design presentation slides
- Requests explicitly requiring a .ppt or .pptx file

IMAGE:
Use "image" for:
- Generate an image
- Create an image
- Draw an image
- Design an image
- Create an illustration
- Generate a poster
- Generate an infographic
- Create a logo or visual
- Edit an existing image
- Modify an image
- Requests explicitly requiring an image

==================================================
IMPORTANT PRIORITY RULES
==================================================

1. If the user explicitly asks to generate/create an image,
   choose "image".

2. If the user explicitly asks for a PDF,
   choose "pdf".

3. If the user explicitly asks for a PPT, PowerPoint, or presentation,
   choose "ppt".

4. If the user asks to write, debug, modify, or generate code,
   choose "coding".

5. If the request requires current or changing information,
   choose "search".

6. Otherwise, choose "chat".

7. Choose exactly ONE agent.

8. Never combine multiple agent names.

9. Do not explain your decision.

10. Do not return JSON.

11. Do not return Markdown.

12. Do not return punctuation.

==================================================
VALID OUTPUT
==================================================

Your response MUST be exactly one of:

chat
search
coding
pdf
ppt
image

==================================================
USER QUERY
==================================================

${state.prompt}
`;

    const response = await llm.invoke(prompt);

    const agent = response.content
        .trim()
        .toLowerCase();

    const validAgents = [
        "chat",
        "search",
        "coding",
        "pdf",
        "ppt",
        "image"
    ];

    return {
        ...state,
        agent: validAgents.includes(agent)
            ? agent
            : "chat"
    };
};