import api from "../utils/axios";

export const sendMessage = async (payload) => {
    try {
        const { data } = await api.post("/api/agent/chat",  payload);
        return data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
