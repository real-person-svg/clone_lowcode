CREATE TABLE resource_placements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_key TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  biz_id INTEGER NOT NULL,
  env TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  example_image TEXT,
  directory_path TEXT NOT NULL DEFAULT '',
  page_from TEXT,
  show_frequency_control INTEGER NOT NULL DEFAULT 0,
  show_reco INTEGER NOT NULL DEFAULT 0,
  ab_experiment_option_enabled INTEGER NOT NULL DEFAULT 0,
  parent_resource_key TEXT,
  version TEXT,
  version_alias TEXT,
  version_limit TEXT,
  config_data TEXT NOT NULL DEFAULT '{"content":[]}',
  extra TEXT,
  status INTEGER NOT NULL DEFAULT 1 CHECK(status IN(0,1,2)),
  creator TEXT NOT NULL,
  updater TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX resource_identity_active
  ON resource_placements(biz_id, resource_key, env)
  WHERE status != 2;

CREATE INDEX resource_list_order
  ON resource_placements(status, updated_at DESC, id DESC);

CREATE TABLE resource_placement_operations (
  version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_placement_id INTEGER NOT NULL,
  operation_type TEXT NOT NULL,
  old_config TEXT NOT NULL,
  new_config TEXT NOT NULL,
  operator TEXT NOT NULL,
  operation_time TEXT NOT NULL
);

CREATE INDEX resource_operations
  ON resource_placement_operations(resource_placement_id, version_id DESC);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL
);
