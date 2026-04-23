import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the dashboard (the URL might need to be /dashboard)
    await page.goto('http://localhost:3000/dashboard');

    // Wait for the dashboard content to load
    await page.waitForSelector('h1:has-text("Dashboard")');

    // Take a screenshot
    await page.screenshot({ path: 'dashboard-verify.png', fullPage: true });
    console.log('Screenshot saved to dashboard-verify.png');

    // Verify specific elements exist
    const integrationsTitle = await page.textContent('h3:has-text("Integrations")');
    console.log('Found card:', integrationsTitle);

    const manageLink = await page.getAttribute('a:has-text("Manage")', 'aria-label');
    console.log('Manage link aria-label:', manageLink);

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await browser.close();
  }
})();
