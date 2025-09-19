import type { UserInterface } from './types.js';

/**
 * Simple console-based user interface implementation
 * Provides basic functionality without external dependencies
 */
export class ConsoleUI implements UserInterface {
    private isProgressActive = false;

    log(message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info'): void {
        const prefix = this.getPrefix(type);
        console.log(`${prefix}${message}`);
    }

    async confirm(message: string, defaultValue: boolean = false): Promise<boolean> {
        const suffix = defaultValue ? ' (Y/n)' : ' (y/N)';
        const answer = await this.prompt(message + suffix);

        if (!answer.trim()) {
            return defaultValue;
        }

        return ['y', 'yes', 'true', '1'].includes(answer.toLowerCase());
    }

    progress(title: string, percentage: number): void {
        if (!this.isProgressActive) {
            this.isProgressActive = true;
        }

        const width = 30;
        const filled = Math.round(width * percentage / 100);
        const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
        const percent = percentage.toFixed(1).padStart(5);

        process.stdout.write(`\r${title}: [${bar}] ${percent}%`);

        if (percentage >= 100) {
            process.stdout.write('\n');
            this.isProgressActive = false;
        }
    }

    stopProgress(): void {
        if (this.isProgressActive) {
            process.stdout.write('\n');
            this.isProgressActive = false;
        }
    }

    async select<T>(message: string, choices: Array<{ label: string; value: T }>): Promise<T> {
        console.log(`\n${message}`);
        choices.forEach((choice, index) => {
            console.log(`  ${index + 1}. ${choice.label}`);
        });

        while (true) {
            const answer = await this.prompt(`\nSelect (1-${choices.length}): `);
            const index = parseInt(answer) - 1;

            if (index >= 0 && index < choices.length && choices[index]) {
                return choices[index].value;
            }

            console.log('Invalid selection. Please try again.');
        }
    }

    clear(): void {
        console.clear();
    }

    private getPrefix(type: string): string {
        switch (type) {
            case 'error': return '❌ ';
            case 'warn': return '⚠️  ';
            case 'success': return '✅ ';
            case 'info':
            default: return '📋 ';
        }
    }

    private async prompt(question: string): Promise<string> {
        process.stdout.write(question);

        return new Promise((resolve) => {
            const stdin = process.stdin;
            stdin.setRawMode(false);
            stdin.resume();
            stdin.setEncoding('utf8');

            const onData = (data: string) => {
                stdin.removeListener('data', onData);
                stdin.pause();
                resolve(data.toString().trim());
            };

            stdin.on('data', onData);
        });
    }
}

/**
 * Enhanced terminal UI implementation (optional)
 * Uses terminal-kit for better user experience if available
 */
export class TerminalUI implements UserInterface {
    private terminal: any;
    private progressBar: any;

    constructor() {
        try {
            this.terminal = require('terminal-kit').terminal;
        } catch {
            // Fallback to console UI if terminal-kit is not available
            console.warn('terminal-kit not available, using console fallback');
            return new ConsoleUI() as any;
        }
    }

    log(message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info'): void {
        const colorMethod = this.getColorMethod(type);
        this.terminal[colorMethod](this.getPrefix(type) + message + '\n');
    }

    async confirm(message: string, defaultValue: boolean = false): Promise<boolean> {
        this.terminal.cyan(message + ' ');

        if (defaultValue) {
            this.terminal.dim('(Y/n)');
        } else {
            this.terminal.dim('(y/N)');
        }

        this.terminal(' ');

        const result = await this.terminal.yesOrNo({
            yes: ['y', 'yes', 'Y', 'YES'],
            no: ['n', 'no', 'N', 'NO']
        }).promise;

        this.terminal('\n');
        return result ?? defaultValue;
    }

    progress(title: string, percentage: number): void {
        if (!this.progressBar) {
            this.progressBar = this.terminal.progressBar({
                width: 40,
                title,
                eta: true,
                percent: true
            });
        }

        this.progressBar.update(percentage / 100);

        if (percentage >= 100) {
            this.progressBar.stop();
            this.progressBar = null;
        }
    }

    stopProgress(): void {
        if (this.progressBar) {
            this.progressBar.stop();
            this.progressBar = null;
        }
    }

    async select<T>(message: string, choices: Array<{ label: string; value: T }>): Promise<T> {
        this.terminal('\n');
        this.terminal.magenta.bold(message + '\n');

        const items = choices.map(choice => choice.label);

        const result = await this.terminal.singleColumnMenu(items, {
            style: this.terminal.cyan,
            selectedStyle: this.terminal.green.bold,
            cancelable: false,
            exitOnUnexpectedKey: false
        }).promise;

        this.terminal('\n');
        const choice = choices[result.selectedIndex];
        if (!choice) {
            throw new Error('Invalid selection');
        }
        return choice.value;
    }

    clear(): void {
        this.terminal.clear();
    }

    private getColorMethod(type: string): string {
        switch (type) {
            case 'error': return 'red';
            case 'warn': return 'yellow';
            case 'success': return 'green';
            case 'info':
            default: return 'cyan';
        }
    }

    private getPrefix(type: string): string {
        switch (type) {
            case 'error': return '❌ ';
            case 'warn': return '⚠️  ';
            case 'success': return '✅ ';
            case 'info':
            default: return '📋 ';
        }
    }
}