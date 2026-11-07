-- The owner's order for rooms in the sidebar, which a drag sets. A room with none comes after the rest, oldest first.
alter table rooms add column position int;
