-- Migration: Create Workspace Routing Policies & Fallback Chains
-- NetRoot AI Enterprise Infrastructure

CREATE TABLE IF NOT EXISTS public.workspace_routing_policies (
    workspace_id TEXT PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    strategy TEXT NOT NULL DEFAULT 'latency', -- 'latency' | 'cost' | 'throughput'
    retry_count INTEGER NOT NULL DEFAULT 2, -- 1 to 5 retries
    timeout_seconds INTEGER NOT NULL DEFAULT 30,
    failover_on_429 BOOLEAN NOT NULL DEFAULT true,
    failover_on_5xx BOOLEAN NOT NULL DEFAULT true,
    fallbacks JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { id, primary, fallback, trigger }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure fallback telemetry column exists in workspace_logs
ALTER TABLE public.workspace_logs 
ADD COLUMN IF NOT EXISTS is_fallback BOOLEAN DEFAULT false;

ALTER TABLE public.workspace_logs 
ADD COLUMN IF NOT EXISTS original_model TEXT;

-- Create index for quick routing policy lookups
CREATE INDEX IF NOT EXISTS idx_workspace_routing_workspace_id 
ON public.workspace_routing_policies(workspace_id);

