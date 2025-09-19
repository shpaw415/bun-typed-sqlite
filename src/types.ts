/**
 * Core types and interfaces for the generic database CLI library
 */

export interface DatabaseConfig {
    /** Path to the database file */
    databasePath: string;
    /** Path to the schema definition file (optional) */
    schemaPath?: string;
    /** Database type identifier */
    type?: 'sqlite' | 'mysql' | 'postgres' | string;
    /** Connection options specific to database type */
    connectionOptions?: Record<string, any>;
}

export interface BackupOptions {
    /** Whether to compress the backup file */
    compress?: boolean;
    /** Whether to include table data or schema only */
    includeData?: boolean;
    /** Custom backup format */
    format?: 'sql' | 'json' | 'binary';
}

export interface RestoreOptions {
    /** Whether to drop existing tables before restore */
    dropExisting?: boolean;
    /** Tables to include in restore (if not specified, all tables) */
    tablesFilter?: string[];
}

export interface MergeOptions {
    /** How to handle conflicts during merge */
    conflictResolution?: 'replace' | 'ignore' | 'fail';
    /** Tables to include in merge (if not specified, all tables) */
    tablesFilter?: string[];
    /** Callback for handling individual conflicts */
    onConflict?: (tableName: string, existingRecord: any, newRecord: any) => 'use_new' | 'keep_existing';
}

export interface DatabaseStats {
    /** Number of tables in the database */
    tables: number;
    /** Total number of records across all tables */
    totalRecords: number;
    /** Database file size in bytes */
    size?: number;
    /** Additional metadata */
    metadata?: Record<string, any>;
}

export interface TableInfo {
    name: string;
    compatibleColumns: number;
    totalColumns: number;
    conflicts?: string[];
}

export interface MergeAnalysis {
    compatibleTables: TableInfo[];
    incompatibleTables: string[];
}

/**
 * Abstract interface for database operations
 * Implement this interface to support different database types
 */
export interface DatabaseManager {
    /** Initialize the database connection */
    connect(config: DatabaseConfig): Promise<void> | void;

    /** Close the database connection */
    disconnect(): Promise<void> | void;

    /** Check if database exists and is accessible */
    exists(): Promise<boolean> | boolean;

    /** Create database tables from schema */
    createTables(schema?: any): Promise<void> | void;

    /** Get list of table names */
    listTables(): string[];

    /** Get database statistics */
    getDatabaseStats(): DatabaseStats;

    /** Create a backup of the database */
    backup(backupPath: string, options?: BackupOptions): Promise<void> | void;

    /** Restore database from backup */
    restore(backupPath: string, options?: RestoreOptions): Promise<void> | void;

    /** Merge data from another database */
    mergeDatabase(sourcePath: string, options?: MergeOptions): Promise<void> | void;

    /** Analyze merge compatibility */
    analyzeMergeCompatibility?(sourcePath: string): Promise<MergeAnalysis> | MergeAnalysis;
}

/**
 * UI interface for user interactions
 * Can be implemented with different UI libraries or simple console
 */
export interface UserInterface {
    /** Display a message to the user */
    log(message: string, type?: 'info' | 'warn' | 'error' | 'success'): void;

    /** Ask user for yes/no confirmation */
    confirm(message: string, defaultValue?: boolean): Promise<boolean>;

    /** Show progress indicator */
    progress(title: string, percentage: number): void;

    /** Stop/hide progress indicator */
    stopProgress(): void;

    /** Show a selection menu */
    select<T>(message: string, choices: Array<{ label: string; value: T }>): Promise<T>;

    /** Clear the display */
    clear?(): void;
}

/**
 * Configuration for the CLI operations
 */
export interface CLIConfig {
    /** Database configuration */
    database: DatabaseConfig;
    /** User interface implementation */
    ui?: UserInterface;
    /** Database manager implementation */
    manager?: DatabaseManager;
    /** Default backup directory */
    backupDir?: string;
    /** Enable verbose logging */
    verbose?: boolean;
}

/**
 * Command result interface
 */
export interface CommandResult {
    success: boolean;
    message?: string;
    data?: any;
    error?: Error;
}