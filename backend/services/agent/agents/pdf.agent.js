import generatePdf from "../utils/generatePDF.js";
import { getModel } from "../config/llmModels.js";
import cloudinary, { uploadBuffer } from "../config/cloudinary.js";

export const pdfAgent = async (state) => {
    try {
        const llm = await getModel("pdf");
        const response = await llm.invoke(`
You are a PDF document designer.
Return only valid JSON.
No markdown, no code fences, no explanations, no asterisks, no extra text.

Required JSON structure:
{
  "title": "Document title",
  "subtitle": "Short subtitle",
  "sections": [
    { "heading": "Section title", "points": ["Point 1", "Point 2"] }
  ]
}

Rules:
- Understand the topic, purpose, audience, and document type.
- Use a logical structure with title, summary, sections, and conclusion.
- Add tables, charts, diagrams, or references only when useful.
- Keep content clear and accurate; never invent facts or sources.
- Maintain clean layout, consistent headings, and readable spacing.
- If the request is technical, include proper structure and examples.
- Ensure the response is valid JSON and can be parsed by JavaScript.

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
            aiResponse: "❌ Failed to Generate PDF",
        };
    }
};