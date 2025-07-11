-- This is an example of multiple separate foreign keys (not composite)
-- This SHOULD create multiple edges in the ERD

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100)
);

CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(user_id),
    reviewer_id INTEGER REFERENCES users(user_id),
    title VARCHAR(200)
);