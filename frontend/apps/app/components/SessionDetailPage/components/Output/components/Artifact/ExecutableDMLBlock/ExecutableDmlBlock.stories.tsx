import type { Meta, StoryObj } from '@storybook/react'
import { ExecutableDMLBlock } from './ExecutableDmlBlock'

const meta = {
  component: ExecutableDMLBlock,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ExecutableDMLBlock>

export default meta
type Story = StoryObj<typeof meta>

export const BasicSelect: Story = {
  name: 'Basic SELECT Query',
  args: {
    dmlBlock: {
      name: 'Get All Users',
      code: 'SELECT * FROM users WHERE active = true;',
    },
  },
}

export const ComplexQuery: Story = {
  name: 'Complex JOIN Query',
  args: {
    dmlBlock: {
      name: 'User Orders Summary',
      code: `SELECT 
  u.id,
  u.username,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_spent,
  MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.active = true
  AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.username
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC
LIMIT 10;`,
    },
  },
}

export const InsertQuery: Story = {
  name: 'INSERT Statement',
  args: {
    dmlBlock: {
      name: 'Create New User',
      code: `INSERT INTO users (username, email, created_at)
VALUES ('john_doe', 'john@example.com', NOW());`,
    },
  },
}

export const UpdateQuery: Story = {
  name: 'UPDATE Statement',
  args: {
    dmlBlock: {
      name: 'Update User Status',
      code: `UPDATE users
SET 
  active = false,
  updated_at = NOW()
WHERE last_login < NOW() - INTERVAL '90 days';`,
    },
  },
}

export const DeleteQuery: Story = {
  name: 'DELETE Statement',
  args: {
    dmlBlock: {
      name: 'Remove Inactive Users',
      code: `DELETE FROM users
WHERE active = false
  AND created_at < NOW() - INTERVAL '1 year';`,
    },
  },
}

export const WithCTE: Story = {
  name: 'Query with CTE',
  args: {
    dmlBlock: {
      name: 'Sales Performance Analysis',
      code: `WITH monthly_sales AS (
  SELECT
    DATE_TRUNC('month', sale_date) as month,
    product_id,
    SUM(quantity) as total_quantity,
    SUM(amount) as total_amount
  FROM sales
  WHERE sale_date >= DATE_TRUNC('year', CURRENT_DATE)
  GROUP BY DATE_TRUNC('month', sale_date), product_id
),
ranked_products AS (
  SELECT
    month,
    product_id,
    total_quantity,
    total_amount,
    ROW_NUMBER() OVER (PARTITION BY month ORDER BY total_amount DESC) as rank
  FROM monthly_sales
)
SELECT
  TO_CHAR(rp.month, 'YYYY-MM') as month,
  p.name as product_name,
  rp.total_quantity,
  rp.total_amount,
  rp.rank
FROM ranked_products rp
JOIN products p ON rp.product_id = p.id
WHERE rp.rank <= 5
ORDER BY rp.month, rp.rank;`,
    },
  },
}

export const VeryLongQuery: Story = {
  name: 'Very Long Query (Scroll Test)',
  args: {
    dmlBlock: {
      name: 'Complex Analytics Query',
      code: `-- This is a complex analytics query that demonstrates scrolling behavior
WITH RECURSIVE category_hierarchy AS (
  -- Anchor: Get all root categories
  SELECT 
    c.id,
    c.name,
    c.parent_id,
    c.description,
    0 as level,
    ARRAY[c.id] as path,
    c.name as full_path
  FROM categories c
  WHERE c.parent_id IS NULL
    AND c.active = true
  
  UNION ALL
  
  -- Recursive: Get all child categories
  SELECT 
    c.id,
    c.name,
    c.parent_id,
    c.description,
    ch.level + 1,
    ch.path || c.id,
    ch.full_path || ' > ' || c.name
  FROM categories c
  INNER JOIN category_hierarchy ch ON c.parent_id = ch.id
  WHERE c.active = true
),
product_metrics AS (
  SELECT
    p.id as product_id,
    p.name as product_name,
    p.category_id,
    p.price,
    p.cost,
    p.price - p.cost as profit_margin,
    COUNT(DISTINCT o.id) as order_count,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.quantity * oi.unit_price) as total_revenue,
    AVG(oi.quantity) as avg_quantity_per_order,
    COUNT(DISTINCT o.customer_id) as unique_customers,
    AVG(r.rating) as avg_rating,
    COUNT(DISTINCT r.id) as review_count
  FROM products p
  LEFT JOIN order_items oi ON p.id = oi.product_id
  LEFT JOIN orders o ON oi.order_id = o.id
  LEFT JOIN reviews r ON p.id = r.product_id
  WHERE p.active = true
    AND o.status IN ('completed', 'shipped')
    AND o.created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY p.id, p.name, p.category_id, p.price, p.cost
),
inventory_status AS (
  SELECT
    i.product_id,
    SUM(i.quantity) as current_stock,
    AVG(i.quantity) as avg_stock_per_location,
    COUNT(DISTINCT i.warehouse_id) as warehouse_count,
    MIN(i.last_restocked) as oldest_restock_date,
    MAX(i.last_restocked) as latest_restock_date
  FROM inventory i
  WHERE i.active = true
  GROUP BY i.product_id
)
SELECT
  ch.full_path as category_path,
  ch.level as category_level,
  pm.product_name,
  pm.price,
  pm.profit_margin,
  pm.order_count,
  pm.total_quantity_sold,
  pm.total_revenue,
  pm.avg_quantity_per_order,
  pm.unique_customers,
  COALESCE(pm.avg_rating, 0) as avg_rating,
  COALESCE(pm.review_count, 0) as review_count,
  COALESCE(is.current_stock, 0) as current_stock,
  COALESCE(is.warehouse_count, 0) as warehouse_count,
  is.latest_restock_date,
  CASE
    WHEN is.current_stock IS NULL OR is.current_stock = 0 THEN 'Out of Stock'
    WHEN is.current_stock < 10 THEN 'Low Stock'
    WHEN is.current_stock < 50 THEN 'Medium Stock'
    ELSE 'High Stock'
  END as stock_status,
  CASE
    WHEN pm.total_quantity_sold = 0 THEN 'No Sales'
    WHEN pm.total_revenue < 1000 THEN 'Low Performer'
    WHEN pm.total_revenue < 10000 THEN 'Medium Performer'
    ELSE 'High Performer'
  END as performance_category
FROM product_metrics pm
INNER JOIN category_hierarchy ch ON pm.category_id = ch.id
LEFT JOIN inventory_status is ON pm.product_id = is.product_id
WHERE pm.total_revenue > 0
ORDER BY ch.path, pm.total_revenue DESC;`,
    },
  },
}

// Story to demonstrate button states
export const LoadingState: Story = {
  name: 'Loading State (Simulated)',
  args: {
    dmlBlock: {
      name: 'Execute with Loading',
      code: 'SELECT COUNT(*) FROM large_table;',
    },
  },
  play: async ({ canvasElement }) => {
    // This would simulate clicking and showing loading state
    // In actual implementation, you'd need to modify the component
    // to accept onExecute callback or similar
    const button = canvasElement.querySelector('button')
    if (button) {
      // Button found - in real implementation, this would trigger loading state
    }
  },
}

export const ShortQueryName: Story = {
  name: 'Short Query Name',
  args: {
    dmlBlock: {
      name: 'Count',
      code: 'SELECT COUNT(*) FROM users;',
    },
  },
}

export const LongQueryName: Story = {
  name: 'Long Query Name',
  args: {
    dmlBlock: {
      name: 'Get All Active Users With Their Recent Orders and Calculate Total Spending',
      code: 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id;',
    },
  },
}
