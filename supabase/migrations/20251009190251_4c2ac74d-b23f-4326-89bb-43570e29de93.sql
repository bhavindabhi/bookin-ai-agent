-- Add voice selection column to prompts table
ALTER TABLE prompts ADD COLUMN voice_type TEXT DEFAULT 'alloy';

COMMENT ON COLUMN prompts.voice_type IS 'Voice type for AI agent: alloy, echo, fable, onyx, nova, shimmer';