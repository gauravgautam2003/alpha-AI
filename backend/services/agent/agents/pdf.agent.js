import generatePdf from "../utils/generatePDF.js";
import { getModel } from "../config/llmModels.js";
import { uploadBuffer } from "../config/cloudinary.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const pdfAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdf")
        const llm = await getModel("pdf");
        const response = await llm.invoke(`
You are a professional document architect creating a polished PDF-ready document.
Turn the user's request into accurate, useful content for the intended audience and purpose.
Return only valid JSON. No markdown, code fences, explanations, asterisks, or extra text.

Required JSON structure:
{
  "title": "Document title",
  "subtitle": "Short subtitle",
  "sections": [
    { "heading": "Section title", "points": ["Point 1", "Point 2"] }
  ]
}

Rules:
- Infer the document type, audience, tone, and desired depth from the request.
- Use a logical narrative: title, concise subtitle, overview, sections, and conclusion.
- Make every section specific and useful; avoid filler and repetition.
- Add tables, comparisons, examples, references, or action items only when they improve the document.
- Never invent sources, statistics, quotations, or claims presented as facts.
- Keep headings short and points readable in a PDF layout.
- Use consistent terminology and a professional tone.
- Put the most important information first and make each point understandable without extra context.
- If the request lacks key details, make a reasonable neutral assumption rather than adding fictional specifics.
- Ensure the response is strict parseable JSON matching the schema exactly.

User request:
${state.prompt}
`);

        const rawContent = Array.isArray(response.content)
            ? response.content.map((part) => typeof part === "string" ? part : part?.text || "").join("")
            : String(response.content ?? "");

        const jsonText = rawContent
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .replace(/^\s*[*-]\s*/gm, "")
            .trim();


        const data = JSON.parse(jsonText)
        await deductCredits(state.userId, "pdf")

        const pdfBuffer = await generatePdf(data)
        const fileName = `pdf-${Date.now()}.pdf`
        const uploaded = await uploadBuffer(pdfBuffer, {
            public_id: fileName,
            resource_type: "raw",
            format: "pdf",
        });

        const downloadUrl = uploaded?.secure_url || "";

        return {
            ...state,
            aiResponse: `✅ PDF generated successfully.
                        ${data.title}
                    [Download PDF](${downloadUrl}),
                    Link Expired after 24 hours`,

        };

    } catch (error) {
        console.error("PDF generation failed:", error?.response?.data || error?.message || error);

        return {
            ...state,
            aiResponse: error?.data?.message || "❌ Failed to Generate PDF",
        };
    }
};