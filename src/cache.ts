import * as vscode from 'vscode';

export class StateManager {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    read() {
        return this.context.globalState.get('lastFolderApplied')?.toString();
    }

    async write(newState: string) {
        await this.context.globalState.update('lastFolderApplied', newState);
    }
}