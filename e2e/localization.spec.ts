import { test, expect } from '@playwright/test';

test.describe('Multi-Language Support', () => {
  test('should switch between languages', async ({ page }) => {
    await page.goto('/');
    
    // Open settings/language selector
    await page.click('[aria-label*="settings"], button:has-text("Settings")');
    await page.click('text=Language');
    
    // Switch to Shona
    await page.click('text=Shona');
    
    // Check if key terms are translated
    await expect(page.locator('text=Musha')).toBeVisible(); // Home in Shona
    
    // Switch to Ndebele
    await page.click('[aria-label*="settings"], button:has-text("Settings")');
    await page.click('text=Language');
    await page.click('text=Ndebele');
    
    // Check Ndebele translation
    await expect(page.locator('text=Ikhaya')).toBeVisible(); // Home in Ndebele
    
    // Switch back to English
    await page.click('[aria-label*="settings"], button:has-text("Settings")');
    await page.click('text=Language');
    await page.click('text=English');
    await expect(page.locator('text=Home')).toBeVisible();
  });

  test('should persist language preference', async ({ page }) => {
    await page.goto('/');
    
    // Switch to Shona
    await page.click('[aria-label*="settings"], button:has-text("Settings")');
    await page.click('text=Language');
    await page.click('text=Shona');
    
    // Reload page
    await page.reload();
    
    // Should still be in Shona
    await expect(page.locator('text=Musha')).toBeVisible();
  });

  test('should format currency based on locale', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Check USD format
    await expect(page.locator('text=/\\$\\d+\\.\\d{2}/')).toBeVisible();
    
    // Switch to ZWL if currency selector exists
    const currencySelector = page.locator('text=Currency');
    if (await currencySelector.isVisible()) {
      await currencySelector.click();
      await page.click('text=ZWL');
      await expect(page.locator('text=/Z\\$\\d+/')).toBeVisible();
    }
  });
});
