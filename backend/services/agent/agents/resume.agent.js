import { uploadBuffer } from "../config/cloudinary.js"
import { getModel } from "../config/llmModels.js"
import { deductCredits } from "../utils/deductCredits.js"
import generatePdf from "../utils/generatePDF.js"

export const resumeAgent = async (state) => {
    try {
        const llm = await getModel("resumeBuilder")
        const systemPrompt = `
                You are a professional resume builder. Your task is to help users create a well-structured and effective resume based on the information they provide.  

                Please follow these guidelines when creating the resume:
                1. Structure: Organize the resume into clear sections such as Contact Information, Summary, Work Experience, Education, Skills, and any other relevant sections based on the user's input.
                2. Clarity: Use concise and clear language. Avoid unnecessary jargon or complex terms.
                3. Relevance: Highlight the most relevant experiences and skills that align with the user's career goals.
                4. Formatting: Use bullet points for easy readability. Ensure consistent formatting throughout the resume.
                5. Tailoring: Customize the resume based on the user's target job or industry, if specified.
                6. Professionalism: Maintain a professional tone and avoid personal opinions or subjective statements.
                7. Output Format: Return the resume in a structured JSON format that can be easily converted into a PDF or Word document. The JSON should include sections, headings, and content for each section.
                8. ATS Optimization: Ensure that the resume is optimized for Applicant Tracking Systems (ATS) by using standard headings and avoiding images or graphics that may not be parsed correctly.

            User's Input:
                ${state.prompt}
                
                Please generate a resume based on the above information, following the guidelines provided. Return the resume in a structured format that can be easily converted into a PDF or Word document.
            `

        const response = await llm.invoke(systemPrompt)
        const rawContent = Array.isArray(response.content)
            ? response.content.map((part) => typeof part === "string" ? part : part?.text || "").join("")
            : String(response.content ?? "");

        const jsonText = rawContent
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .replace(/^\s*[*-]\s*/gm, "")
            .trim();

        const data = JSON.parse(jsonText)
        await deductCredits(state.userId, "resume")

        const pdfBuffer = await generatePdf(data)
        const fileName = `resume-${Date.now()}.pdf`
        const uploaded = await uploadBuffer(pdfBuffer, {
            public_id: fileName,
            resource_type: "raw",
            format: "pdf",
        });

        const downloadUrl = uploaded?.secure_url || "";

        return {
            ...state,
            aiResponse: `✅ Resume generated successfully.
                        ${data.title}
                    [Download Resume](${downloadUrl}),
                    Link Expired after 24 hours`,

        };

    } catch (error) {
        console.error("PDF generation failed:", error?.response?.data || error?.message || error);

        return {
            ...state,
            aiResponse: error?.data?.message || "❌ Failed to Generate Resume",
        };
    }
}