import * as vscode from 'vscode';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

let channel: vscode.OutputChannel | undefined;

function getChannel(): vscode.OutputChannel {
    if (!channel) {
        channel = vscode.window.createOutputChannel('Power Automate Copilot');
    }
    return channel;
}

function write(level: LogLevel, message: string, data?: unknown): void {
    const ts = new Date().toISOString();
    let line = `[${ts}] [${level}] ${message}`;
    if (data !== undefined) {
        try {
            line += '\n' + JSON.stringify(data, null, 2);
        } catch {
            line += '\n' + String(data);
        }
    }
    getChannel().appendLine(line);
}

export const logger = {
    debug: (message: string, data?: unknown) => write('DEBUG', message, data),
    info:  (message: string, data?: unknown) => write('INFO',  message, data),
    warn:  (message: string, data?: unknown) => write('WARN',  message, data),
    error: (message: string, data?: unknown) => write('ERROR', message, data),

    /** Show the output panel and bring it to focus. */
    show(): void {
        getChannel().show(true);
    },

    /** Dispose the channel (called on extension deactivation). */
    dispose(): void {
        channel?.dispose();
        channel = undefined;
    },
};
