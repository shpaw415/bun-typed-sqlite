/**
 * Bunext Database Schema Definition
 * 
 * Defines the structure of your SQLite database with full TypeScript support and advanced features.
 * Supports complex data types, relationships, constraints, and automatic type generation.
 * 
 * @features
 * - **Basic Types**: number, string, boolean, Date, float
 * - **JSON Support**: Complex nested objects with type safety
 * - **Union Types**: Restrict values to specific sets (enums)
 * - **Constraints**: Primary keys, unique fields, nullable columns
 * - **Auto-increment**: Automatic ID generation
 * - **Defaults**: Default values for columns
 * - **Reserved Types**: Union and intersection types for complex schemas
 * 
 * @example
 * ```typescript
 * import { DBSchema, Union } from "bunext-js/database/schema";
 * 
 * // Complex e-commerce database schema showcasing all features
 * const schema: DBSchema = [
 *   {
 *     name: "Users",
 *     columns: [
 *       // Auto-incrementing primary key
 *       { name: "id", type: "number", primary: true, autoIncrement: true },
 *       
 *       // Required unique string
 *       { name: "email", type: "string", unique: true },
 *       
 *       // String with union constraint (enum-like)
 *       { name: "role", type: "string", union: ["admin", "user", "moderator"], default: "user" },
 *       
 *       // Optional nullable field
 *       { name: "firstName", type: "string", nullable: true },
 *       { name: "lastName", type: "string", nullable: true },
 *       
 *       // Boolean with default
 *       { name: "isActive", type: "boolean", default: true },
 *       { name: "emailVerified", type: "boolean", default: false },
 *       
 *       // Date fields
 *       { name: "createdAt", type: "Date" },
 *       { name: "lastLogin", type: "Date", nullable: true },
 *       
 *       // Complex JSON with typed structure
 *       { 
 *         name: "profile", 
 *         type: "json", 
 *         nullable: true,
 *         DataType: {
 *           avatar: "string",
 *           bio: "string",
 *           preferences: {
 *             theme: Union("light", "dark", "auto"),
 *             notifications: "boolean",
 *             language: "string"
 *           },
 *           socialLinks: ["string"], // Array of strings
 *           metadata: {} // Any object
 *         }
 *       },
 *       
 *       // Numeric fields with constraints
 *       { name: "age", type: "number", nullable: true },
 *       { name: "creditScore", type: "number", union: [300, 400, 500, 600, 700, 800, 850] },
 *       
 *       // Float for precise calculations
 *       { name: "accountBalance", type: "float", default: 0.00 }
 *     ]
 *   },
 *   
 *   {
 *     name: "Products",
 *     columns: [
 *       { name: "id", type: "number", primary: true, autoIncrement: true },
 *       { name: "sku", type: "string", unique: true },
 *       { name: "name", type: "string" },
 *       { name: "description", type: "string", nullable: true },
 *       
 *       // Product category with union constraint
 *       { 
 *         name: "category", 
 *         type: "string", 
 *         union: ["electronics", "clothing", "books", "home", "sports", "toys"] 
 *       },
 *       
 *       // Status enum
 *       { 
 *         name: "status", 
 *         type: "string", 
 *         union: ["draft", "active", "discontinued", "out_of_stock"], 
 *         default: "draft" 
 *       },
 *       
 *       // Pricing
 *       { name: "price", type: "float" },
 *       { name: "discountPrice", type: "float", nullable: true },
 *       
 *       // Inventory
 *       { name: "stock", type: "number", default: 0 },
 *       { name: "minStock", type: "number", default: 5 },
 *       
 *       // Complex product data as JSON
 *       {
 *         name: "specifications",
 *         type: "json",
 *         DataType: {
 *           dimensions: {
 *             width: "number",
 *             height: "number", 
 *             depth: "number",
 *             unit: Union("cm", "inch", "mm")
 *           },
 *           weight: {
 *             value: "number",
 *             unit: Union("kg", "lb", "g")
 *           },
 *           colors: ["string"], // Array of available colors
 *           features: ["string"], // Array of features
 *           warranty: {
 *             duration: "number",
 *             unit: Union("months", "years"),
 *             coverage: "string"
 *           }
 *         }
 *       },
 *       
 *       // SEO and marketing data
 *       {
 *         name: "seoData",
 *         type: "json",
 *         nullable: true,
 *         DataType: {
 *           metaTitle: "string",
 *           metaDescription: "string",
 *           keywords: ["string"],
 *           slug: "string"
 *         }
 *       },
 *       
 *       // Timestamps
 *       { name: "createdAt", type: "Date" },
 *       { name: "updatedAt", type: "Date" }
 *     ]
 *   },
 *   
 *   {
 *     name: "Orders",
 *     columns: [
 *       { name: "id", type: "number", primary: true, autoIncrement: true },
 *       { name: "orderNumber", type: "string", unique: true },
 *       
 *       // Foreign key relationships (as numbers)
 *       { name: "userId", type: "number" },
 *       
 *       // Order status with progression
 *       { 
 *         name: "status", 
 *         type: "string", 
 *         union: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
 *         default: "pending"
 *       },
 *       
 *       // Payment information
 *       { 
 *         name: "paymentStatus", 
 *         type: "string", 
 *         union: ["pending", "paid", "failed", "refunded"], 
 *         default: "pending" 
 *       },
 *       { 
 *         name: "paymentMethod", 
 *         type: "string", 
 *         union: ["credit_card", "paypal", "stripe", "bank_transfer", "cash_on_delivery"] 
 *       },
 *       
 *       // Financial calculations
 *       { name: "subtotal", type: "float" },
 *       { name: "taxAmount", type: "float", default: 0.00 },
 *       { name: "shippingCost", type: "float", default: 0.00 },
 *       { name: "discountAmount", type: "float", default: 0.00 },
 *       { name: "totalAmount", type: "float" },
 *       
 *       // Shipping information as complex JSON
 *       {
 *         name: "shippingAddress",
 *         type: "json",
 *         DataType: {
 *           firstName: "string",
 *           lastName: "string",
 *           company: "string",
 *           addressLine1: "string",
 *           addressLine2: "string",
 *           city: "string",
 *           state: "string",
 *           postalCode: "string",
 *           country: "string",
 *           phone: "string"
 *         }
 *       },
 *       
 *       // Order items as nested array
 *       {
 *         name: "items",
 *         type: "json",
 *         DataType: [{
 *           productId: "number",
 *           sku: "string",
 *           name: "string",
 *           quantity: "number",
 *           unitPrice: "float",
 *           totalPrice: "float",
 *           productSnapshot: {
 *             description: "string",
 *             category: "string",
 *             specifications: {}
 *           }
 *         }]
 *       },
 *       
 *       // Tracking and logistics
 *       {
 *         name: "tracking",
 *         type: "json",
 *         nullable: true,
 *         DataType: {
 *           carrier: Union("ups", "fedex", "dhl", "usps", "other"),
 *           trackingNumber: "string",
 *           estimatedDelivery: "string",
 *           events: [{
 *             timestamp: "string",
 *             status: "string",
 *             location: "string",
 *             description: "string"
 *           }]
 *         }
 *       },
 *       
 *       // Timestamps
 *       { name: "createdAt", type: "Date" },
 *       { name: "updatedAt", type: "Date" },
 *       { name: "shippedAt", type: "Date", nullable: true },
 *       { name: "deliveredAt", type: "Date", nullable: true }
 *     ]
 *   },
 *   
 *   {
 *     name: "Reviews",
 *     columns: [
 *       { name: "id", type: "number", primary: true, autoIncrement: true },
 *       { name: "userId", type: "number" },
 *       { name: "productId", type: "number" },
 *       { name: "orderId", type: "number", nullable: true },
 *       
 *       // Rating with number union (1-5 stars)
 *       { name: "rating", type: "number", union: [1, 2, 3, 4, 5] },
 *       
 *       { name: "title", type: "string" },
 *       { name: "content", type: "string" },
 *       
 *       // Review status
 *       { 
 *         name: "status", 
 *         type: "string", 
 *         union: ["pending", "approved", "rejected", "flagged"], 
 *         default: "pending" 
 *       },
 *       
 *       // Helpful votes
 *       { name: "helpfulVotes", type: "number", default: 0 },
 *       { name: "totalVotes", type: "number", default: 0 },
 *       
 *       // Rich review data
 *       {
 *         name: "reviewData",
 *         type: "json",
 *         nullable: true,
 *         DataType: {
 *           images: ["string"], // Array of image URLs
 *           pros: ["string"], // Array of positive points
 *           cons: ["string"], // Array of negative points
 *           wouldRecommend: "boolean",
 *           purchaseVerified: "boolean",
 *           reviewerProfile: {
 *             isVerifiedBuyer: "boolean",
 *             totalReviews: "number",
 *             reviewerRank: Union("newbie", "contributor", "top_reviewer", "vine_customer")
 *           }
 *         }
 *       },
 *       
 *       { name: "createdAt", type: "Date" },
 *       { name: "updatedAt", type: "Date" }
 *     ]
 *   },
 *   
 *   {
 *     name: "Analytics",
 *     columns: [
 *       { name: "id", type: "number", primary: true, autoIncrement: true },
 *       { name: "eventType", type: "string", union: ["page_view", "product_view", "add_to_cart", "purchase", "search"] },
 *       { name: "userId", type: "number", nullable: true },
 *       { name: "sessionId", type: "string" },
 *       
 *       // Event data with flexible structure
 *       {
 *         name: "eventData",
 *         type: "json",
 *         DataType: {
 *           page: "string",
 *           referrer: "string",
 *           userAgent: "string",
 *           ip: "string",
 *           country: "string",
 *           device: {
 *             type: Union("desktop", "mobile", "tablet"),
 *             os: "string",
 *             browser: "string"
 *           },
 *           customProperties: {}, // Flexible object for any additional data
 *           ecommerce: {
 *             currency: "string",
 *             value: "number",
 *             items: [{
 *               productId: "number",
 *               quantity: "number",
 *               price: "number"
 *             }]
 *           }
 *         }
 *       },
 *       
 *       { name: "timestamp", type: "Date" }
 *     ]
 *   }
 * ];
 * 
 * export default schema;
 * ```
 * 
 * @usage
 * ```typescript
 * // After defining your schema, run the migration
 * bun run db:create
 * 
 * // Use in your Bunext app
 * import { Database } from "bunext-js/database";
 * 
 * const db = Database();
 * 
 * // All tables are now available with full type safety
 * const users = db.Users.select({ where: { role: "admin" } });
 * const products = db.Products.select({ where: { category: "electronics", status: "active" } });
 * const orders = db.Orders.select({ where: { status: "delivered" } });
 * ```
 */
export type DBSchema = TableSchema[];

/**
 * Individual table definition within a database schema
 * Supports both mutable and readonly column arrays for flexibility
 * 
 * @interface TableSchema
 * @property name - The table name (will be capitalized in the Database() function)
 * @property columns - Array of column definitions for the table
 */
export interface TableSchema {
  readonly name: string;
  readonly columns: readonly ColumnsSchema[] | ColumnsSchema[];
}

/**
 * Column definition with support for all SQLite-compatible types and Bunext features
 * 
 * @features
 * - **Type Safety**: Full TypeScript support with automatic type generation
 * - **Constraints**: Primary keys, unique constraints, nullable fields
 * - **Defaults**: Default values for any column type
 * - **Union Types**: Restrict values to specific sets (enum-like behavior)
 * - **JSON Support**: Complex nested objects with type definitions
 * - **Auto-increment**: Automatic ID generation for number fields
 * 
 * @example
 * ```typescript
 * // Basic column types
 * { name: "id", type: "number", primary: true, autoIncrement: true }
 * { name: "email", type: "string", unique: true }
 * { name: "isActive", type: "boolean", default: true }
 * { name: "createdAt", type: "Date" }
 * { name: "price", type: "float", default: 0.00 }
 * 
 * // Union constraints (enum-like)
 * { name: "status", type: "string", union: ["active", "inactive", "pending"] }
 * { name: "rating", type: "number", union: [1, 2, 3, 4, 5] }
 * 
 * // Complex JSON with type safety
 * {
 *   name: "settings",
 *   type: "json",
 *   DataType: {
 *     theme: Union("light", "dark"),
 *     notifications: "boolean",
 *     preferences: {
 *       language: "string",
 *       timezone: "string"
 *     }
 *   }
 * }
 * ```
 */
export type ColumnsSchema =
  | ({
    type: "number";
    autoIncrement?: true;
    default?: number;
    /**  */
    union?: number[];
  } & common)
  | ({
    type: "string";
    default?: string;
    /**  */
    union?: string[];
  } & common)
  | ({
    type: "Date";
    default?: Date;
  } & common)
  | ({
    type: "json";
    default?: any;
    DataType: _DataType;
  } & common)
  | ({
    type: "float";
    default?: number;
    /**  */
    union?: number[];
  } & common)
  | ({
    type: "boolean";
    default?: boolean;
  } & common);

/**
 * Supported primitive types for JSON column definitions
 * Maps to TypeScript types for type-safe JSON schema definitions
 */
type _TypeJson = "number" | "string" | "undefined" | "float" | "boolean";

/**
 * Object structure for complex JSON data types
 * Supports nested objects, arrays, and primitive types
 */
type _DataTypeObject = {
  [key: string]: _TypeJson | _TypeJson[] | _DataType;
};

/**
 * Comprehensive data type system for JSON columns with advanced type safety
 * 
 * @features
 * - **Nested Objects**: Deep object structures with type safety
 * - **Arrays**: Typed arrays of primitives or objects
 * - **Union Types**: Use Union() helper for enum-like restrictions
 * - **Intersection Types**: Combine multiple types (advanced)
 * - **Mixed Types**: Flexible combinations of objects and arrays
 * 
 * @example
 * ```typescript
 * // Simple object
 * DataType: {
 *   name: "string",
 *   age: "number",
 *   active: "boolean"
 * }
 * 
 * // Nested object with arrays
 * DataType: {
 *   user: {
 *     profile: {
 *       name: "string",
 *       preferences: {
 *         theme: Union("light", "dark", "auto"),
 *         languages: ["string"]
 *       }
 *     }
 *   },
 *   tags: ["string"],
 *   metadata: {}
 * }
 * 
 * // Array of objects
 * DataType: [{
 *   id: "number",
 *   name: "string",
 *   properties: {
 *     color: "string",
 *     size: Union("small", "medium", "large")
 *   }
 * }]
 * ```
 */
export type _DataType =
  | _DataTypeObject
  | (_DataTypeObject & Array<_TypeJson>)
  | (_DataTypeObject & _TypeJson)
  | Array<_DataTypeObject | _TypeJson>
  | ReservedType;

/**
 * Reserved type system for advanced type operations
 * Used internally for Union and Intersection type handling
 */
type ReservedType<T extends string | number = string | number> = {
  "!union_type!": Array<T>;
  "!intersection_type!": Array<T>;
};
const ReservedTypeKeys = ["!union_type!"];

/**
 * Common column properties shared across all column types
 * 
 * @property name - Column name (required)
 * @property nullable - Allow NULL values (optional, default: false)
 * @property unique - Enforce unique constraint (optional, default: false)  
 * @property primary - Mark as primary key (optional, default: false)
 */
type common = { name: string; nullable?: true; unique?: true; primary?: true };

/**
 * Convert a DBSchema to a type mapping table names to their respective row types
 * This utility type automatically generates TypeScript types from your schema definition
 * 
 * @example
 * ```typescript
 * const Schema = [
 *   {
 *     name: "users",
 *     columns: [
 *       { name: "id", type: "number", primary: true, autoIncrement: true },
 *       { name: "name", type: "string" },
 *       { name: "email", type: "string", unique: true },
 *       { name: "isActive", type: "boolean", default: true }
 *     ]
 *   },
 *   {
 *     name: "posts", 
 *     columns: [
 *       { name: "id", type: "number", primary: true, autoIncrement: true },
 *       { name: "userId", type: "number" },
 *       { name: "title", type: "string" },
 *       { name: "content", type: "string", nullable: true }
 *     ]
 *   }
 * ] as const;
 * 
 * type SchemaTypes = DBSchemaToTableTypes<typeof Schema>;
 * // Result:
 * // {
 * //   users: {
 * //     id?: number;        // Optional due to autoIncrement
 * //     name: string;
 * //     email: string;
 * //     isActive?: boolean; // Optional due to default
 * //   };
 * //   posts: {
 * //     id?: number;        // Optional due to autoIncrement
 * //     userId: number;
 * //     title: string;
 * //     content?: string;   // Optional due to nullable
 * //   };
 * // }
 * ```
 */
export type DBSchemaToTableTypes<T extends readonly TableSchema[]> = {
  [K in T[number]as K['name']]: SchemaToRowType<K['columns']>
};

/**
 * Convert a single table's column schema to its row type
 * Used internally by DBSchemaToTableTypes
 */
type SchemaToRowType<T extends readonly ColumnsSchema[]> = {
  [K in T[number]as IsOptionalColumn<K> extends true ? never : K['name']]: K extends { nullable: true }
  ? ColumnToType<K> | null
  : ColumnToType<K>
} & {
  [K in T[number]as IsOptionalColumn<K> extends true ? K['name'] : never]?: K extends { nullable: true }
  ? ColumnToType<K> | null
  : ColumnToType<K>
};

/**
 * Helper type to determine if a column should be optional
 * A column is optional if it has autoIncrement or a default value
 */
type IsOptionalColumn<T extends ColumnsSchema> =
  T extends { autoIncrement: true }
  ? true
  : T extends { default: any }
  ? true
  : false;

/**
 * Convert a column schema to its TypeScript type
 * Handles all supported column types including unions and JSON
 */
type ColumnToType<T extends ColumnsSchema> =
  T extends { type: "string"; union: readonly (infer U)[] }
  ? U
  : T extends { type: "string" }
  ? string
  : T extends { type: "number"; union: readonly (infer U)[] }
  ? U
  : T extends { type: "number" }
  ? number
  : T extends { type: "float"; union: readonly (infer U)[] }
  ? U
  : T extends { type: "float" }
  ? number
  : T extends { type: "boolean" }
  ? boolean
  : T extends { type: "Date" }
  ? Date
  : T extends { type: "json"; DataType: infer D }
  ? JSONDataTypeToType<D>
  : unknown;

/**
 * Convert JSON DataType to TypeScript type
 * Recursively handles nested objects, arrays, and Union types
 */
type JSONDataTypeToType<T> =
  T extends { "!union_type!": readonly (infer U)[] }
  ? U
  : T extends { "!intersection_type!": readonly string[] }
  ? string
  : T extends readonly (infer U)[]
  ? Array<JSONDataTypeToType<U>>
  : T extends "string"
  ? string
  : T extends "number"
  ? number
  : T extends "float"
  ? number
  : T extends "boolean"
  ? boolean
  : T extends "undefined"
  ? undefined
  : T extends Record<string, any>
  ? {
    [K in keyof T]: JSONDataTypeToType<T[K]>
  }
  : T;

export function ConvertShemaToType(Schema: DBSchema) {
  let tables: string[] = [];
  const types = Schema.map((table) => {
    if (tables.includes(table.name))
      throw new Error(`Table name: ${table.name} is already taken`, {
        cause: "DUPLICATE_TABLE",
      });
    else tables.push(table.name);
    return `type _${table.name} = {\n${table.columns
      .map((column) => ColumnsSchemaToType(column, true))
      .join("\n")}\n};`;
  });
  const typesWithDefaultAsRequired = Schema.map(
    (table) =>
      `type SELECT_${table.name} = {\n${table.columns
        .map((column) => ColumnsSchemaToType(column, false))
        .join("\n")}\n};`
  );

  return {
    tables,
    types,
    typesWithDefaultAsRequired,
  };
}

/**
 * Helper function to define a schema without needing 'as const satisfies DBSchema'
 * Automatically applies proper TypeScript constraints for type inference
 * 
 * @param schema - Schema definition
 * @returns Properly typed schema ready for use with DatabaseManager
 * 
 * @example
 * ```typescript
 * import { defineSchema, Union } from "bun-typed-sqlite/schema";
 * 
 * // ✅ Simple and clean - no 'as const satisfies DBSchema' needed
 * const schema = defineSchema([
 *   {
 *     name: "users",
 *     columns: [
 *       { name: "id", type: "number", primary: true, autoIncrement: true },
 *       { name: "name", type: "string" },
 *       { name: "email", type: "string", unique: true },
 *       { name: "role", type: "string", union: ["admin", "user"], default: "user" },
 *       { name: "data", type: "json", DataType: { theme: Union("light", "dark") } }
 *     ]
 *   }
 * ]);
 * 
 * // Use directly with DatabaseManager - full type safety maintained
 * const db = DatabaseManager.createWithSchema({ schema, dbPath: "./app.db" });
 * const users = db.getTable("users"); // Fully typed!
 * ```
 */
export function defineSchema<const T extends readonly TableSchema[]>(schema: T): T {
  return schema;
}

/**
 * Helper function to define a single table schema
 * Provides better IntelliSense and type checking for individual tables
 * 
 * @param table - Table definition
 * @returns Properly typed table schema
 * 
 * @example
 * ```typescript
 * import { defineTable, defineSchema } from "bun-typed-sqlite/schema";
 * 
 * const usersTable = defineTable({
 *   name: "users",
 *   columns: [
 *     { name: "id", type: "number", primary: true, autoIncrement: true },
 *     { name: "email", type: "string", unique: true },
 *     { name: "role", type: "string", union: ["admin", "user"], default: "user" }
 *   ]
 * });
 * 
 * const postsTable = defineTable({
 *   name: "posts", 
 *   columns: [
 *     { name: "id", type: "number", primary: true, autoIncrement: true },
 *     { name: "title", type: "string" },
 *     { name: "userId", type: "number" }
 *   ]
 * });
 * 
 * // Combine into schema
 * const schema = defineSchema([usersTable, postsTable]);
 * ```
 */
export function defineTable<const T extends TableSchema>(table: T): T {
  return table;
}

/**
 * Helper function to define columns with better type inference
 * Useful for complex column definitions with JSON types
 * 
 * @param columns - Array of column definitions
 * @returns Properly typed columns array
 * 
 * @example
 * ```typescript
 * import { defineColumns, Union } from "bun-typed-sqlite/schema";
 * 
 * const userColumns = defineColumns([
 *   { name: "id", type: "number", primary: true, autoIncrement: true },
 *   { name: "profile", type: "json", DataType: {
 *     avatar: "string",
 *     settings: {
 *       theme: Union("light", "dark", "auto"),
 *       notifications: "boolean"
 *     },
 *     tags: ["string"]
 *   }}
 * ]);
 * 
 * const schema = defineSchema([{
 *   name: "users",
 *   columns: userColumns
 * }]);
 * ```
 */
export function defineColumns<const T extends readonly ColumnsSchema[]>(columns: T): T {
  return columns;
}
/**
 * Creates a union type constraint for JSON schema fields
 * Restricts values to a specific set, similar to TypeScript union types or database enums
 * 
 * @param type - Array of allowed string or number values
 * @returns ReservedType that gets converted to TypeScript union during type generation
 * 
 * @example
 * ```typescript
 * // In your schema definition
 * {
 *   name: "userSettings",
 *   type: "json",
 *   DataType: {
 *     theme: Union("light", "dark", "auto"), // "light" | "dark" | "auto"
 *     fontSize: Union(12, 14, 16, 18), // 12 | 14 | 16 | 18
 *     status: Union("active", "inactive", "pending"), // "active" | "inactive" | "pending"
 *     priority: Union(1, 2, 3, 4, 5), // 1 | 2 | 3 | 4 | 5
 *     
 *     // Nested usage
 *     preferences: {
 *       language: Union("en", "es", "fr", "de"),
 *       currency: Union("USD", "EUR", "GBP", "JPY"),
 *       notifications: {
 *         email: Union("always", "important", "never"),
 *         push: Union("enabled", "disabled")
 *       }
 *     }
 *   }
 * }
 * 
 * // Usage in your app with full type safety
 * const db = Database();
 * const user = db.Users.findFirst({ where: { id: 1 } });
 * 
 * // TypeScript knows these are the only valid values
 * user.userSettings.theme = "light"; // ✅ Valid
 * user.userSettings.theme = "blue";  // ❌ TypeScript error
 * user.userSettings.fontSize = 16;   // ✅ Valid  
 * user.userSettings.fontSize = 20;   // ❌ TypeScript error
 * ```
 */
export function Union<T extends string | number>(...type: Array<T>): ReservedType<T> {
  return { "!union_type!": type } as unknown as ReservedType<T>;
}

/**
 * Creates an intersection type constraint for JSON schema fields
 * Combines multiple types - advanced feature for complex type operations
 * 
 * @param type - Array of type names to intersect
 * @returns ReservedType that gets converted to TypeScript intersection during type generation
 * 
 * @example
 * ```typescript
 * // Advanced usage for complex type combinations (rarely needed)
 * {
 *   name: "complexData",
 *   type: "json", 
 *   DataType: {
 *     combinedType: Intersection("BaseType", "ExtendedType")
 *   }
 * }
 * ```
 * 
 * @note This is an advanced feature. Most use cases are covered by Union() and nested objects.
 */
export function Intersection(...type: string[]): ReservedType {
  return { "!intersection_type!": type } as ReservedType;
}

function ColumnsSchemaToType(
  column: ColumnsSchema,
  defaultAsOptional: boolean
) {
  let autoIncrement = false;
  let dataType = "";
  if (column.type == "number") {
    autoIncrement = column.autoIncrement ? true : false;
  }
  switch (column.type) {
    case "string":
      if (column?.union) dataType = DatatypeToUnion(column.union);
      else dataType = column.type;
      break;
    case "number":
      if (column?.union) dataType = DatatypeToUnion(column.union);
      else dataType = column.type;
      break;
    case "Date":
    case "boolean":
      dataType = column.type;
      break;
    case "float":
      if (column?.union)
        dataType = column.union.map((e) => `"${e}"`).join(" | ");
      else dataType = "number";
      break;
    case "json":
      dataType = dataTypeToType(column.DataType);
      break;
  }
  return `"${column.name}"${column.nullable || autoIncrement || (column?.default && defaultAsOptional)
    ? "?"
    : ""
    }: ${dataType};`;
}

function sqliteTypeToTypeScript(type: _TypeJson): _TypeJson | undefined {
  switch (type) {
    case "number":
    case "string":
    case "boolean":
      return type;
    case "float":
      return "number";
    case "undefined":
      return undefined;
  }
}

function dataTypeToType(dataType: _DataType) {
  let returnString = "";
  if (Array.isArray(dataType)) {
    returnString += dataTypeArrayToType(dataType).text;
  } else {
    returnString += dataTypeObjectToType(dataType as _DataTypeObject).text;
  }
  return returnString;
}

function dataTypeArrayToType(
  dataTypeArray: _TypeJson[] | Array<_DataTypeObject | _TypeJson>
) {
  let optional = false;
  let returnString = "";
  returnString += "Array<";
  returnString += dataTypeArray
    .map((d) => {
      //@ts-ignore
      if (typeof d == "string") return sqliteTypeToTypeScript(d);
      else {
        const data = dataTypeObjectToType(d);
        return data.text;
      }
    })
    .filter((d) => {
      if (typeof d != "undefined") return true;
      optional = true;
      return false;
    })
    .join(" | ");
  returnString += ">";
  return {
    text: returnString,
    optional,
  };
}

type DataTypeObjectTypeParams = {
  [key: string]: _DataType | _TypeJson | _TypeJson[];
};

function dataTypeObjectToType(dataTypeObject: DataTypeObjectTypeParams) {
  const isInReservedMode = ReservedTypeKeys.includes(
    Object.keys(dataTypeObject).at(0) || ""
  );
  let returnString = "";

  returnString += (Object.keys(dataTypeObject) as Array<keyof _DataType>)
    .map((d) => {
      const dType = dataTypeObject[d];

      if (isInReservedMode) {
        switch (d as keyof ReservedType) {
          case "!union_type!":
            return DatatypeToUnion(dType as string[]);
          case "!intersection_type!":
            return DataTypeToIntersection(dType as string[]);
        }
      } else if (Array.isArray(dType)) {
        const parsed = dataTypeArrayToType(dType as _TypeJson[]);
        return `"${d}"${parsed.optional ? "?" : ""}: ${parsed.text}`;
      } else if (typeof dType == "string") {
        return `"${d}": ${sqliteTypeToTypeScript(dType)}`;
      } else {
        const parsed = dataTypeObjectToType(dType as _DataTypeObject);
        return `"${d}": ${parsed.text}`;
      }
    })
    .join(", ");

  if (!isInReservedMode) returnString = `{ ${returnString} }`;
  return {
    text: returnString,
    optional: false,
  };
}

function DatatypeToUnion(types: Array<string | number>) {
  return `( ${types
    .map((type) => {
      switch (typeof type) {
        case "string":
          return `"${type}"`;
        case "number":
          return type;
      }
    })
    .join(" | ")} )`;
}
function DataTypeToIntersection(types: Array<string | number>) {
  return `( ${types
    .map((type) => {
      switch (typeof type) {
        case "string":
          return `"${type}"`;
        case "number":
          return type;
      }
    })
    .join(" & ")} )`;
}
