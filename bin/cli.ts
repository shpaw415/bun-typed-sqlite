#!/usr/bin/env node

/**
 * Command-line interface for the generic database CLI
 */

import { DatabaseCLI, createSQLiteCLI } from '../dist/index.js';
import { existsSync } from 'fs';
import { resolve } from 'path';

const COMMANDS = {
    create: 'Create database and schema',
    backup: 'Create a backup of the database',
    restore: 'Restore database from backup',
    merge: 'Merge data from another database',
    stats: 'Show database statistics',
    help: 'Show this help message'
};

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
        showHelp();
        return;
    }

    const command = args[0];
    const databasePath = args[1] || './database.db';

    if (!Object.keys(COMMANDS).includes(command)) {
        console.error(`❌ Unknown command: ${command}`);
        console.log('');
        showHelp();
        process.exit(1);
    }

    const cli = createSQLiteCLI(resolve(databasePath), {
        useTerminalUI: !process.env.NO_TERMINAL_UI,
        verbose: process.env.VERBOSE === 'true'
    });

    try {
        let result;

        switch (command) {
            case 'create':
                // Optional schema file path
                const schemaPath = args[2];
                let schema;
                if (schemaPath && existsSync(schemaPath)) {
                    const schemaModule = await import(resolve(schemaPath));
                    schema = schemaModule.default || schemaModule;
                }
                result = await cli.create(schema);
                break;

            case 'backup':
                const backupPath = args[2];
                if (!backupPath) {
                    console.error('❌ Backup path is required');
                    console.log('Usage: database-cli backup <database-path> <backup-path>');
                    process.exit(1);
                }
                result = await cli.backup(backupPath);
                break;

            case 'restore':
                const restorePath = args[2];
                if (!restorePath) {
                    console.error('❌ Restore path is required');
                    console.log('Usage: database-cli restore <database-path> <backup-path>');
                    process.exit(1);
                }
                result = await cli.restore(restorePath);
                break;

            case 'merge':
                const sourcePath = args[2];
                if (!sourcePath) {
                    console.error('❌ Source database path is required');
                    console.log('Usage: database-cli merge <database-path> <source-database-path>');
                    process.exit(1);
                }
                result = await cli.merge(sourcePath);
                break;

            case 'stats':
                result = await cli.stats();
                break;

            default:
                console.error(`❌ Command not implemented: ${command}`);
                process.exit(1);
        }

        if (!result.success) {
            console.error(`❌ Command failed: ${result.message || result.error?.message}`);
            process.exit(1);
        }

    } catch (error) {
        console.error(`❌ Unexpected error: ${error}`);
        process.exit(1);
    }
}

function showHelp() {
    console.log('Generic Database CLI - Framework-agnostic database management');
    console.log('');
    console.log('Usage: database-cli <command> <database-path> [options]');
    console.log('');
    console.log('Commands:');
    Object.entries(COMMANDS).forEach(([cmd, desc]) => {
        console.log(`  ${cmd.padEnd(12)} ${desc}`);
    });
    console.log('');
    console.log('Examples:');
    console.log('  database-cli create ./myapp.db');
    console.log('  database-cli create ./myapp.db ./schema.js');
    console.log('  database-cli backup ./myapp.db ./backups/backup.db.gz');
    console.log('  database-cli restore ./myapp.db ./backups/backup.db.gz');
    console.log('  database-cli merge ./myapp.db ./old-data.db');
    console.log('  database-cli stats ./myapp.db');
    console.log('');
    console.log('Environment Variables:');
    console.log('  NO_TERMINAL_UI=true    Disable enhanced terminal UI');
    console.log('  VERBOSE=true           Enable verbose logging');
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
    console.error(`❌ Uncaught exception: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error(`❌ Unhandled rejection: ${reason}`);
    process.exit(1);
});

main().catch((error) => {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
});