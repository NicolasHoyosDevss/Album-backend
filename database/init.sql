create extension if not exists pgcrypto;

drop table if exists album_stickers cascade;
drop table if exists albums cascade;

create table albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  nickname text default 'My album',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table album_stickers (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  sticker_code text not null,
  quantity integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  constraint unique_album_sticker unique (album_id, sticker_code),
  constraint quantity_non_negative check (quantity >= 0)
);

create index if not exists idx_albums_user_id on albums(user_id);
create index if not exists idx_album_stickers_album_id on album_stickers(album_id);
create index if not exists idx_album_stickers_sticker_code on album_stickers(sticker_code);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_albums_set_updated_at on albums;
create trigger trg_albums_set_updated_at
before update on albums
for each row
execute function set_updated_at();

drop trigger if exists trg_album_stickers_set_updated_at on album_stickers;
create trigger trg_album_stickers_set_updated_at
before update on album_stickers
for each row
execute function set_updated_at();

create or replace function touch_album_updated_at()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    update albums
    set updated_at = now()
    where id = old.album_id;

    return old;
  end if;

  update albums
  set updated_at = now()
  where id = new.album_id;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_album_stickers_touch_album_insert on album_stickers;
create trigger trg_album_stickers_touch_album_insert
after insert on album_stickers
for each row
execute function touch_album_updated_at();

drop trigger if exists trg_album_stickers_touch_album_update on album_stickers;
create trigger trg_album_stickers_touch_album_update
after update on album_stickers
for each row
execute function touch_album_updated_at();

drop trigger if exists trg_album_stickers_touch_album_delete on album_stickers;
create trigger trg_album_stickers_touch_album_delete
after delete on album_stickers
for each row
execute function touch_album_updated_at();
