import { test, expect } from '@playwright/test';

test.describe('Mobile Money Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Login as buyer
    await page.click('text=Login');
    await page.fill('input[type="text"]', '0771234567');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display mobile money payment options', async ({ page }) => {
    // Navigate to marketplace and select a product
    await page.click('text=Marketplace');
    await page.click('.listing-card >> nth=0');
    
    // Click buy now
    await page.click('button:has-text("Buy Now")');
    
    // Select mobile money as payment method
    await page.click('text=Mobile Money');
    
    // Verify all providers are shown
    await expect(page.locator('text=EcoCash')).toBeVisible();
    await expect(page.locator('text=OneMoney')).toBeVisible();
    await expect(page.locator('text=InnBucks')).toBeVisible();
    await expect(page.locator('text=Telecash')).toBeVisible();
  });

  test('should validate phone number for EcoCash', async ({ page }) => {
    await page.goto('/wallet');
    await page.click('text=Deposit');
    await page.click('text=Mobile Money');
    
    // Select EcoCash
    await page.click('text=EcoCash');
    
    // Enter invalid phone number
    await page.fill('input[placeholder*="phone"]', '0711234567');
    await page.click('button:has-text("Continue")');
    
    // Should show error for wrong network
    await expect(page.locator('text=/invalid|wrong network/i')).toBeVisible();
    
    // Enter valid EcoCash number
    await page.fill('input[placeholder*="phone"]', '0771234567');
    await page.click('button:has-text("Continue")');
    
    // Should proceed to confirmation
    await expect(page.locator('text=Confirm')).toBeVisible();
  });

  test('should show payment instructions', async ({ page }) => {
    await page.goto('/wallet');
    await page.click('text=Deposit');
    await page.click('text=Mobile Money');
    await page.click('text=EcoCash');
    
    await page.fill('input[placeholder*="phone"]', '0771234567');
    await page.fill('input[placeholder*="amount"]', '50');
    await page.click('button:has-text("Continue")');
    
    // Should show USSD instructions
    await expect(page.locator('text=*151#')).toBeVisible();
    await expect(page.locator('text=Send Money')).toBeVisible();
  });

  test('should poll for payment status', async ({ page }) => {
    await page.goto('/wallet');
    await page.click('text=Deposit');
    await page.click('text=Mobile Money');
    await page.click('text=EcoCash');
    
    await page.fill('input[placeholder*="phone"]', '0771234567');
    await page.fill('input[placeholder*="amount"]', '50');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Confirm")');
    
    // Should show processing state
    await expect(page.locator('text=/processing|awaiting/i')).toBeVisible();
    
    // Wait for status update (mock will eventually succeed)
    await expect(page.locator('text=/success|completed/i')).toBeVisible({ timeout: 60000 });
  });
});
