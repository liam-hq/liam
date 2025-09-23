Fetching gem metadata from https://rubygems.org/.........
Resolving dependencies...
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 0) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "default_patterns", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "currency", default: "JPY", null: false
    t.integer "quantity", default: 0, null: false
    t.decimal "price", default: "123.45", null: false
    t.boolean "is_active", default: true, null: false
    t.text "description"
    t.jsonb "json_data", default: {}, null: false
    t.text "tags", default: [], null: false, array: true
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.timestamptz "updated_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.timestamptz "expires_at", default: -> { "(now() + 'P30D'::interval)" }
    t.float "random_value", default: -> { "random()" }, null: false
    t.decimal "discount", null: false
    t.text "special_note", default: -> { "\nCASE\n    WHEN (EXTRACT(dow FROM now()) = (0)::numeric) THEN 'Sunday'::text\n    ELSE 'Not Sunday'::text\nEND" }
    t.text "lower_name", default: -> { "lower('DEFAULT_NAME'::text)" }
    t.timestamptz "record_time", default: -> { "statement_timestamp()" }
    t.text "app_user"
    t.text "greeting", default: -> { "default_greeting()" }
    t.timestamptz "expiry_date", default: -> { "default_expiry()" }
  end
end
