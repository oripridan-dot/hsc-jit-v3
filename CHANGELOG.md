# Changelog

All notable changes to HSC Mission Control will be documented in this file.

## [3.7.2] - 2026-01-20

### Added
- **Multi-Brand Scraping System**
  - Boss scraper with comprehensive data extraction (28-57 images, 12-28 specs, 6-22 manuals per product)
  - Nord scraper with comprehensive data extraction (4-16 images, 15 specs, 3-4 manuals per product)
  - Moog scraper framework (awaiting product discovery fixes)
  - Total: 117 products across 4 brands (Roland: 99, Boss: 9, Nord: 9)

- **Real-Time Progress Tracking**
  - HeaderSystemPanel component with live scraping updates
  - Phase-based progress indicators (initializing → exploring → harvesting → processing → complete)
  - Time tracking (elapsed/estimated remaining)
  - Recent files display with shimmer animations
  - 3-second polling interval for real-time updates

- **Enhanced UI Components**
  - Docs tab in Workbench for manuals and documentation
  - Videos tab in MediaBar with proper video rendering
  - Improved product detail views with comprehensive data display
  - Document cards with file type indicators and download links

### Changed
- **Data Quality Improvements**
  - Enhanced Boss/Nord scrapers to match Roland's extraction quality
  - All products now have: images (100%), videos (100%), manuals (100%)
  - Specifications coverage: 32% (main instruments have specs, accessories excluded)

- **UI/UX Improvements**
  - Moved documentation from MediaBar to dedicated Docs tab in Workbench
  - MediaBar now shows only Images, Videos, and Audio tabs
  - Improved file name extraction from URLs for better document display

### Fixed
- **CORS Errors**
  - Wrapped canvas `getImageData()` in try-catch to prevent console errors
  - Added proper error handling for cross-origin image analysis
  - Images from external domains now fail gracefully without breaking UI

- **Import Errors**
  - Added missing `FiFile` icon import in Workbench component
  - Fixed media type handling in MediaBar (videos/docs were showing as images)

### Technical Details
- Enhanced scraper extraction patterns for images, videos, specifications, and manuals
- Added Set type imports for duplicate URL prevention
- Improved normalizeMedia function to accept media type parameter
- Updated getManuals() helper to extract manual_urls from products

---

## [3.7.1] - 2026-01-19

### Added
- Initial Roland catalog with 99 products
- Hierarchical navigation system (7 categories)
- Client-side fuzzy search with Fuse.js
- Dynamic brand theming system (WCAG AA compliant)

### Changed
- Migrated from backend-heavy architecture to static JSON catalog
- Cleaned up unused dependencies and dead code
- Archived legacy documentation

---

## [3.7.0] - 2026-01-18

### Added
- Product hierarchy navigation system
- Static catalog loader
- Instant search implementation
- Brand theming framework

---

*Format based on [Keep a Changelog](https://keepachangelog.com/)*
