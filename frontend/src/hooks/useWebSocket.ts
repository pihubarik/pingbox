import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null)
  const token = useAuthStore(state => state.token)
  const { addMessage, updateMessageStatus, setTyping } = useChatStore()

  useEffect(() => {
    if (!token) return

    ws.current = new WebSocket(`ws://localhost:8001/messages/ws/${token}`)

    ws.current.onopen = () => {
      console.log('✅ WebSocket connected')
    }

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'message') {
        addMessage(
          {
            id: data.id,
            sender_id: data.sender_id,
            content: data.content,
            created_at: data.created_at,
            username: data.username,
            status: 'delivered'
          },
          data.sender_id
        )
      }

      if (data.type === 'ack') {
      updateMessageStatus(data.message_id, data.status)
      }

      if (data.type === 'typing_start') {
        setTyping(data.sender_id, true)
        // Auto clear after 3 seconds
        setTimeout(() => setTyping(data.sender_id, false), 3000)
      }

      if (data.type === 'typing_stop') {
        setTyping(data.sender_id, false)
      }

      if (data.type === 'group_message') {
        const { addGroupMessage } = useChatStore.getState()
        addGroupMessage({
          id: data.message_id,
          sender_id: data.sender_id,
          content: data.content,
          created_at: data.created_at,
          username: data.username,
          status: 'delivered'
        }, data.group_id)
      }
    }

    ws.current.onclose = () => {
      console.log('❌ WebSocket disconnected')
    }

    return () => {
      ws.current?.close()
    }
  }, [token])

  const sendMessage = (receiverId: string, content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        receiver_id: receiverId,
        content
      }))
    }
  }

  const sendTypingStart = (receiverId: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'typing_start',
        receiver_id: receiverId
      }))
    }
  }

  const sendTypingStop = (receiverId: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'typing_stop',
        receiver_id: receiverId
      }))
    }
  }

  const sendReadReceipt = (senderId: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'read_receipt',
        sender_id: senderId
      }))
    }
  }

  return { sendMessage, sendTypingStart, sendTypingStop, sendReadReceipt }
}
