-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  topic VARCHAR,
  status VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender VARCHAR NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) if needed, but since using service role, it bypasses RLS
-- If you want to use anon key, add policies like:
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations for anon" ON conversations FOR ALL USING (true);
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations for anon" ON messages FOR ALL USING (true);