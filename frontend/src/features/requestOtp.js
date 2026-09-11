import api from "../utils/axios";

export const requestOtp = async (credentials) => {
    const { data } = await api.post("/api/auth/request-otp", credentials);
    return data;
};