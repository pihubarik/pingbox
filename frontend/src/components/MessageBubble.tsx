import { useAuthStore } from '../store/authStore'
import { formatTime } from '../utils/time'
import type { Message } from '../store/chatStore'

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  const user = useAuthStore(state => state.user)
  const isMe = message.sender_id === user?.id

  const statusIcon = () => {
    if (!isMe) return null
    if (message.status === 'read') return <span className="text-blue-500 text-xs">✓✓</span>
    if (message.status === 'delivered') return <span className="text-gray-400 text-xs">✓✓</span>
    return <span className="text-gray-400 text-xs">✓</span>
  }

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
        isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm'
      }`}>
   e && (
          <p className="text-xs font-semibold text-blue-500 mb-1">{message.username}</p>
        )}
        <p className="text-sm leading-relaxed">{message.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
          <span className="text-xs">{formatTime(message.created_at)}</span>
          {statusIcon()}
        </div>
      </div>
    </div>
  )
}
