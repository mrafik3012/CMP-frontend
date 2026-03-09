import { test, expect } from "@playwright/test";

test.describe("Project creation", () => {
  test("creates a project with SqFt, type and category", async ({ page }) => {
    // Assumes a logged-in session helper or test user; adapt as needed.
    await page.goto("/projects/new");

    await page.getByLabel("Name *").fill("E2E Test Tower");
    await page.getByLabel("Client *").fill("E2E Client");
    await page.getByLabel("Location *").fill("E2E City");
    await page.getByLabel("Start *").fill("2026-01-01");
    await page.getByLabel("End *").fill("2026-12-31");

    await page.getByLabel("Budget *").fill("1000000");
    await page.getByLabel("SqFt *").fill("50000");

    await page.getByLabel("Type *").selectOption("Residential");
    await page.getByLabel("Category *").selectOption("Construction");
    await page.getByLabel("Status *").selectOption("Planning");

    await page.getByRole("button", { name: "Create Project" }).click();

    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText("E2E Test Tower")).toBeVisible();
  });

  test("shows validation errors for missing SqFt and selects", async ({ page }) => {
    await page.goto("/projects/new");

    await page.getByLabel("Name *").fill("Invalid Project");
    await page.getByLabel("Client *").fill("Client");
    await page.getByLabel("Location *").fill("City");
    await page.getByLabel("Start *").fill("2026-01-01");
    await page.getByLabel("End *").fill("2026-12-31");
    await page.getByLabel("Budget *").fill("100000");

    // Leave SqFt, Type and Category empty
    await page.getByRole("button", { name: "Create Project" }).click();

    await expect(page.getByText("SqFt required")).toBeVisible();
    await expect(page.getByText("Project type is required")).toBeVisible();
    await expect(page.getByText("Project category is required")).toBeVisible();
  });
});

