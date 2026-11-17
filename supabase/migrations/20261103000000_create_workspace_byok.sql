-- Migration: 20261103000000_create_workspace_byok.sql
-- Description: Create Bring-Your-Own-Key (BYOK) encrypted vault table with Custom Provider and Pro Plan support.

-- 1. Create Workspace BYOK Keys Vault Table
CREATE TABLE IF NOT EXISTS public.workspace_byok_keys (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g. 'openai', 'anthropic', 'google', 'groq', 'deepseek', 'xai', 'mistral' or custom id
    display_name TEXT,
    base_url TEXT, -- Base URL for Custom OpenAI-compatible providers (e.g. vLLM, Ollama, Together)
    model_prefix TEXT, -- Custom model prefix or exact model identifier
    is_custom BOOLEAN DEFAULT false,
    key_masked TEXT NOT NULL,
    ciphertext TEXT NOT NULL, -- AES-256-GCM encrypted key data
    iv TEXT NOT NULL,
    tag TEXT NOT NULL,
    status TEXT DEFAULT 'unverified', -- 'verified', 'invalid', 'unverified', 'paused_free'
    last_tested_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_workspace_provider UNIQUE (workspace_id, provider)
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_workspace_byok_provider 
ON public.workspace_byok_keys(workspace_id, provider);

CREATE INDEX IF NOT EXISTS idx_workspace_byok_status 
ON public.workspace_byok_keys(workspace_id, status);

-- 3. Ensure logs table has BYOK indicator
ALTER TABLE public.workspace_logs 
ADD COLUMN IF NOT EXISTS is_byok BOOLEAN DEFAULT false;
