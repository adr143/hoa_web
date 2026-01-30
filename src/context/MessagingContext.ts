import { createContext } from 'react';
import { Message, Conversation } from '@/types/messaging';

interface MessagingContextType {
  messages: Message[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  hasMoreConversations: boolean;
  sendMessage: (recipientId: string, text: string) => Promise<void>;
  fetchMessages: (recipientId: string) => Promise<void>;
  fetchConversations: (offset?: number, limit?: number) => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  markAsRead: (messageId: string) => Promise<void>;
  chatState?: {
    open: boolean;
    recipientId?: string | null;
    recipientName?: string | null;
    initialText?: string | null;
  };
  openChat?: (recipientId?: string | null, recipientName?: string | null, initialText?: string | null) => void;
  closeChat?: () => void;
}

export const MessagingContext = createContext<MessagingContextType | undefined>(undefined);
