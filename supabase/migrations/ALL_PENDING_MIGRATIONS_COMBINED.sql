-- ==============================================================================
-- ALL PENDING MIGRATIONS COMBINED (NetRoot AI Platform)
-- Fully audited & synchronized against every migration in supabase/migrations/
-- Safe, Idempotent (IF NOT EXISTS), and ready to run in Supabase SQL Editor.
-- ==============================================================================

-- 1. Enable Vector Extension (for pgvector Document RAG Engine)
CREATE EXTENSION IF NOT EXISTS vector;

-- ------------------------------------------------------------------------------
-- 2. Extend Existing Base Tables with Missing Columns
-- ------------------------------------------------------------------------------

-- Profiles: Add PPT lifetime counter and Wallet balance
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS lifetime_ppt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 5) NOT NULL DEFAULT 0.00000;

CREATE INDEX IF NOT EXISTS profiles_lifetime_ppt_idx ON public.profiles(lifetime_ppt_count);
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_balance ON public.profiles(wallet_balance);

-- User Decks: Add AI Edits counter
ALTER TABLE IF EXISTS public.user_decks
  ADD COLUMN IF NOT EXISTS ai_edits_count integer NOT NULL DEFAULT 0;

-- Subscriptions: Add auto-renew, plan term, and trial tracking
ALTER TABLE IF EXISTS public.subscriptions
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS plan_term text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS trial_end timestamptz;

-- Threads: Add pinning and workspace association (TEXT to match workspaces.id)
ALTER TABLE IF EXISTS public.threads
  ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS workspace_id text;

CREATE INDEX IF NOT EXISTS idx_threads_pinned_updated ON public.threads(is_pinned, updated_at DESC);

-- Usage Logs: Add prompt tracking
ALTER TABLE IF EXISTS public.usage_logs
  ADD COLUMN IF NOT EXISTS prompt text;

-- ------------------------------------------------------------------------------
-- 3. Document Vectorization & RAG Engine Tables (20261107000000)
-- ------------------------------------------------------------------------------

-- Knowledge Documents Metadata Table
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id text,
  thread_id text,
  file_name text NOT NULL,
  file_size bigint DEFAULT 0,
  mime_type text,
  file_type text DEFAULT 'file',
  total_chunks int DEFAULT 0,
  status text DEFAULT 'ready',
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document Chunks Table with 384-dimensional dense vectors
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  embedding vector(384),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc_id ON public.document_chunks(document_id);

-- HNSW Cosine Index for ultra-fast vector retrieval
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw 
  ON public.document_chunks USING hnsw (embedding vector_cosine_ops);

-- Fast Cosine Similarity Vector Search RPC Function
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.20,
  match_count int DEFAULT 6,
  filter_thread_id text DEFAULT NULL,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  file_name text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.document_id,
    d.file_name,
    c.content,
    c.metadata,
    (1 - (c.embedding <=> query_embedding))::float AS similarity
  FROM public.document_chunks c
  JOIN public.knowledge_documents d ON c.document_id = d.id
  WHERE
    (filter_thread_id IS NULL OR d.thread_id = filter_thread_id)
    AND (filter_user_id IS NULL OR d.user_id = filter_user_id)
    AND (1 - (c.embedding <=> query_embedding)) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. Model Settings & Platform Settings Tables (20261018000000)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.model_settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT,
  provider TEXT,
  description TEXT,
  context_length INTEGER DEFAULT 0,
  modalities TEXT[] DEFAULT ARRAY['text']::TEXT[],
  is_free BOOLEAN DEFAULT false,
  base_pricing JSONB DEFAULT '{}'::JSONB,
  calculated_pricing JSONB DEFAULT '{}'::JSONB,
  benchmarks JSONB DEFAULT '{}'::JSONB,
  uptime_pct NUMERIC DEFAULT 99.5,
  custom_badge TEXT,
  badge_override BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  min_plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_model_settings_featured ON public.model_settings(is_featured);
CREATE INDEX IF NOT EXISTS idx_model_settings_provider ON public.model_settings(provider);
CREATE INDEX IF NOT EXISTS idx_model_settings_min_plan ON public.model_settings(min_plan);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_settings (key, value)
VALUES (
  'models_config',
  '{"global_margin_percentage": 20, "auto_sync": true, "last_synced_at": null}'::JSONB
)
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. Wallet System Table (20261029000000)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  type text NOT NULL, -- 'deposit' | 'usage_debit' | 'refund' | 'admin_adjustment'
  amount NUMERIC(10, 5) NOT NULL,
  balance_after NUMERIC(10, 5) NOT NULL,
  model text,
  tokens_total integer DEFAULT 0,
  base_cost NUMERIC(10, 5) DEFAULT 0,
  profit_usd NUMERIC(10, 5) DEFAULT 0,
  stripe_session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_email ON public.wallet_transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);

-- Atomic Stripe wallet crediting (20261120)
CREATE OR REPLACE FUNCTION public.credit_wallet_once(
  p_user_id uuid,
  p_user_email text,
  p_amount numeric,
  p_stripe_session_id text,
  p_note text DEFAULT 'Stripe Top-Up'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_balance numeric(10, 5);
BEGIN
  IF p_user_id IS NULL
     OR p_user_email IS NULL
     OR p_amount IS NULL
     OR p_amount <= 0
     OR p_stripe_session_id IS NULL
     OR btrim(p_stripe_session_id) = '' THEN
    RAISE EXCEPTION 'A user, positive amount, and Stripe session ID are required.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_stripe_session_id), 918273);

  SELECT wallet_balance
    INTO v_balance
    FROM public.profiles
   WHERE id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet profile not found for user %.', p_user_id;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.wallet_transactions
     WHERE stripe_session_id = p_stripe_session_id
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'balance', v_balance,
      'duplicate', true
    );
  END IF;

  v_balance := round(COALESCE(v_balance, 0) + p_amount, 5);

  UPDATE public.profiles
     SET wallet_balance = v_balance
   WHERE id = p_user_id;

  INSERT INTO public.wallet_transactions (
    user_id,
    user_email,
    type,
    amount,
    balance_after,
    stripe_session_id,
    metadata
  ) VALUES (
    p_user_id,
    lower(p_user_email),
    'deposit',
    p_amount,
    v_balance,
    p_stripe_session_id,
    jsonb_build_object('note', COALESCE(p_note, 'Stripe Top-Up'))
  );

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_balance,
    'duplicate', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.credit_wallet_once(uuid, text, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_wallet_once(uuid, text, numeric, text, text) TO service_role;

-- ------------------------------------------------------------------------------
-- 6. Workspaces & Enterprise Infrastructure (20261023, 20261103, 20261104)
-- ------------------------------------------------------------------------------

-- Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    environment TEXT DEFAULT 'production',
    is_default BOOLEAN DEFAULT false,
    monthly_budget_usd NUMERIC(10, 2) DEFAULT 250.00,
    budget_alert_threshold INTEGER DEFAULT 80,
    service_tier TEXT DEFAULT 'default',
    disable_user_keys BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace API Keys
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
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Logs
CREATE TABLE IF NOT EXISTS public.workspace_logs (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    api_key_id TEXT REFERENCES public.workspace_api_keys(id) ON DELETE SET NULL,
    key_id TEXT,
    model TEXT NOT NULL,
    provider TEXT,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    cost_usd NUMERIC(10, 6) DEFAULT 0.000000,
    duration_ms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success',
    cached_status TEXT DEFAULT 'miss',
    is_byok BOOLEAN DEFAULT false,
    is_fallback BOOLEAN DEFAULT false,
    original_model TEXT,
    client_ip TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Members & RBAC
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
    invited_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_email ON public.workspace_members(email);

-- Workspace BYOK Vault (workspace_byok_keys)
CREATE TABLE IF NOT EXISTS public.workspace_byok_keys (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    display_name TEXT,
    base_url TEXT,
    model_prefix TEXT,
    is_custom BOOLEAN DEFAULT false,
    key_masked TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    tag TEXT NOT NULL,
    status TEXT DEFAULT 'unverified',
    last_tested_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_workspace_provider UNIQUE (workspace_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_workspace_byok_provider ON public.workspace_byok_keys(workspace_id, provider);
CREATE INDEX IF NOT EXISTS idx_workspace_byok_status ON public.workspace_byok_keys(workspace_id, status);

-- Workspace Routing Policies (workspace_routing_policies)
CREATE TABLE IF NOT EXISTS public.workspace_routing_policies (
    workspace_id TEXT PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    strategy TEXT NOT NULL DEFAULT 'latency',
    retry_count INTEGER NOT NULL DEFAULT 2,
    timeout_seconds INTEGER NOT NULL DEFAULT 30,
    failover_on_429 BOOLEAN NOT NULL DEFAULT true,
    failover_on_5xx BOOLEAN NOT NULL DEFAULT true,
    fallbacks JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_routing_ws ON public.workspace_routing_policies(workspace_id);

-- Workspace Presets
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

CREATE INDEX IF NOT EXISTS idx_workspace_presets_ws_id ON public.workspace_presets(workspace_id);

-- Workspace Knowledge Files (Enterprise RAG)
CREATE TABLE IF NOT EXISTS public.workspace_files (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT,
    status TEXT DEFAULT 'ready',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Classifiers & Routing Rules
CREATE TABLE IF NOT EXISTS public.workspace_classifiers (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    condition_type TEXT NOT NULL,
    condition_value TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_target TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Semantic Cache Settings
CREATE TABLE IF NOT EXISTS public.workspace_cache_settings (
    workspace_id TEXT PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    similarity_threshold NUMERIC(3, 2) DEFAULT 0.85,
    ttl_hours INTEGER DEFAULT 168,
    total_saved_usd NUMERIC(10, 4) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. Row Level Security (RLS) & Access Policies
-- ------------------------------------------------------------------------------

-- Enable RLS on core tables
ALTER TABLE public.model_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_byok_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_routing_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_presets ENABLE ROW LEVEL SECURITY;

-- Model Settings: Allow all authenticated & anonymous users to read available models
DROP POLICY IF EXISTS "allow_read_visible_models" ON public.model_settings;
CREATE POLICY "allow_read_visible_models" ON public.model_settings FOR SELECT USING (true);

-- Platform Settings: Allow read
DROP POLICY IF EXISTS "allow_read_platform_settings" ON public.platform_settings;
CREATE POLICY "allow_read_platform_settings" ON public.platform_settings FOR SELECT USING (true);

-- Knowledge Documents & Chunks: Allow users to access their own documents
DROP POLICY IF EXISTS "Users can access own documents" ON public.knowledge_documents;
CREATE POLICY "Users can access own documents" ON public.knowledge_documents
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can access chunks of own documents" ON public.document_chunks;
CREATE POLICY "Users can access chunks of own documents" ON public.document_chunks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_documents d
      WHERE d.id = document_chunks.document_id AND (d.user_id = auth.uid() OR d.user_id IS NULL)
    )
  );

-- Wallet Transactions: Allow users to view their own transactions
DROP POLICY IF EXISTS "Users can view own wallet tx" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet tx" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Workspaces: Owners can access their workspaces
DROP POLICY IF EXISTS "Users can access own workspaces" ON public.workspaces;
CREATE POLICY "Users can access own workspaces" ON public.workspaces
  FOR ALL USING (auth.uid() = user_id);

-- Workspace Members: Members can view workspace membership
DROP POLICY IF EXISTS "Members can access workspace membership" ON public.workspace_members;
CREATE POLICY "Members can access workspace membership" ON public.workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id AND w.user_id = auth.uid()
    ) OR email = auth.jwt()->>'email'
  );
