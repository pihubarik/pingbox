import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import GroupChatWindow from '../components/GroupChatWindow'
import { useChatStore } from '../store/chatStore'
import { useWebSocket } from '../hooks/useWebSocket'

export default function ChatPage() {
  const ws = useWebSocket()
  const activeGroup = useChatStore(state => state.activeGroup)
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      {activeGroup ? (
        <GroupChatWindow />
      ) : (
        <ChatWindow
          sendMessage={ws.sendMessage}
          sendTypingStart={ws.sendTypingStart}
          sendTypingStop={ws.sendTypingStop}
          sendReadReceipt={ws.sendReadReceipt}
        />
      )}
    </div>
  )
}
