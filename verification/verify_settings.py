from playwright.sync_api import sync_playwright, expect

def verify_settings_selects():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Navigate to the settings page
        page.goto("http://localhost:3000/settings")

        # Wait for the page to load
        page.wait_for_selector("h1:has-text('Settings')")

        # Scroll to the bottom to see preferences
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

        # Take a screenshot of the preferences section
        # We need to find the select triggers
        language_trigger = page.locator("#language")
        timezone_trigger = page.locator("#timezone")

        # Assert they are visible
        expect(language_trigger).to_be_visible()
        expect(timezone_trigger).to_be_visible()

        # Click on Language to show the dropdown
        language_trigger.click()

        # Wait for content to appear
        page.wait_for_selector("div[data-slot='select-content']")

        # Take screenshot of the open select
        page.screenshot(path="verification/settings_select_open.png")

        # Close it by clicking away or selecting something
        page.keyboard.press("Escape")

        # Take a screenshot of the full settings page (scrolled down)
        page.screenshot(path="verification/settings_view_final.png")

        browser.close()

if __name__ == "__main__":
    import os
    if not os.path.exists("verification"):
        os.makedirs("verification")
    verify_settings_selects()
