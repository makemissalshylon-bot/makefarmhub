-- Password reset / verification tokens
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('password_reset', 'email_verify', 'otp')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON verification_tokens(user_id);

ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; no public policies needed for tokens
