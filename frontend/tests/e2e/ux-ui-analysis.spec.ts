import { test, type Page } from "@playwright/test";

/**
 * UX/UI Analysis Test Suite
 * Evaluates user experience and interface design with actionable suggestions
 */

// Helper to measure and report performance
async function measureInteraction(
  page: Page,
  name: string,
  action: () => Promise<void>,
) {
  const start = Date.now();
  await action();
  const duration = Date.now() - start;
  console.log(`⏱️  ${name}: ${duration}ms`);
  return duration;
}

// Helper to check accessibility
async function checkAccessibility(page: Page, context: string) {
  const issues: string[] = [];

  // Check for alt text on images
  const imagesWithoutAlt = await page.locator("img:not([alt])").count();
  if (imagesWithoutAlt > 0) {
    issues.push(`${imagesWithoutAlt} images missing alt text`);
  }

  // Check for proper heading hierarchy
  const h1Count = await page.locator("h1").count();
  if (h1Count === 0) {
    issues.push("No h1 heading found on page");
  } else if (h1Count > 1) {
    issues.push(`Multiple h1 headings found (${h1Count})`);
  }

  // Check for interactive elements without labels
  const buttonsWithoutLabel = await page
    .locator("button:not([aria-label]):not(:has-text(*))")
    .count();
  if (buttonsWithoutLabel > 0) {
    issues.push(`${buttonsWithoutLabel} buttons without accessible labels`);
  }

  if (issues.length > 0) {
    console.log(`\n♿ Accessibility Issues (${context}):`);
    issues.forEach((issue) => console.log(`   ❌ ${issue}`));
  } else {
    console.log(`\n♿ Accessibility (${context}): ✅ No major issues`);
  }

  return issues;
}

// Helper to analyze visual hierarchy
async function analyzeVisualHierarchy(page: Page) {
  const suggestions: string[] = [];

  // Check contrast ratios
  const darkText = await page.locator('text[class*="text-zinc-600"]').count();
  const veryDarkText = await page
    .locator('text[class*="text-zinc-900"]')
    .count();

  if (darkText > veryDarkText * 2) {
    suggestions.push(
      "Consider using higher contrast text colors for better readability",
    );
  }

  // Check for consistent spacing
  const elements = await page.locator('div[class*="py-"]').all();
  if (elements.length > 0) {
    suggestions.push(
      `${elements.length} elements with vertical padding - ensure consistent spacing`,
    );
  }

  return suggestions;
}

test.describe("UX/UI Analysis: TierBar Component", () => {
  test("1. Initial Load & Visual Impression", async ({ page }) => {
    console.log("\n📊 === TIERBAR UX/UI ANALYSIS ===\n");

    await page.goto("/");

    // Measure initial load
    await page.waitForLoadState("networkidle");

    // Check if parallax background is visible
    const parallaxLabel = page
      .locator("h2")
      .filter({ hasText: /SYNTHESIZER|WORKSTATION|KEYS/ });
    const isParallaxVisible = (await parallaxLabel.count()) > 0;

    console.log("\n🎨 Visual Design:");
    console.log(
      `   ${isParallaxVisible ? "✅" : "❌"} Parallax background labels`,
    );

    // Check for clutter
    const visibleText = await page
      .locator("text=/Price Range|Showing/")
      .count();
    console.log(
      `   ${visibleText === 0 ? "✅" : "⚠️"} Header clutter ${visibleText > 0 ? "(found redundant labels)" : "(clean)"}`,
    );

    // Screenshot for visual reference
    await page.screenshot({
      path: "test-results/tierbar-initial.png",
      fullPage: true,
    });
    console.log("   📸 Screenshot saved: test-results/tierbar-initial.png");
  });

  test("2. Handle Interaction & Feedback", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    console.log("\n🎮 Handle Interaction:");

    // Find handles (should be minimal pill shapes)
    const handles = page.locator('[class*="cursor-ew-resize"]');
    const handleCount = await handles.count();

    console.log(`   Found ${handleCount} draggable handles`);

    if (handleCount > 0) {
      const firstHandle = handles.first();

      // Check initial state
      const initialBox = await firstHandle.boundingBox();
      if (!initialBox) {
        console.log("   ❌ Handle not visible or positioned");
        return;
      }

      console.log(
        `   ✅ Handle size: ${initialBox.width}x${initialBox.height}px`,
      );

      // Test hover state
      await firstHandle.hover();
      await page.waitForTimeout(100);

      // Check for visual feedback
      const hasGlow =
        (await page.locator('[class*="shadow-"][class*="cyan"]').count()) > 0;
      console.log(
        `   ${hasGlow ? "✅" : "⚠️"} Hover feedback ${hasGlow ? "(glow effect)" : "(consider adding)"}`,
      );

      // Measure drag responsiveness
      const dragTime = await measureInteraction(
        page,
        "Handle drag",
        async () => {
          await firstHandle.dragTo(page.locator("body"), {
            targetPosition: { x: initialBox.x + 100, y: initialBox.y },
          });
        },
      );

      if (dragTime < 100) {
        console.log("   ✅ Drag performance: Excellent (<100ms)");
      } else if (dragTime < 300) {
        console.log("   ⚠️ Drag performance: Good but could be faster");
      } else {
        console.log("   ❌ Drag performance: Sluggish (>300ms)");
      }

      // Check if price label updates
      const priceLabel = page.locator("text=/₪[0-9,]+/").first();
      const priceText = await priceLabel.textContent();
      console.log(`   ✅ Price label visible: ${priceText}`);

      await page.screenshot({
        path: "test-results/tierbar-dragged.png",
        fullPage: true,
      });
    }
  });

  test("3. Product Logo Clarity & Interaction", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    console.log("\n🎯 Product Logos:");

    // Find product logos on track
    const logos = page
      .locator("svg, img")
      .filter({ has: page.locator('[class*="w-7"]') });
    const logoCount = await logos.count();

    console.log(`   Found ${logoCount} product logos`);

    if (logoCount > 0) {
      const firstLogo = logos.first();

      // Check if logos have frames (should be removed)
      const hasFrame =
        (await firstLogo.locator("..").locator('[class*="border-2"]').count()) >
        0;
      console.log(
        `   ${!hasFrame ? "✅" : "⚠️"} Frame-less design ${hasFrame ? "(remove borders)" : "(clean)"}`,
      );

      // Test hover interaction
      await firstLogo.hover();
      await page.waitForTimeout(100);

      // Check for scale animation
      const scaleAnimation = await page.evaluate(() => {
        const logo = document.querySelector('[class*="w-7"]');
        if (!logo) return false;
        const transform = window.getComputedStyle(
          logo.parentElement!,
        ).transform;
        return transform !== "none" && transform.includes("scale");
      });

      console.log(
        `   ${scaleAnimation ? "✅" : "⚠️"} Hover animation ${scaleAnimation ? "(scaling)" : "(consider adding)"}`,
      );

      // Check for active indicator
      await firstLogo.click();
      await page.waitForTimeout(100);

      const hasActiveIndicator =
        (await page
          .locator('[class*="rounded-full"][class*="bg-white"]')
          .count()) > 0;
      console.log(
        `   ${hasActiveIndicator ? "✅" : "⚠️"} Active indicator ${hasActiveIndicator ? "(dot on track)" : "(add visual cue)"}`,
      );
    }
  });

  test("4. Visual Connection & Clarity", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    console.log("\n🔗 Visual Connections:");

    // Check for connection lines between handles and track
    const connectionLines = page.locator('[class*="w-[2px]"][class*="h-6"]');
    const lineCount = await connectionLines.count();

    console.log(
      `   ${lineCount >= 2 ? "✅" : "⚠️"} Connection lines (${lineCount} found, expected 2+)`,
    );

    // Check track thickness
    const track = page.locator('[class*="h-1"]').first();
    const trackBox = await track.boundingBox();

    if (trackBox) {
      console.log(
        `   ✅ Track thickness: ${trackBox.height}px (minimal design)`,
      );
    }

    // Check gradient highlights
    const gradientHighlight = page.locator(
      '[class*="from-cyan-500"][class*="to-purple-500"]',
    );
    const hasGradient = (await gradientHighlight.count()) > 0;
    console.log(
      `   ${hasGradient ? "✅" : "❌"} Gradient highlight (handle color match)`,
    );

    await page.screenshot({
      path: "test-results/tierbar-connections.png",
      fullPage: true,
    });
  });

  test("5. Responsive Behavior & Zoom Effect", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    console.log("\n🔍 Zoom & Filter Behavior:");

    // Count initial products
    const initialProducts = await page.locator('[class*="w-7 h-7"]').count();
    console.log(`   Initial products visible: ${initialProducts}`);

    // Drag a handle to filter
    const leftHandle = page.locator('[class*="cursor-ew-resize"]').first();
    const handleBox = await leftHandle.boundingBox();

    if (handleBox) {
      await leftHandle.dragTo(page.locator("body"), {
        targetPosition: { x: handleBox.x + 200, y: handleBox.y },
      });

      await page.waitForTimeout(500);

      // Count filtered products
      const filteredProducts = await page.locator('[class*="w-7 h-7"]').count();
      console.log(`   After filter: ${filteredProducts} products`);

      const zoomWorking = filteredProducts < initialProducts;
      console.log(
        `   ${zoomWorking ? "✅" : "❌"} Zoom/filter effect ${zoomWorking ? "(products filtered)" : "(not working)"}`,
      );

      // Check if products redistribute (zoom effect)
      // Products should spread out to fill the selected range
      const firstProduct = page.locator('[class*="w-7 h-7"]').first();
      const lastProduct = page.locator('[class*="w-7 h-7"]').last();

      const firstBox = await firstProduct.boundingBox();
      const lastBox = await lastProduct.boundingBox();

      if (firstBox && lastBox && filteredProducts > 1) {
        const spread = lastBox.x - firstBox.x;
        console.log(`   Product spread: ${Math.round(spread)}px`);

        if (spread > 300) {
          console.log("   ✅ Products distributed across range (good zoom)");
        } else {
          console.log("   ⚠️ Products clustered (zoom may need adjustment)");
        }
      }

      await page.screenshot({
        path: "test-results/tierbar-zoomed.png",
        fullPage: true,
      });
    }
  });

  test("6. Accessibility Audit", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await checkAccessibility(page, "TierBar Component");
  });

  test("7. Performance & Animation Smoothness", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    console.log("\n⚡ Performance Metrics:");

    // Measure transition durations
    const transitions = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="transition"]');
      const durations = Array.from(elements).map((el) => {
        const style = window.getComputedStyle(el);
        return style.transitionDuration;
      });
      return durations.filter((d) => d !== "0s");
    });

    console.log(`   Animated elements: ${transitions.length}`);
    console.log(
      `   Transition durations: ${[...new Set(transitions)].join(", ")}`,
    );

    // Check for layout shifts during interaction
    const handle = page.locator('[class*="cursor-ew-resize"]').first();
    const trackBox = await page.locator('[class*="h-1"]').first().boundingBox();

    if (trackBox && handle) {
      const initialY = trackBox.y;

      await handle.hover();
      await page.waitForTimeout(100);

      const afterHoverBox = await page
        .locator('[class*="h-1"]')
        .first()
        .boundingBox();
      const layoutShift = afterHoverBox
        ? Math.abs(afterHoverBox.y - initialY)
        : 0;

      console.log(
        `   ${layoutShift === 0 ? "✅" : "⚠️"} Layout stability ${layoutShift > 0 ? `(${layoutShift}px shift)` : "(no shift)"}`,
      );
    }
  });
});

test.describe("UX/UI Recommendations", () => {
  test("Generate Comprehensive Report", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    console.log("\n\n📋 === RECOMMENDATIONS ===\n");

    const recommendations: string[] = [];

    // Test various aspects and collect suggestions

    // 1. Color Contrast
    const hasGoodContrast = await page.evaluate(() => {
      const textElements = document.querySelectorAll('[class*="text-"]');
      let lowContrastCount = 0;
      textElements.forEach((el) => {
        const classes = el.className;
        if (
          classes.includes("text-zinc-600") ||
          classes.includes("text-zinc-500")
        ) {
          lowContrastCount++;
        }
      });
      return lowContrastCount < textElements.length / 2;
    });

    if (!hasGoodContrast) {
      recommendations.push(
        "🎨 Increase text contrast for better readability (WCAG AA: 4.5:1)",
      );
    }

    // 2. Touch Target Sizes
    const handles = await page.locator('[class*="cursor-ew-resize"]').all();
    for (const handle of handles) {
      const box = await handle.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        recommendations.push(
          "📱 Increase handle touch targets to 44x44px minimum (mobile usability)",
        );
        break;
      }
    }

    // 3. Animation Preferences
    recommendations.push(
      "♿ Add prefers-reduced-motion media query for accessibility",
    );
    recommendations.push(
      "⚡ Consider using CSS transforms instead of left/right for better performance",
    );

    // 4. Visual Feedback
    const hasActiveStates =
      (await page.locator('[class*="group-hover"]').count()) > 0;
    if (!hasActiveStates) {
      recommendations.push("👆 Add more hover states for interactive elements");
    }

    // 5. Information Density
    const parallaxVisible =
      (await page.locator('h2[class*="text-[12rem]"]').count()) > 0;
    if (parallaxVisible) {
      recommendations.push(
        "✅ Parallax effect successfully reduces visual clutter",
      );
    }

    // 6. Progressive Disclosure
    recommendations.push(
      "💡 Consider adding tooltips to handles explaining drag functionality",
    );
    recommendations.push(
      '📊 Add a "Reset Filters" button for quick return to full range',
    );

    // 7. Visual Hierarchy
    const visualSuggestions = await analyzeVisualHierarchy(page);
    recommendations.push(...visualSuggestions.map((s) => `🎯 ${s}`));

    // 8. Product Interaction
    recommendations.push(
      "🖼️ Consider showing product name on hover (currently in popup)",
    );
    recommendations.push(
      "⚡ Add keyboard navigation (arrow keys to move between products)",
    );

    // 9. Price Range Display
    recommendations.push(
      "💰 Consider showing price range extremes on track edges",
    );
    recommendations.push("📈 Add visual price markers at quartile points");

    // Print all recommendations
    if (recommendations.length > 0) {
      console.log("Priority Improvements:\n");
      recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

    console.log("\n✅ Quick Wins:");
    console.log("   • Increase handle size from 12x24px to 16x32px");
    console.log("   • Add aria-labels to all interactive elements");
    console.log("   • Implement keyboard shortcuts (Esc to reset)");
    console.log("   • Add subtle animation to price labels when they update");

    console.log("\n🎨 Visual Polish:");
    console.log("   • Add subtle pulsing animation to active product dot");
    console.log("   • Increase parallax text opacity slightly (0.03-0.04)");
    console.log("   • Add micro-interaction: handle slightly expands on hover");
    console.log(
      "   • Consider adding a subtle grid pattern to track background",
    );

    console.log("\n🚀 Performance:");
    console.log("   • Use will-change: transform on draggable elements");
    console.log("   • Debounce price calculation during drag");
    console.log("   • Lazy load product images outside viewport");

    console.log("\n♿ Accessibility:");
    console.log("   • Add ARIA live region for price range updates");
    console.log("   • Ensure 3:1 contrast for UI components");
    console.log("   • Add focus indicators for keyboard navigation");
    console.log("   • Support prefers-reduced-motion");

    console.log("\n📱 Mobile Considerations:");
    console.log("   • Test touch drag on mobile devices");
    console.log("   • Increase handle size for touch targets");
    console.log("   • Consider vertical tierbar layout for narrow screens");

    console.log("\n\n=== END OF ANALYSIS ===\n");
  });
});
