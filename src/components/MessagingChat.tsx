import React, { useState, useRef, useEffect, useContext } from 'react';
import { SendIcon, XIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { MessagingContext } from '@/context/MessagingContext';
import { Message as MessageType } from '@/types/messaging';

interface MessagingChatProps {
  recipientName?: string;
  recipientId?: string;
  initialText?: string;
  onClose?: () => void;
  isOpen?: boolean;
  inline?: boolean;
}

export function MessagingChat({
  recipientName,
  recipientId,
  initialText,
  onClose,
  isOpen = true,
  inline = false,
}: MessagingChatProps) {
  const { user } = useAuth();
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error('MessagingChat must be used within a MessagingProvider');

  const { messages, fetchMessages, sendMessage, markAsRead } = ctx;
  const { conversations, fetchConversations } = ctx;
  const [localMessages, setLocalMessages] = useState<MessageType[]>(messages || []);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [selectedRecipientName, setSelectedRecipientName] = useState<string | undefined>(recipientName);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // keep localMessages in sync with provider messages
  useEffect(() => {
    setLocalMessages(messages || []);
  }, [messages]);

  const effectiveRecipientId = recipientId ?? selectedRecipientId ?? undefined;

  useEffect(() => {
    // if no explicit recipient provided, load conversation list
    if (!recipientId) {
      fetchConversations().catch(console.error);
    }

    if (!effectiveRecipientId || !user?.id) return;
    // load conversation messages
    fetchMessages(effectiveRecipientId).catch(console.error);

    // subscribe to realtime changes for messages table
    const channel = supabase.channel('public:messages');

    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      const m = payload.new as MessageType;
      if (!m) return;
      // only add messages that belong to this two-way conversation
      if ((m.sender_id === user.id && m.recipient_id === effectiveRecipientId) || (m.sender_id === effectiveRecipientId && m.recipient_id === user.id)) {
        setLocalMessages(prev => [...prev, m]);
        // if the incoming message is for current user, mark as read
        if (m.recipient_id === user.id && !m.read) {
          markAsRead(m.id).catch(console.error);
        }
      }
    }).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
      const m = payload.new as MessageType;
      if (!m) return;
      setLocalMessages(prev => prev.map(pm => pm.id === m.id ? m : pm));
    });

    // actually subscribe our channel variable
    channel.subscribe();

    return () => {
      try { channel.unsubscribe(); } catch (e) { /* ignore */ }
    };
  }, [recipientId, effectiveRecipientId, user?.id, fetchMessages, fetchConversations, markAsRead]);

  // set initial text when opening or when recipient changes
  useEffect(() => {
    if (!initialText) return;
    setInputValue(initialText);
  }, [initialText, effectiveRecipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !effectiveRecipientId) return;
    try {
      await sendMessage(effectiveRecipientId, inputValue.trim());
      setInputValue('');
    } catch (err) {
      console.error('Send message failed', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  const containerClass = inline
    ? 'w-full h-full bg-white rounded-lg shadow-sm flex flex-col border border-gray-200'
    : 'fixed bottom-4 right-4 w-96 max-w-full h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200 z-50';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-teal-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold">{selectedRecipientName || recipientName || 'Messages'}</h3>
          <p className="text-xs text-teal-100">Online</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="hover:bg-teal-600 p-1 rounded transition-colors"
          >
            <XIcon size={20} />
          </button>
        )}
      </div>

      {/* Body: messages only when inline, otherwise show conversation list */}
      <div className="flex-1 overflow-y-auto p-0 bg-gray-50">
        {!effectiveRecipientId && !inline ? (
          // Conversation list with search (only for non-inline mode)
          <div className="p-3">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full px-3 py-2 border border-gray-200 rounded mb-3 text-sm"
            />
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(conversations || []).filter(c => c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())).map((c) => (
                <button key={c.id} onClick={() => { setSelectedRecipientId(c.other_user_id); setSelectedRecipientName(c.other_user_name); fetchMessages(c.other_user_id).catch(console.error); }} className="w-full text-left p-2 rounded hover:bg-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {c.other_user_avatar ? (
                      <img src={c.other_user_avatar} alt={c.other_user_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        {c.other_user_name?.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm">{c.other_user_name}</div>
                      <div className="text-xs text-gray-500">{c.last_message}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </button>
              ))}
              {(!conversations || conversations.length === 0) && (
                <div className="p-4 text-center text-gray-500">No conversations yet</div>
              )}
            </div>
          </div>
        ) : effectiveRecipientId ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {localMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender_id === user?.id
                      ? 'bg-teal-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user?.id ? 'text-teal-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.sender_id === user?.id && (
                      <span className="ml-2">{message.read ? '✓' : '•'}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
          <button
            onClick={handleSendMessage}
            className="bg-teal-500 text-white p-2 rounded-lg hover:bg-teal-600 transition-colors"
          >
            <SendIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
