# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.3] - 2024-12-21

### Changed

- Updated documentation to correctly reflect support for external images
- Clarified markdown limitations in README.md and tool description

## [1.2.2] - 2024-12-21

### Added

- Support for decimal values in paperBorder margins (e.g., '1.5cm', '2.5mm')

## [1.2.1] - 2024-12-21

### Fixed

- Fixed "Method not found" error by properly registering the create_pdf_from_markdown tool in MCP capabilities
- Resolved path resolution issues by using absolute paths for all file references
- Improved PDF generation reliability by increasing render delay and timeout values

## [1.2.0] - 2024-12-21

### Added

- Support for default output path via MCP settings (DEFAULT_OUTPUT_PATH)
- Automatic file name incrementation to prevent overwriting existing files

### Changed

- Made output path parameter optional in the tool schema
- Default output path now reads from MCP settings or falls back to '/Volumes/RAMDisk/output.pdf'

## [1.1.0] - Initial Release

### Added

- Basic markdown to PDF conversion
- Support for syntax highlighting
- Custom CSS styling
- Configurable paper format, orientation, and borders
