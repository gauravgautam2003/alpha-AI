import axios from "axios"

export const deductCredits= async (userId, agent) => {
    try {
        const { data } = await axios.post(`${process.env.CHAT_SERVICE}/deduct-credits`, {userId, agent});
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.log(error);
        return null;
    }
}