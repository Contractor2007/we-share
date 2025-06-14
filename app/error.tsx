'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ChatError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error('ChatError:', error)
  }, [error])

  const getErrorDetails = () => {
    // Network/connection errors
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError')) {
      return {
        title: "Connection Error",
        description: "Unable to connect to the chat service. Please check your internet connection.",
        action: "retry"
      }
    }

    // Authentication errors
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return {
        title: "Session Expired",
        description: "Please sign in again to continue chatting.",
        action: "signin"
      }
    }

    // Rate limiting
    if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
      return {
        title: "Too Many Requests",
        description: "Please wait a moment before sending more messages.",
        action: "retry"
      }
    }

    // Server errors
    if (error.message.includes('50')) {
      return {
        title: "Server Error",
        description: "We're experiencing technical difficulties. Please try again later.",
        action: "home"
      }
    }

    // Default error
    return {
      title: "Something Went Wrong",
      description: "An unexpected error occurred in the chat.",
      action: "retry"
    }
  }

  const { title, description, action } = getErrorDetails()

  const handleAction = () => {
    switch (action) {
      case 'retry': return reset()
      case 'signin': return router.push('/signin')
      case 'home': return router.push('/')
      default: return reset()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <div style={{
        padding: '1rem',
        marginBottom: '1rem',
        border: '1px solid #ff4444',
        borderRadius: '0.375rem',
        backgroundColor: '#fff0f0',
        maxWidth: '28rem'
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
          color: '#cc0000',
          fontWeight: '600'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {title}
        </div>
        <p style={{ marginBottom: '0.5rem', color: '#333' }}>{description}</p>
        {error.digest && (
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
            Error reference: {error.digest}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={handleAction}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid #ddd',
            backgroundColor: '#f8f8f8',
            cursor: 'pointer'
          }}
        >
          {action === 'retry' && 'Try Again'}
          {action === 'signin' && 'Sign In'}
          {action === 'home' && 'Go Home'}
        </button>

        {action !== 'signin' && (
          <button
            onClick={() => router.push('/support')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #ddd',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
          >
            Contact Support
          </button>
        )}
      </div>
    </div>
  )
}