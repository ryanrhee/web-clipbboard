import { test, expect } from '@playwright/test';

test('should not show "Content loaded" toast on initial page load', async ({ page }) => {
  // Navigate to the page
  await page.goto('/');

  // Wait for page to load completely
  await expect(page.locator('h1')).toContainText('Online Clipboard');

  // Wait for any toasts that might appear
  await page.waitForTimeout(3000);
  
  // Get all toasts with "Content loaded" text
  const contentLoadedToasts = page.locator('.fixed .mb-2').filter({ hasText: 'Content loaded' });
  const toastCount = await contentLoadedToasts.count();
  
  // Should not show "Content loaded" toast on initial page load
  expect(toastCount, `Expected 0 "Content loaded" toasts on initial page load, but found ${toastCount}`).toBe(0);
});

test('should maintain text input focus during typing without re-renders', async ({ page }) => {
  // Listen to console messages
  page.on('console', msg => console.log(`🟡 BROWSER: ${msg.text()}`));
  
  // Navigate to the page
  await page.goto('/');
  
  // Wait for page to load completely
  await expect(page.locator('h1')).toContainText('Online Clipboard');
  
  // Focus on the textarea
  const textarea = page.locator('textarea[id="content"]');
  await textarea.click();
  
  // Type letters one by one with small delays
  await textarea.type('a', { delay: 100 });
  await page.waitForTimeout(200);
  await expect(textarea).toBeFocused();
  await expect(textarea).toHaveValue('a');
  
  await textarea.type('b', { delay: 100 });
  await page.waitForTimeout(200);
  await expect(textarea).toBeFocused();
  await expect(textarea).toHaveValue('ab');

  await textarea.type('c', { delay: 100 });
  await page.waitForTimeout(200);
  await expect(textarea).toBeFocused();
  await expect(textarea).toHaveValue('abc');
  
  // Wait a bit more to ensure no re-renders interrupt typing
  await page.waitForTimeout(1000);
  await expect(textarea).toBeFocused();
  await expect(textarea).toHaveValue('abc');
});