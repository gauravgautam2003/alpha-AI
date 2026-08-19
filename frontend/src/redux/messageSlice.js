import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
    name: "message",
    initialState: {
        messages: []
    },

    reducers: {
        setMessage: (state, actions) => {
            state.messages = actions.payload
        },
        addMessage: (state, actions) => {
            state.messages.push(actions.payload)
        }
    }
})

export const { setMessage, addMessage } = messageSlice.actions;
export default messageSlice.reducer;