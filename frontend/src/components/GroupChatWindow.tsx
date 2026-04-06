import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { api } from '../utils/api'

export default function GroupChatWindow() {
  const { activeGroup, getGroupMessages, addGroupMessage } = useChatStore()
  const user = useAuthStore(state => state.user)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const loadedGroups = useRef<Set<string>>(new Set())

  const messages = activeGroup ? getGroupMessages(activeGroup.id) : []

  useEffect(() => {
    if (!activeGroup) return
    if (!loadedGroups.current.has(activeGroup.id)) {
      loadedGroups.current.add(activeGroup.id)
      loadHistory()
    }
  }, [activeGroup])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadHistory() {
    if (!activeGroup) return
    try {
      const res = await api.get(`/groups/${activeGroup.id}/messages`)
      res.data.forEach((msg: any) => {
        addGroupMessage({
          id: msg.id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
          username: msg.username || msg.sender_id,
          status: 'delivered'
        }, activeGroup.id)
      })
    } catch (err) {
      console.error('Failed to load group history', err)
    }
  }

  async function handleSend() {
    if (!input.trim() || !activeGroup) return
    const content = input.trim()
    setInput('')

    // Optimistically add message
    addGroupMessage({
      id: Date.now().toString(),
      sender_id: user?.id || '',
      content,
      created_at: new Date().toISOString(),
      username: user?.username,
      status: 'sent'
    }, activeGroup.id)

    try {
      await api.post(`/groups/${activeGroup.id}/messages`, { content })
    } catch (err) {
      console.error('Failed to send group message', err)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!activeGroup) return null

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center
                        justify-center text-white font-semibold">
          #
        </div>
        <div>
          <p className="font-semibold text-gray-800">{activeGroup.name}</p>
          <p className="text-xs text-gray-400">Group chat</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            No messages yet. Start the conversation! 👋
          </p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm'
              }`}>
                {!isMe && (
                  <p className="text-xs font-semibold text-green-600 mb-1">{msg.username || msg.sender_id}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-xs mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${activeGroup.name}...`}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white
                     rounded-full flex items-center justify-center
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          ➤
        </button>
      </div>
    </div>
  )
}
