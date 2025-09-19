/**
 * Bun Database CLI Library
 * A high-performance database management CLI optimized for Bun runtime
 */

import { BunSQLiteManager } from './bun-sqlite-manager';
import { DatabaseCLI } from './cli';
import { ConsoleUI, TerminalUI } from './ui';

export { DatabaseCLI } from './cli';
export { ConsoleUI, TerminalUI } from './ui';
export { BunSQLiteManager } from './bun-sqlite-manager';

export type {
    DatabaseConfig,
    BackupOptions,
    RestoreOptions,
    MergeOptions,
    DatabaseStats,
    TableInfo,
    MergeAnalysis,
    DatabaseManager,
    UserInterface,
    CLIConfig,
    CommandResult
} from './types';


/**
 * Create a pre-configured DatabaseCLI instance optimized for Bun + SQLite
 */
export function createBunSQLiteCLI(databasePath: string, options: {
    backupDir?: string;
    verbose?: boolean;
    useTerminalUI?: boolean;
} = {}) {

    return new DatabaseCLI({
        database: {
            databasePath,
            type: 'sqlite',
            connectionOptions: {
                // Bun-specific optimizations
                strict: true,
                safeIntegers: true
            }
        },
        ui: options.useTerminalUI ? new TerminalUI() : new ConsoleUI(),
        manager: new BunSQLiteManager(),
        backupDir: options.backupDir || './backups',
        verbose: options.verbose || false
    });
}

/**
 * Utility functions optimized for Bun
 */
export const bunUtils = {
    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Generate a timestamped backup filename using Bun's performance
     */
    generateBackupFilename(prefix: string = 'backup', extension: string = 'db.gz'): string {
        const timestamp = new Date().toISOString().split('T')[0];
        // Use Bun's high-precision timer if available
        const time = typeof Bun !== 'undefined' ? Bun.nanoseconds() : Date.now();
        return `${prefix}-${timestamp}-${time}.${extension}`;
    },

    /**
     * Validate database configuration for Bun
     */
    validateBunConfig(config: any): string[] {
        const errors: string[] = [];

        if (!config.database) {
            errors.push('Database configuration is required');
        } else {
            if (!config.database.databasePath) {
                errors.push('Database path is required');
            }

            if (config.database.type && config.database.type !== 'sqlite') {
                errors.push('Only SQLite is supported in Bun mode');
            }
        }

        return errors;
    },

    /**
     * Check if running in Bun environment
     */
    isBunRuntime(): boolean {
        return typeof Bun !== 'undefined';
    },

    /**
     * Get optimal SQLite settings for Bun
     */
    getOptimalSQLiteConfig() {
        return {
            strict: true,
            safeIntegers: true,
            // Enable WAL mode for better performance
            journal_mode: 'WAL',
            synchronous: 'NORMAL',
            cache_size: 1000,
            foreign_keys: true
        };
    }
};

// Legacy exports for backwards compatibility
export const createSQLiteCLI = createBunSQLiteCLI;
export const utils = bunUtils;