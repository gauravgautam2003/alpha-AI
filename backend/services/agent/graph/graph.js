import { StateGraph } from "@langchain/langgraph";
import { agentState } from "./state.js";
import { router } from "./router.js";
import { chatAgent } from "../agents/chat.agent.js";
import { searchAgent } from "../agents/search.agent.js";
import { codingAgent } from "../agents/coding.agent.js";
import { pdfAgent } from "../agents/pdf.agent.js";
import { pptAgent } from "../agents/ppt.agent.js";
import { imageGenAgent } from "../agents/imageGen.agent.js";
import { imageAnalyzerAgent } from "../agents/imageAnalyzer.agent.js";
import { pdfRagAgent } from "../agents/pdfRag.agent.js";
import { resumeAgent } from "../agents/resume.agent.js";

const workflow = new StateGraph(agentState);

workflow.addNode("router", router);
workflow.addNode("chat", chatAgent);
workflow.addNode("search", searchAgent);
workflow.addNode("coding", codingAgent);
workflow.addNode("pdf", pdfAgent);
workflow.addNode("ppt", pptAgent);
workflow.addNode("imageGen", imageGenAgent);
workflow.addNode("pdfRag", pdfRagAgent);
workflow.addNode("imageAnalyzer", imageAnalyzerAgent);
workflow.addNode("resume", resumeAgent);


// connect agents

workflow.addEdge("__start__", "router");

workflow.addConditionalEdges("router", (state) => {
    switch (state.agent) {
        case "chat":
            return "chat"
        case "search":
            return "search"
        case "coding":
            return "coding"
        case "pdf":
            return "pdf"
        case "ppt":
            return "ppt"
        case "imageGen":
            return "imageGen"
        case "pdfRag":
            return "pdfRag"
        case "imageAnalyzer":
            return "imageAnalyzer"
        case "resume":
            return "resume"    
        default:
            return "chat"
    }
}, {
    //map agents

    chat: "chat",
    search: "search",
    coding: "coding",
    pdf: "pdf",
    ppt: "ppt",
    imageGen: "imageGen",
    pdfRag: "pdfRag",
    imageAnalyzer: "imageAnalyzer",
    resume: "resume"
})

//connect agents with end
workflow.addEdge("search", "chat");
workflow.addEdge("chat", "__end__");
workflow.addEdge("coding", "__end__");
workflow.addEdge("pdf", "__end__");
workflow.addEdge("ppt", "__end__");
workflow.addEdge("imageGen", "__end__");
workflow.addEdge("pdfRag", "__end__");
workflow.addEdge("imageAnalyzer", "__end__");
workflow.addEdge("resume", "__end__");

export const graph = workflow.compile();
