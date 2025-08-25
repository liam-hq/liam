create_table "companies", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "Represents organizations using the system. Each company is a top-level entity that owns departments, users, and projects.", force: :cascade do |t|
  t.string "name", null: false, comment: "The name of the company."
  t.string "address", null: false, comment: "The registered address of the company."
end

create_table "departments", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "Represents departments within a company, organizing users into functional groups.", force: :cascade do |t|
  t.string "name", null: false, comment: "The name of the department."
  t.uuid "company_id", null: false, comment: "Foreign key linking the department to a company."
  t.index ["company_id"], name: "index_departments_on_company_id"
end

create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "Represents employees or members of a company, who are assigned roles and tasks.", force: :cascade do |t|
  t.uuid "company_id", null: false, comment: "Foreign key linking the user to a company."
  t.uuid "department_id", null: false, comment: "Foreign key linking the user to a department."
  t.datetime "created_at", null: false, comment: "The timestamp when the user was created."
  t.string "name", default: "new user", null: true, comment: "The user's full name."
  t.integer "age", default: 30, null: true, comment: "The user's age."
  t.boolean "is_deleted", default: false, null: true, comment: "Indicates whether the user is deleted (soft delete)."
  t.string "user_name", null: false, comment: "A unique identifier or login name for the user."
  t.index ["company_id"], name: "index_users_on_company_id"
  t.index ["department_id"], name: "index_users_on_department_id"
end

create_table "roles", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "Defines roles that can be assigned to users, such as 'Admin' or 'Manager'.", force: :cascade do |t|
  t.string "name", null: false, comment: "The name of the role."
  t.string "description", comment: "A brief description of the role's purpose or permissions."
end

create_table "user_roles", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "Associates users with roles to define their permissions within the company.", force: :cascade do |t|
  t.uuid "user_id", null: false, comment: "Foreign key linking to the user."
  t.uuid "role_id", null: false, comment: "Foreign key linking to the role."
  t.index ["user_id", "role_id"], unique: true, name: "index_user_roles_on_user_id_and_role_id", comment: "Ensures that each user-role pair is unique."
end

create_table "projects", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "Represents projects managed within a company. Projects are linked to tasks and users.", force: :cascade do |t|
  t.string "name", null: false, comment: "The name of the project."
  t.text "description", comment: "A detailed description of the project."
  t.uuid "company_id", null: false, comment: "Foreign key linking the project to a company."
  t.index ["company_id"], name: "index_projects_on_company_id"
end

create_table "project_assignments", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "Associates users with projects they are assigned to work on.", force: :cascade do |t|
  t.uuid "user_id", null: false, comment: "Foreign key linking to the user."
  t.uuid "project_id", null: false, comment: "Foreign key linking to the project."
  t.index ["user_id", "project_id"], unique: true, name: "index_project_assignments_on_user_id_and_project_id", comment: "Ensures that each user is uniquely assigned to a project."
end

create_table "tasks", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "Represents tasks within a project, assigned to users with deadlines and statuses.", force: :cascade do |t|
  t.string "title", null: false, comment: "The title of the task."
  t.text "description", comment: "A detailed description of the task."
  t.uuid "project_id", null: false, comment: "Foreign key linking the task to a project."
  t.uuid "assigned_user_id", null: false, comment: "Foreign key linking the task to the assigned user."
  t.datetime "due_date", comment: "The deadline for completing the task."
  t.integer "status", default: 0, comment: "The current status of the task (e.g., 0: pending, 1: in progress, 2: completed)."
  t.index ["project_id"], name: "index_tasks_on_project_id"
  t.index ["assigned_user_id"], name: "index_tasks_on_assigned_user_id"
end

create_table "comments", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "Stores comments on tasks, enabling discussions or updates.", force: :cascade do |t|
  t.text "content", null: false, comment: "The content of the comment."
  t.uuid "task_id", null: false, comment: "Foreign key linking the comment to a task."
  t.uuid "user_id", null: false, comment: "Foreign key linking the comment to the user who wrote it."
  t.datetime "created_at", null: false, comment: "The timestamp when the comment was created."
  t.index ["task_id"], name: "index_comments_on_task_id"
  t.index ["user_id"], name: "index_comments_on_user_id"
end

create_table "timesheets", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "Tracks time spent by users on tasks for reporting or billing purposes.", force: :cascade do |t|
  t.uuid "user_id", null: false, comment: "Foreign key linking the timesheet to a user."
  t.uuid "task_id", null: false, comment: "Foreign key linking the timesheet to a task."
  t.datetime "start_time", null: false, comment: "The timestamp when the user started working on the task."
  t.datetime "end_time", comment: "The timestamp when the user stopped working on the task."
  t.integer "duration_minutes", null: false, comment: "The total duration of work in minutes."
  t.index ["user_id"], name: "index_timesheets_on_user_id"
  t.index ["task_id"], name: "index_timesheets_on_task_id"
end

add_foreign_key "departments", "companies", column: "company_id", name: "fk_departments_company_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "users", "companies", column: "company_id", name: "fk_users_company_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "users", "departments", column: "department_id", name: "fk_users_department_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "user_roles", "users", column: "user_id", name: "fk_user_roles_user_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "user_roles", "roles", column: "role_id", name: "fk_user_roles_role_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "projects", "companies", column: "company_id", name: "fk_projects_company_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "project_assignments", "users", column: "user_id", name: "fk_project_assignments_user_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "project_assignments", "projects", column: "project_id", name: "fk_project_assignments_project_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "tasks", "projects", column: "project_id", name: "fk_tasks_project_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "tasks", "users", column: "assigned_user_id", name: "fk_tasks_assigned_user_id", on_update: :restrict, on_delete: :restrict
add_foreign_key "comments", "tasks", column: "task_id", name: "fk_comments_task_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "comments", "users", column: "user_id", name: "fk_comments_user_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "timesheets", "users", column: "user_id", name: "fk_timesheets_user_id", on_update: :restrict, on_delete: :cascade
add_foreign_key "timesheets", "tasks", column: "task_id", name: "fk_timesheets_task_id", on_update: :restrict, on_delete: :cascade
