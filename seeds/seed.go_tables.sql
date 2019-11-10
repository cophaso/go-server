BEGIN;

TRUNCATE
  comments,
  activity_items,
  itineraries,
  users
  RESTART IDENTITY CASCADE;

INSERT INTO thingful_users (user_name, last_name, first_name,  password)
VALUES
  ('dunder', 'Mifflin', 'Dunder', '$2a$12$uW52cZfOJ1lWWhV6mBuXL.wsvpP88uqe8kNn831Dtcno7QU/tHA2u'),
  ('b.deboop', 'Deboop', 'Bo', '$2a$12$lSyCo/VPaH5IWQnv9vqhf.eTFxxvIUum7wNF2ueAdOwTgdAFTQOzO'),
  ('c.bloggs', 'Bloggs', 'Charlie', '$2a$12$gRoDqmxvJoR0s55veGU9JONsihxFoREIlQSjFaFpUWivY4srmHYES'),
  ('s.smith', 'Smith', 'Sam', '$2a$12$G1D9YfXnLB0CtIDR9kHB/.f3ek5lAv8hLnCcJieKxVNtZ/FcUP8wa'),
  ('lexlor', 'Taylor', 'Lex', '$2a$12$HFM0benrmbUMtYUw0L.Pu.voW6laQ7s9EzScwZQDhiVtz01IwjRbi'),
  ('wippy', 'Won In', 'Ping', '$2a$12$JEbGkPYQnqxF2W4Il1s59eApoPnP6IdTSfngifduPkZyoiLPAH4NC');

INSERT INTO itineraries(title, start_date, end_date, user_id)
  VALUES
    ('Honolulu, Hawaii', '2017-7-10', '2017-7-20', 1),
    ('London, United Kingdom', '2018-7-10', '2018-7-20', 1),
    ('Tokyo, Japan', '2019-7-10', '2019-7-20', 1),
    ('Honolulu, Hawaii', '2017-7-10', '2017-7-20', 3),
    ('London, United Kingdom', '2018-7-10', '2018-7-20', 4),
    ('Tokyo, Japan', '2019-7-10', '2019-7-20', 2);

INSERT INTO activity_items(travel_type, title, description, start_date, end_date, start_time, end_time, cost, url, itinerary_id, user_id)
  VALUES 
    ('Accommodations', 'Golden Inn', 'This is an Inn', '2019-06-22', '2019-06-30', 'T10:28:32.615Z', 'T16:28:32.615Z', 1234.23, 'https://www.hotels.com/', 1, 2),
    ('Activity', 'Sailing', 'I am on a Boat!', '2019-06-22', '2019-06-23', 'T10:28:32.615Z', 'T16:28:32.615Z', 1234.00, 'https://www.boats.com/', 1, 2),
    ('Dining and Bars', 'Pub and Grill', 'This is Food', '2019-06-24', '2019-06-24', 'T10:28:32.615Z', 'T11:28:32.615Z', 1234.87, 'https://www.yelp.com/', 1, 2);