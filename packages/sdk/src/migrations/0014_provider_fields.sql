-- What a provider from the catalog was added with, so it runs without its entry: the fields filled into its address,
-- such as a region, and the model ids typed for it, such as Azure's deployments.
alter table providers add column fields jsonb not null default '{}', add column model_ids text[];
