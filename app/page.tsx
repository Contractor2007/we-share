'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Send, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

type Message = {
  id: string
  username: string
  content: string
  created_at: string
}

export default function LiveChat() {
  const supabase = createClientComponentClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [username, setUsername] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100)
      setMessages(data || [])
    }

    loadMessages()

    const channel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      await supabase.from('messages').insert({
        content: newMessage,
        username: username.trim() || 'Anonymous'
      })
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const deleteMessage = async (id: string) => {
    try {
      await supabase.from('messages').delete().eq('id', id)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-pink-100 overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-pink-500 p-4 shadow-md text-white text-center font-bold text-xl">
        🚀 Live Public Chat
      </header>

      {/* Chat Box */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            No messages yet. Be the first to chat!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="relative bg-white border border-blue-100 rounded-xl shadow p-3 pr-8 hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-blue-600">
                  {message.username}
                </span>
                <span className="text-xs text-gray-400">
                  {format(new Date(message.created_at), 'hh:mm a')}
                </span>
              </div>
              <p className="text-gray-700 break-words">{message.content}</p>

              {/* Delete Icon - always visible */}
              <button
                onClick={() => deleteMessage(message.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                title="Delete message"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={sendMessage}
        className="bg-white p-4 border-t shadow-lg"
      >
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name (optional)"
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            required
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-full p-2 hover:scale-105 transition disabled:opacity-50"
          >
            {isSending ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}