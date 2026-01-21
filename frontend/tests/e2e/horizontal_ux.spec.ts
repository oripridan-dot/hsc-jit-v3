import { test, expect } from '@playwright/test';

test.describe('Horizontal User Journeys', () => {

    // SCENARIO A: CROSS-BRAND COMPARISON
    test('Scenario A: The Comparison (Tier Bar)', async ({ page }) => {
        await page.goto('/');

        // 1. Search for two competing products
        const searchInput = page.getByPlaceholder('Search products...');
        await searchInput.fill('Roland FP-90X vs Nord Grand');
        await searchInput.press('Enter');

        // 2. Expect the UI to Morph into "Tier Bar" mode
        // Note: The selector 'text=Market Landscape' implies a header with this text exists
        await expect(page.locator('text=Market Landscape')).toBeVisible();

        // 3. Verify Cross-Brand Visuals
        const rolandCard = page.locator('button:has-text("Roland")');
        const nordCard = page.locator('button:has-text("Nord")');

        await expect(rolandCard).toBeVisible();
        await expect(nordCard).toBeVisible();

        // 4. Verify Visual Factory Output (Clean Thumbnails)
        // Check that we are loading the WEBP optimized version, not the heavy JPG
        const img = rolandCard.locator('img');
        await expect(img).toHaveAttribute('src', /.*_thumb.webp/);
    });

    // SCENARIO B: DEEP PROBLEM SOLVING
    test('Scenario B: The Engineer (Cockpit & Manuals)', async ({ page }) => {
        await page.goto('/');

        // Navigate specifically to a complex product
        // Assuming navigation structure is available
        await page.click('text=Roland');
        await page.click('text=Synthesizers');
        await page.click('text=FANTOM-06');

        // 1. Expect Product Cockpit
        await expect(page.locator('h1:has-text("FANTOM-06")')).toBeVisible();

        // 2. Test "Visual Lens" (High Res Load on Hover)
        const mainImage = page.locator('[aria-label="Inspection Lens"]');
        await mainImage.hover();

        // The "Lens" div should appear with the high-res image
        await expect(page.locator('.lens-zoom')).toBeVisible();
        await expect(page.locator('.lens-zoom img')).toHaveAttribute('src', /.*_inspect.webp/);
    });

});
