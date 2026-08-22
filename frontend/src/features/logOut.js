import api from "../utils/axios"

export const logOut = async () => {
    try {
        const { data } = await api.post("/api/auth/logout");
        return data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
