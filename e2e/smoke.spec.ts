import { expect, test } from '@playwright/test';

/**
 * Smoke: boot → default project → new file → persistence → export.
 * Replaces the manual-only gate for the critical path (C.3).
 */
test('boot creates My Notes, file lifecycle works', async ({ page }) => {
  await page.goto('/');
  // Default project bootstrapped and selected (no project-first friction)
  await expect(page.getByRole('region', { name: 'File Explorer' })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('combobox', { name: 'Select project' })).toContainText('My Notes', {
    timeout: 30000,
  });

  // Deep link opens the new-file dialog (store-driven, no race)
  await page.goto('/?new=file');
  const dialog = page.getByRole('dialog', { name: 'Create New File' });
  await expect(dialog).toBeVisible({ timeout: 30000 });
  await dialog.getByRole('textbox').fill('e2e smoke note');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: /e2e smoke note/ }).first()).toBeVisible({
    timeout: 30000,
  });

  // Persistence across reload (IndexedDB, not localStorage)
  await page.reload();
  await expect(page.getByRole('button', { name: /e2e smoke note/ }).first()).toBeVisible({
    timeout: 30000,
  });

  // Export produces a download: main button opens options for PDF,
  // dialog Export starts generation, result downloads (lastFormat is PDF)
  await page.getByRole('button', { name: /Export as PDF/ }).click();
  const optionsDialog = page.getByRole('dialog', { name: /Export Options/ });
  await expect(optionsDialog).toBeVisible({ timeout: 30000 });
  const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
  await optionsDialog.getByRole('button', { name: 'Export', exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
});
