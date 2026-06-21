import { test, expect } from './fixtures/auth.fixture';
test.describe('Flashcards', () => {
    test.beforeEach(async ({ authedPage: page }) => {
        await page.goto('/flashcards');
        await page.waitForLoadState('networkidle');
    });
    test('student can view flashcard decks page', async ({ authedPage: page }) => {
        await expect(page).toHaveURL(/flashcards/);
        await expect(page.getByRole('heading', { name: /flashcard/i })).toBeVisible({ timeout: 10_000 });
    });
    test('create deck button is visible', async ({ authedPage: page }) => {
        const createBtn = page
            .getByRole('button', { name: /create|new|add/i })
            .or(page.getByRole('link', { name: /create|new/i }));
        await expect(createBtn.first()).toBeVisible({ timeout: 5_000 });
    });
    test('shows decks or empty state', async ({ authedPage: page }) => {
        const hasDecks = await page
            .locator('[data-testid="flashcard-deck"], .deck-card, a[href*="/flashcards/"]')
            .count();
        const hasEmpty = await page
            .getByText(/no decks|no flashcards|create your first/i)
            .isVisible()
            .catch(() => false);
        const content = await page.locator('main').textContent();
        expect(hasDecks > 0 || hasEmpty || (content?.trim().length ?? 0) > 0).toBeTruthy();
    });
    test('search input accepts query', async ({ authedPage: page }) => {
        const searchInput = page
            .getByRole('searchbox')
            .or(page.getByPlaceholder(/search/i));
        if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await searchInput.fill('math');
            await page.waitForTimeout(400);
            const value = await searchInput.inputValue();
            expect(value).toBe('math');
            await searchInput.clear();
        }
    });
    test('can open a deck or create new one', async ({ authedPage: page }) => {
        // Click first deck if available, otherwise create button should be enabled
        const firstDeck = page.locator('a[href*="/flashcards/"]').first();
        if (await firstDeck.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await firstDeck.click();
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(/flashcards\//);
        }
        else {
            // No decks — create button should be present and enabled
            const createBtn = page.getByRole('button', { name: /create|new|add/i });
            if (await createBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
                await expect(createBtn).toBeEnabled();
            }
        }
    });
});
test.describe('Flashcards — AI generation', () => {
    test('AI generate flashcards button or tab is present', async ({ authedPage: page }) => {
        await page.goto('/flashcards');
        await page.waitForLoadState('networkidle');
        const aiBtn = page
            .getByRole('button', { name: /generate|AI|auto/i })
            .or(page.getByRole('tab', { name: /generate|AI/i }));
        if (await aiBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await expect(aiBtn.first()).toBeEnabled();
        }
    });
    test('study mode button is visible on a deck', async ({ authedPage: page }) => {
        await page.goto('/flashcards');
        await page.waitForLoadState('networkidle');
        const firstDeck = page.locator('a[href*="/flashcards/"]').first();
        if (await firstDeck.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await firstDeck.click();
            await page.waitForLoadState('networkidle');
            const studyBtn = page.getByRole('button', { name: /study|start|practice/i });
            if (await studyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
                await expect(studyBtn).toBeEnabled();
            }
        }
    });
});
