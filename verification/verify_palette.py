from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            # Check Analytics page
            print("Checking Analytics page...")
            page.goto("http://localhost:3000/analytics")
            page.wait_for_selector('h1:has-text("Analytics")')
            page.screenshot(path="verification/analytics_audit.png")
            icons = page.query_selector_all('svg.lucide')
            print(f"Found {len(icons)} icons on Analytics page.")

            # Check Modern Dashboard page
            print("Checking Modern Dashboard page...")
            page.goto("http://localhost:3000/dashboard")
            page.wait_for_selector('h1:has-text("Dashboard")')

            # Verify Header Buttons aria-labels
            export_btn = page.get_attribute('button:has-text("Export")', 'aria-label')
            print(f"Export button aria-label: {export_btn}")

            # Verify See All link aria-label
            see_all = page.get_attribute('button:has-text("See All")', 'aria-label')
            print(f"See All aria-label: {see_all}")

            # Verify Metric Card trend aria-label
            # Metric cards have "Increase/Decrease of X% from last period"
            trend = page.get_attribute('div[aria-label*="from last period"]', 'aria-label')
            print(f"Metric trend label sample: {trend}")

            page.screenshot(path="verification/dashboard_audit.png")

            if export_btn == "Export report" and see_all == "See all active integrations":
                print("SUCCESS: Accessibility labels verified in Modern Dashboard.")
            else:
                print("WARNING: Some accessibility labels missing or incorrect.")

        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    run()
