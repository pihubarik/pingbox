import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { api } from '../utils/api'
import MessageBubble from './MessageBubble'

interface Props {
  sendMessage: (receiverId: string, content: string) => void
  sendTypingStart: (receiverId: string) => void
  sendTypingStop: (receiverId: string) => void
  sendReadReceipt: (senderId: string) => void
}

export default function ChatWindow({ sendMessage, sendTypingStart, sendTypingStop, sendReadReceipt }: Props) {
  const { activeContact, getMessages, addMessage, typingUsers } = useChatStore()
  const user = useAuthStore(state => state.user)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const loadedContacts = useRef<Set<string>>(new Set())

  const messages = activeContact ? getMessages(activeContact.id) : []

  useEffect(() => {
    if (!activeContact) return
    // only load history once per contact
    if (!loadedContacts.current.has(activeContact.id)) {
      loadedContacts.current.add(activeContact.id)
      loadHistory()
    }
    sendReadReceipt(activeContact.id)
  }, [activeContact])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadHistory() {
    if (!activeContact) return
    try {
      const res = await api.get(`/messages/history/${activeContact.id}`)
      res.data.forEach((msg: any) => {
        addMessage({
          ...msg,
          status: msg.read ? 'read' : msg.delivered ? 'delivered' : 'sent'
        }, activeContact.id)
      })
    } catch (err) {
      console.error('Failed to load history', err)
    }
  }

  function handleSend() {
    if (!input.trim() || !activeContact) return
    const content = input.trim()
    setInput('')

    const tempId = Date.now().toString()
    addMessage({
      id: tempId,
      sender_id: user?.id || '',
      content,
      created_at: new Date().toISOString(),
      username: user?.username,
      status: 'sent'
    }, activeContact.id)

    sendMessage(activeContact.id, content)
    sendTypingStop(activeContact.id)
  }

  function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value)
    if (!activeContact) return
    sendTypingStart(activeContact.id)
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      sendTypingStop(activeContact.id)
    }, 2000)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!activeContact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-gray-500 font-medium">Select a contact to start chatting</p>
          <p className="text-gray-400 text-sm mt-1">Your messages are end-to-end encrypted</p>
        </div>
      </div>
    )
  }

  const isTyping = typingUsers[activeContact.id]

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center
                        justify-center text-white font-semibold">
          {activeContact.username[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{activeContact.username}</p>
          <p className="text-xs text-gray-400">
            {isTyping ? (
              <span className="text-blue-500 animate-pulse">typing...</span>
            ) : (
              activeContact.online ? '🟢 online' : 'offline'
            )}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            No messages yet. Say hi! 👋
          </p>
        )}
    {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${activeContact.username}...`}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white
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
