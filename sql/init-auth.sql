CREATE TABLE accounts (
  id int PRIMARY KEY,
  username varchar NOT NULL UNIQUE,
  password varchar NOT NULL,
  token varchar
);

