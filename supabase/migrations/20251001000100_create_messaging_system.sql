-- Create messaging and notification system tables

-- 1. MESSAGE THREADS TABLE
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_type TEXT NOT NULL CHECK (thread_type IN ('direct', 'group', 'system', 'support_request')),
  subject TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived BOOLEAN DEFAULT false
);

-- Add indexes for message threads
CREATE INDEX IF NOT EXISTS idx_message_threads_created_by ON message_threads(created_by);
CREATE INDEX IF NOT EXISTS idx_message_threads_reference ON message_threads(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_type ON message_threads(thread_type);

-- 2. MESSAGE THREAD PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS message_thread_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('admin', 'participant', 'observer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN DEFAULT false,
  UNIQUE(thread_id, user_id)
);

-- Add indexes for thread participants
CREATE INDEX IF NOT EXISTS idx_thread_participants_thread_id ON message_thread_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_participants_user_id ON message_thread_participants(user_id);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'attachment')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Add indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('system', 'milestone', 'reminder', 'announcement', 'message')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Add indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR MESSAGE_THREADS
-- Users can view threads they participate in
CREATE POLICY "Users can view their threads"
  ON message_threads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM message_thread_participants
      WHERE message_thread_participants.thread_id = message_threads.id
      AND message_thread_participants.user_id = auth.uid()
    )
  );

-- Users can create threads
CREATE POLICY "Users can create threads"
  ON message_threads
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update threads they created
CREATE POLICY "Users can update their threads"
  ON message_threads
  FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS POLICIES FOR MESSAGE_THREAD_PARTICIPANTS
-- Users can view participants in their threads
CREATE POLICY "Users can view thread participants"
  ON message_thread_participants
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM message_thread_participants mtp
      WHERE mtp.thread_id = message_thread_participants.thread_id
      AND mtp.user_id = auth.uid()
    )
  );

-- Thread creators can add participants
CREATE POLICY "Thread creators can add participants"
  ON message_thread_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = thread_id
      AND message_threads.created_by = auth.uid()
    )
  );

-- Users can update their own participant record
CREATE POLICY "Users can update their participant record"
  ON message_thread_participants
  FOR UPDATE
  USING (user_id = auth.uid());

-- RLS POLICIES FOR MESSAGES
-- Users can view messages in their threads
CREATE POLICY "Users can view messages in their threads"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM message_thread_participants
      WHERE message_thread_participants.thread_id = messages.thread_id
      AND message_thread_participants.user_id = auth.uid()
    )
  );

-- Users can send messages in their threads
CREATE POLICY "Users can send messages in their threads"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM message_thread_participants
      WHERE message_thread_participants.thread_id = thread_id
      AND message_thread_participants.user_id = auth.uid()
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update their messages"
  ON messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- RLS POLICIES FOR NOTIFICATIONS
-- Users can view their own notifications
CREATE POLICY "Users can view their notifications"
  ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- System can create notifications (for now, allow authenticated users)
CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
  ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete their notifications"
  ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- Add comments
COMMENT ON TABLE message_threads IS 'Container for message conversations';
COMMENT ON TABLE message_thread_participants IS 'Tracks participants in message threads';
COMMENT ON TABLE messages IS 'Individual messages within threads';
COMMENT ON TABLE notifications IS 'System notifications and alerts';

-- Create function to update thread updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update thread timestamp when new message is added
CREATE TRIGGER update_thread_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_thread_timestamp();
