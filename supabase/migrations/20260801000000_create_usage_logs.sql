create table if not exists usage_logs (
  id          bigserial primary key,
  ts          bigint       not null,
  user_email  text,
  model       text,
  plan        text,
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  cached_tokens int not null default 0,
  latency_ms    int not null default 0,
  prompt        text,
  created_at  timestamptz not null default now()
);

create index if not exists usage_logs_ts_idx         on usage_logs (ts desc);
create index if not exists usage_logs_user_email_idx on usage_logs (user_email);

-- Allow service role full access (server uses service role key)
alter table usage_logs enable row level security;
create policy "service role full access" on usage_logs
  using (true) with check (true);
