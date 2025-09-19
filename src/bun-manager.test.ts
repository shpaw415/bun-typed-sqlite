import { test, expect } from 'bun:test';
import { BunSQLiteManager } from '../src/bun-sqlite-manager';
import { DatabaseConfig } from '../src/types';
import { unlinkSync } from 'fs';

test('BunSQLiteManager Basic Operations', async () => {
    const testDbPath = './test-bun-manager.db';

    const config: DatabaseConfig = {
        databasePath: testDbPath,
        type: 'sqlite'
    };

    const manager = new BunSQLiteManager();

    try {
        // Clean up any existing test database
        try {
            unlinkSync(testDbPath);
        } catch {
            // File doesn't exist, ignore
        }

        // Test connection
        await manager.connect(config);
        expect(await manager.isConnected()).toBe(true);
        expect(await manager.exists()).toBe(true);

        // Test table creation
        await manager.createTables(`
      CREATE TABLE IF NOT EXISTS test_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE
      )
    `);

        const tables = manager.listTables();
        expect(tables).toContain('test_users');

        // Test stats
        const stats = manager.getDatabaseStats();
        expect(stats.tables).toBe(1);
        expect(stats.totalRecords).toBe(0);
        expect(typeof stats.size).toBe('number');

        // Test backup
        const backupPath = './test-backup-bun.db';
        await manager.backup(backupPath, { compress: false });

        // Test compressed backup
        const compressedBackupPath = './test-backup-bun.db.gz';
        await manager.backup(compressedBackupPath, { compress: true });

        // Test restore
        await manager.restore(backupPath);
        expect(await manager.isConnected()).toBe(true);

        // Clean up
        await manager.disconnect();

        // Clean up test files
        try {
            unlinkSync(testDbPath);
            unlinkSync(backupPath);
            unlinkSync(compressedBackupPath);
        } catch {
            // Files might not exist, ignore
        }

        console.log('✅ BunSQLiteManager is working correctly with Bun native APIs!');

    } catch (error) {
        console.error('❌ BunSQLiteManager test failed:', error);
        throw error;
    }
});

test('BunSQLiteManager Merge Operations', async () => {
    const sourceDbPath = './test-source.db';
    const targetDbPath = './test-target.db';

    const sourceConfig: DatabaseConfig = {
        databasePath: sourceDbPath,
        type: 'sqlite'
    };

    const targetConfig: DatabaseConfig = {
        databasePath: targetDbPath,
        type: 'sqlite'
    };

    const sourceManager = new BunSQLiteManager();
    const targetManager = new BunSQLiteManager();

    try {
        // Clean up
        [sourceDbPath, targetDbPath].forEach(path => {
            try { unlinkSync(path); } catch { }
        });

        // Set up source database
        await sourceManager.connect(sourceConfig);
        await sourceManager.createTables(`
      CREATE TABLE test_table (
        id INTEGER PRIMARY KEY,
        name TEXT,
        value INTEGER
      )
    `);

        // Set up target database  
        await targetManager.connect(targetConfig);
        await targetManager.createTables(`
      CREATE TABLE test_table (
        id INTEGER PRIMARY KEY,
        name TEXT,
        value INTEGER
      )
    `);

        await sourceManager.disconnect();

        // Test merge analysis
        const analysis = targetManager.analyzeMergeCompatibility(sourceDbPath);
        expect(analysis.compatibleTables.length).toBeGreaterThan(0);
        expect(analysis.incompatibleTables.length).toBe(0);

        // Test merge
        await targetManager.mergeDatabase(sourceDbPath);

        await targetManager.disconnect();

        // Clean up
        [sourceDbPath, targetDbPath].forEach(path => {
            try { unlinkSync(path); } catch { }
        });

        console.log('✅ BunSQLiteManager merge operations working correctly!');

    } catch (error) {
        console.error('❌ BunSQLiteManager merge test failed:', error);
        throw error;
    }
});