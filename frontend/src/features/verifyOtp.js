import api from "../utils/axios";

export const verifyOtp = async (email, otp) => {
    const { data } = await api.post("/api/auth/verify-otp", { email, otp });
    return data;
};