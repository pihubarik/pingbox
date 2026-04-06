import { create } from 'zustand'

export interface Message {
  id: string
  sender_id: string
  receiver_id?: string
  content: string
  created_at: string
  username?: string
  status?: 'sent' | 'delivered' | 'read'
}

export interface Contact {
  id: string
  username: string
  email: string
  online?: boolean
  last_seen?: string
  typing?: boolean
}

export interface Group {
  id: string
  name: string
  created_by: string
  members?: string[]
}

interface ChatState {
  messagesByContact: Record<string, Message[]>
  contacts: Contact[]
  activeContact: Contact | null
  typingUsers: Record<string, boolean>

  groups: Group[]
  activeGroup: Group | null
  groupMessages: Record<string, Message[]>

  setActiveContact: (contact: Contact) => void
  addMessage: (message: Message, contactId: string) => void
  updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'read') => void
  setContacts: (contacts: Contact[]) => void
  setTyping: (userId: string, isTyping: boolean) => void
  getMessages: (contactId: string) => Message[]

  setGroups: (groups: Group[]) => void
  setActiveGroup: (group: Group | null) => void
  addGroupMessage: (message: Message, groupId: string) => void
  getGroupMessages: (groupId: string) => Message[]
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByContact: {},
  contacts: [],
  activeContact: null,
  typingUsers: {},

  groups: [],
  activeGroup: null,
  groupMessages: {},

  setGroups: (groups) => set({ groups }),

  setActiveGroup: (group) => set({ activeGroup: group, activeContact: null }),

  addGroupMessage: (message, groupId) => set((state) => {
    const existing = state.groupMessages[groupId] || []
    const isDuplicate = existing.some(m => m.id === message.id)
    if (isDuplicate) return state
    return {
      groupMessages: {
        ...state.groupMessages,
        [groupId]: [...existing, message]
      }
    }
  }),

  getGroupMessages: (groupId) => {
    return get().groupMessages[groupId] || []
  },

  setActiveContact: (contact) => set({ activeContact: contact, activeGroup: null }),

  addMessage: (message, contactId) => set((state) => {
    const existing = state.messagesByContact[contactId] || []
    // avoid duplicate messages
    const isDuplicate = existing.some(m => m.id === message.id)
    if (isDuplicate) return state
    return {
      messagesByContact: {
        ...state.messagesByContact,
        [contactId]: [...existing, message]
      }
    }
  }),

  updateMessageStatus: (messageId, status) => set((state) => {
    const updated = { ...state.messagesByContact }
    for (const contactId in updated) {
      updated[contactId] = updated[contactId].map(msg =>
        msg.id === messageId ? { ...msg, status } : msg
      )
    }
    return { messagesByContact: updated }
  }),

  setContacts: (contacts) => set({ contacts }),

  setTyping: (userId, isTyping) => set((state) => ({
    typingUsers: { ...state.typingUsers, [userId]: isTyping }
  })),

  getMessages: (contactId) => {
    return get().messagesByContact[contactId] || []
  }
}))
