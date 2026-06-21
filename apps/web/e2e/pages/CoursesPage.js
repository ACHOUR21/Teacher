import { expect } from '@playwright/test';
export class CoursesPage {
    page;
    heading;
    searchInput;
    createButton;
    courseCards;
    levelFilter;
    constructor(page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: /courses/i });
        this.searchInput = page
            .getByRole('searchbox')
            .or(page.getByPlaceholder(/search/i));
        this.createButton = page.getByRole('button', { name: /new course|create course/i });
        this.courseCards = page.locator('[data-testid="course-card"], .course-card, [class*="course"]');
        this.levelFilter = page.getByRole('combobox').or(page.getByLabel(/level/i));
    }
    async goto() {
        await this.page.goto('/courses');
        await this.page.waitForLoadState('networkidle');
    }
    async search(query) {
        await this.searchInput.fill(query);
        await this.page.waitForTimeout(400); // debounce
    }
    async clearSearch() {
        await this.searchInput.clear();
        await this.page.waitForTimeout(300);
    }
    async assertPageLoaded() {
        await expect(this.heading).toBeVisible();
    }
}
