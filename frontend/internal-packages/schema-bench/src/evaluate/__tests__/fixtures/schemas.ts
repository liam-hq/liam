import {
  createSchema,
  createUserTable,
  createPostTable,
  createTable,
  createIdColumn,
  createVarcharColumn,
  createTextColumn,
  createIntegerColumn,
  createPrimaryKeyConstraint,
  createForeignKeyConstraint,
} from '../schemaFactory'

// シンプルなユーザー・投稿スキーマ
export const simpleUserPostSchema = createSchema({
  user: createUserTable({
    additionalColumns: {
      name: createVarcharColumn('name', 100),
    },
  }),
  post: createPostTable({
    additionalColumns: {
      content: createTextColumn('content'),
    },
  }),
})

// 類似した名前のテーブルを持つスキーマ（参照用）
export const similarNamesReferenceSchema = createSchema({
  user_account: createTable(
    'user_account',
    {
      id: createIdColumn(),
      email: createVarcharColumn('email', 255, { unique: true }),
    },
    {
      pk_user_account: createPrimaryKeyConstraint('user_account'),
    }
  ),
  blog_post: createTable(
    'blog_post',
    {
      post_id: createIdColumn('post_id'),
      title: createVarcharColumn('title', 200),
    },
    {
      pk_blog_post: createPrimaryKeyConstraint('blog_post', 'post_id'),
    }
  ),
})

// 類似した名前のテーブルを持つスキーマ（予測用）
export const similarNamesPredictSchema = createSchema({
  user: createTable(
    'user',
    {
      user_id: createIdColumn('user_id'),
      email_address: createVarcharColumn('email_address', 255, { unique: true }),
    },
    {
      pk_user: createPrimaryKeyConstraint('user', 'user_id'),
    }
  ),
  post: createTable(
    'post',
    {
      id: createIdColumn(),
      post_title: createVarcharColumn('post_title', 200),
    },
    {
      pk_post: createPrimaryKeyConstraint('post'),
    }
  ),
})

// 顧客スキーマ（部分一致テスト用）
export const customerReferenceSchema = createSchema({
  customer: createTable(
    'customer',
    {
      customer_id: createIdColumn('customer_id'),
      first_name: createVarcharColumn('first_name', 50),
      last_name: createVarcharColumn('last_name', 50),
      email: createVarcharColumn('email', 255, { unique: true }),
    },
    {
      pk_customer: createPrimaryKeyConstraint('customer', 'customer_id'),
    }
  ),
})

export const customerPredictSchema = createSchema({
  customer: createTable(
    'customer',
    {
      id: createIdColumn(),
      first_name: createVarcharColumn('first_name', 50),
      surname: createVarcharColumn('surname', 50),
      email_address: createVarcharColumn('email_address', 255, { unique: true }),
    },
    {
      pk_customer: createPrimaryKeyConstraint('customer'),
    }
  ),
})

// 外部キー評価用スキーマ
export const foreignKeySimpleSchema = createSchema({
  users: createUserTable({ tableName: 'users' }),
  posts: createTable(
    'posts',
    {
      id: createIdColumn(),
      user_id: createIntegerColumn('user_id'),
    },
    {
      pk_posts: createPrimaryKeyConstraint('posts'),
      fk_posts_user_id: createForeignKeyConstraint('posts', 'user_id', 'users'),
    }
  ),
})

// 複数外部キーのスキーマ
export const multipleForeignKeysReferenceSchema = createSchema({
  users: createUserTable({ tableName: 'users' }),
  categories: createTable(
    'categories',
    {
      id: createIdColumn(),
    },
    {
      pk_categories: createPrimaryKeyConstraint('categories'),
    }
  ),
  posts: createTable(
    'posts',
    {
      id: createIdColumn(),
      user_id: createIntegerColumn('user_id'),
      category_id: createIntegerColumn('category_id'),
    },
    {
      pk_posts: createPrimaryKeyConstraint('posts'),
      fk_posts_user_id: createForeignKeyConstraint('posts', 'user_id', 'users'),
      fk_posts_category_id: createForeignKeyConstraint('posts', 'category_id', 'categories'),
    }
  ),
})

// 外部キー部分一致用（カテゴリー外部キーが欠落）
export const partialForeignKeysPredictSchema = createSchema({
  users: createUserTable({ tableName: 'users' }),
  categories: createTable(
    'categories',
    {
      id: createIdColumn(),
    },
    {
      pk_categories: createPrimaryKeyConstraint('categories'),
    }
  ),
  posts: createTable(
    'posts',
    {
      id: createIdColumn(),
      user_id: createIntegerColumn('user_id'),
      category_id: createIntegerColumn('category_id'),
    },
    {
      pk_posts: createPrimaryKeyConstraint('posts'),
      fk_posts_user_id: createForeignKeyConstraint('posts', 'user_id', 'users'),
    }
  ),
})

// 外部キーカラム名が異なるスキーマ
export const differentForeignKeyColumnSchema = createSchema({
  users: createUserTable({ tableName: 'users' }),
  posts: createTable(
    'posts',
    {
      id: createIdColumn(),
      author_id: createIntegerColumn('author_id'),
    },
    {
      pk_posts: createPrimaryKeyConstraint('posts'),
      fk_posts_author_id: createForeignKeyConstraint('posts', 'author_id', 'users'),
    }
  ),
})