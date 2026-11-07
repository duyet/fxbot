-- The owner's order for bots in the sidebar, which a drag sets. A bot with none comes after the rest, by name.
alter table profiles add column position int;
