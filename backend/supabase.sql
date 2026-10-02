-- Run once in a private Supabase project's SQL editor. Uses caller's identity and RLS.
create table if not exists public.dokkanos_snapshots (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null,
 revision bigint not null default 1,
 updated_at timestamptz not null default now(),
 constraint snapshot_size check (octet_length(payload::text) <= 8000000)
);
alter table public.dokkanos_snapshots enable row level security;
create policy "Own DokkanOS state" on public.dokkanos_snapshots
 for all to authenticated using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
revoke all on public.dokkanos_snapshots from anon;
grant select, insert, update on public.dokkanos_snapshots to authenticated;
create or replace function public.dokkanos_save(expected_revision bigint, payload_data jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare next_revision bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if payload_data->>'format' <> 'DokkanOS' or payload_data->>'version' <> '1'
 or jsonb_typeof(payload_data->'entries') <> 'object' then raise exception 'Invalid snapshot'; end if;
 if expected_revision = 0 then
  insert into public.dokkanos_snapshots(user_id,payload,revision)
  values(auth.uid(),payload_data,1) on conflict(user_id) do nothing returning revision into next_revision;
 else
  update public.dokkanos_snapshots set payload=payload_data, revision=revision+1, updated_at=now()
  where user_id=auth.uid() and revision=expected_revision returning revision into next_revision;
 end if;
 return jsonb_build_object('ok',next_revision is not null,'revision',next_revision);
end; $$;
revoke all on function public.dokkanos_save(bigint,jsonb) from public,anon;
grant execute on function public.dokkanos_save(bigint,jsonb) to authenticated;
