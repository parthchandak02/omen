import { openOmen } from "./omen-test-helpers";
import { expect, test } from "./toolcraft-product-test";

test("browser: omen opens in the Toolcraft shell", async ({ page }) => {
  await openOmen(page);
  await expect(page.getByRole("button", { exact: true, name: "Export PNG" })).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "Dorothy" })).toBeVisible();
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
});
