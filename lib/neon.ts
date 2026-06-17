import { neon } from '@neondatabase/serverless';

if (!process.env.NEON_CONNECTION_STR) {
  throw new Error('NEON_CONNECTION_STR is not set in the environment variables');
}

export const sql = neon(process.env.NEON_CONNECTION_STR);

export const initNeonDB = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id VARCHAR(255) NOT NULL,
      receiver_id VARCHAR(255) NOT NULL,
      encrypted_content TEXT NOT NULL,
      iv TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
    ON messages(sender_id, receiver_id);
  `;
  
  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_created_at 
    ON messages(created_at);
  `;

  // Note-specific AI chat history
  await sql`
    CREATE TABLE IF NOT EXISTS note_chats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      note_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_note_chats_note_user 
    ON note_chats(note_id, user_id, created_at);
  `;
};
