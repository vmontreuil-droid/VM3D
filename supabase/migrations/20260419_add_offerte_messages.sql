create table if not exists offerte_messages (
  id          bigserial primary key,
  offerte_id  bigint not null references offertes(id) on delete cascade,
  sender_type text   not null check (sender_type in ('admin', 'customer')),
  sender_name text,
  message     text   not null,
  created_at  timestamptz default now() not null,
  read_at     timestamptz
);

create index if not exists offerte_messages_offerte_id_idx on offerte_messages(offerte_id, created_at);
create index if not exists offerte_messages_unread_idx    on offerte_messages(sender_type, read_at) where read_at is null;
