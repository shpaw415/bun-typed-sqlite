import type {
    CLIConfig,
    CommandResult,
    BackupOptions,
    RestoreOptions,
    MergeOptions,
    DatabaseManager,
    UserInterface
} from './types.js';
import { ConsoleUI, TerminalUI } from './ui.js';
import { BunSQLiteManager } from './bun-sqlite-manager.js';

/**
 * Generic Database CLI Commands
 * Provides database management functionality that can be used with any database implementation
 */
export class DatabaseCLI {
    private config: CLIConfig;
    private ui: UserInterface;
    private manager: DatabaseManager;

    constructor(config: CLIConfig) {
        this.config = config;
        this.ui = config.ui || this.createDefaultUI();
        this.manager = config.manager || new BunSQLiteManager();
    }

    /**
     * Create database and schema
     */
    async create(schema?: any): Promise<CommandResult> {
        try {
            this.ui.clear?.();
            this.ui.log('🚀 Database Creation Started', 'info');
            this.ui.log('═'.repeat(50), 'info');

            this.ui.progress('Initializing...', 10);
            await this.manager.connect(this.config.database);

            this.ui.progress('Checking existing database...', 30);
            const exists = this.manager.exists();

            if (exists) {
                const hasExistingTables = this.manager.listTables().length > 0;

                if (hasExistingTables) {
                    this.ui.stopProgress();
                    this.ui.log('⚠️  Warning: Database already exists with tables.', 'warn');

                    const shouldMigrate = await this.ui.confirm(
                        'Do you want to proceed with schema migration? This will modify your database.',
                        false
                    );

                    if (!shouldMigrate) {
                        this.ui.log('❌ Database creation cancelled.', 'error');
                        return { success: false, message: 'Operation cancelled by user' };
                    }

                    const strategy = await this.promptMigrationStrategy();
                    const shouldBackup = await this.ui.confirm(
                        'Create a backup before migration? (recommended)',
                        true
                    );

                    return await this.performMigration(schema, strategy, shouldBackup);
                }
            }

            this.ui.progress('Creating database schema...', 70);
            this.manager.createTables(schema);

            this.ui.progress('Finalizing...', 100);
            this.ui.stopProgress();

            this.ui.log('✅ Database and schema created successfully!', 'success');
            this.ui.log('🎉 Your database is ready to use!', 'success');

            return { success: true, message: 'Database created successfully' };
        } catch (error) {
            this.ui.stopProgress();
            this.ui.log(`❌ Database creation failed: ${error}`, 'error');
            return { success: false, error: error as Error };
        } finally {
            this.manager.disconnect();
        }
    }

    /**
     * Create a backup of the database
     */
    async backup(backupPath: string, options: BackupOptions = {}): Promise<CommandResult> {
        if (!backupPath) {
            this.ui.log('Error: Backup path is required', 'error');
            this.ui.log('Usage: backup <backup-file-path>', 'info');
            this.ui.log('Examples:', 'info');
            this.ui.log('  backup ./backups/my-backup.db', 'info');
            this.ui.log('  backup ./backups/compressed-backup.db.gz', 'info');
            return { success: false, message: 'Backup path required' };
        }

        try {
            await this.manager.connect(this.config.database);

            if (!this.manager.exists()) {
                throw new Error('No database found to backup. Create database first.');
            }

            this.ui.log('📦 Creating database backup...', 'info');

            // Determine options from file extension if not explicitly set
            const shouldCompress = options.compress ?? backupPath.endsWith('.gz');
            const isJSON = backupPath.endsWith('.json') || backupPath.endsWith('.json.gz');

            // Ask for backup options if not provided
            const finalOptions: BackupOptions = {
                compress: shouldCompress,
                format: isJSON ? 'json' : 'binary',
                includeData: options.includeData ?? await this.ui.confirm(
                    'Include table data in backup?',
                    true
                ),
                ...options
            };

            if (!finalOptions.includeData) {
                this.ui.log('Creating schema-only backup...', 'info');
            }

            const startTime = Date.now();
            this.manager.backup(backupPath, finalOptions);
            const duration = Date.now() - startTime;

            this.ui.log('✅ Database backup completed successfully!', 'success');
            this.ui.log(`📁 Backup saved to: ${backupPath}`, 'info');
            this.ui.log(`⏱️  Backup took: ${duration}ms`, 'info');
            this.ui.log(`🗜️  Compression: ${shouldCompress ? 'enabled' : 'disabled'}`, 'info');
            this.ui.log(`📊 Content: ${finalOptions.includeData ? 'schema + data' : 'schema only'}`, 'info');

            return {
                success: true,
                message: 'Backup completed successfully',
                data: { backupPath, duration, options: finalOptions }
            };
        } catch (error) {
            this.ui.log(`❌ Database backup failed: ${error}`, 'error');
            return { success: false, error: error as Error };
        } finally {
            this.manager.disconnect();
        }
    }

    /**
     * Restore database from backup
     */
    async restore(backupPath: string, options: RestoreOptions = {}): Promise<CommandResult> {
        if (!backupPath) {
            this.ui.log('Error: Backup path is required', 'error');
            this.ui.log('Usage: restore <backup-file-path>', 'info');
            this.ui.log('Examples:', 'info');
            this.ui.log('  restore ./backups/my-backup.db', 'info');
            this.ui.log('  restore ./backups/compressed-backup.db.gz', 'info');
            return { success: false, message: 'Backup path required' };
        }

        try {
            await this.manager.connect(this.config.database);

            this.ui.log(`🔄 Preparing to restore from: ${backupPath}`, 'info');

            const targetExists = this.manager.exists();
            if (targetExists) {
                this.ui.log('⚠️  Warning: Current database will be affected by this restore operation.', 'warn');

                const shouldBackupFirst = await this.ui.confirm(
                    'Create a backup of current database before restore?',
                    true
                );

                if (shouldBackupFirst) {
                    const preRestoreBackupPath = this.generateBackupPath('pre-restore');
                    this.ui.log(`📦 Creating pre-restore backup: ${preRestoreBackupPath}`, 'info');

                    this.manager.backup(preRestoreBackupPath, { compress: true, includeData: true });
                    this.ui.log('✅ Pre-restore backup created!', 'success');
                }
            }

            // Ask for restore strategy if not provided
            const finalOptions: RestoreOptions = {
                dropExisting: options.dropExisting ?? await this.ui.confirm(
                    'Drop existing tables before restore? (recommended for clean restore)',
                    true
                ),
                ...options
            };

            const shouldProceed = await this.ui.confirm(
                `Proceed with restore from ${backupPath}? This will modify your current database.`,
                false
            );

            if (!shouldProceed) {
                this.ui.log('Database restore cancelled.', 'info');
                return { success: false, message: 'Operation cancelled by user' };
            }

            this.ui.log('🚀 Starting restore operation...', 'info');
            const startTime = Date.now();
            this.manager.restore(backupPath, finalOptions);
            const duration = Date.now() - startTime;

            this.ui.log('✅ Database restore completed successfully!', 'success');
            this.ui.log(`⏱️  Restore took: ${duration}ms`, 'info');
            this.ui.log(`🗂️  Strategy: ${finalOptions.dropExisting ? 'clean restore (dropped existing)' : 'merge restore'}`, 'info');

            // Show current database statistics
            const stats = this.manager.getDatabaseStats();
            this.ui.log(`📊 Current database: ${stats.tables} tables, ${stats.totalRecords} total records`, 'info');

            return {
                success: true,
                message: 'Restore completed successfully',
                data: { duration, options: finalOptions, stats }
            };
        } catch (error) {
            this.ui.log(`❌ Database restore failed: ${error}`, 'error');
            return { success: false, error: error as Error };
        } finally {
            this.manager.disconnect();
        }
    }

    /**
     * Merge data from another database
     */
    async merge(sourcePath: string, options: MergeOptions = {}): Promise<CommandResult> {
        if (!sourcePath) {
            this.ui.log('Error: Source database path is required', 'error');
            this.ui.log('Usage: merge <source-database-path>', 'info');
            this.ui.log('Example: merge ./backup/old-database.db', 'info');
            return { success: false, message: 'Source path required' };
        }

        try {
            await this.manager.connect(this.config.database);

            if (!this.manager.exists()) {
                this.ui.log('Target database doesn\'t exist. Creating it first...', 'info');
                this.manager.createTables();
            }

            this.ui.log(`🔄 Starting database merge from: ${sourcePath}`, 'info');
            this.ui.log('This operation will merge data from the source database into the current database.', 'info');

            const shouldProceed = await this.ui.confirm(
                'Do you want to proceed with the merge? This may overwrite existing data.',
                false
            );

            if (!shouldProceed) {
                this.ui.log('Database merge cancelled.', 'info');
                return { success: false, message: 'Operation cancelled by user' };
            }

            const shouldBackup = await this.ui.confirm(
                'Would you like to create a backup of the current database before merging?',
                true
            );

            if (shouldBackup) {
                const backupPath = this.generateBackupPath('pre-merge');
                this.ui.log(`📦 Creating backup at: ${backupPath}`, 'info');
                this.manager.backup(backupPath, { compress: true, includeData: true });
                this.ui.log('✅ Backup created successfully!', 'success');
            }

            // Get merge options if not provided
            const finalOptions: MergeOptions = {
                conflictResolution: options.conflictResolution || await this.promptConflictResolution(),
                tablesFilter: options.tablesFilter || await this.promptTableFilter(sourcePath),
                ...options
            };

            this.ui.log('🚀 Starting merge operation...', 'info');
            await this.manager.mergeDatabase(sourcePath, finalOptions);

            this.ui.log('✅ Database merge completed successfully!', 'success');
            this.ui.log('Your database now contains merged data from both sources.', 'success');

            const stats = this.manager.getDatabaseStats();
            this.ui.log(`📊 Current database: ${stats.tables} tables, ${stats.totalRecords} total records`, 'info');

            return {
                success: true,
                message: 'Merge completed successfully',
                data: { options: finalOptions, stats }
            };
        } catch (error) {
            this.ui.log(`❌ Database merge failed: ${error}`, 'error');
            return { success: false, error: error as Error };
        } finally {
            this.manager.disconnect();
        }
    }

    /**
     * Get database statistics
     */
    async stats(): Promise<CommandResult> {
        try {
            await this.manager.connect(this.config.database);

            if (!this.manager.exists()) {
                this.ui.log('❌ Database does not exist', 'error');
                return { success: false, message: 'Database not found' };
            }

            const stats = this.manager.getDatabaseStats();
            const tables = this.manager.listTables();

            this.ui.log('📊 Database Statistics', 'info');
            this.ui.log('═'.repeat(30), 'info');
            this.ui.log(`📁 Database: ${this.config.database.databasePath}`, 'info');
            this.ui.log(`🗂️  Tables: ${stats.tables}`, 'info');
            this.ui.log(`📄 Total Records: ${stats.totalRecords}`, 'info');

            if (stats.size) {
                this.ui.log(`💾 File Size: ${this.formatBytes(stats.size)}`, 'info');
            }

            if (tables.length > 0) {
                this.ui.log('\n📋 Tables:', 'info');
                tables.forEach(table => {
                    this.ui.log(`  • ${table}`, 'info');
                });
            }

            return {
                success: true,
                message: 'Statistics retrieved successfully',
                data: { ...stats, tables }
            };
        } catch (error) {
            this.ui.log(`❌ Failed to get database statistics: ${error}`, 'error');
            return { success: false, error: error as Error };
        } finally {
            this.manager.disconnect();
        }
    }

    private createDefaultUI(): UserInterface {
        try {
            return new TerminalUI();
        } catch {
            return new ConsoleUI();
        }
    }

    private async performMigration(schema: any, strategy: string, shouldBackup: boolean): Promise<CommandResult> {
        try {
            // Create backups
            const tempBackupPath = this.generateBackupPath('temp-migration');
            this.manager.backup(tempBackupPath, { compress: true, includeData: true });

            if (shouldBackup) {
                const permanentBackupPath = this.generateBackupPath('pre-migration');
                this.ui.log(`📦 Creating permanent backup: ${permanentBackupPath}`, 'info');
                this.manager.backup(permanentBackupPath, { compress: true, includeData: true });
            }

            // Get existing stats
            const existingStats = this.manager.getDatabaseStats();
            this.ui.log(`📊 Current database: ${existingStats.tables} tables, ${existingStats.totalRecords} total records`, 'info');

            // Drop and recreate
            this.ui.progress('Migration Progress', 50);
            const existingTables = this.manager.listTables();
            for (const tableName of existingTables) {
                // This would need to be implemented in the database manager
                // this.manager.dropTable(tableName);
            }

            // Create new schema
            this.manager.createTables(schema);

            // Attempt to restore compatible data
            this.ui.progress('Migration Progress', 90);
            if (this.manager.analyzeMergeCompatibility) {
                const analysis = await Promise.resolve(this.manager.analyzeMergeCompatibility(tempBackupPath));

                if (analysis.compatibleTables.length > 0) {
                    const shouldRestore = await this.ui.confirm(
                        `Found ${analysis.compatibleTables.length} compatible tables. Restore data?`,
                        true
                    );

                    if (shouldRestore) {
                        await this.manager.mergeDatabase(tempBackupPath, {
                            conflictResolution: strategy as any,
                            tablesFilter: analysis.compatibleTables.map((t: any) => t.name)
                        });
                    }
                }
            }

            this.ui.progress('Migration Progress', 100);
            this.ui.stopProgress();

            this.ui.log('🎉 Database migration completed successfully!', 'success');

            return { success: true, message: 'Migration completed successfully' };
        } catch (error) {
            this.ui.log(`❌ Migration failed: ${error}`, 'error');
            return { success: false, error: error as Error };
        }
    }

    private async promptMigrationStrategy(): Promise<string> {
        return await this.ui.select('Choose migration strategy:', [
            { label: '🔄 Replace - Overwrite existing records with new data (recommended)', value: 'replace' },
            { label: '⏭️  Ignore - Keep existing records, skip conflicts', value: 'ignore' },
            { label: '🛑 Fail - Stop on first conflict (safest)', value: 'fail' }
        ]);
    }

    private async promptConflictResolution(): Promise<'replace' | 'ignore' | 'fail'> {
        this.ui.log('🔧 Conflict Resolution Strategy', 'info');
        this.ui.log('When merging data, conflicts may occur. Choose how to handle them:', 'info');

        return await this.ui.select('Select conflict resolution:', [
            { label: '🔄 Replace - Overwrite existing records', value: 'replace' },
            { label: '⏭️  Ignore - Keep existing records', value: 'ignore' },
            { label: '🛑 Fail - Stop on conflicts', value: 'fail' }
        ]) as 'replace' | 'ignore' | 'fail';
    }

    private async promptTableFilter(sourcePath: string): Promise<string[] | undefined> {
        const shouldFilter = await this.ui.confirm(
            'Do you want to merge only specific tables?',
            false
        );

        if (!shouldFilter) {
            return undefined;
        }

        // This would need to be implemented to analyze the source database
        // For now, return undefined (merge all tables)
        this.ui.log('⚠️  Table filtering not yet implemented, merging all compatible tables', 'warn');
        return undefined;
    }

    private generateBackupPath(prefix: string): string {
        const timestamp = new Date().toISOString().split('T')[0];
        const time = Date.now();
        const dir = this.config.backupDir || './backups';
        return `${dir}/${prefix}-${timestamp}-${time}.db.gz`;
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}