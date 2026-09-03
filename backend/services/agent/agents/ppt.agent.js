import { getModel } from "../config/llmModels.js";
import { uploadBuffer } from "../config/cloudinary.js";
import { generatePPT } from "../utils/generatePPT.js";
import { deductCredits } from "../utils/deductCredits.js";

export const pptAgent = async (state) => {
    try {
        const llm = await getModel("ppt");
        const response = await llm.invoke(`
        You are a professional presentation designer.
        Create a polished, professional slide deck based on the user request.

            Return ONLY valid JSON:    

        Format:

        {
            "title" : "",
            "subtitle" : "",
            "slides" : [
                {
                    "title" : "",
                    "points" : [
                        "",
                        "",
                        "",
                        "",
                        "",
                    ]
                }        
            ]
        }

        Rules:
        - Generate exactly 6content slides.
        - Keep the story clear and logical.
        - Use short headings and bullet points.
        - Prefer 3 to 6 points per slide.
        - Add title, intro, main points, examples, data, and conclusion as needed.
        - Use visuals only when they help understanding.
        - Never invent facts, numbers, or sources.
        - Keep the design clean, readable, and professional.

        User request:
            ${state.prompt}
    `);


        const contentValue = response?.content ?? response?.text ?? response?.message ?? response;
        const rawContent = Array.isArray(contentValue)
            ? contentValue.map((part) => typeof part === "string" ? part : part?.text || "").join("")
            : typeof contentValue === "string"
                ? contentValue
                : typeof contentValue === "object" && contentValue !== null
                    ? JSON.stringify(contentValue)
                    : String(contentValue ?? "");

        const jsonText = rawContent
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .replace(/^\s*[*-]\s*/gm, "")
            .trim();

        const jsonStart = jsonText.indexOf("{");
        const jsonEnd = jsonText.lastIndexOf("}");
        const cleanJsonText = jsonStart >= 0 && jsonEnd > jsonStart ? jsonText.slice(jsonStart, jsonEnd + 1) : jsonText;

        const data = JSON.parse(cleanJsonText);
        await deductCredits(state.userId, "ppt")

        if (!data?.title || !Array.isArray(data?.slides)) {
            throw new Error("Invalid PPT payload structure");
        }

        const ppt = await generatePPT(data)
        const buffer = await ppt.write({
            outputType: "nodebuffer"
        })

        const fileName = `ppt-${Date.now()}`;
        const uploaded = await uploadBuffer(buffer, {
            public_id: fileName,
            resource_type: "raw",
            format: "ppt",
        });

        const downloadUrl = uploaded?.secure_url || "";
        if (!downloadUrl) {
            throw new Error("PPT upload returned no secure URL");
        }

        return {
            ...state,
            aiResponse: `✅ Presentation generated successfully.
                        ${data.title}
                    [Download PPT](${downloadUrl}),
                    Link Expired after 24 hours`,

        };
    } catch (error) {
        console.error("PPT generation failed:", error?.response?.data || error?.message || error);

        return {
            ...state,
            aiResponse: "❌ Failed to Generate PPT",
        };
    }
};