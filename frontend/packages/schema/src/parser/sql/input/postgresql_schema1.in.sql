CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id)
);

CREATE UNIQUE INDEX index_users_on_id_and_email ON public.users USING btree (id, email);
COMMENT ON TABLE users IS 'store our users.';
COMMENT ON COLUMN users.username IS 'user fullname.';
