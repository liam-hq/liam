CREATE TABLE regions (
    country_code VARCHAR(2),
    region_code VARCHAR(3),
    region_name VARCHAR(100),
    PRIMARY KEY (country_code, region_code)
);

CREATE TABLE stores (
    store_id SERIAL PRIMARY KEY,
    store_name VARCHAR(100),
    country_code VARCHAR(2),
    region_code VARCHAR(3),
    FOREIGN KEY (country_code, region_code) REFERENCES regions(country_code, region_code)
);