create_table "companies", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "store companies", force: :cascade do |t|
  t.string "name", null: false
  t.string "address", null: false
end

create_table "departments", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "store departments", force: :cascade do |t|
  t.string "name", null: false
  t.uuid "company_id", null: false
end

create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "store users", force: :cascade do |t|
  t.uuid "company_id", null: false
  t.uuid "department_id", null: false
  t.datetime "created_at", null: false
  t.string "name", default: "new user", null: true
  t.string "age", default: 30, null: true
  t.string "is_deleted", default: false, null: true
  t.string "user_name", null: false
end

create_table "roles", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "store roles", force: :cascade do |t|
  t.string "name", null: false
  t.string "description"
end

create_table "user_roles", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "join table for users and roles", force: :cascade do |t|
  t.uuid "user_id", null: false
  t.uuid "role_id", null: false
end

create_table "projects", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "store projects", force: :cascade do |t|
  t.string "name", null: false
  t.text "description"
  t.uuid "company_id", null: false
end
add_foreign_key "projects", "companies", column: "company_id", name: "fk_projects_company_id", on_update: :restrict, on_delete: :cascade

create_table "project_assignments", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "join table for users and projects", force: :cascade do |t|
  t.uuid "user_id", null: false
  t.uuid "project_id", null: false
end

create_table "tasks", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "store tasks", force: :cascade do |t|
  t.string "title", null: false
  t.text "description"
  t.uuid "project_id", null: false
  t.uuid "assigned_user_id", null: false
  t.datetime "due_date"
  t.integer "status", default: 0
end

create_table "comments", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "store task comments", force: :cascade do |t|
  t.text "content", null: false
  t.uuid "task_id", null: false
  t.uuid "user_id", null: false
  t.datetime "created_at", null: false
end

create_table "timesheets", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "store timesheet records", force: :cascade do |t|
  t.uuid "user_id", null: false
  t.uuid "task_id", null: false
  t.datetime "start_time", null: false
  t.datetime "end_time"
  t.integer "duration_minutes", null: false
end

create_table "invoices", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "store invoices", force: :cascade do |t|
  t.uuid "project_id", null: false
  t.uuid "company_id", null: false
  t.decimal "amount", null: false, precision: 10, scale: 2
  t.datetime "invoice_date", null: false
  t.datetime "due_date"
end

add_foreign_key "departments", "companies", column: "company_id", name: "fk_departments_company_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "users", "companies", column: "company_id", name: "fk_users_company_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "users", "departments", column: "department_id", name: "fk_users_department_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "user_roles", "users", column: "user_id", name: "fk_user_roles_user_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "user_roles", "roles", column: "role_id", name: "fk_user_roles_role_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "project_assignments", "users", column: "user_id", name: "fk_project_assignments_user_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "project_assignments", "projects", column: "project_id", name: "fk_project_assignments_project_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "tasks", "projects", column: "project_id", name: "fk_tasks_project_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "tasks", "users", column: "assigned_user_id", name: "fk_tasks_assigned_user_id", on_update: :restrict, on_delete: :restrict
add_foreign_key "comments", "tasks", column: "task_id", name: "fk_comments_task_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "comments", "users", column: "user_id", name: "fk_comments_user_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "timesheets", "users", column: "user_id", name: "fk_timesheets_user_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "timesheets", "tasks", column: "task_id", name: "fk_timesheets_task_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "invoices", "projects", column: "project_id", name: "fk_invoices_project_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "invoices", "companies", column: "company_id", name: "fk_invoices_company_id", on_update: :restrict, on_delete: :cascade
