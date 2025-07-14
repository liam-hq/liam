CREATE TABLE regions (
  country_code VARCHAR(2),
  region_code VARCHAR(10),
  region_name VARCHAR(100),
  PRIMARY KEY (country_code, region_code)
);

CREATE TABLE stores (
  store_id SERIAL PRIMARY KEY,
  country_code VARCHAR(2),
  region_code VARCHAR(10),
  store_name VARCHAR(100),
  CONSTRAINT fk_store_region FOREIGN KEY (country_code, region_code)
    REFERENCES regions(country_code, region_code) ON DELETE CASCADE
);
