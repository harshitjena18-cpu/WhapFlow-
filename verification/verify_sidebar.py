from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Go to dashboard directly to see the Sidebar
        page.goto("http://localhost:3000/dashboard")

        # Wait for the sidebar to be visible
        # The sidebar is always visible on desktop, or we can check for a specific element
        page.wait_for_selector('aside')

        # Take a screenshot
        page.screenshot(path="verification/sidebar.png")

        # Check for text
        # Since we expect "User" and "US" as fallback
        content = page.content()
        if "John Doe" in content:
            print("FAILURE: 'John Doe' still present")
        else:
            print("SUCCESS: 'John Doe' not found")

        if "User" in content:
            print("SUCCESS: 'User' found (fallback)")
        else:
            print("FAILURE: 'User' fallback not found")

        browser.close()

if __name__ == "__main__":
    run()
