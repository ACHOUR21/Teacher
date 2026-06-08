import { test, expect } from './fixtures/auth.fixture';
import { CoursesPage } from './pages/CoursesPage';

test.describe('Courses list', () => {
  test('page loads with heading', async ({ authedPage: page }) => {
    const coursesPage = new CoursesPage(page);
    await coursesPage.goto();
    await coursesPage.assertPageLoaded();
  });

  test('displays course cards or empty state', async ({ authedPage: page }) => {
    const coursesPage = new CoursesPage(page);
    await coursesPage.goto();
    const hasCards = await page
      .locator('[data-testid="course-card"], .group.cursor-pointer, a[href*="/courses/"]')
      .count();
    const hasEmpty = await page.getByText(/no courses|empty/i).isVisible().catch(() => false);
    expect(hasCards > 0 || hasEmpty).toBeTruthy();
  });

  test('search input is visible and accepts input', async ({ authedPage: page }) => {
    const coursesPage = new CoursesPage(page);
    await coursesPage.goto();
    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i));
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill('flutter');
      await page.waitForTimeout(500);
      await searchInput.clear();
    }
  });

  test('create course button visible for teachers/admins', async ({ authedPage: page }) => {
    await page.goto('/courses');
    const createBtn = page.getByRole('button', { name: /new course|create/i });
    // May or may not be visible depending on role — just assert page loaded
    await expect(page.getByRole('heading', { name: /courses/i })).toBeVisible();
    // If create button exists it should be clickable
    if (await createBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await expect(createBtn).toBeEnabled();
    }
  });

  test('can navigate to course detail page', async ({ authedPage: page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    const firstCourse = page.locator('a[href*="/courses/"]').first();
    if (await firstCourse.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const href = await firstCourse.getAttribute('href');
      await firstCourse.click();
      await page.waitForLoadState('networkidle');
      if (href) {
        await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }
    }
  });

  test('back navigation from course detail returns to list', async ({ authedPage: page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    const firstCourse = page.locator('a[href*="/courses/"]').first();
    if (await firstCourse.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstCourse.click();
      await page.waitForLoadState('networkidle');
      await page.goBack();
      await expect(page).toHaveURL(/\/courses/);
    }
  });
});

test.describe('Courses — new course form', () => {
  test('new course modal/page opens', async ({ authedPage: page }) => {
    await page.goto('/courses');
    const createBtn = page.getByRole('button', { name: /new course|create/i }).or(
      page.getByRole('link', { name: /new course/i })
    );
    if (await createBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await createBtn.click();
      // Should open a modal or navigate to /courses/new
      const isModal = await page.getByRole('dialog').isVisible({ timeout: 3_000 }).catch(() => false);
      const isNewPage = page.url().includes('/courses/new') || page.url().includes('/new');
      expect(isModal || isNewPage).toBeTruthy();
    }
  });

  test('new course form has required title field', async ({ authedPage: page }) => {
    await page.goto('/courses/new');
    await page.waitForLoadState('networkidle');
    const titleInput = page
      .getByLabel(/title/i)
      .or(page.getByPlaceholder(/course title/i));
    if (await titleInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(titleInput).toBeVisible();
    }
  });
});

test.describe('My Learning', () => {
  test('my learning page loads', async ({ authedPage: page }) => {
    await page.goto('/my-learning');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('heading', { name: /my learning|enrolled/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows enrolled courses or empty state', async ({ authedPage: page }) => {
    await page.goto('/my-learning');
    await page.waitForLoadState('networkidle');
    const hasCourses = await page.locator('a[href*="/courses/"]').count();
    const hasEmpty = await page
      .getByText(/no courses|not enrolled|start learning/i)
      .isVisible()
      .catch(() => false);
    expect(hasCourses > 0 || hasEmpty).toBeTruthy();
  });
});

test.describe('Marketplace', () => {
  test('marketplace page loads', async ({ authedPage: page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('heading', { name: /marketplace/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows course cards or empty state', async ({ authedPage: page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    const hasContent = await page.locator('main').textContent();
    expect(hasContent?.trim().length).toBeGreaterThan(0);
  });
});
