import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import { useWebSocket } from '../hooks/useWebSocket'

export default function ChatPage() {
  const ws = useWebSocket()
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <ChatWindow
        sendMessage={ws.sendMessage}
        sendTypingStart={ws.sendTypingStart}
        sendTypingStop={ws.sendTypingStop}
        sendReadReceipt={ws.sendReadReceipt}
      />
    </div>
  )
}
