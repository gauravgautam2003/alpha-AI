import { useEffect, useState } from 'react'
import Nav from './Nav'
import MessageList from "./MessageList"
import ChatInput from './ChatInput'
import { useDispatch, useSelector } from 'react-redux'
import { getMessages } from '../features/getMessage'
import { setArtifacts, setMessage } from '../redux/messageSlice'

function ChatArea() {
    const { selectedConversation } = useSelector(state => state.conversation);
    const dispatch = useDispatch();
    const [draft, setDraft] = useState("");

    useEffect(() => {
        let cancelled = false;

        const getMsg = async () => {
            if (!selectedConversation || selectedConversation.title == "New Chat") {
                dispatch(setMessage([]));
                dispatch(setArtifacts([]));
                return;
            }

            try {
                const data = await getMessages(selectedConversation._id);
                if (cancelled) return;

                dispatch(setMessage(data));
                const latestArtifactsMessage = [...data].reverse().find(msg => msg.artifacts && msg.artifacts.length > 0)
                dispatch(setArtifacts(latestArtifactsMessage?.artifacts || []))
            } catch {
                if (!cancelled) {
                    dispatch(setMessage([]));
                    dispatch(setArtifacts([]));
                }
            }
        }
        getMsg();

        return () => {
            cancelled = true;
        };
    }, [dispatch, selectedConversation])
    return (
        <main className='relative flex-1 min-w-0 flex flex-col'>
            <Nav />
            <MessageList onSuggestion={setDraft} />
            <ChatInput draft={draft} onDraftChange={setDraft} />
        </main>
    )
}

export default ChatArea
