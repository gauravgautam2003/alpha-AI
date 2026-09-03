import axios from "axios"

export const getMessages = async (conversationId, userId) => {
    try {
        const { data } = await axios.get(`${process.env.AUTH_SERVICE}/get-messages/${conversationId}`, {
            headers: userId ? { "x-user-id": userId } : undefined
        });
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.log(error);
        return null;
    }
}