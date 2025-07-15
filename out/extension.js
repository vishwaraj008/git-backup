"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
/**
 * Get all files in the project, excluding common directories and files
 */
async function getAllProjectFiles(dirPath, options) {
    const files = [];
    const ignoredDirs = ['.git', 'node_modules', '.vscode', 'dist', 'build', 'out', '.next', '.nuxt', 'coverage', 'target', 'bin', 'obj'];
    const ignoredFiles = ['.DS_Store', 'Thumbs.db', '.gitignore', '.eslintrc', '.prettierrc', 'package-lock.json', 'yarn.lock'];
    function scanDirectory(currentPath) {
        try {
            const items = fs.readdirSync(currentPath);
            for (const item of items) {
                const itemPath = path.join(currentPath, item);
                const stat = fs.statSync(itemPath);
                if (stat.isDirectory()) {
                    // Skip ignored directories
                    if (!ignoredDirs.includes(item) && (options.includeHiddenFiles || !item.startsWith('.'))) {
                        scanDirectory(itemPath);
                    }
                }
                else if (stat.isFile()) {
                    // Skip ignored files and optionally hidden files
                    if (!ignoredFiles.includes(item) && (options.includeHiddenFiles || !item.startsWith('.'))) {
                        files.push(itemPath);
                    }
                }
            }
        }
        catch (error) {
            console.error(`Error scanning directory ${currentPath}:`, error);
        }
    }
    scanDirectory(dirPath);
    return files.sort();
}
/**
 * Create a backup folder with timestamp if requested
 */
function createBackupFolder(destinationPath, options) {
    if (options.createTimestampFolder) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFolder = path.join(destinationPath, `backup-${timestamp}`);
        fs.mkdirSync(backupFolder, { recursive: true });
        return backupFolder;
    }
    return destinationPath;
}
/**
 * Copy a file to the destination with proper directory structure
 */
function copyFileWithStructure(sourcePath, destinationPath, workspaceRoot, options) {
    let finalDestinationPath;
    if (options.preserveStructure) {
        const relativePath = path.relative(workspaceRoot, sourcePath);
        finalDestinationPath = path.join(destinationPath, relativePath);
        // Create directory structure if it doesn't exist
        const destinationDir = path.dirname(finalDestinationPath);
        if (!fs.existsSync(destinationDir)) {
            fs.mkdirSync(destinationDir, { recursive: true });
        }
    }
    else {
        finalDestinationPath = path.join(destinationPath, path.basename(sourcePath));
    }
    // Handle file name conflicts
    let counter = 1;
    let actualDestinationPath = finalDestinationPath;
    while (fs.existsSync(actualDestinationPath)) {
        const ext = path.extname(finalDestinationPath);
        const nameWithoutExt = path.basename(finalDestinationPath, ext);
        const dir = path.dirname(finalDestinationPath);
        actualDestinationPath = path.join(dir, `${nameWithoutExt}(${counter})${ext}`);
        counter++;
    }
    fs.copyFileSync(sourcePath, actualDestinationPath);
}
/**
 * Get backup options from user
 */
async function getBackupOptions() {
    const preserveStructure = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Preserve directory structure in backup?'
    });
    if (!preserveStructure) {
        return undefined;
    }
    const includeHiddenFiles = await vscode.window.showQuickPick(['No', 'Yes'], {
        placeHolder: 'Include hidden files and folders?'
    });
    if (!includeHiddenFiles) {
        return undefined;
    }
    const createTimestampFolder = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Create timestamped backup folder?'
    });
    if (!createTimestampFolder) {
        return undefined;
    }
    return {
        preserveStructure: preserveStructure === 'Yes',
        includeHiddenFiles: includeHiddenFiles === 'Yes',
        createTimestampFolder: createTimestampFolder === 'Yes'
    };
}
/**
 * Main backup command implementation
 */
async function backupProject() {
    try {
        // Get the current workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        // Get backup options from user
        const options = await getBackupOptions();
        if (!options) {
            return; // User cancelled
        }
        // Get all files in the workspace
        const allFiles = await getAllProjectFiles(workspaceRoot, options);
        if (allFiles.length === 0) {
            vscode.window.showErrorMessage('No files found in the project.');
            return;
        }
        // Create quick pick items for file selection
        const quickPickItems = allFiles.map(file => ({
            label: path.basename(file),
            description: path.relative(workspaceRoot, file),
            detail: file,
            filePath: file
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
        const destinationFolder = createBackupFolder(destinationUri[0].fsPath, options);
        // Show progress during backup
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Backing up files",
            cancellable: false
        }, async (progress) => {
            const totalFiles = selectedItems.length;
            for (let i = 0; i < selectedItems.length; i++) {
                const file = selectedItems[i];
                const sourcePath = file.filePath;
                // Copy the file
                copyFileWithStructure(sourcePath, destinationFolder, workspaceRoot, options);
                // Update progress
                progress.report({
                    increment: (100 / totalFiles),
                    message: `Copying ${path.basename(sourcePath)} (${i + 1}/${totalFiles})`
                });
            }
        });
        // Show success message with option to open destination
        const result = await vscode.window.showInformationMessage(`Successfully backed up ${selectedItems.length} file(s) to ${destinationFolder}`, 'Open Destination');
        if (result === 'Open Destination') {
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(destinationFolder), true);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Backup failed: ${errorMessage}`);
        console.error('Backup error:', error);
    }
}
function activate(context) {
    console.log('Git Backup extension is now active!');
    const disposable = vscode.commands.registerCommand('git-backup.backupProject', backupProject);
    context.subscriptions.push(disposable);
}
function deactivate() {
    // Extension is being deactivated
}
//# sourceMappingURL=extension.js.map