# Git Backup

A VS Code extension that allows you to easily backup selected project files to a chosen destination with customizable options.

## Features

- **Selective File Backup**: Choose exactly which files to backup from your project
- **Preserve Directory Structure**: Optionally maintain the original folder structure in your backup
- **Hidden Files Support**: Include or exclude hidden files and folders
- **Timestamped Backups**: Create timestamped backup folders for better organization
- **Progress Tracking**: Visual progress indicator during backup operations
- **Duplicate Handling**: Automatically handles file name conflicts
- **Smart Filtering**: Excludes common build artifacts and system files by default

## How to Use

1. **Open Command Palette**: Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. **Run Command**: Type "Git Backup: Backup Project" and select it
3. **Configure Options**: Choose your backup preferences:
   - Preserve directory structure (Yes/No)
   - Include hidden files (Yes/No)
   - Create timestamped folder (Yes/No)
4. **Select Files**: Multi-select files from the quick pick menu (use Ctrl/Cmd+Click)
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
- Selective file backup with multi-select support
- Configurable backup options
- Progress tracking and error handling
- Smart file filtering and conflict resolution

---

**Enjoy backing up your code!**
