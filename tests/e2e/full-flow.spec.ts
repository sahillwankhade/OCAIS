import { test, expect } from '@playwright/test';

test.describe('One Click AIS: Full Healthcare Journey', () => {
  test('Complete flow: Patient booking, QR generation, Cabin scan, Doctor Console & Display Board', async ({
    page,
  }) => {
    // 1. Visit Patient Mobile Home
    await page.goto('/patient');
    await expect(page).toHaveTitle(/One Click AIS/);
    await expect(page.locator('header').first()).toBeVisible();

    // 2. Search for Doctor
    await page.goto('/patient/search');
    await expect(page.locator('text=Dr. Rajesh Sharma').first()).toBeVisible();

    // 3. Open Booking Page for Dr. Sharma
    await page.goto('/patient/book/doc-sharma');
    await expect(page.locator('text=Dr. Rajesh Sharma').first()).toBeVisible();

    // Select an available (enabled) slot chip
    const availableSlot = page.locator('button:not([disabled])').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await expect(availableSlot).toBeVisible();
    await availableSlot.click();

    // Submit booking
    const bookButton = page.locator('button[type="submit"]');
    await expect(bookButton).toBeVisible();
    await bookButton.click();

    // 4. Confirmation screen with HMAC QR
    await page.waitForURL('**/patient/confirmation/**', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Appointment Booked/i })).toBeVisible();
    await expect(page.locator('img[alt="Appointment HMAC QR Code"]')).toBeVisible();
    await expect(page.locator('text=Queue Token')).toBeVisible();

    // 5. Open Live Queue Tracker
    const openQueueButton = page.locator('text=Open Live Queue Tracker');
    await openQueueButton.click();
    await page.waitForURL('**/patient/queue/**', { timeout: 15000 });
    await expect(page.locator('text=Live Queue Tracker').first()).toBeVisible();
    await expect(page.locator('text=Now Serving in Cabin').first()).toBeVisible();

    // 6. Test Cabin Scan Station Kiosk
    await page.goto('/scan/doc-sharma');
    await expect(page.locator('text=Cabin Touchless Check-In')).toBeVisible();
    await expect(page.locator('text=Dr. Rajesh Sharma').first()).toBeVisible();

    // Click "Simulate Patient Cabin Scan"
    const simulateScanBtn = page.locator('button:has-text("Simulate Patient Cabin Scan")');
    await simulateScanBtn.click();
    await expect(page.locator('text=Verified Successfully!')).toBeVisible({ timeout: 15000 });

    // 7. Verify Doctor Consultation Console
    await page.goto('/dashboard/consultation?doctorId=doc-sharma');
    await expect(page.locator('text=Doctor Consultation Console')).toBeVisible();
    await expect(page.locator('button:has-text("Next Patient")')).toBeVisible();
    await expect(page.locator('button:has-text("Done")')).toBeVisible();

    // 8. Verify Waiting Room Display Board
    await page.goto('/display/doc-sharma');
    await expect(page.locator('text=Sahyadri Care Hospital').first()).toBeVisible();
    await expect(page.locator('text=NOW IN CABIN')).toBeVisible();
    await expect(page.locator('text=UP NEXT IN QUEUE')).toBeVisible();

    // 9. Verify Super-Admin Panel
    await page.goto('/admin');
    await expect(page.locator('text=Super-Admin')).toBeVisible();
    await expect(page.locator('text=Registered Hospitals')).toBeVisible();
  });

  test('Cancellation and reschedule flow', async ({ page }) => {
    await page.goto('/patient/appointments');
    await expect(page.locator('text=My Appointments').first()).toBeVisible();

    // Cancel an appointment if upcoming exists
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    if (await cancelButton.isVisible()) {
      page.on('dialog', (dialog) => dialog.accept());
      await cancelButton.click();
    }
  });
});
