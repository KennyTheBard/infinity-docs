CREATE TABLE documents (
  id int PRIMARY KEY,
  title varchar,
  content varchar,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE users (
  id int PRIMARY KEY,
  username NOT NULL UNIQUE varchar,
  password NOT NULL varchar
);

