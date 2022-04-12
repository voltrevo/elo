CREATE TABLE general_user_data (
  user_id VARCHAR NOT NULL,
  collection_id VARCHAR NOT NULL,
  element_id VARCHAR NOT NULL,
  data BYTEA NOT NULL,
  PRIMARY KEY (user_id, collection_id, element_id)
);
