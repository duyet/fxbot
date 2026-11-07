-- The owner's own words that began a conversation, from the chat of the bot they asked, which the frame carries on.
alter table conversations add column asked text;
