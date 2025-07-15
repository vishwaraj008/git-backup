import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface FileItem extends vscode.QuickPickItem {
    detail: string;
    filePath: string;
    isDirectory: boolean;
    isParent?: boolean;
    isSelected?: boolean;
}

interface BackupOptions {
    preserveStructure: boolean;
    includeHiddenFiles: boolean;
    createTimestampFolder: boolean;
}

interface RohitIgnorePattern {
    pattern: string;
    isDirectory: boolean;
    isGlob: boolean;
}

/**
 * Parse .rohitignore file and return patterns
 */
function parseRohitIgnore(workspaceRoot: string): RohitIgnorePattern[] {
    const rohitIgnorePath = path.join(workspaceRoot, '.rohitignore');
    const patterns: RohitIgnorePattern[] = [];
    
    if (!fs.existsSync(rohitIgnorePath)) {
        return patterns;
    }
    
    try {
        const content = fs.readFileSync(rohitIgnorePath, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const isDirectory = trimmed.endsWith('/');
                const pattern = isDirectory ? trimmed.slice(0, -1) : trimmed;
                const isGlob = pattern.includes('*') || pattern.includes('?');
                
                patterns.push({
                    pattern,
                    isDirectory,
                    isGlob
                });
            }
        }
    } catch (error) {
        console.error('Error reading .rohitignore:', error);
    }
    
    return patterns;
}

/**
 * Check if a file or directory should be ignored based on .rohitignore patterns
 */
function shouldIgnore(itemPath: string, workspaceRoot: string, isDirectory: boolean, rohitIgnorePatterns: RohitIgnorePattern[]): boolean {
    const relativePath = path.relative(workspaceRoot, itemPath);
    const itemName = path.basename(itemPath);
    
    for (const pattern of rohitIgnorePatterns) {
        // Skip directory patterns for files and vice versa
        if (pattern.isDirectory && !isDirectory) {
            continue;
        }
        
        if (pattern.isGlob) {
            // Simple glob matching (basic * support)
            const regexPattern = pattern.pattern.replace(/\*/g, '.*');
            const regex = new RegExp(`^${regexPattern}$`);
            if (regex.test(itemName) || regex.test(relativePath)) {
                return true;
            }
        } else {
            // Exact match
            if (itemName === pattern.pattern || relativePath === pattern.pattern) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Get files and directories in a specific directory
 */
function getDirectoryContents(dirPath: string, workspaceRoot: string, options: BackupOptions, rohitIgnorePatterns: RohitIgnorePattern[]): FileItem[] {
    const items: FileItem[] = [];
    const ignoredDirs = ['.git', 'node_modules', '.vscode', 'dist', 'build', 'out', '.next', '.nuxt', 'coverage', 'target', 'bin', 'obj'];
    const ignoredFiles = ['.DS_Store', 'Thumbs.db', '.gitignore', '.eslintrc', '.prettierrc', 'package-lock.json', 'yarn.lock'];
    
    try {
        const entries = fs.readdirSync(dirPath);
        
        for (const entry of entries) {
            const itemPath = path.join(dirPath, entry);
            const stat = fs.statSync(itemPath);
            const isDirectory = stat.isDirectory();
            
            // Skip hidden files/folders if not included
            if (!options.includeHiddenFiles && entry.startsWith('.')) {
                continue;
            }
            
            // Skip default ignored items
            if (isDirectory && ignoredDirs.includes(entry)) {
                continue;
            }
            if (!isDirectory && ignoredFiles.includes(entry)) {
                continue;
            }
            
            // Skip items matching .rohitignore patterns
            if (shouldIgnore(itemPath, workspaceRoot, isDirectory, rohitIgnorePatterns)) {
                continue;
            }
            
            const relativePath = path.relative(workspaceRoot, itemPath);
            const icon = isDirectory ? '📁' : '📄';
            
            items.push({
                label: `${icon} ${entry}`,
                description: relativePath,
                detail: itemPath,
                filePath: itemPath,
                isDirectory: isDirectory
            });
        }
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
    }
    
    return items.sort((a, b) => {
        // Directories first, then files
        if (a.isDirectory !== b.isDirectory) {
            return a.isDirectory ? -1 : 1;
        }
        return a.label.localeCompare(b.label);
    });
}

/**
 * Get all files recursively from a directory
 */
function getAllFilesInDirectory(dirPath: string, workspaceRoot: string, options: BackupOptions, rohitIgnorePatterns: RohitIgnorePattern[]): string[] {
    const files: string[] = [];
    const ignoredDirs = ['.git', 'node_modules', '.vscode', 'dist', 'build', 'out', '.next', '.nuxt', 'coverage', 'target', 'bin', 'obj'];
    const ignoredFiles = ['.DS_Store', 'Thumbs.db', '.gitignore', '.eslintrc', '.prettierrc', 'package-lock.json', 'yarn.lock'];
    
    function scanDirectory(currentPath: string): void {
        try {
            const entries = fs.readdirSync(currentPath);
            
            for (const entry of entries) {
                const itemPath = path.join(currentPath, entry);
                const stat = fs.statSync(itemPath);
                const isDirectory = stat.isDirectory();
                
                // Skip hidden files/folders if not included
                if (!options.includeHiddenFiles && entry.startsWith('.')) {
                    continue;
                }
                
                // Skip default ignored items
                if (isDirectory && ignoredDirs.includes(entry)) {
                    continue;
                }
                if (!isDirectory && ignoredFiles.includes(entry)) {
                    continue;
                }
                
                // Skip items matching .rohitignore patterns
                if (shouldIgnore(itemPath, workspaceRoot, isDirectory, rohitIgnorePatterns)) {
                    continue;
                }
                
                if (isDirectory) {
                    scanDirectory(itemPath);
                } else {
                    files.push(itemPath);
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${currentPath}:`, error);
        }
    }
    
    scanDirectory(dirPath);
    return files;
}

/**
 * Check if an item is selected (file or any file in folder)
 */
function isItemSelected(itemPath: string, isDirectory: boolean, selectedFiles: FileItem[], workspaceRoot: string, options: BackupOptions, rohitIgnorePatterns: RohitIgnorePattern[]): boolean {
    if (!isDirectory) {
        return selectedFiles.some(f => f.filePath === itemPath);
    }
    
    // For directories, check if all files in the directory are selected
    const allFilesInDir = getAllFilesInDirectory(itemPath, workspaceRoot, options, rohitIgnorePatterns);
    if (allFilesInDir.length === 0) {
        return false;
    }
    
    return allFilesInDir.every(filePath => selectedFiles.some(f => f.filePath === filePath));
}

/**
 * Navigate through directories and select files
 */
async function navigateAndSelectFiles(workspaceRoot: string, options: BackupOptions, rohitIgnorePatterns: RohitIgnorePattern[]): Promise<FileItem[]> {
    const selectedFiles: FileItem[] = [];
    let currentPath = workspaceRoot;
    
    while (true) {
        const items = getDirectoryContents(currentPath, workspaceRoot, options, rohitIgnorePatterns);
        
        // Update labels with checkbox indicators
        for (const item of items) {
            const isSelected = isItemSelected(item.filePath, item.isDirectory, selectedFiles, workspaceRoot, options, rohitIgnorePatterns);
            const checkbox = isSelected ? '☑️' : '☐';
            const icon = item.isDirectory ? '📁' : '📄';
            const baseName = path.basename(item.filePath);
            
            item.label = `${checkbox} ${icon} ${baseName}`;
            item.isSelected = isSelected;
        }
        
        // Add parent directory option if not at root
        if (currentPath !== workspaceRoot) {
            const parentPath = path.dirname(currentPath);
            items.unshift({
                label: '📁 .. (Parent Directory)',
                description: 'Go back to parent directory',
                detail: parentPath,
                filePath: parentPath,
                isDirectory: true,
                isParent: true
            });
        }
        
        // Add "Done" option
        items.push({
            label: '✅ Done (Finish Selection)',
            description: `${selectedFiles.length} file(s) selected`,
            detail: 'done',
            filePath: 'done',
            isDirectory: false
        });
        
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Navigate: ${path.relative(workspaceRoot, currentPath) || 'Root'} | Selected: ${selectedFiles.length} files`
        });
        
        if (!selected) {
            return []; // User cancelled
        }
        
        if (selected.filePath === 'done') {
            break;
        }
        
        if (selected.isParent) {
            currentPath = selected.filePath;
        } else if (selected.isDirectory) {
            // Check if we should navigate or toggle selection
            const action = await vscode.window.showQuickPick([
                { label: '📂 Enter Folder', description: 'Navigate into this folder' },
                { label: '☑️ Toggle Selection', description: 'Select/deselect all files in this folder' }
            ], {
                placeHolder: `What would you like to do with "${path.basename(selected.filePath)}"?`
            });
            
            if (!action) {
                continue; // User cancelled, stay in current directory
            }
            
            if (action.label.includes('Enter Folder')) {
                currentPath = selected.filePath;
            } else {
                // Toggle folder selection
                const allFilesInDir = getAllFilesInDirectory(selected.filePath, workspaceRoot, options, rohitIgnorePatterns);
                const isCurrentlySelected = selected.isSelected;
                
                if (isCurrentlySelected) {
                    // Remove all files in this directory
                    for (const filePath of allFilesInDir) {
                        const index = selectedFiles.findIndex(f => f.filePath === filePath);
                        if (index >= 0) {
                            selectedFiles.splice(index, 1);
                        }
                    }
                    vscode.window.showInformationMessage(`Deselected folder: ${path.basename(selected.filePath)} (${allFilesInDir.length} files)`);
                } else {
                    // Add all files in this directory
                    for (const filePath of allFilesInDir) {
                        if (!selectedFiles.some(f => f.filePath === filePath)) {
                            selectedFiles.push({
                                label: path.basename(filePath),
                                description: path.relative(workspaceRoot, filePath),
                                detail: filePath,
                                filePath: filePath,
                                isDirectory: false
                            });
                        }
                    }
                    vscode.window.showInformationMessage(`Selected folder: ${path.basename(selected.filePath)} (${allFilesInDir.length} files)`);
                }
            }
        } else {
            // Toggle file selection
            const existingIndex = selectedFiles.findIndex(f => f.filePath === selected.filePath);
            if (existingIndex >= 0) {
                selectedFiles.splice(existingIndex, 1);
                vscode.window.showInformationMessage(`Removed: ${path.basename(selected.filePath)}`);
            } else {
                selectedFiles.push(selected);
                vscode.window.showInformationMessage(`Added: ${path.basename(selected.filePath)}`);
            }
        }
    }
    
    return selectedFiles;
}

/**
 * Create a backup folder with timestamp if requested
 */
function createBackupFolder(destinationPath: string, options: BackupOptions): string {
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
function copyFileWithStructure(sourcePath: string, destinationPath: string, workspaceRoot: string, options: BackupOptions): void {
    let finalDestinationPath: string;
    
    if (options.preserveStructure) {
        const relativePath = path.relative(workspaceRoot, sourcePath);
        finalDestinationPath = path.join(destinationPath, relativePath);
        
        // Create directory structure if it doesn't exist
        const destinationDir = path.dirname(finalDestinationPath);
        if (!fs.existsSync(destinationDir)) {
            fs.mkdirSync(destinationDir, { recursive: true });
        }
    } else {
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
async function getBackupOptions(): Promise<BackupOptions | undefined> {
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
async function backupProject(): Promise<void> {
    try {
        // Get the current workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        const workspaceRoot = workspaceFolders[0]!.uri.fsPath;
        
        // Get backup options from user
        const options = await getBackupOptions();
        if (!options) {
            return; // User cancelled
        }
        
        // Parse .rohitignore file
        const rohitIgnorePatterns = parseRohitIgnore(workspaceRoot);
        
        // Navigate and select files using tree navigation
        const selectedItems = await navigateAndSelectFiles(workspaceRoot, options, rohitIgnorePatterns);
        
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

        const destinationFolder = createBackupFolder(destinationUri[0]!.fsPath, options);

        // Show progress during backup
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Backing up files",
            cancellable: false
        }, async (progress) => {
            const totalFiles = selectedItems.length;
            
            for (let i = 0; i < selectedItems.length; i++) {
                const file = selectedItems[i]!;
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
        const result = await vscode.window.showInformationMessage(
            `Successfully backed up ${selectedItems.length} file(s) to ${destinationFolder}`,
            'Open Destination'
        );
        
        if (result === 'Open Destination') {
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(destinationFolder), true);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Backup failed: ${errorMessage}`);
        console.error('Backup error:', error);
    }
}

export function activate(context: vscode.ExtensionContext): void {
    console.log('Git Backup extension is now active!');

    const disposable = vscode.commands.registerCommand('git-backup.backupProject', backupProject);

    context.subscriptions.push(disposable);
}

export function deactivate(): void {
    // Extension is being deactivated
}
