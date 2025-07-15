# Git Backup

A VS Code extension that allows you to easily backup selected project files to a chosen destination with customizable options.

## Features

-  **Tree Navigation**: Navigate through your project folder structure like a file explorer
-  **Selective File Backup**: Choose exactly which files to backup from your project
-  **Preserve Directory Structure**: Optionally maintain the original folder structure in your backup
-  **Hidden Files Support**: Include or exclude hidden files and folders
-  **Timestamped Backups**: Create timestamped backup folders for better organization
-  **Progress Tracking**: Visual progress indicator during backup operations
-  **Duplicate Handling**: Automatically handles file name conflicts
-  **Smart Filtering**: Excludes common build artifacts and system files by default
-  **Custom Ignore Patterns**: Support for `.rohitignore` file to exclude specific files and folders

## How to Use

1. **Open Command Palette**: Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. **Run Command**: Type "Git Backup: Backup Project" and select it
3. **Configure Options**: Choose your backup preferences:
   - Preserve directory structure (Yes/No)
   - Include hidden files (Yes/No)
   - Create timestamped folder (Yes/No)
4. **Navigate and Select Files**: Use the tree navigation to browse folders and select files:
   - **Visual Selection**: Checkboxes show selection status (☑️ = selected, ☐ = not selected)
   - **Folder Actions**: Click on folders to choose "Enter Folder" or "Toggle Selection"
   - **Bulk Selection**: Select entire folders to include all files within them
   - **Individual Files**: Click on files to select/deselect them for backup
   - **Navigation**: Use ".. (Parent Directory)" to go back
   - **Completion**: Click "Done" when you've selected all desired files
5. **Choose Destination**: Select where you want to save the backup
6. **Done!**: Your files are backed up with a progress indicator

## Configuration Options

When running the backup command, you'll be prompted to configure:

### Preserve Directory Structure
- **Yes**: Maintains the original folder hierarchy in the backup
- **No**: Copies all files to the root of the backup folder

### Include Hidden Files
- **Yes**: Includes files and folders starting with `.` (like `.env`, `.config/`)
- **No**: Excludes hidden files and folders

### Create Timestamped Folder
- **Yes**: Creates a backup folder with timestamp (e.g., `backup-2024-01-15T10-30-45-123Z`)
- **No**: Uses the selected destination folder directly

## Excluded Files and Folders

The extension automatically excludes common build artifacts and system files:

**Directories:**
- `.git`, `node_modules`, `.vscode`
- `dist`, `build`, `out`, `.next`, `.nuxt`
- `coverage`, `target`, `bin`, `obj`

**Files:**
- `.DS_Store`, `Thumbs.db`
- `.gitignore`, `.eslintrc`, `.prettierrc`
- `package-lock.json`, `yarn.lock`

## .rohitignore File

You can create a `.rohitignore` file in your project root to specify custom files and folders to exclude from backup selection. This works similar to `.gitignore` but specifically for the backup process.

### Pattern Rules

- **Comments**: Lines starting with `#` are ignored
- **Files**: Specify filename directly (e.g., `secrets.txt`)
- **Directories**: Add trailing slash (e.g., `temp/`)
- **Wildcards**: Use `*` for any characters (e.g., `*.log`)
- **Relative Paths**: Specify paths relative to project root (e.g., `src/generated/`)

## Requirements

- VS Code 1.102.0 or higher
- An open workspace/folder in VS Code

## Installation

1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Git Backup"
4. Click Install

Or install via command line:
```bash
code --install-extension git-backup
```

## Commands

| Command | Description |
|---------|-------------|
| `Git Backup: Backup Project` | Start the backup process for current workspace |

## Use Cases

- **Project Snapshots**: Create quick backups before major changes
- **Code Sharing**: Share specific files with team members
- **Version Archiving**: Archive specific versions of important files
- **Safe Refactoring**: Backup files before large refactoring operations
- **Client Deliverables**: Package specific files for client delivery

## Known Issues

- Large files may take some time to copy (progress indicator will show status)
- Symbolic links are not followed (files are copied, not linked)
- Network drives may have slower performance

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This extension is released under the MIT License.

## Release Notes

### 0.0.1

- Initial release of Git Backup extension
- **Tree Navigation**: Browse project folders like a file explorer
- **Visual Selection**: Checkbox indicators show selection status (☑️/☐)
- **Folder Selection**: Select entire folders to include all files within
- **Selective File Backup**: Choose exactly which files to backup
- **Custom Ignore Patterns**: Support for `.rohitignore` file
- **Configurable Options**: Preserve structure, hidden files, timestamps
- **Progress Tracking**: Visual progress indicator during backup
- **Smart Filtering**: Excludes common build artifacts automatically
- **Conflict Resolution**: Handles duplicate file names gracefully

---

**Enjoy backing up your code!**
