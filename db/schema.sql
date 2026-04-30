PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Location (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip INTEGER NOT NULL,
  timezone TEXT NOT NULL,
  excerpt TEXT
);

CREATE TABLE IF NOT EXISTS Event (
  id INTEGER PRIMARY KEY,
  wpPostId INTEGER UNIQUE,
  subject TEXT NOT NULL,
  excerpt TEXT,
  "where" TEXT,
  date TEXT NOT NULL,
  dateCivil TEXT NOT NULL,
  locationId INTEGER NOT NULL,
  FOREIGN KEY (locationId) REFERENCES Location(id)
);

CREATE TABLE IF NOT EXISTS User (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_initial TEXT,
  phone TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  address_1 TEXT NOT NULL,
  address_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS Ticket (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  courseId INTEGER NOT NULL,
  date TEXT NOT NULL,
  grade TEXT,
  attended INTEGER DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (courseId) REFERENCES Event(id),
  UNIQUE (courseId, userId)
);
