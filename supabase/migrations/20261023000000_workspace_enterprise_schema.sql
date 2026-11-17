-- 1. Ensure Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    environment TEXT DEFAULT 'production',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure API Keys Table (with last_used_at)
CREATE TABLE IF NOT EXISTS public.workspace_api_keys (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_masked TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    monthly_limit_usd NUMERIC(10, 2) DEFAULT 100.00,
    current_spend_usd NUMERIC(10, 4) DEFAULT 0.00,
    allowed_models TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active',
    last_used_at TIMESTAMPTZ, --  Security & audit timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure Request Logs Table (with cached_status)
CREATE TABLE IF NOT EXISTS public.workspace_logs (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    key_id TEXT,
    model TEXT NOT NULL,
    provider TEXT,
    status INTEGER DEFAULT 200,
    latency_ms INTEGER DEFAULT 0,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost_usd NUMERIC(10, 6) DEFAULT 0.00,
    profit_usd NUMERIC(10, 6) DEFAULT 0.00,
    cached_status BOOLEAN DEFAULT false, --  True if served via Semantic Cache
    client_ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Knowledge Files (RAG)
CREATE TABLE IF NOT EXISTS public.workspace_files (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    estimated_tokens INTEGER DEFAULT 0,
    sync_chat BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'ready',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Classifiers & Intent Rules (with Execution Priority)
CREATE TABLE IF NOT EXISTS public.workspace_classifiers (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1, --  Order of execution (1, 2, 3...)
    condition_type TEXT NOT NULL, -- 'keyword' | 'regex' | 'token_length' | 'toxicity'
    condition_value TEXT NOT NULL,
    target_action TEXT NOT NULL, -- 'route_model' | 'block' | 'apply_system_prompt'
    target_value TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Semantic Cache & Similarity Threshold
CREATE TABLE IF NOT EXISTS public.workspace_cache_settings (
    workspace_id TEXT PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    similarity_threshold NUMERIC(3, 2) DEFAULT 0.85, --  Slider: 0.70 to 0.98
    ttl_hours INTEGER DEFAULT 168,
    total_saved_usd NUMERIC(10, 4) DEFAULT 0.00,
    total_cache_hits INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on priority for rapid classifier evaluation
CREATE INDEX IF NOT EXISTS idx_workspace_classifiers_priority 
ON public.workspace_classifiers(workspace_id, priority ASC);

-- Add index on logs for rapid timeseries queries
CREATE INDEX IF NOT EXISTS idx_workspace_logs_timestamp 
ON public.workspace_logs(workspace_id, created_at DESC);
