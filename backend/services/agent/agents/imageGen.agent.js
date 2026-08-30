import axios from "axios";
import cloudinary, { uploadBuffer } from "../config/cloudinary.js";

export const imageGenAgent = async (state) => {

    try {
        const prompt = String(state.prompt || "").trim();

        if (!prompt) {
            throw new Error("Image request is empty");
        }

        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`

        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" })

        const buffer = Buffer.from(imageResponse.data)

        const filename = `image-${Date.now()}`;
        const uploadedImage = await uploadBuffer(buffer, {
            public_id: filename,
            resource_type: "image",
            format: "png",
        });


        const downloadUrl = uploadedImage?.secure_url || "";

        return {
            ...state,
            aiResponse: `✅ Image generated successfully.
                    [Download Image](${downloadUrl}),
                    Link Expired after 24 hours`,
            images: [downloadUrl],
        };
    } catch (error) {
        console.error("Image generation failed:", error?.response?.data || error?.message || error);

        return {
            ...state,
            aiResponse: "❌ Failed to Generate Image",
            images: [],
        };
    }
}