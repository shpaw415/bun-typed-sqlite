import type {
    DatabaseManager,
    DatabaseConfig,
    BackupOptions,
    RestoreOptions,
    MergeOptions,
    DatabaseStats,
    MergeAnalysis,
    TableInfo
} from './types.js';
import { Database } from 'bun:sqlite';
import { dirname } from 'path';

/**
 * Bun-optimized SQLite database manager implementation
 * Leverages Bun's native SQLite API for maximum performance
 */
export class BunSQLiteManager implements DatabaseManager {
    private db?: Database;
    private config?: DatabaseConfig;

    async connect(config: DatabaseConfig): Promise<void> {
        this.config = config;

        // Ensure directory exists
        const dir = dirname(config.databasePath);
        try {
            await Bun.write(Bun.file(`${dir}/.keep`), '');
        } catch {
            // Directory might not be writable, but database path might still work
        }

        // Open database with Bun's SQLite
        try {
            this.db = new Database(config.databasePath, {
                strict: true,
                safeIntegers: true,
                ...(config.connectionOptions || {})
            });

            // Apply optimal settings for Bun
            this.db.exec('PRAGMA journal_mode = WAL');
            this.db.exec('PRAGMA synchronous = NORMAL');
            this.db.exec('PRAGMA cache_size = 1000');
            this.db.exec('PRAGMA foreign_keys = ON');

        } catch (error) {
            throw new Error(`Failed to connect to database: ${error}`);
        }
    }

    async disconnect(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = undefined;
        }
    }

    async backup(backupPath: string, options: BackupOptions = {}): Promise<void> {
        this.requireDatabase();

        try {
            // Create backup directory if needed
            const backupDir = dirname(backupPath);
            try {
                await Bun.write(Bun.file(`${backupDir}/.keep`), '');
            } catch {
                // Ignore directory creation errors
            }

            if (options.compress) {
                // Read database and compress with Bun
                const backupData = await Bun.file(this.config!.databasePath).arrayBuffer();
                const compressed = Bun.gzipSync(new Uint8Array(backupData));
                await Bun.write(backupPath, compressed);
            } else {
                // Copy database directly using Bun's file API
                const dbContent = await Bun.file(this.config!.databasePath).arrayBuffer();
                await Bun.write(backupPath, dbContent);
            }

        } catch (error) {
            throw new Error(`Backup failed: ${error}`);
        }
    }

    async restore(backupPath: string, options: RestoreOptions = {}): Promise<void> {
        if (!this.config) {
            throw new Error('Database not connected');
        }

        try {
            // Check if backup file exists
            const backupFile = Bun.file(backupPath);
            if (!(await backupFile.exists())) {
                throw new Error(`Backup file not found: ${backupPath}`);
            }

            // Close current connection
            await this.disconnect();

            let restoredData: ArrayBuffer;

            if (backupPath.endsWith('.gz')) {
                // Decompress with Bun
                const compressedData = await backupFile.arrayBuffer();
                const decompressed = Bun.gunzipSync(new Uint8Array(compressedData));
                restoredData = decompressed.buffer;
            } else {
                restoredData = await backupFile.arrayBuffer();
            }

            // Write restored data to database path
            await Bun.write(this.config.databasePath, restoredData);

            // Reconnect
            await this.connect(this.config);

        } catch (error) {
            throw new Error(`Restore failed: ${error}`);
        }
    }

    async exists(): Promise<boolean> {
        if (!this.config) return false;

        try {
            const file = Bun.file(this.config.databasePath);
            return await file.exists();
        } catch {
            return false;
        }
    }

    async createTables(schema?: any): Promise<void> {
        this.requireDatabase();

        if (schema) {
            // Execute schema if provided
            if (typeof schema === 'string') {
                this.db!.exec(schema);
            } else if (Array.isArray(schema)) {
                for (const statement of schema) {
                    this.db!.exec(statement);
                }
            }
        }
    }

    listTables(): string[] {
        this.requireDatabase();

        const tables = this.db!.query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).all() as Array<{ name: string }>;

        return tables.map(t => t.name);
    }

    async isConnected(): Promise<boolean> {
        if (!this.db || !this.config) return false;

        try {
            // Check if database file exists and is readable
            const file = Bun.file(this.config.databasePath);
            return await file.exists();
        } catch {
            return false;
        }
    }

    getDatabaseStats(): DatabaseStats {
        this.requireDatabase();

        const stats: DatabaseStats = {
            tables: 0,
            totalRecords: 0,
            metadata: {}
        };

        // Get table information
        const tables = this.db!.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name: string }>;

        stats.tables = tables.length;

        for (const table of tables) {
            const countResult = this.db!.query(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: bigint };
            stats.totalRecords += Number(countResult.count);
        }

        // Get database size using synchronous approach (convert async to sync for interface compatibility)
        try {
            // Note: We'll use a different approach for size since the interface expects sync
            const pageCountInfo = this.db!.query("PRAGMA page_count").get() as { page_count?: bigint } | null;
            const pageInfo = this.db!.query("PRAGMA page_size").get() as { page_size?: number } | null;

            if (pageCountInfo?.page_count && pageInfo?.page_size) {
                stats.size = Number(pageCountInfo.page_count) * pageInfo.page_size;
            }

            // Store additional metadata
            stats.metadata = {
                pageSize: pageInfo?.page_size || 0,
                pageCount: pageCountInfo?.page_count ? Number(pageCountInfo.page_count) : 0
            };

            const freePagesInfo = this.db!.query("PRAGMA freelist_count").get() as { freelist_count?: number } | null;
            if (freePagesInfo?.freelist_count) {
                stats.metadata.unusedPages = freePagesInfo.freelist_count;
            }

        } catch {
            stats.size = 0;
        }

        return stats;
    }

    private requireDatabase(): void {
        if (!this.db) {
            throw new Error('Database not connected');
        }
    }

    // Additional Bun-optimized methods for merging and analysis

    async mergeDatabase(sourcePath: string, options: MergeOptions = {}): Promise<void> {
        this.requireDatabase();

        // Open source database
        const sourceDb = new Database(sourcePath, { readonly: true });

        try {
            // Get all tables from source
            const sourceTables = sourceDb.query(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            ).all() as Array<{ name: string }>;

            for (const table of sourceTables) {
                const tableName = table.name;

                // Check if table exists in target
                const targetTableExists = this.db!.query(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
                ).get(tableName);

                if (!targetTableExists) {
                    // Create table structure
                    const createTableSQL = sourceDb.query(
                        "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?"
                    ).get(tableName) as { sql: string };

                    if (createTableSQL?.sql) {
                        this.db!.exec(createTableSQL.sql);
                    }
                }

                // Copy data based on merge strategy
                const mergeStrategy = options.conflictResolution || 'replace';

                if (mergeStrategy === 'replace') {
                    this.db!.exec(`DELETE FROM ${tableName}`);
                }

                // Get all data from source table
                const sourceData = sourceDb.query(`SELECT * FROM ${tableName}`).all();

                if (sourceData.length > 0) {
                    await this.insertDataBatch(tableName, sourceData);
                }
            }
        } finally {
            sourceDb.close();
        }
    }

    analyzeMergeCompatibility(sourcePath: string): MergeAnalysis {
        this.requireDatabase();

        const analysis: MergeAnalysis = {
            compatibleTables: [],
            incompatibleTables: []
        };

        try {
            const sourceDb = new Database(sourcePath, { readonly: true });

            try {
                const sourceTables = sourceDb.query(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                ).all() as Array<{ name: string }>;

                const targetTables = this.db!.query(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                ).all() as Array<{ name: string }>;

                for (const sourceTable of sourceTables) {
                    const targetTable = targetTables.find(t => t.name === sourceTable.name);

                    if (!targetTable) {
                        // Table doesn't exist in target, so it's compatible (will be created)
                        analysis.compatibleTables.push({
                            name: sourceTable.name,
                            compatibleColumns: 0, // Will be all columns since table doesn't exist
                            totalColumns: 0
                        });
                        continue;
                    }

                    // Compare schemas
                    const sourceSchema = sourceDb.query(
                        "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?"
                    ).get(sourceTable.name) as { sql: string };

                    const targetSchema = this.db!.query(
                        "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?"
                    ).get(sourceTable.name) as { sql: string };

                    if (sourceSchema?.sql !== targetSchema?.sql) {
                        analysis.incompatibleTables.push(sourceTable.name);
                    } else {
                        analysis.compatibleTables.push({
                            name: sourceTable.name,
                            compatibleColumns: 0, // Could be enhanced to count actual compatible columns
                            totalColumns: 0
                        });
                    }
                }
            } finally {
                sourceDb.close();
            }
        } catch (error) {
            analysis.incompatibleTables.push(`Error analyzing source: ${error}`);
        }

        return analysis;
    }

    // Optimized batch insert for Bun
    private async insertDataBatch(tableName: string, rows: any[]): Promise<void> {
        if (rows.length === 0) return;

        // Get column names from first row
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const columnNames = columns.join(', ');

        const insertQuery = this.db!.query(
            `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`
        );

        // Use transaction for better performance
        this.db!.exec('BEGIN TRANSACTION');
        try {
            for (const row of rows) {
                const values = columns.map(col => row[col]);
                insertQuery.run(...values);
            }
            this.db!.exec('COMMIT');
        } catch (error) {
            this.db!.exec('ROLLBACK');
            throw error;
        }
    }
}