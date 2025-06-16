begin;

alter table public.building_schemas add constraint building_schemas_design_session_id_key unique (design_session_id);

commit;
