/**
 * Playwright Tests for CoffeeOrder Application
 * Tests run against local server to avoid affecting production data
 */

const { test, expect } = require('@playwright/test');

// Test data prefix to identify and clean up test orders
const TEST_PREFIX = '[TEST]';
const TEST_NAME = `${TEST_PREFIX}_TestUser_${Date.now()}`;

test.describe('CoffeeOrder App Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local server
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
  });

  test('page loads successfully', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/메가커피/);

    // Check main elements
    await expect(page.locator('header h1')).toContainText('메가커피 단체 주문');
    await expect(page.locator('#nameSelect')).toBeVisible();
    await expect(page.locator('#menuList')).toBeVisible();
  });

  test('category filtering works', async ({ page }) => {
    // Wait for categories to load
    await page.waitForSelector('.category-btn', { timeout: 5000 });

    // Get category buttons
    const categoryButtons = page.locator('.category-btn');
    const count = await categoryButtons.count();
    expect(count).toBeGreaterThan(0);

    // Click on a category (커피)
    const coffeeBtn = page.locator('.category-btn').filter({ hasText: '커피' });
    if (await coffeeBtn.isVisible().catch(() => false)) {
      await coffeeBtn.click();

      // Check if menu items are filtered - use explicit wait instead of timeout
      await page.waitForSelector('.menu-item-wrapper', { timeout: 5000 });
      const menuItems = page.locator('.menu-item-wrapper');
      await expect(menuItems.first()).toBeVisible();
    }
  });

  test('multi-order mode checkbox toggles', async ({ page }) => {
    const checkbox = page.locator('#multiOrderMode');
    await expect(checkbox).toBeVisible();

    // Check initial state
    await expect(checkbox).not.toBeChecked();

    // Toggle on
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Toggle off
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test('menu item selection shows temp buttons', async ({ page }) => {
    // Wait for menu items
    await page.waitForSelector('.menu-item-wrapper', { timeout: 5000 });

    // Get first menu item
    const firstMenu = page.locator('.menu-item-wrapper').first();
    const radio = firstMenu.locator('input[type="radio"]');

    // Click radio button
    await radio.click();

    // Check if temp buttons are shown
    const tempButtons = firstMenu.locator('.temp-buttons');
    await expect(tempButtons).toBeVisible();

    // Check ICE/HOT buttons
    await expect(tempButtons.locator('.temp-ice, .temp-ice-btn').first()).toBeVisible();
  });

  test('search functionality filters menu', async ({ page }) => {
    const searchInput = page.locator('#searchInput');
    await expect(searchInput).toBeVisible();

    // Type in search box
    await searchInput.fill('아메리칸');

    // Wait for filter to apply (use DOM state instead of timeout)
    await page.waitForFunction(() => {
      const menuList = document.querySelector('#menuList');
      return menuList && !menuList.classList.contains('loading');
    }, { timeout: 5000 });

    // Check filtered results
    const menuItems = page.locator('.menu-item-wrapper');
    const count = await menuItems.count();

    // Should show filtered results or empty state
    if (count > 0) {
      const firstItem = await menuItems.first().textContent();
      expect(firstItem).toContain('아메리칸');
    }
  });

  test('ICE only items hide HOT button in single mode', async ({ page }) => {
    // Select 에이드 category which has ICE only items
    const adeBtn = page.locator('.category-btn').filter({ hasText: '에이드' });
    if (await adeBtn.isVisible().catch(() => false)) {
      await adeBtn.click();

      // Wait for menu items to load
      await page.waitForSelector('.menu-item-wrapper', { timeout: 5000 });

      // Check first item in 에이드 category
      const firstItem = page.locator('.menu-item-wrapper').first();
      const radio = firstItem.locator('input[type="radio"]');
      await radio.click();

      // In single mode, ICE only items should only show ICE button
      const tempButtons = firstItem.locator('.temp-buttons');
      await expect(tempButtons).toBeVisible();

      // Check if HOT button exists (it shouldn't for ICE only)
      const hotButtonCount = await tempButtons.locator('.temp-hot, .temp-hot-btn').count();
      // For ICE only items, hot button should be hidden or not present
      expect(hotButtonCount).toBe(0);
    }
  });

  test('name selection shows custom input when 기타 selected', async ({ page }) => {
    const nameSelect = page.locator('#nameSelect');
    const customNameInput = page.locator('#customName');

    // Initially custom name input should be hidden
    await expect(customNameInput).toBeHidden();

    // Select '기타 (직접 입력)'
    await nameSelect.selectOption('custom');

    // Custom name input should be visible
    await expect(customNameInput).toBeVisible();

    // Type a name
    await customNameInput.fill(TEST_NAME);
    await expect(customNameInput).toHaveValue(TEST_NAME);
  });
});

test.describe('Cleanup', () => {
  test('cleanup test data', async ({ page }) => {
    // This test would clean up any test orders created
    // Implementation depends on Firebase admin access
    console.log('Test data cleanup would happen here');
    console.log(`Test prefix: ${TEST_PREFIX}`);
    console.log(`Test name used: ${TEST_NAME}`);
  });
});
