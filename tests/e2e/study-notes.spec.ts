import { expect, test } from '@playwright/test';
import { ACTIVE, PANEL, openPassage, waitForApp, openPanel } from './helpers.ts';

test.describe('Bible Study reader additions', () => {
  test('a verse highlight and private note survive a reload and appear in the notebook', async ({
    page,
  }) => {
    await openPassage(page, 'Gen.1.1');
    const panel = page.locator(PANEL);
    const amber = panel.getByRole('group', { name: 'Highlight colours' }).getByRole('button', { name: /Amber · Miracles/ });
    await expect(amber).toBeVisible();
    await amber.click();
    await expect(amber).toHaveAttribute('aria-pressed', 'true');
    await panel.getByPlaceholder('Write a note…').fill('My private Genesis 1:1 note');
    await panel.getByRole('button', { name: 'Save new note' }).click();
    await expect(panel.getByRole('heading', { name: 'Notes (1)' })).toBeVisible();

    await page.reload();
    await waitForApp(page);
    await openPanel(page);
    await expect(amber).toHaveAttribute('aria-pressed', 'true');
    await expect(panel.getByRole('textbox', { name: 'Notes' })).toHaveValue(
      'My private Genesis 1:1 note',
    );

    await page.locator(ACTIVE).getByRole('button', { name: 'My Notebook' }).click();
    const notebook = page.getByRole('dialog', { name: 'My Notebook' });
    await expect(notebook).toBeVisible();
    await expect(notebook.getByText('My private Genesis 1:1 note')).toBeVisible();
    await notebook.getByRole('button', { name: 'Close notebook' }).click();
    await expect(notebook).not.toBeVisible();
  });

  test('study panel shows sourced Tyndale notes and differing readings', async ({ page }) => {
    await openPassage(page, 'Gen.1.1');
    const panel = page.locator(PANEL);
    await panel.getByText('Theological study', { exact: true }).click();
    await expect(
      panel.getByText(/This statement summarizes the entire creation account/),
    ).toBeVisible();
    await expect(panel.getByText('An independent opening statement')).toBeVisible();
    await expect(panel.getByText(/A dependent opening/)).toBeVisible();
    await expect(panel.getByRole('link', { name: 'CC BY-SA 4.0' })).toBeVisible();
  });
});
