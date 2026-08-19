import React, { useEffect } from 'react'
import Nav from './Nav'
import MessageList from "./MessageList"
import ChatInput from './ChatInput'
import { useDispatch, useSelector } from 'react-redux'
import { getMessages } from '../features/getMessage'
import { setMessage } from '../redux/messageSlice'

function ChatArea() {
    const { selectedConversation } = useSelector(state => state.conversation);
    const dispatch = useDispatch();

    useEffect(() => {
        const getMsg = async () => {
            if(selectedConversation) {
                if(selectedConversation.title == "New Chat") return;
                const data = await getMessages(selectedConversation?._id);
                dispatch(setMessage(data));
            }
        }
        getMsg();
        
    }, [selectedConversation?._id])
    return (
        <div className='flex-1 flex flex-col'>
            <Nav />
            <MessageList />
            <ChatInput />
        </div>
    )
}

export default ChatArea