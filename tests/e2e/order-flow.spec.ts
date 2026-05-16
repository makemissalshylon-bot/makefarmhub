import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete Order Flow
 * Tests the critical path from signup to order completion
 */

test.describe('Complete Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('user can sign up, create listing, and place order', async ({ page }) => {
    // Step 1: Sign up as a farmer
    await page.click('text=Sign Up');
    await page.fill('input[name="name"]', 'Test Farmer');
    await page.fill('input[name="email"]', `farmer-${Date.now()}@test.com`);
    await page.fill('input[name="phone"]', '+263771234567');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.selectOption('select[name="role"]', 'farmer');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Step 2: Create a listing
    await page.click('text=Create Listing');
    await page.fill('input[name="title"]', 'Fresh Tomatoes');
    await page.fill('textarea[name="description"]', 'Organic tomatoes from our farm');
    await page.selectOption('select[name="category"]', 'crops');
    await page.fill('input[name="price"]', '5.00');
    await page.fill('input[name="quantity"]', '100');
    await page.selectOption('select[name="unit"]', 'kg');
    await page.fill('input[name="location"]', 'Harare');
    await page.click('button:has-text("Publish Listing")');

    // Wait for success notification
    await expect(page.locator('text=Listing created successfully')).toBeVisible();

    // Step 3: Log out and sign up as buyer
    await page.click('button:has-text("Logout")');
    await page.click('text=Sign Up');
    await page.fill('input[name="name"]', 'Test Buyer');
    await page.fill('input[name="email"]', `buyer-${Date.now()}@test.com`);
    await page.fill('input[name="phone"]', '+263772345678');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.selectOption('select[name="role"]', 'buyer');
    await page.click('button[type="submit"]');

    // Step 4: Browse marketplace and find listing
    await page.click('text=Marketplace');
    await page.fill('input[placeholder*="Search"]', 'tomatoes');
    await page.click('button:has-text("Search")');

    // Click on the listing
    await page.click('text=Fresh Tomatoes');

    // Step 5: Place order
    await page.fill('input[name="quantity"]', '10');
    await page.fill('input[name="deliveryAddress"]', '123 Main St, Harare');
    await page.fill('input[type="date"]', '2026-06-15');
    await page.click('button:has-text("Place Order")');

    // Verify order confirmation
    await expect(page.locator('text=Order placed successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/orders/);

    // Step 6: Verify order appears in orders list
    const orderCard = page.locator('[data-testid="order-card"]').first();
    await expect(orderCard).toContainText('Fresh Tomatoes');
    await expect(orderCard).toContainText('pending');
  });

  test('farmer can accept and fulfill order', async ({ page }) => {
    // Login as farmer
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'farmer@test.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Navigate to orders
    await page.click('text=Orders');

    // Find pending order
    const pendingOrder = page.locator('[data-testid="order-card"]:has-text("pending")').first();
    await pendingOrder.click();

    // Accept order
    await page.click('button:has-text("Accept Order")');
    await expect(page.locator('text=Order accepted')).toBeVisible();

    // Mark as ready for delivery
    await page.click('button:has-text("Ready for Delivery")');
    await expect(page.locator('text=confirmed')).toBeVisible();

    // Mark as in transit
    await page.click('button:has-text("Mark as In Transit")');
    await expect(page.locator('text=in_transit')).toBeVisible();

    // Mark as delivered
    await page.click('button:has-text("Mark as Delivered")');
    await expect(page.locator('text=delivered')).toBeVisible();
  });

  test('buyer can confirm delivery and release escrow', async ({ page }) => {
    // Login as buyer
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'buyer@test.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Navigate to orders
    await page.click('text=Orders');

    // Find delivered order
    const deliveredOrder = page.locator('[data-testid="order-card"]:has-text("delivered")').first();
    await deliveredOrder.click();

    // Confirm delivery and release payment
    await page.click('button:has-text("Confirm Delivery")');
    
    // Verify escrow release notification
    await expect(page.locator('text=Payment released to seller')).toBeVisible();
    await expect(page.locator('text=completed')).toBeVisible();
  });

  test('user can leave review after order completion', async ({ page }) => {
    // Login as buyer
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'buyer@test.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Navigate to completed orders
    await page.click('text=Orders');
    await page.selectOption('select[name="status"]', 'completed');

    // Open completed order
    const completedOrder = page.locator('[data-testid="order-card"]').first();
    await completedOrder.click();

    // Leave review
    await page.click('button:has-text("Leave Review")');
    await page.fill('input[name="rating"]', '5');
    await page.fill('input[name="title"]', 'Excellent quality!');
    await page.fill('textarea[name="comment"]', 'The tomatoes were fresh and delicious. Highly recommend!');
    await page.click('button:has-text("Submit Review")');

    // Verify review submission
    await expect(page.locator('text=Review submitted successfully')).toBeVisible();
  });

  test('wallet balance updates correctly through order flow', async ({ page }) => {
    // Login as buyer
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'buyer@test.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Check initial wallet balance
    await page.click('text=Wallet');
    const initialBalance = await page.locator('[data-testid="wallet-balance"]').textContent();

    // Place order (escrow should be held)
    await page.click('text=Marketplace');
    await page.click('[data-testid="listing-card"]').first();
    await page.fill('input[name="quantity"]', '5');
    await page.click('button:has-text("Place Order")');

    // Verify escrow held
    await page.click('text=Wallet');
    const escrowHeld = await page.locator('[data-testid="escrow-held"]').textContent();
    expect(parseFloat(escrowHeld || '0')).toBeGreaterThan(0);

    // Complete order
    // ... (farmer accepts, delivers)

    // Confirm delivery
    await page.click('text=Orders');
    await page.locator('[data-testid="order-card"]').first().click();
    await page.click('button:has-text("Confirm Delivery")');

    // Verify escrow released
    await page.click('text=Wallet');
    const finalEscrow = await page.locator('[data-testid="escrow-held"]').textContent();
    expect(parseFloat(finalEscrow || '0')).toBe(0);
  });

  test('error handling: insufficient wallet balance', async ({ page }) => {
    // Login as buyer with low balance
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'poorbuyer@test.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Try to place large order
    await page.click('text=Marketplace');
    await page.click('[data-testid="listing-card"]').first();
    await page.fill('input[name="quantity"]', '1000'); // Large quantity
    await page.click('button:has-text("Place Order")');

    // Verify error message
    await expect(page.locator('text=Insufficient wallet balance')).toBeVisible();
  });

  test('messaging between buyer and seller', async ({ page }) => {
    // Login as buyer
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'buyer@test.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Navigate to order
    await page.click('text=Orders');
    await page.locator('[data-testid="order-card"]').first().click();

    // Open chat
    await page.click('button:has-text("Message Seller")');

    // Send message
    await page.fill('textarea[name="message"]', 'When can you deliver?');
    await page.click('button:has-text("Send")');

    // Verify message sent
    await expect(page.locator('text=When can you deliver?')).toBeVisible();
  });
});
