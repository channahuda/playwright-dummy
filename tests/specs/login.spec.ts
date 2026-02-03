import test, { expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test("valid login test", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login("tomsmith", "SuperSecretPassword!");

  await page.screenshot({ path: "screenshots/login-success.png" });

  const message = await loginPage.getSuccessMessage();
  await expect(loginPage.successMsg).toContainText(
    "You logged into a secure area!"
  );
});
