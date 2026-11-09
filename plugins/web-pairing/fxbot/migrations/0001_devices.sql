-- Each paired device: its public key, which is all it is to fxbot, with no token and no expiry. `last_seq` is the
-- greatest connect counter it has sent, so a connect can't be replayed.
create table devices (
  id text primary key,
  name text not null,
  platform text not null default '',
  key bytea not null unique,
  paired_at timestamptz not null default now(),
  paired_by text not null,                     -- where the pairing was approved: this fxbot's Settings, or a device's name
  how text not null default 'link',            -- link or code
  last_seen timestamptz,
  last_seq bigint not null default 0
);

-- Passkeys, opt-in: each pairs a wiped device again with no code. `id` is the credential's id, and `spki` its public key.
create table passkeys (
  id text primary key,
  spki bytea not null,
  alg integer not null,
  added_by text not null,
  added_at timestamptz not null default now(),
  used_at timestamptz
);
