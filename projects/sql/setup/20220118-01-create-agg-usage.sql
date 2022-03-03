CREATE TABLE agg_usage (
  date_ DATE NOT NULL,
  hour INT NOT NULL,
  concurrent_pct BIGINT NOT NULL,
  PRIMARY KEY (date_, hour)
);
