import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import type { Contact, Group } from '../store/chatStore'
import CreateGroupModal from './CreateGroupModal'
import { api } from '../utils/api'
import { useNavigate } from 'react-router-dom'

export default function Sidebar() {
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const {
    contacts,
    setContacts,
    activeContact,
    setActiveContact,
    groups,
    setGroups,
    activeGroup,
    setActiveGroup,
  } = useChatStore()
  const [search, setSearch] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUsers()
    fetchGroups()
  }, [])

  async function fetchUsers() {
    try {
      const res = await api.get('/auth/users')
      const others = res.data.filter((u: Contact) => u.id !== user?.id)
      setContacts(others)
    } catch (err) {
      console.error('Failed to fetch users', err)
    }
  }

  async function fetchGroups() {
    try {
      const res = await api.get('/groups/')
      setGroups(res.data)
    } catch (err) {
      console.error('Failed to fetch groups', err)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const filtered = contacts.filter(c =>
    c.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-800">PingBox 📦</h2>
          <p className="text-xs text-gray-500">@{user?.username}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">
          Logout
        </button>
      </div>
      <div className="p-3 border-b border-gray-100">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">No contacts found</p>
        )}
        {filtered.map(contact => (
          <div
            key={contact.id}
            onClick={() => setActiveContact(contact)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
              activeContact?.id === contact.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {contact.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-sm truncate">
                {contact.username}
                {contact.id === user?.id ? ' (you)' : ''}
              </p>
              <p className="text-xs text-gray-400">{contact.online ? '🟢 online' : 'offline'}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Groups</p>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="text-xs text-green-600 hover:text-green-700 font-medium"
          >
            + New
          </button>
        </div>
        {groups.map((group: Group) => (
          <div
            key={group.id}
            onClick={() => setActiveGroup(group)}
            className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer
              hover:bg-gray-50 transition-colors mb-1
              ${activeGroup?.id === group.id ? 'bg-green-50 border border-green-200' : ''}`}
          >
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center
                            justify-center text-white font-semibold text-sm flex-shrink-0">
              #
            </div>
            <p className="font-medium text-gray-800 text-sm truncate">{group.name}</p>
          </div>
        ))}
      </div>
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </div>
  )
}
