ActiveRecord::Schema[8.0].define(version: 0) do
  create_table "products", primary_key: ["store_id", "sku"], force: :cascade do |t|
    t.integer "store_id"
    t.string "sku"
    t.text "description"
  end
end
