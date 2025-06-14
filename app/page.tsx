'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Send } from 'lucide-react'
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

  // Load messages and setup realtime
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
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      await supabase
        .from('messages')
        .insert({
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white p-4 border-b shadow-sm">
        <h1 className="text-xl font-bold text-center">Live Public Chat</h1>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Send the first message!
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className="bg-white p-3 rounded-lg shadow-sm border"
            >
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-medium text-blue-600">
                  {message.username}
                </span>
                <span className="text-xs text-gray-500">
                  {format(new Date(message.created_at), 'h:mm a')}
                </span>
              </div>
              <p className="text-gray-800">{message.content}</p>
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
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name (optional)"
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            maxLength={20}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
            maxLength={500}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="bg-blue-500 text-white rounded-full p-2 disabled:bg-blue-300 hover:bg-blue-600 transition-colors"
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