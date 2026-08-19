import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
    name: "conversation",
    initialState: {
        conversations: [],
        selectedConversation: null
    },

    reducers: {
        setConversations: (state, actions) => {
            state.conversations = actions.payload
        },
        addConversation: (state, actions) => {
            state.conversations.unshift(actions.payload);
        },
        setSelectedConversation: (state, actions) => {
            state.selectedConversation = actions.payload
        },
        setConversationTitle: (state, actions) => {
            const {title, conversationId} = actions.payload;
            state.conversations = state.conversations.map((conv) => (
                conv._id == conversationId ? {...conv, title} : conv
            ))

            if(state.selectedConversation?._id == conversationId) {
                state.selectedConversation = {...state.selectedConversation, title}
            }
        }
    }
})

export const { setConversations, addConversation, setSelectedConversation, setConversationTitle } = conversationSlice.actions;
export default conversationSlice.reducer;