export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  current_user_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}
