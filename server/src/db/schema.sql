-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Senders Table (support multiple senders per user)
CREATE TABLE IF NOT EXISTS senders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'ethereal', -- 'ethereal' or 'gmail'
  credentials JSONB DEFAULT '{}', -- Store SMTP config or OAuth tokens securely (encryption recommended in prod)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Campaigns (batches of emails)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PROCESSING, COMPLETED, PAUSED
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emails Table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  sender_id UUID REFERENCES senders(id),
  recipient VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SCHEDULED, SENT, FAILED, CANCELLED
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  message_id VARCHAR(255), -- ID from the SMTP server
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hourly Limit Tracking (DB backed implementation option)
CREATE TABLE IF NOT EXISTS hourly_stats (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES senders(id) ON DELETE CASCADE,
  hour_window TIMESTAMP WITH TIME ZONE NOT NULL, -- Truncated to hour
  count INT DEFAULT 0,
  UNIQUE(sender_id, hour_window)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_scheduled_at ON emails(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_hourly_stats_sender_window ON hourly_stats(sender_id, hour_window);
