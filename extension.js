// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Get all files in the project, excluding common directories and files
 * @param {string} dirPath - The directory path to scan
 * @returns {Promise<string[]>} - Array of file paths
 */
async function getAllProjectFiles(dirPath) {
    const files = [];
    const ignoredDirs = ['.git', 'node_modules', '.vscode', 'dist', 'build', 'out', '.next', '.nuxt', 'coverage'];
    const ignoredFiles = ['.gitignore', '.eslintrc', '.prettierrc', 'package-lock.json', 'yarn.lock'];

    function scanDirectory(currentPath) {
        try {
            const items = fs.readdirSync(currentPath);
            
            for (const item of items) {
                const itemPath = path.join(currentPath, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    // Skip ignored directories
                    if (!ignoredDirs.includes(item) && !item.startsWith('.')) {
                        scanDirectory(itemPath);
                    }
                } else if (stat.isFile()) {
                    // Skip ignored files and hidden files
                    if (!ignoredFiles.includes(item) && !item.startsWith('.')) {
                        files.push(itemPath);
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${currentPath}:`, error);
        }
    }

    scanDirectory(dirPath);
    return files.sort();
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "git-backup" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
const disposable = vscode.commands.registerCommand('git-backup.backupProject', async function () {
    try {
        // Get the current workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        
        // Get all files in the workspace
        const allFiles = await getAllProjectFiles(workspaceRoot);
        
        if (allFiles.length === 0) {
            vscode.window.showErrorMessage('No files found in the project.');
            return;
        }

        // Create quick pick items for file selection
        const quickPickItems = allFiles.map(file => ({
            label: path.basename(file),
            description: path.relative(workspaceRoot, file),
            detail: file,
            picked: false
        }));

        // Show multi-select quick pick for files
        const selectedItems = await vscode.window.showQuickPick(quickPickItems, {
            canPickMany: true,
            placeHolder: 'Select files to backup (use Ctrl/Cmd+Click for multiple selection)'
        });

        if (!selectedItems || selectedItems.length === 0) {
            vscode.window.showErrorMessage('No files selected for backup.');
            return;
        }

        // Ask for destination folder
        const destinationUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            openLabel: 'Select destination folder',
            canSelectFiles: false
        });

        if (!destinationUri) {
            vscode.window.showErrorMessage('No destination folder selected.');
            return;
        }

        const destinationFolder = destinationUri[0].fsPath;

        // Show progress during backup
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Backing up files",
            cancellable: false
        }, async (progress) => {
            const totalFiles = selectedItems.length;
            
            for (let i = 0; i < selectedItems.length; i++) {
                const file = selectedItems[i];
                const sourcePath = file.detail;
                const relativePath = path.relative(workspaceRoot, sourcePath);
                const destinationPath = path.join(destinationFolder, relativePath);
                
                // Create directory structure if it doesn't exist
                const destinationDir = path.dirname(destinationPath);
                if (!fs.existsSync(destinationDir)) {
                    fs.mkdirSync(destinationDir, { recursive: true });
                }
                
                // Copy the file
                fs.copyFileSync(sourcePath, destinationPath);
                
                // Update progress
                progress.report({ 
                    increment: (100 / totalFiles), 
                    message: `Copying ${path.basename(sourcePath)} (${i + 1}/${totalFiles})` 
                });
            }
        });

        vscode.window.showInformationMessage(`Successfully backed up ${selectedItems.length} file(s) to ${destinationFolder}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Backup failed: ${error.message}`);
        console.error('Backup error:', error);
    }
});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
