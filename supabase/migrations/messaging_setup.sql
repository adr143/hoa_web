-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Create function to get conversations
CREATE OR REPLACE FUNCTION get_conversations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  current_user_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversation_users AS (
    SELECT DISTINCT
      CASE WHEN sender_id = p_user_id THEN recipient_id ELSE sender_id END as other_user_id
    FROM messages
    WHERE sender_id = p_user_id OR recipient_id = p_user_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (
      CASE WHEN sender_id = p_user_id THEN recipient_id ELSE sender_id END
    )
      CASE WHEN sender_id = p_user_id THEN recipient_id ELSE sender_id END as other_user_id,
      text,
      created_at
    FROM messages
    WHERE sender_id = p_user_id OR recipient_id = p_user_id
    ORDER BY
      CASE WHEN sender_id = p_user_id THEN recipient_id ELSE sender_id END,
      created_at DESC
  )
  SELECT
    gen_random_uuid(),
    p_user_id,
    cu.other_user_id,
    COALESCE(e.full_name, w.full_name, 'Unknown User'),
    lm.text,
    lm.created_at,
    COUNT(CASE WHEN m.read = FALSE AND m.recipient_id = p_user_id THEN 1 END)
  FROM conversation_users cu
  LEFT JOIN last_messages lm ON cu.other_user_id = lm.other_user_id
  LEFT JOIN employers e ON cu.other_user_id = e.user_id
  LEFT JOIN workers w ON cu.other_user_id = w.user_id
  LEFT JOIN messages m ON (
    (m.sender_id = cu.other_user_id AND m.recipient_id = p_user_id) OR
    (m.sender_id = p_user_id AND m.recipient_id = cu.other_user_id)
  )
  GROUP BY cu.other_user_id, lm.text, lm.created_at;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert their own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
