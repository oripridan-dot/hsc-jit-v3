#!/usr/bin/env python3
"""
Quick Reference: Image Alignment Workflow
Run this whenever you regenerate images with forge_backbone.py
"""

# ============================================================================

# SINGLE COMMAND TO SYNC EVERYTHING

# ============================================================================

# 1. Navigate to backend

# cd /workspaces/hsc-jit-v3/backend

# 2. Run alignment (syncs JSON catalogs with actual images)

# python3 align_images.py

# 3. Done! All product URLs now point to real files on disk

# ✅ Regenerate and commit: git add -A && git commit -m "Update catalogs and images"

# ============================================================================

# WHAT THE SCRIPT DOES

# ============================================================================

"""
align_images.py performs these steps:

1. LOAD: Read each brand's JSON catalog (e.g., roland.json)
2. SCAN: Find all actual thumbnail files (e.g., roland-prod-1_thumb.webp)
3. ASSIGN: Map real files to products (round-robin if more products than images)
4. UPDATE: Write the URL back to the catalog
5. VERIFY: Confirm all references point to real files

Result: Every product in the catalog has a valid image_url
"""

# ============================================================================

# WHEN TO RUN

# ============================================================================

"""
After any of these:

- You run forge_backbone.py to regenerate catalogs
- You add new images to product_images/
- You rename/reorganize image files
- You add new brand catalogs
- You want to sync after a big image refresh
  """

# ============================================================================

# WHAT IT FIXES

# ============================================================================

"""
Before: Product says "use roland-fantom-06_thumb.webp" but file doesn't exist
After: Product says "use roland-prod-1_thumb.webp" (we verified it exists)

GalaxyDashboard then loads these URLs from the JSON and displays real images!
"""

# ============================================================================

# COMPLETE WORKFLOW (After Image Regeneration)

# ============================================================================

WORKFLOW = """

1. Regenerate images:
   cd /workspaces/hsc-jit-v3/backend
   python3 forge_backbone.py

2. Reprocess thumbnails:
   python3 reprocess_thumbnails.py

3. Align catalogs:
   python3 align_images.py ← RUN THIS

4. Verify frontend:
   cd ../frontend
   pnpm dev

5. Test in browser:
   Open http://localhost:5174
   → GalaxyDashboard shows real images
   → All product cards display thumbnails

6. Commit everything:
   git add -A
   git commit -m "Refresh catalogs and align images"
   git push origin main
   """

print(WORKFLOW)
