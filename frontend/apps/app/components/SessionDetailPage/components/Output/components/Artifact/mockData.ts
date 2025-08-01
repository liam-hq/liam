import type { Artifact } from '@liam-hq/artifact'

// Minimal artifact data
export const minimalArtifact: Artifact = {
  requirement_analysis: {
    business_requirement: 'Create a simple task management application',
    requirements: [],
  },
}

// Requirements only (no use cases)
export const artifactWithRequirements: Artifact = {
  requirement_analysis: {
    business_requirement:
      'Build an animal encyclopedia system that can systematically manage and browse animal information. Designed for educational and research purposes, balancing accurate classification with easy-to-understand information presentation.',
    requirements: [
      {
        type: 'functional',
        name: 'Animal Information Management',
        description:
          'Registration and editing of basic information (name, scientific name, classification), management of characteristics and ecological information, management of images and videos',
        use_cases: [],
      },
      {
        type: 'functional',
        name: 'Search and Browse Functions',
        description:
          'Filtering by classification hierarchy, keyword search, search by characteristics',
        use_cases: [],
      },
      {
        type: 'non_functional',
        name: 'Performance',
        description:
          'Fast search across large volumes of animal data, efficient image delivery',
      },
      {
        type: 'non_functional',
        name: 'Scalability',
        description:
          'Support for new classification systems, easy addition of new attributes',
      },
    ],
  },
}

// Full example (with requirements, use cases, and execution results)
export const fullExampleArtifact: Artifact = {
  requirement_analysis: {
    business_requirement:
      'Build an animal encyclopedia system that can systematically manage and browse animal information. Designed for educational and research purposes, balancing accurate classification with easy-to-understand information presentation.',
    requirements: [
      {
        type: 'functional',
        name: 'Animal Information Management',
        description:
          'Registration and editing of basic information (name, scientific name, classification), management of characteristics and ecological information, management of images and videos',
        use_cases: [
          {
            title: 'Register New Animal',
            description:
              'Add newly discovered animals to the classification hierarchy and record their characteristics',
            dml_operations: [
              {
                useCaseId: 'uc-001',
                operation_type: 'INSERT',
                sql: `INSERT INTO taxonomies (rank, scientific_name, parent_id) VALUES ('Species', 'Panthera uncia', 6);`,
                description: 'Add Snow Leopard to taxonomy hierarchy',
                dml_execution_logs: [
                  {
                    executed_at: '2024-01-15T10:30:00Z',
                    success: true,
                    result_summary: '1 row inserted successfully',
                  },
                ],
              },
              {
                useCaseId: 'uc-001',
                operation_type: 'INSERT',
                sql: `INSERT INTO animals (taxonomy_id, scientific_name, characteristics, habitat, conservation_status) VALUES (7, 'Panthera uncia', '{"size": "medium", "weight": "27-55kg", "lifespan": "15-18 years", "diet": "carnivore", "climate": "cold"}', 'Mountain ranges of Central and South Asia', 'Vulnerable');`,
                description:
                  'Register basic animal information and characteristics',
                dml_execution_logs: [
                  {
                    executed_at: '2024-01-15T10:31:00Z',
                    success: true,
                    result_summary: '1 row inserted successfully',
                  },
                ],
              },
            ],
          },
          {
            title: 'Search Animals by Classification',
            description: 'Retrieve all animals belonging to a specific family',
            dml_operations: [
              {
                useCaseId: 'uc-002',
                operation_type: 'SELECT',
                sql: `SELECT a.*, t.scientific_name as taxonomy_name FROM animals a JOIN taxonomies t ON a.taxonomy_id = t.id WHERE t.parent_id IN (SELECT id FROM taxonomies WHERE scientific_name = 'Felidae');`,
                description: 'Search for animals in the Felidae family',
                dml_execution_logs: [
                  {
                    executed_at: '2024-01-15T11:00:00Z',
                    success: true,
                    result_summary: '3 rows returned',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'functional',
        name: 'Search and Browse Functions',
        description:
          'Filtering by classification hierarchy, keyword search, search by characteristics',
        use_cases: [
          {
            title: 'Search Animals by Characteristics',
            description:
              'Search for animals with specific characteristics using JSONB column',
            dml_operations: [
              {
                useCaseId: 'uc-003',
                operation_type: 'SELECT',
                sql: `SELECT scientific_name, characteristics, habitat FROM animals WHERE characteristics @> '{"climate": "cold"}';`,
                description: 'Search for animals living in cold climates',
                dml_execution_logs: [
                  {
                    executed_at: '2024-01-15T11:30:00Z',
                    success: true,
                    result_summary: '5 rows returned',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'non_functional',
        name: 'Performance',
        description:
          'Fast search across large volumes of animal data, efficient image delivery',
      },
      {
        type: 'non_functional',
        name: 'Data Integrity',
        description:
          'Ensuring consistency within classification hierarchy, maintaining referential integrity',
      },
    ],
  },
}

// Example with errors
export const artifactWithErrors: Artifact = {
  requirement_analysis: {
    business_requirement: 'Build a test environment for user management system',
    requirements: [
      {
        type: 'functional',
        name: 'Data Operation Testing',
        description: 'Verify data creation, update, and deletion operations',
        use_cases: [
          {
            title: 'Constraint Violation Testing',
            description:
              'Attempt to insert data that violates NOT NULL constraint',
            dml_operations: [
              {
                useCaseId: 'uc-error-001',
                operation_type: 'INSERT',
                sql: 'INSERT INTO users (id, email, created_at) VALUES (1, NULL, CURRENT_TIMESTAMP);',
                description:
                  'Insert NULL into email column (NOT NULL constraint violation)',
                dml_execution_logs: [
                  {
                    executed_at: '2024-01-15T14:00:00Z',
                    success: false,
                    result_summary:
                      'ERROR: null value in column "email" violates not-null constraint',
                  },
                ],
              },
              {
                useCaseId: 'uc-error-001',
                operation_type: 'INSERT',
                sql: `INSERT INTO users (id, email, created_at) VALUES (1, 'test@example.com', CURRENT_TIMESTAMP);`,
                description: 'Retry with correct data',
                dml_execution_logs: [
                  {
                    executed_at: '2024-01-15T14:01:00Z',
                    success: true,
                    result_summary: '1 row inserted successfully',
                  },
                ],
              },
            ],
          },
          {
            title: 'Foreign Key Constraint Testing',
            description: 'Attempt to reference non-existent parent record',
            dml_operations: [
              {
                useCaseId: 'uc-error-002',
                operation_type: 'INSERT',
                sql: `INSERT INTO user_profiles (user_id, bio) VALUES (999, 'This user does not exist');`,
                description:
                  'Insert with non-existent user_id (foreign key constraint violation)',
                dml_execution_logs: [
                  {
                    executed_at: '2024-01-15T14:30:00Z',
                    success: false,
                    result_summary:
                      'ERROR: insert or update on table "user_profiles" violates foreign key constraint',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
}

// Complex hierarchy example
export const complexHierarchyArtifact: Artifact = {
  requirement_analysis: {
    business_requirement:
      'Build an e-commerce order management system and optimize order processing flow',
    requirements: [
      {
        type: 'functional',
        name: 'Order Processing',
        description:
          'Overall order processing including order creation, updates, cancellation, and status management',
        use_cases: [
          {
            title: 'Create New Order',
            description:
              'Create a new order from cart contents and update inventory',
            dml_operations: [
              {
                useCaseId: 'uc-order-001',
                operation_type: 'INSERT',
                sql: `BEGIN;
INSERT INTO orders (customer_id, total_amount, status) VALUES (123, 15000, 'pending') RETURNING id;
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1001, 201, 2, 5000), (1001, 202, 1, 5000);
UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = 201;
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 202;
COMMIT;`,
                description:
                  'Execute order creation and inventory update within transaction',
                dml_execution_logs: [
                  {
                    executed_at: '2024-01-16T09:00:00Z',
                    success: true,
                    result_summary:
                      'Transaction completed: 1 order, 2 items created, 2 products updated',
                  },
                ],
              },
            ],
          },
          {
            title: 'Update Order Status',
            description: 'Update order status after payment confirmation',
            dml_operations: [
              {
                useCaseId: 'uc-order-002',
                operation_type: 'UPDATE',
                sql: `UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = 1001 AND status = 'pending';`,
                description: 'Update to paid status',
                dml_execution_logs: [
                  {
                    executed_at: '2024-01-16T09:30:00Z',
                    success: true,
                    result_summary: '1 row updated',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'functional',
        name: 'Inventory Management',
        description: 'Product inventory tracking, updates, and alert functions',
        use_cases: [
          {
            title: 'Detect Low Stock Products',
            description: 'Identify products with inventory below threshold',
            dml_operations: [
              {
                useCaseId: 'uc-inventory-001',
                operation_type: 'SELECT',
                sql: 'SELECT p.id, p.name, p.stock_quantity, p.reorder_level, c.name as category FROM products p JOIN categories c ON p.category_id = c.id WHERE p.stock_quantity <= p.reorder_level ORDER BY p.stock_quantity ASC;',
                description: 'List products that need reordering',
                dml_execution_logs: [
                  {
                    executed_at: '2024-01-16T10:00:00Z',
                    success: true,
                    result_summary: '8 products below reorder level',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'non_functional',
        name: 'Performance',
        description:
          'Maintain response time within 1 second even under high load',
      },
      {
        type: 'non_functional',
        name: 'Security',
        description:
          'Customer data encryption, implementation of access control',
      },
    ],
  },
}

// Example without execution logs
export const artifactWithoutExecutionLogs: Artifact = {
  requirement_analysis: {
    business_requirement: 'Implement comment functionality for blog platform',
    requirements: [
      {
        type: 'functional',
        name: 'Comment Management',
        description:
          'Comment posting, editing, deletion, and moderation functions',
        use_cases: [
          {
            title: 'Post Comment',
            description: 'Post a comment on an article',
            dml_operations: [
              {
                useCaseId: 'uc-comment-001',
                operation_type: 'INSERT',
                sql: `INSERT INTO comments (post_id, user_id, content, status) VALUES (?, ?, ?, 'pending');`,
                description: 'Create new comment in pending approval status',
                dml_execution_logs: [],
              },
            ],
          },
        ],
      },
    ],
  },
}
