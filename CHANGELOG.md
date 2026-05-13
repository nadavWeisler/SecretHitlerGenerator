# Changelog

## Unreleased

### Added
- Official 5–10 player selector in the Print & Play Wizard
- Saved wizard presets and saved custom-builder configurations via browser local storage
- Custom Game Builder with editable roles, counts, icons, descriptions, theme colors, and optional art
- Export settings for paper size, layout density, crop marks, card backs, duplex-friendly back pages, and PNG sheet downloads
- UI-focused Jest coverage for wizard and custom-builder flows

### Changed
- Refactored browser code into separate `ui.js`, `exporters.js`, and `script.js` responsibilities
- Improved card reveal accessibility with keyboard interaction and better status messaging
- Improved image handling by normalizing uploads before preview/export

### Documentation
- Updated README usage and feature documentation
- Added release-process and roadmap documentation
