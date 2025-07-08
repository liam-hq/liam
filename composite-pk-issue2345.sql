CREATE TABLE foo (
    foo_id integer NOT NULL,
    name text
);

CREATE TABLE bar (
    bar_id integer NOT NULL,
    name text
);

CREATE TABLE foo_bar (
    foo_id integer NOT NULL,
    bar_id integer NOT NULL
);

ALTER TABLE ONLY foo
    ADD CONSTRAINT foo_pkey PRIMARY KEY (foo_id);

ALTER TABLE ONLY bar
    ADD CONSTRAINT bar_primary_key PRIMARY KEY (bar_id);

ALTER TABLE ONLY foo_bar
    ADD CONSTRAINT foo_bar_pkey PRIMARY KEY (foo_id, bar_id);

ALTER TABLE ONLY foo_bar
    ADD CONSTRAINT foo_bar_foo_id_fkey FOREIGN KEY (foo_id) REFERENCES foo(foo_id);

ALTER TABLE ONLY foo_bar
    ADD CONSTRAINT foo_bar_bar_id_fkey FOREIGN KEY (bar_id) REFERENCES bar(bar_id);