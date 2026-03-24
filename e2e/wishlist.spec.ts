import { test, expect } from '@playwright/test';

test.describe('Wishlist Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Login as buyer
    await page.click('text=Login');
    await page.fill('input[type="text"]', 'buyer@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should add item to wishlist from marketplace', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Get first product card
    const firstProduct = page.locator('.listing-card').first();
    
    // Click wishlist heart icon
    await firstProduct.locator('[aria-label*="wishlist"], .wishlist-icon, button:has(svg)').first().click();
    
    // Should show success message
    await expect(page.locator('text=/added to wishlist|saved/i')).toBeVisible();
  });

  test('should view wishlist items', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Add item to wishlist
    await page.locator('.listing-card >> nth=0 >> [aria-label*="wishlist"]').click();
    
    // Navigate to wishlist
    await page.click('text=Wishlist');
    
    // Should show wishlist items
    await expect(page.locator('.wishlist-item, .listing-card')).toHaveCount(1);
  });

  test('should remove item from wishlist', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Add item
    await page.locator('.listing-card >> nth=0 >> [aria-label*="wishlist"]').click();
    
    // Go to wishlist
    await page.click('text=Wishlist');
    
    // Remove item
    await page.locator('[aria-label*="remove"], button:has-text("Remove")').first().click();
    
    // Confirm removal if dialog appears
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Should show empty state
    await expect(page.locator('text=/empty|no items/i')).toBeVisible();
  });

  test('should show wishlist count in navigation', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Add multiple items
    await page.locator('.listing-card >> nth=0 >> [aria-label*="wishlist"]').click();
    await page.locator('.listing-card >> nth=1 >> [aria-label*="wishlist"]').click();
    
    // Check wishlist count badge
    const badge = page.locator('[aria-label*="wishlist"] .badge, .wishlist-count');
    await expect(badge).toHaveText('2');
  });
});
