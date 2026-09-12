import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
    name: "ui",
    initialState: {
        value: "",
        auth: {
            isOpen: false,
            mode: "login"
        }
    },
    reducers: {
        setValue: (state, action) => {
            state.value = action.payload;
        },
        openAuth: (state, action) => {
            state.auth.isOpen = true;
            state.auth.mode = action.payload || "login";
        },
        closeAuth: (state) => {
            state.auth.isOpen = false;
        },
        setAuthMode: (state, action) => {
            state.auth.mode = action.payload;
        }
    }
});

export const { setValue, openAuth, closeAuth, setAuthMode } = uiSlice.actions;
export default uiSlice.reducer;
