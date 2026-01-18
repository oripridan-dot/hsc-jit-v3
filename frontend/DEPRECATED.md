# Deprecated Components - v3.7

**DO NOT USE** the following components. They are from v3.5 and v3.6 and are no longer part of the v3.7 architecture.

## Deprecated Component List

### 1. `UnifiedComponents.tsx` ❌

- **Deprecated:** v3.7
- **Reason:** Old v3.6 monolithic architecture replaced by modular components
- **Replacement:** Use `HalileoNavigator`, `Navigator`, `Workbench`, `ProductDetailView`

### 2. `TheStage.tsx` ❌

- **Deprecated:** v3.7
- **Reason:** Replaced by ProductDetailView with better UX
- **Replacement:** `ProductDetailView.tsx` (cinema mode + image gallery)

### 3. `BrandExplorer.tsx` ❌

- **Deprecated:** v3.7
- **Reason:** Replaced by hierarchical Navigator
- **Replacement:** `Navigator.tsx` (domain → brand → category → subcategory → product)

### 4. `ZenFinder.tsx` ❌

- **Deprecated:** v3.7
- **Reason:** Replaced by Halileo AI Navigator
- **Replacement:** `HalileoNavigator.tsx` (voice + text AI navigation)

### 5. `ContextRail.tsx` (old version) ❌

- **Deprecated:** v3.7
- **Reason:** Replaced by floating context insights
- **Replacement:** `HalileoContextRail.tsx` (floating, smart context)

### 6. `FolderView.tsx` ❌

- **Deprecated:** v3.7
- **Reason:** Replaced by Navigator tree view
- **Replacement:** `Navigator.tsx` (hierarchical tree navigation)

### 7. `DualSourceIntelligence.tsx` ❌

- **Deprecated:** v3.7
- **Reason:** Dual-source verification feature deprecated
- **Replacement:** Static catalog only (no backend dependency)

### 8. `ScenarioToggle.tsx` ❌

- **Deprecated:** v3.7
- **Reason:** Scenario switching feature removed
- **Replacement:** None (static catalog workflow)

### 9. `SyncMonitor.tsx` ❌

- **Deprecated:** v3.7
- **Reason:** Backend sync monitoring not needed for static catalog
- **Replacement:** None (no backend required)

### 10. `ProductDetailModal.tsx` ❌

- **Deprecated:** v3.7
- **Reason:** Replaced by ProductDetailView
- **Replacement:** `ProductDetailView.tsx`

### 11. `BackendUnavailable.tsx` ❌

- **Deprecated:** v3.7
- **Reason:** No backend dependency in v3.7
- **Replacement:** None (frontend works standalone)

### 12. `ChatView.tsx` ❌

- **Deprecated:** v3.7
- **Reason:** Replaced by AIAssistant
- **Replacement:** `AIAssistant.tsx` (analyst panel)

---

## Active Components (v3.7)

Use these components instead:

### Navigation

- **`HalileoNavigator.tsx`** - AI-powered navigation (voice + text)
- **`Navigator.tsx`** - Hierarchical tree navigation
- **`Workbench.tsx`** - Main product display pane

### Product Display

- **`ProductDetailView.tsx`** - Product detail modal with cinema mode
- **`ImageGallery.tsx`** - Full-screen image gallery

### Context & Insights

- **`HalileoContextRail.tsx`** - Floating contextual insights
- **`AIAssistant.tsx`** - Chat interface for product queries

### UI Components

- **`SystemHealthBadge.tsx`** - System status indicator
- **`SmartMessage.tsx`** - Intelligent message display

---

## Migration Guide

If you encounter deprecated components in the codebase:

1. **Do NOT** import or use them in new code
2. **Replace** with the recommended v3.7 alternative
3. **Remove** imports if they exist
4. **Delete** the deprecated component file if not referenced anywhere

---

**Last Updated:** January 2026  
**Version:** 3.7.0
