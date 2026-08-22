import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
    name: "message",
    initialState: {
        messages: [],
        artifacts: []
    },

    reducers: {
        setMessage: (state, actions) => {
            state.messages = actions.payload
        },
        addMessage: (state, actions) => {
            state.messages.push(actions.payload)
        },
        setArtifacts: (state, actions) => {
            state.artifacts = actions.payload
        },
    }
})

export const { setMessage, addMessage, setArtifacts} = messageSlice.actions;
export default messageSlice.reducer;