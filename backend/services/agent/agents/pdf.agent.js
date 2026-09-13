import generatePdf from "../utils/generatePDF.js";
import { getModel } from "../config/llmModels.js";
import { uploadBuffer } from "../config/cloudinary.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const pdfAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdf");
        const llm = await getModel("pdf", state.plan);
        const response = await llm.invoke(`
You are Alpha AI's Senior Executive Document Architect.
Generate a structured, professional, publication-ready PDF document from the user's request.

Return ONLY valid JSON matching this schema:
{
  "title": "Clear Document Title",
  "subtitle": "Brief subtitle or executive tagline",
  "sections": [
    { 
      "heading": "Section Heading", 
      "points": ["Clear, informative, well-articulated point 1", "Detailed point 2", "Key insight 3"] 
    }
  ]
}

Rules:
- Organize with logical progression: Executive Summary, Key Findings, In-depth Analysis, Recommendations, Next Steps.
- Keep every point actionable, professional, and directly relevant.
- Do NOT output markdown code fences, notes, or text outside the JSON object.

User request:
${state.prompt}
`);

        const rawContent = Array.isArray(response?.content)
            ? response.content.map((part) => (typeof part === "string" ? part : part?.text || "")).join("")
            : String(response?.content ?? "");

        const jsonText = rawContent
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .replace(/^\s*[*-]\s*/gm, "")
            .trim();

        const jsonStart = jsonText.indexOf("{");
        const jsonEnd = jsonText.lastIndexOf("}");
        const cleanJsonText = jsonStart >= 0 && jsonEnd > jsonStart ? jsonText.slice(jsonStart, jsonEnd + 1) : jsonText;

        let data;
        try {
            data = JSON.parse(cleanJsonText);
        } catch (parseErr) {
            data = {
                title: "Generated Document",
                subtitle: "Alpha AI Export",
                sections: [{ heading: "Overview", points: [state.prompt] }]
            };
        }

        await deductCredits(state.userId, "pdf");

        const pdfBuffer = await generatePdf(data);
        const fileName = `pdf-${Date.now()}.pdf`;
        const uploaded = await uploadBuffer(pdfBuffer, {
            public_id: fileName,
            resource_type: "raw",
            format: "pdf",
        });

        const downloadUrl = uploaded?.secure_url || "";

        return {
            ...state,
            aiResponse: `✅ **PDF generated successfully.**\n\n📄 **${data.title}**\n\n🔗 [Download PDF Document](${downloadUrl})\n\n*(Download link valid for 24 hours)*`,
        };

    } catch (error) {
        console.error("PDF generation failed:", error?.response?.data || error?.message || error);

        return {
            ...state,
            aiResponse: error?.data?.message || "❌ Failed to Generate PDF",
        };
    }
};