CREATE TABLE zoom_connections (
  user_id TEXT NOT NULL PRIMARY KEY,
  zoom_id TEXT NOT NULL,
  zoom_email TEXT NOT NULL,
  presence_status TEXT,
  presence_update_time TIMESTAMPTZ
);

CREATE INDEX zoom_connections_by_zoom_id ON zoom_connections (zoom_id);
