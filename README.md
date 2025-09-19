# Bun Typed SQLite - Advanced Database Management

A powerful, type-safe SQLite database library for Bun with automatic schema validation, connection pooling, and advanced type generation.

## 🚀 Quick Start

```typescript
import { DatabaseManager } from "bun-typed-sqlite";
import { defineSchema, defineTable, defineColumns } from "bun-typed-sqlite/schema";

// Define your schema with full type safety using helper functions
const schema = defineSchema([
  defineTable({
    name: "users",
    columns: defineColumns([
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "email", type: "string", unique: true },
      { name: "role", type: "string", union: ["admin", "user", "moderator"], default: "user" },
      { name: "isActive", type: "boolean", default: true },
      { name: "createdAt", type: "Date" }
    ])
  }),
  defineTable({
    name: "posts",
    columns: defineColumns([
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "userId", type: "number" },
      { name: "title", type: "string" },
      { name: "content", type: "string", nullable: true }
    ])
  })
]);

// Create database manager with typed schema
const db = new DatabaseManager({
  dbPath: "./my-database.db",
  schema
});

// Create tables in database
db.createTablesInDatabase();

// Get type-safe table instances
const usersTable = db.getTable("users");   // ✅ Fully typed
const postsTable = db.getTable("posts");   // ✅ Fully typed

// Use with complete type safety
const users = usersTable.select({ where: { role: "admin" } });
const user = usersTable.findFirst({ where: { email: "john@example.com" } });
```

## 📖 Table of Contents

- [Database Manager](#database-manager)
- [Schema Definition](#schema-definition)
- [Table Operations](#table-operations)
- [Connection Pooling](#connection-pooling)
- [Type Safety](#type-safety)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)

## 🏗️ Database Manager

### Creating a Database Manager

The `DatabaseManager` class is the core of the library, providing schema-aware database operations:

```typescript
import { DatabaseManager } from "bun-typed-sqlite";
import { defineSchema } from "bun-typed-sqlite/schema";

// Basic usage with empty schema
const db = new DatabaseManager({
  dbPath: "./database.db",
  schema: defineSchema([])
});

// With schema for type safety
const typedDb = new DatabaseManager({
  dbPath: "./database.db",
  schema: mySchema,
  usePool: false
});

// With connection pooling
const pooledDb = new DatabaseManager({
  dbPath: "./database.db",
  schema: mySchema,
  usePool: true,
  poolConfig: {
    maxConnections: 10,
    minConnections: 2,
    enableQueryCache: true
  }
});
```

### Type-Safe Table Access

The `getTable` method provides fully typed table instances:

```typescript
// Define your schema
const schema = defineSchema([
  defineTable({
    name: "products",
    columns: defineColumns([
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "name", type: "string" },
      { name: "price", type: "float" },
      { name: "category", type: "string", union: ["electronics", "clothing", "books"] },
      { name: "inStock", type: "boolean", default: true }
    ])
  })
]);

const db = new DatabaseManager({ 
  dbPath: "./shop.db",
  schema
});

// Create tables in database (important step!)
db.createTablesInDatabase();

// Type-safe table access
const products = db.getTable("products");
// ✅ products is fully typed with your schema

// TypeScript prevents invalid table names
const invalid = db.getTable("nonexistent"); // ❌ TypeScript Error
```

## 📋 Schema Definition

### Basic Schema Structure

You can define schemas in two ways:

**Option 1: Using Helper Functions (Recommended)**
```typescript
import { defineSchema, defineTable, defineColumns } from "bun-typed-sqlite/schema";

const schema = defineSchema([
  defineTable({
    name: "TableName",
    columns: defineColumns([
      // Column definitions here
    ])
  })
]);
```

**Option 2: Traditional Approach**
```typescript
import type { DBSchema } from "bun-typed-sqlite/schema";

const schema = [
  {
    name: "TableName",
    columns: [
      // Column definitions here
    ]
  }
] as const satisfies DBSchema;
```

The **helper functions approach is recommended** as it provides:
- Better IntelliSense and autocompletion
- Cleaner syntax without type assertions
- Automatic readonly array handling
- Easier refactoring and maintenance

### Helper Functions Explained

**`defineSchema(tables)`**
- Wraps your table array with proper TypeScript const assertions
- Ensures full type safety without manual type annotations
- Supports both `const` and `readonly` arrays automatically

**`defineTable(tableDefinition)`**  
- Validates individual table structure at compile time
- Provides better error messages for malformed tables
- Makes table definitions reusable across schemas

**`defineColumns(columnArray)`**
- Optimizes column type inference for complex scenarios
- Especially useful with JSON DataType definitions
- Prevents common typing issues with union constraints

```typescript
// Example: Modular schema building
const userColumns = defineColumns([
  { name: "id", type: "number", primary: true, autoIncrement: true },
  { name: "email", type: "string", unique: true },
  { name: "role", type: "string", union: ["admin", "user", "moderator"] }
]);

const usersTable = defineTable({
  name: "users", 
  columns: userColumns
});

const postsTable = defineTable({
  name: "posts",
  columns: defineColumns([
    { name: "id", type: "number", primary: true, autoIncrement: true },
    { name: "userId", type: "number" },
    { name: "title", type: "string" }
  ])
});

const schema = defineSchema([usersTable, postsTable]);
```

### Supported Column Types

| Type | TypeScript Type | Description | Example |
|------|----------------|-------------|---------|
| `number` | `number` | Integer values | `{ name: "age", type: "number" }` |
| `string` | `string` | Text values | `{ name: "email", type: "string" }` |
| `boolean` | `boolean` | True/false values | `{ name: "isActive", type: "boolean" }` |
| `Date` | `Date` | Date/time values | `{ name: "createdAt", type: "Date" }` |
| `float` | `number` | Decimal numbers | `{ name: "price", type: "float" }` |
| `json` | Custom | Complex objects | `{ name: "metadata", type: "json", DataType: {...} }` |

### Column Properties

```typescript
interface ColumnDefinition {
  name: string;          // Column name (required)
  type: ColumnType;      // Data type (required)
  nullable?: true;       // Allow NULL values
  unique?: true;         // Enforce unique constraint
  primary?: true;        // Mark as primary key
  default?: any;         // Default value
  autoIncrement?: true;  // Auto-increment (number only)
  union?: Array<string | number>; // Restrict to specific values
}
```

### Advanced Schema Examples

```typescript
import { defineSchema, defineTable, defineColumns } from "bun-typed-sqlite/schema";

const ecommerceSchema = defineSchema([
  defineTable({
    name: "users",
    columns: defineColumns([
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "email", type: "string", unique: true },
      { name: "firstName", type: "string" },
      { name: "lastName", type: "string", nullable: true },
      { name: "role", type: "string", union: ["admin", "customer", "vendor"], default: "customer" },
      { name: "isActive", type: "boolean", default: true },
      { name: "profile", type: "json", nullable: true, DataType: {
        bio: "string",
        avatar: "string",
        preferences: {
          theme: "string",
          notifications: "boolean"
        }
      }},
      { name: "createdAt", type: "Date" }
    ])
  }),
  defineTable({
    name: "products", 
    columns: defineColumns([
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "name", type: "string" },
      { name: "description", type: "string", nullable: true },
      { name: "price", type: "float" },
      { name: "category", type: "string", union: ["electronics", "clothing", "books", "home"] },
      { name: "tags", type: "json", DataType: ["string"] },
      { name: "inStock", type: "boolean", default: true },
      { name: "createdAt", type: "Date" }
    ])
  })
]);

// Create database with schema
const db = new DatabaseManager({
  dbPath: "./ecommerce.db",
  schema: ecommerceSchema
});

// Create tables in database
db.createTablesInDatabase();
```

## 🔧 Table Operations

### Selecting Data

```typescript
const users = db.getTable("users");

// Get all records
const allUsers = users.select();

// With conditions
const activeUsers = users.select({
  where: { isActive: true }
});

// Specific fields only
const userProfiles = users.select({
  where: { role: "customer" },
  select: { id: true, firstName: true, lastName: true, email: true }
});

// Complex conditions
const filteredUsers = users.select({
  where: {
    isActive: true,
    greaterThan: { createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000) },
    OR: [{ role: "admin" }, { role: "moderator" }]
  },
  limit: 50
});
```

### Inserting Data

```typescript
// Insert single record
users.insert([{
  email: "john@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "customer",
  createdAt: new Date()
}]);

// Bulk insert with transaction
users.insert([
  { email: "user1@example.com", firstName: "User", lastName: "One", createdAt: new Date() },
  { email: "user2@example.com", firstName: "User", lastName: "Two", createdAt: new Date() }
]);

// Optimized bulk insert
const userIds = users.bulkInsert(thousandsOfUsers, 1000); // Batch size: 1000
```

### Updating Records

```typescript
// Update specific user
users.update({
  where: { id: 1 },
  values: { 
    firstName: "Updated Name",
    isActive: false 
  }
});

// Bulk update
users.update({
  where: { role: "customer" },
  values: { lastSeen: new Date() }
});
```

### Advanced Operations

```typescript
// Upsert (insert or update)
users.upsert([
  { email: "existing@example.com", firstName: "Updated", isActive: true }
], ["email"]); // Conflict column

// Pagination
const page = users.paginate({
  page: 1,
  pageSize: 20,
  where: { isActive: true },
  orderBy: { column: "createdAt", direction: "DESC" }
});

// Aggregation
const stats = users.aggregate({
  column: "createdAt",
  functions: ["COUNT", "MIN", "MAX"]
});

// Query builder
const results = users
  .query()
  .where({ isActive: true })
  .whereLike({ email: "%@company.com" })
  .select({ id: true, email: true })
  .limit(10)
  .execute();
```

## 🏊‍♂️ Connection Pooling

### Basic Pooling

```typescript
const pooledDb = new DatabaseManager({
  dbPath: "./database.db",
  schema,
  usePool: true,
  poolConfig: {
    maxConnections: 20,
    minConnections: 5,
    enableQueryCache: true,
    enableHealthChecks: true
  }
});

// Get pool statistics
const stats = pooledDb.getPoolStats();
console.log(`Active connections: ${stats?.activeConnections}`);
```

### Advanced Pool Configuration

```typescript
const advancedPool = new DatabaseManager({
  dbPath: "./database.db",
  schema,
  usePool: true,
  poolConfig: {
    maxConnections: 50,
    minConnections: 10,
    acquireTimeout: 15000,
    idleTimeout: 30000,
    maxConnectionAge: 3600000, // 1 hour
    enableQueryCache: true,
    maxCacheSize: 2000,
    enableStatementPooling: true,
    enableHealthChecks: true,
    enableLogging: true
  }
});
```

## 🛡️ Type Safety

### Automatic Type Generation

The library automatically generates TypeScript types from your schema:

```typescript
// Schema defines structure
const schema = defineSchema([
  defineTable({
    name: "orders",
    columns: defineColumns([
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "userId", type: "number" },
      { name: "total", type: "float" },
      { name: "status", type: "string", union: ["pending", "completed", "cancelled"] },
      { name: "metadata", type: "json", DataType: { notes: "string", priority: "number" } }
    ])
  })
]);

const db = new DatabaseManager({ 
  dbPath: "./orders.db",
  schema 
});
const orders = db.getTable("orders");

// TypeScript knows the exact structure
const order = orders.findFirst({ where: { id: 1 } });
// order type: { id?: number; userId: number; total: number; status: "pending" | "completed" | "cancelled"; metadata: { notes: string; priority: number } } | null
```

### Compile-Time Validation

```typescript
// ✅ Valid operations
orders.insert([{
  userId: 123,
  total: 99.99,
  status: "pending", // Type-safe union
  metadata: { notes: "Priority order", priority: 1 }
}]);

// ❌ TypeScript prevents these
orders.insert([{
  userId: "invalid", // Error: Expected number
  status: "invalid_status", // Error: Not in union
  metadata: { invalid: "field" } // Error: Doesn't match DataType
}]);

const wrongTable = db.getTable("nonexistent"); // Error: Table doesn't exist
```

## 🔬 Advanced Features

### Database Backup & Restore

```typescript
// Full backup with compression
db.backup("./backups/database.db.gz", { 
  compress: true, 
  includeData: true 
});

// Schema-only export
db.backup("./backups/schema.json", { 
  includeData: false 
});

// Restore from backup
db.restore("./backups/database.db.gz");
```

### Database Merging

```typescript
// Merge data from another database
db.mergeDatabase("./source.db", {
  conflictResolution: "replace",
  tablesFilter: ["users", "orders"]
});
```

### Schema Management

```typescript
// Export schema
const schema = db.exportSchema();

// Import schema
db.importSchema(schemaData);

// Database statistics
const stats = db.getDatabaseStats();
console.log(`${stats.tables} tables, ${stats.totalRecords} records`);
```

### Index Management

```typescript
const users = db.getTable("users");

// Create performance indexes
users.createIndex({
  name: "idx_users_email",
  columns: ["email"],
  unique: true
});

users.createIndex({
  name: "idx_users_active_created",
  columns: ["isActive", "createdAt"]
});

// Get table statistics
const tableStats = users.getTableStats();
console.log(`${tableStats.recordCount} records, ${tableStats.indexes.length} indexes`);
```

### Data Import/Export

```typescript
// Export to JSON
users.exportToJson({
  where: { isActive: true },
  filePath: "./exports/active-users.json"
});

// Import from JSON
const importResult = users.importFromJson(jsonData, {
  conflictResolution: "replace",
  batchSize: 1000
});
```

## 📊 Best Practices

### 1. Schema Design

```typescript
// Use descriptive table and column names
const schema = defineSchema([
  defineTable({
    name: "user_profiles", // Clear table naming
    columns: defineColumns([
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "user_id", type: "number", unique: true }, // Foreign key reference
      { name: "display_name", type: "string" },
      { name: "bio", type: "string", nullable: true },
      { name: "avatar_url", type: "string", nullable: true },
      { name: "created_at", type: "Date" },
      { name: "updated_at", type: "Date" }
    ])
  })
]);
```

### 2. Connection Management

```typescript
// Use pooling for high-concurrency applications
const db = new DatabaseManager({
  dbPath: "./app.db",
  schema,
  usePool: true,
  poolConfig: {
    maxConnections: Math.min(20, require('os').cpus().length * 4),
    minConnections: 2,
    enableQueryCache: true,
    enableHealthChecks: true
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await DatabaseManager.closeAllPools();
  process.exit(0);
});
```

### 3. Performance Optimization

```typescript
// Create strategic indexes
const users = db.getTable("users");

// Index frequently queried columns
users.createIndex({ name: "idx_email", columns: ["email"], unique: true });
users.createIndex({ name: "idx_active_created", columns: ["isActive", "createdAt"] });

// Use pagination for large datasets
const paginateUsers = (page: number) => users.paginate({
  page,
  pageSize: 50,
  where: { isActive: true },
  orderBy: { column: "createdAt", direction: "DESC" }
});

// Optimize with transactions for bulk operations
const insertManyUsers = (userData: any[]) => {
  const batches = chunk(userData, 1000);
  batches.forEach(batch => users.insert(batch));
};
```

### 4. Type Safety

```typescript
// Use defineSchema helper for better type inference
const schema = defineSchema([
  defineTable({
    name: "products",
    columns: defineColumns([
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "name", type: "string" },
      { name: "category", type: "string", union: ["electronics", "books"] as const }
    ])
  })
]);

// Leverage type inference
const db = new DatabaseManager({ 
  dbPath: "./products.db",
  schema
});
const products = db.getTable("products"); // Fully typed automatically
```

### 5. Error Handling

```typescript
try {
  const user = users.findFirst({ where: { email: "user@example.com" } });
  if (!user) {
    throw new Error("User not found");
  }
  
  users.update({
    where: { id: user.id },
    values: { lastSeen: new Date() }
  });
} catch (error) {
  console.error("Database operation failed:", error);
  // Handle error appropriately
}
```

---

This guide provides comprehensive documentation for the modern Bun Typed SQLite library with `DatabaseManager`, type-safe table access, and advanced database management features.
{ name: "email", type: "string", unique: true }

// Optional nullable field
{ name: "firstName", type: "string", nullable: true }

// Boolean with default value
{ name: "isActive", type: "boolean", default: true }

// Date field
{ name: "createdAt", type: "Date" }

// Decimal number with default
{ name: "price", type: "float", default: 0.00 }
```

## 🎯 Advanced Features

### Union Types (Enums)

Restrict column values to specific sets using the `union` property:

```typescript
// String enum
{ 
  name: "status", 
  type: "string", 
  union: ["active", "inactive", "pending"], 
  default: "active" 
}

// Number enum (ratings 1-5)
{ 
  name: "rating", 
  type: "number", 
  union: [1, 2, 3, 4, 5] 
}

// Product categories
{ 
  name: "category", 
  type: "string", 
  union: ["electronics", "clothing", "books", "home", "sports"] 
}
```

### Auto-Increment Fields

```typescript
// Auto-incrementing primary key
{ 
  name: "id", 
  type: "number", 
  primary: true, 
  autoIncrement: true 
}

// Auto-increment makes the field optional in inserts
// TypeScript will know this field doesn't need to be provided
```

### Constraints and Defaults

```typescript
// Unique constraint
{ name: "username", type: "string", unique: true }

// Primary key
{ name: "id", type: "number", primary: true }

// Default values
{ name: "createdAt", type: "Date", default: new Date() }
{ name: "isVerified", type: "boolean", default: false }
{ name: "attempts", type: "number", default: 0 }
```

## 🗃️ JSON Types

### Complex JSON Schema

Use the `json` type for complex nested data with full type safety:

```typescript
{
  name: "profile",
  type: "json",
  DataType: {
    avatar: "string",
    bio: "string",
    preferences: {
      theme: Union("light", "dark", "auto"),
      notifications: "boolean",
      language: "string"
    },
    socialLinks: ["string"], // Array of strings
    metadata: {}             // Any object
  }
}
```

### JSON Type System

| JSON Type | TypeScript | Description |
|-----------|------------|-------------|
| `"string"` | `string` | Text value |
| `"number"` | `number` | Numeric value |
| `"boolean"` | `boolean` | Boolean value |
| `"float"` | `number` | Decimal number |
| `["string"]` | `string[]` | Array of strings |
| `{}` | `any` | Any object |
| `Union(...)` | Union type | Restricted values |

### Advanced JSON Examples

```typescript
// User settings with nested objects
{
  name: "settings",
  type: "json",
  DataType: {
    appearance: {
      theme: Union("light", "dark", "auto"),
      fontSize: Union(12, 14, 16, 18, 20),
      colorScheme: "string"
    },
    privacy: {
      profileVisible: "boolean",
      activityTracking: "boolean",
      dataSharing: Union("none", "anonymous", "full")
    },
    notifications: {
      email: Union("always", "important", "never"),
      push: "boolean",
      frequency: Union("realtime", "daily", "weekly")
    }
  }
}

// E-commerce product specifications
{
  name: "specifications",
  type: "json",
  DataType: {
    dimensions: {
      width: "number",
      height: "number",
      depth: "number",
      unit: Union("cm", "inch", "mm")
    },
    weight: {
      value: "number",
      unit: Union("kg", "lb", "g")
    },
    colors: ["string"],    // Array of available colors
    features: ["string"], // Array of features
    warranty: {
      duration: "number",
      unit: Union("months", "years"),
      coverage: "string"
    }
  }
}

// Array of objects
{
  name: "orderItems",
  type: "json",
  DataType: [{
    productId: "number",
    sku: "string",
    name: "string",
    quantity: "number",
    unitPrice: "float",
    totalPrice: "float",
    options: {
      size: Union("S", "M", "L", "XL"),
      color: "string"
    }
  }]
}
```

### Union Helper Function

Use the `Union()` helper for type-safe enums in JSON:

```typescript
import { Union } from "bun-typed-sqlite/schema";

// String unions
theme: Union("light", "dark", "auto")
// Becomes: "light" | "dark" | "auto"

// Number unions  
rating: Union(1, 2, 3, 4, 5)
// Becomes: 1 | 2 | 3 | 4 | 5

// Mixed usage in complex objects
DataType: {
  status: Union("draft", "published", "archived"),
  priority: Union(1, 2, 3, 4, 5),
  tags: ["string"],
  metadata: {
    author: "string",
    visibility: Union("public", "private", "restricted")
  }
}
```

## 💡 Usage Examples

### Complete E-Commerce Schema

```typescript
import { DBSchema, Union } from "bun-typed-sqlite/schema";

const ecommerceSchema: DBSchema = [
  {
    name: "Users",
    columns: [
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "email", type: "string", unique: true },
      { name: "firstName", type: "string" },
      { name: "lastName", type: "string" },
      { name: "role", type: "string", union: ["admin", "customer", "vendor"], default: "customer" },
      { name: "isActive", type: "boolean", default: true },
      { 
        name: "profile", 
        type: "json", 
        nullable: true,
        DataType: {
          avatar: "string",
          bio: "string",
          phone: "string",
          preferences: {
            newsletter: "boolean",
            theme: Union("light", "dark"),
            language: Union("en", "es", "fr", "de")
          }
        }
      },
      { name: "createdAt", type: "Date" },
      { name: "updatedAt", type: "Date" }
    ]
  },
  
  {
    name: "Products", 
    columns: [
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "sku", type: "string", unique: true },
      { name: "name", type: "string" },
      { name: "description", type: "string", nullable: true },
      { name: "category", type: "string", union: ["electronics", "clothing", "books", "home"] },
      { name: "price", type: "float" },
      { name: "stock", type: "number", default: 0 },
      { name: "status", type: "string", union: ["draft", "active", "discontinued"], default: "draft" },
      {
        name: "specs",
        type: "json",
        DataType: {
          weight: "number",
          dimensions: {
            width: "number",
            height: "number", 
            depth: "number"
          },
          colors: ["string"],
          features: ["string"]
        }
      },
      { name: "createdAt", type: "Date" },
      { name: "updatedAt", type: "Date" }
    ]
  },

  {
    name: "Orders",
    columns: [
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "userId", type: "number" },
      { name: "orderNumber", type: "string", unique: true },
      { name: "status", type: "string", union: ["pending", "confirmed", "shipped", "delivered", "cancelled"], default: "pending" },
      { name: "subtotal", type: "float" },
      { name: "tax", type: "float", default: 0.00 },
      { name: "total", type: "float" },
      {
        name: "items",
        type: "json",
        DataType: [{
          productId: "number",
          sku: "string",
          name: "string", 
          quantity: "number",
          unitPrice: "float",
          totalPrice: "float"
        }]
      },
      {
        name: "shippingAddress",
        type: "json",
        DataType: {
          firstName: "string",
          lastName: "string",
          addressLine1: "string",
          addressLine2: "string",
          city: "string",
          state: "string",
          postalCode: "string",
          country: "string"
        }
      },
      { name: "createdAt", type: "Date" },
      { name: "updatedAt", type: "Date" }
    ]
  }
];
```

### Using the Database with Type Safety

```typescript
import { Database } from "bun-typed-sqlite";

// Initialize database with schema
const db = Database();

// Insert with full type safety
const newUser = db.Users.insert({
  email: "john@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "customer", // TypeScript knows valid values
  profile: {
    avatar: "avatar.jpg",
    bio: "Software developer",
    phone: "+1234567890",
    preferences: {
      newsletter: true,
      theme: "dark", // TypeScript enforces valid theme values
      language: "en"
    }
  },
  createdAt: new Date(),
  updatedAt: new Date()
  // Note: id and isActive are optional due to autoIncrement and default
});

// Query with type safety
const activeUsers = db.Users.select({
  where: { 
    isActive: true,
    role: "customer" // TypeScript validates enum values
  }
});

// Complex product insertion
const newProduct = db.Products.insert({
  sku: "LAPTOP-001",
  name: "Gaming Laptop",
  description: "High-performance gaming laptop",
  category: "electronics", // TypeScript validates category
  price: 1299.99,
  stock: 10,
  status: "active",
  specs: {
    weight: 2.5,
    dimensions: {
      width: 35.5,
      height: 2.3,
      depth: 24.8
    },
    colors: ["black", "silver"],
    features: ["RGB Keyboard", "144Hz Display", "RTX Graphics"]
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Order with nested items
const newOrder = db.Orders.insert({
  userId: 1,
  orderNumber: "ORD-2024-001",
  status: "pending",
  subtotal: 1299.99,
  tax: 129.99,
  total: 1429.98,
  items: [
    {
      productId: 1,
      sku: "LAPTOP-001",
      name: "Gaming Laptop",
      quantity: 1,
      unitPrice: 1299.99,
      totalPrice: 1299.99
    }
  ],
  shippingAddress: {
    firstName: "John",
    lastName: "Doe",
    addressLine1: "123 Main St",
    addressLine2: "Apt 4B",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "USA"
  },
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## 🔒 Type Safety

### Automatic Type Generation

The schema automatically generates TypeScript types for:

- **Insert Types**: What fields are required/optional when creating records
- **Select Types**: What fields are available when querying
- **Update Types**: What fields can be modified
- **JSON Schema Types**: Full type safety for complex JSON fields

### Schema-to-Type Conversion

Use the `DBSchemaToTableTypes` utility type to automatically generate TypeScript types from your schema:

```typescript
import { type DBSchema, type DBSchemaToTableTypes, Union } from "bun-typed-sqlite/schema";

// Define your schema with 'as const' for proper type inference
const Schema = defineSchema([
  defineTable({
    name: "users",
    columns: defineColumns([
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "email", type: "string", unique: true },
      { name: "role", type: "string", union: ["admin", "user"], default: "user" },
      { name: "isActive", type: "boolean", default: true },
      { name: "age", type: "number", nullable: true },
      { name: "created_at", type: "Date" }
    ])
  })
]);

// Automatically generate types from schema
type SchemaTypes = DBSchemaToTableTypes<typeof Schema>;

// Extract individual table types  
type UsersType = SchemaTypes['users'];
// Result:
// {
//   id?: number;          // Optional due to autoIncrement
//   email: string;        // Required
//   role?: "admin" | "user"; // Optional due to default value
//   isActive?: boolean;   // Optional due to default value
//   age?: number | null;  // Optional and nullable
//   created_at: Date;     // Required
// }

// Use the generated types
const newUser: UsersType = {
  email: "john@example.com",
  age: null,
  created_at: new Date()
  // id, role, isActive are optional
};
```

### Advanced Type Features

```typescript
// Complex schema with JSON and unions
const advancedSchema = defineSchema([
  defineTable({
    name: "products",
    columns: defineColumns([
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "category", type: "string", union: ["electronics", "clothing", "books"] },
      { name: "price", type: "float" },
      {
        name: "specs",
        type: "json",
        DataType: {
          weight: "number",
          dimensions: {
            width: "number",
            height: "number"
          },
          features: ["string"],
          warranty: {
            duration: "number",
            type: Union("limited", "extended", "lifetime")
          }
        }
      }
    ])
  })
]);

type ProductTypes = DBSchemaToTableTypes<typeof advancedSchema>;
type ProductType = ProductTypes['products'];

// Full type safety including nested JSON structures
const product: ProductType = {
  category: "electronics", // Only valid categories allowed
  price: 299.99,
  specs: {
    weight: 1.2,
    dimensions: {
      width: 15.6,
      height: 0.8
    },
    features: ["backlit keyboard", "touchscreen"],
    warranty: {
      duration: 24,
      type: "extended" // Only "limited" | "extended" | "lifetime" allowed
    }
  }
};
```

### Example Generated Types

```typescript
// For the Users table above, these types are automatically generated:

type Users_Insert = {
  id?: number;           // Optional due to autoIncrement
  email: string;         // Required
  role?: "admin" | "user"; // Optional due to default
  isActive?: boolean;    // Optional due to default
  age?: number | null;   // Optional and nullable
  created_at: Date;      // Required
};

// JSON types are fully typed too
type ProductSpecs = {
  weight: number;
  dimensions: {
    width: number;
    height: number;
  };
  features: string[];
  warranty: {
    duration: number;
    type: "limited" | "extended" | "lifetime";
  };
};
```

## 📝 Best Practices

### 1. Naming Conventions

```typescript
// Use PascalCase for table names
{ name: "Users" }        // ✅ Good
{ name: "UserProfiles" } // ✅ Good
{ name: "users" }        // ❌ Avoid

// Use camelCase for column names
{ name: "firstName" }    // ✅ Good
{ name: "createdAt" }    // ✅ Good
{ name: "first_name" }   // ❌ Avoid
```

### 2. Primary Keys and IDs

```typescript
// Always use auto-incrementing primary keys
{ name: "id", type: "number", primary: true, autoIncrement: true }

// Use descriptive foreign key names
{ name: "userId", type: "number" }     // ✅ Good
{ name: "user_id", type: "number" }    // ❌ Avoid
{ name: "user", type: "number" }       // ❌ Confusing
```

### 3. Default Values and Nullability

```typescript
// Provide sensible defaults
{ name: "isActive", type: "boolean", default: true }
{ name: "attempts", type: "number", default: 0 }
{ name: "role", type: "string", union: ["user", "admin"], default: "user" }

// Use nullable sparingly and intentionally
{ name: "middleName", type: "string", nullable: true }    // ✅ Makes sense
{ name: "email", type: "string", nullable: true }         // ❌ Email should be required
```

### 4. Union Types

```typescript
// Keep union values short and descriptive
{ name: "status", type: "string", union: ["active", "inactive"] }              // ✅ Good
{ name: "priority", type: "number", union: [1, 2, 3, 4, 5] }                  // ✅ Good
{ name: "status", type: "string", union: ["this_is_a_very_long_status_name"] } // ❌ Too verbose
```

### 5. JSON Schema Design

```typescript
// Group related fields in JSON objects
{
  name: "contactInfo",
  type: "json",
  DataType: {
    email: "string",
    phone: "string",
    address: {
      street: "string",
      city: "string",
      country: "string"
    }
  }
}

// Use Union for constrained values in JSON
{
  name: "preferences",
  type: "json", 
  DataType: {
    theme: Union("light", "dark", "auto"),
    language: Union("en", "es", "fr", "de", "ja"),
    timezone: "string"
  }
}
```

### 6. Timestamps

```typescript
// Always include creation and update timestamps
{ name: "createdAt", type: "Date" },
{ name: "updatedAt", type: "Date" }

// Use nullable for optional timestamps
{ name: "deletedAt", type: "Date", nullable: true },
{ name: "lastLoginAt", type: "Date", nullable: true }
```

## 🔧 Advanced Configuration

### Schema File Location

Place your schema in `/config/database.ts`:

```typescript
// config/database.ts
import { DBSchema, Union } from "bun-typed-sqlite/schema";

const schema: DBSchema = [
  // Your schema definition here
];

export default schema;
```

### Migration and Database Creation

```bash
# Create database with schema
bun run db:create

# Use in your application
import { Database } from "bun-typed-sqlite";
const db = Database();
```

### Environment-Specific Schemas

```typescript
// config/database.ts
import { DBSchema } from "bun-typed-sqlite/schema";

const baseSchema: DBSchema = [
  // Common tables
];

const developmentSchema: DBSchema = [
  ...baseSchema,
  {
    name: "DebugLogs",
    columns: [
      { name: "id", type: "number", primary: true, autoIncrement: true },
      { name: "message", type: "string" },
      { name: "level", type: "string", union: ["debug", "info", "warn", "error"] },
      { name: "timestamp", type: "Date" }
    ]
  }
];

export default process.env.NODE_ENV === 'development' ? developmentSchema : baseSchema;
```

---

This guide provides comprehensive documentation for creating and using type-safe database schemas with Bun Typed SQLite. The combination of TypeScript type safety, flexible JSON support, and intuitive API makes it powerful for building robust applications.
