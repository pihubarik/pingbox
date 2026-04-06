import { useState } from 'react'
import { useChatStore } from '../store/chatStore'
import { api } from '../utils/api'

interface Props {
  onClose: () => void
}

export default function CreateGroupModal({ onClose }: Props) {
  const { contacts, setGroups, groups } = useChatStore()
  const [name, setName] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleMember(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  async function handleCreate() {
    if (!name.trim() || selectedIds.length === 0) {
      setError('Add a group name and at least one member')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/groups/', {
        name: name.trim(),
        member_ids: selectedIds
      })
      setGroups([...groups, res.data])
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="font-bold text-gray-800 text-lg mb-4">Create Group</h2>

        {error && (
          <p className="text-red-500 text-sm mb-3">{error}</p>
        )}

        <input
          type="text"
          placeholder="Group name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4
                     focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <p className="text-xs text-gray-500 mb-2 font-medium">Select members:</p>
        <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
          {contacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => toggleMember(contact.id)}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer
                ${selectedIds.includes(contact.id)
                  ? 'bg-green-50 border border-green-300'
                  : 'hover:bg-gray-50 border border-transparent'
                }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center
                              justify-center text-white text-xs font-semibold">
                {contact.username[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-800">{contact.username}</span>
              {selectedIds.includes(contact.id) && (
                <span className="ml-auto text-green-600 text-xs">✓</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
          className="flex-1 py-2 rounded-lg border border-gray-300
                       text-gray-600 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700
                       text-white text-sm disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
