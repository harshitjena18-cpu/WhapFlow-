from playwright.sync_api import sync_playwright, expect
import time

def verify_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to something standard
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        try:
            # Go to the templates page
            print("Navigating to http://localhost:3000/templates...")
            page.goto("http://localhost:3000/templates")

            # Wait for content to load
            time.sleep(2)

            # Screenshot of the template list
            page.screenshot(path="/home/jules/verification/templates_list_after.png")
            print("Screenshot saved to /home/jules/verification/templates_list_after.png")

            # Look for the New Template button
            new_template_btn = page.get_by_role("button", name="New Template")
            if new_template_btn.is_visible():
                print("Clicking New Template button...")
                new_template_btn.click()
                time.sleep(1)

                # Check for editor accessibility features
                textarea = page.locator("textarea").first
                if textarea.is_visible():
                    aria_describedby = textarea.get_attribute("aria-describedby")
                    print(f"Textarea aria-describedby: {aria_describedby}")

                    validation_container = page.locator("#validation_messages")
                    print(f"Validation container visible: {validation_container.is_visible()}")

                    # Screenshot of the editor
                    page.screenshot(path="/home/jules/verification/templates_editor_after.png")
                    print("Screenshot saved to /home/jules/verification/templates_editor_after.png")
                else:
                    print("Textarea not found in the editor")
            else:
                print("New Template button not visible")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="/home/jules/verification/error_screenshot.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ux()
