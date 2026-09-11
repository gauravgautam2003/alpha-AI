import { getModel } from "../config/llmModels.js";
import { uploadBuffer } from "../config/cloudinary.js";
import { generatePPT } from "../utils/generatePPT.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const pptAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "ppt")
        const llm = await getModel("ppt");
        const response = await llm.invoke(`
        You are a senior presentation strategist and visual storytelling designer.
        Create a polished, audience-focused slide deck with a clear narrative and presentation-ready wording.

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
                        ""
                    ]
                }        
            ]
        }

        Rules:
        - Generate exactly 6 slides.
        - Give the deck a clear beginning, progression, and conclusion.
        - Use short, presentation-friendly headings and concise bullets.
        - Prefer 3 to 5 points per slide; never write paragraph-heavy slides.
        - Include an opening, context, key insights, examples or evidence, recommendations, and conclusion as appropriate.
        - Include visual suggestions in points only when they improve understanding.
        - Never invent facts, numbers, quotations, or sources.
        - Keep the content readable, balanced, and suitable for the stated audience.
        - Make each slide communicate one primary idea.
        - Use parallel phrasing, strong verbs, and concrete language.
        - Do not put speaker notes, markdown, or commentary outside the JSON object.

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
            aiResponse: error?.data?.message || "❌ Failed to Generate PPT",
        };
    }
};