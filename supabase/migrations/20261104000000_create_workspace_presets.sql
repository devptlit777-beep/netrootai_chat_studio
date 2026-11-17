-- Migration: Create Workspace Presets Table
-- NetRoot AI Enterprise Infrastructure

CREATE TABLE IF NOT EXISTS public.workspace_presets (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    default_model TEXT DEFAULT 'openai/gpt-4o',
    temperature NUMERIC(3, 2) DEFAULT 0.70,
    max_tokens INTEGER DEFAULT 2048,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rapid preset lookup by workspace
CREATE INDEX IF NOT EXISTS idx_workspace_presets_ws_id 
ON public.workspace_presets(workspace_id);

