import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { Users as UsersIcon, Shield, Edit2, Check } from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
      if (error) throw error
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      setEditingUser(null)
      alert('User role updated!')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to update user role')
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'editor': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Layout>
      <div>
        <div className="flex items-center space-x-3 mb-8">
          <UsersIcon className="h-8 w-8 text-blue-700" />
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        </div>
        {loading ? (
          <div className="text-center py-12">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">No users found.</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div><div className="font-medium text-gray-900">{user.full_name || 'No name'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUser === user.id ? (
                        <select defaultValue={user.role} onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm">
                          <option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          <Shield className="h-3 w-3 mr-1" />{user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {editingUser === user.id ? (
                        <button onClick={() => setEditingUser(null)} className="text-blue-700 hover:text-blue-800 text-sm flex items-center space-x-1">
                          <Check className="h-4 w-4" /><span>Done</span>
                        </button>
                      ) : (
                        <button onClick={() => setEditingUser(user.id)} className="text-blue-700 hover:text-blue-800 text-sm flex items-center space-x-1">
                          <Edit2 className="h-4 w-4" /><span>Edit Role</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
