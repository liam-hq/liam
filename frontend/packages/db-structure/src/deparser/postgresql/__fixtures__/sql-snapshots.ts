export const SQL_SNAPSHOTS = {
  basicCreateTable: `CREATE TABLE "users" (
  "id" bigint NOT NULL,
  "email" varchar(255) NOT NULL
);

ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");`,

  createTableWithComments: `CREATE TABLE "products" (
  "id" bigint NOT NULL
);

COMMENT ON TABLE "products" IS 'Product table';
COMMENT ON COLUMN "products"."id" IS 'Product ID';

ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");`,

  createTableWithDefaults: `CREATE TABLE "settings" (
  "id" bigint NOT NULL,
  "enabled" boolean NOT NULL DEFAULT TRUE,
  "count" integer DEFAULT 0,
  "title" varchar(50) DEFAULT 'Default Title'
);

ALTER TABLE "settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");`,

  stringEscapingInComments: `CREATE TABLE "test" (
  "id" bigint NOT NULL
);

COMMENT ON TABLE "test" IS 'Table with ''quotes'' in comment';
COMMENT ON COLUMN "test"."id" IS 'Column with ''quotes'' in comment';

ALTER TABLE "test" ADD CONSTRAINT "test_pkey" PRIMARY KEY ("id");`,

  multipleTables: `CREATE TABLE "users" (
  "id" bigint NOT NULL
);

CREATE TABLE "products" (
  "id" bigint NOT NULL,
  "name" varchar(100) NOT NULL
);

ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");`,

  createIndexStatements: `CREATE TABLE "users" (
  "id" bigint NOT NULL,
  "email" varchar(255) NOT NULL
);

CREATE INDEX "idx_users_email" ON "users" USING BTREE ("email");`,

  uniqueIndexStatements: `CREATE TABLE "users" (
  "id" bigint NOT NULL,
  "username" varchar(50) NOT NULL
);

CREATE UNIQUE INDEX "idx_users_username_unique" ON "users" USING BTREE ("username");`,

  compositeIndexStatements: `CREATE TABLE "orders" (
  "id" bigint NOT NULL,
  "user_id" bigint NOT NULL,
  "created_at" timestamp NOT NULL
);

CREATE INDEX "idx_orders_user_date" ON "orders" USING BTREE ("user_id", "created_at");`,

  indexWithoutType: `CREATE TABLE "products" (
  "id" bigint NOT NULL,
  "category_id" bigint
);

CREATE INDEX "idx_products_category" ON "products" ("category_id");`,

  primaryKeyConstraints: `CREATE TABLE "users" (
  "id" bigint NOT NULL
);

ALTER TABLE "users" ADD CONSTRAINT "pk_users_id" PRIMARY KEY ("id");`,

  foreignKeyConstraints: `CREATE TABLE "users" (
  "id" bigint NOT NULL
);

CREATE TABLE "orders" (
  "id" bigint NOT NULL,
  "user_id" bigint NOT NULL
);

ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE SET NULL;`,

  uniqueConstraints: `CREATE TABLE "users" (
  "id" bigint NOT NULL,
  "email" varchar(255) NOT NULL
);

ALTER TABLE "users" ADD CONSTRAINT "uk_users_email" UNIQUE ("email");`,

  checkConstraints: `CREATE TABLE "products" (
  "id" bigint NOT NULL,
  "price" decimal(10,2) NOT NULL
);

ALTER TABLE "products" ADD CONSTRAINT "ck_products_price_positive" CHECK (price > 0);`,

  complexSchema: `CREATE TABLE "users" (
  "id" bigint NOT NULL,
  "email" varchar(255) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);

COMMENT ON TABLE "users" IS 'Users table';
COMMENT ON COLUMN "users"."id" IS 'User ID';

CREATE TABLE "products" (
  "id" bigint NOT NULL,
  "name" varchar(100) NOT NULL,
  "price" decimal(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE "orders" (
  "id" bigint NOT NULL,
  "user_id" bigint NOT NULL,
  "product_id" bigint NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX "idx_users_email" ON "users" USING BTREE ("email");

CREATE INDEX "idx_products_name" ON "products" ("name");

CREATE INDEX "idx_orders_user_product" ON "orders" USING BTREE ("user_id", "product_id");

ALTER TABLE "products" ADD CONSTRAINT "ck_products_price" CHECK (price >= 0);

ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_product" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;`,

  circularForeignKeys: `CREATE TABLE "departments" (
  "id" bigint NOT NULL,
  "name" varchar(100) NOT NULL,
  "manager_id" bigint
);

CREATE TABLE "employees" (
  "id" bigint NOT NULL,
  "name" varchar(100) NOT NULL,
  "department_id" bigint NOT NULL
);

ALTER TABLE "departments" ADD CONSTRAINT "fk_departments_manager" FOREIGN KEY ("manager_id") REFERENCES "employees" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "employees" ADD CONSTRAINT "fk_employees_department" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;`,
}