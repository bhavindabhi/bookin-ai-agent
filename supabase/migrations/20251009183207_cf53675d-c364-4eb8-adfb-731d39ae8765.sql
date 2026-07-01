-- Add business_name column to prompts table to allow custom business names
ALTER TABLE prompts ADD COLUMN business_name TEXT;