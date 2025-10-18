import { test, expect } from '@playwright/test';

// Test configuration
const O7C_HUB_URL = process.env.O7C_HUB_URL || 'http://localhost:3000';
const PLAYER_PORTAL_URL = process.env.PLAYER_PORTAL_URL || 'http://localhost:3001';

test.describe('Data Synchronization E2E Tests', () => {
  let o7cHubPage;
  let playerPortalPage;
  let testUser;
  let testPlayer;

  test.beforeAll(async ({ browser }) => {
    // Create separate browser contexts for each app
    const o7cHubContext = await browser.newContext();
    const playerPortalContext = await browser.newContext();

    o7cHubPage = await o7cHubContext.newPage();
    playerPortalPage = await playerPortalContext.newPage();

    // Setup test data
    testUser = {
      email: 'test-sync@example.com',
      password: 'testpassword123'
    };

    testPlayer = {
      firstName: 'Test',
      lastName: 'Player',
      email: 'test.player@example.com',
      position: 'QB',
      graduationYear: 2025
    };
  });

  test('should authenticate user across both applications', async () => {
    // Navigate to O7C Hub and login
    await o7cHubPage.goto(O7C_HUB_URL);
    await o7cHubPage.fill('[data-testid="email-input"]', testUser.email);
    await o7cHubPage.fill('[data-testid="password-input"]', testUser.password);
    await o7cHubPage.click('[data-testid="login-button"]');

    // Verify login success in O7C Hub
    await expect(o7cHubPage.locator('[data-testid="dashboard"]')).toBeVisible();

    // Open Player Portal in new tab (simulating app switch)
    await playerPortalPage.goto(PLAYER_PORTAL_URL);

    // Verify user is still authenticated in Player Portal
    await expect(playerPortalPage.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(playerPortalPage.locator('[data-testid="user-email"]')).toContainText(testUser.email);
  });

  test('should sync player profile updates between applications', async () => {
    // Login to both apps first
    await o7cHubPage.goto(O7C_HUB_URL + '/login');
    await o7cHubPage.fill('[data-testid="email-input"]', testUser.email);
    await o7cHubPage.fill('[data-testid="password-input"]', testUser.password);
    await o7cHubPage.click('[data-testid="login-button"]');

    await playerPortalPage.goto(PLAYER_PORTAL_URL + '/login');
    await playerPortalPage.fill('[data-testid="email-input"]', testUser.email);
    await playerPortalPage.fill('[data-testid="password-input"]', testUser.password);
    await playerPortalPage.click('[data-testid="login-button"]');

    // Navigate to player profile in Player Portal
    await playerPortalPage.goto(PLAYER_PORTAL_URL + '/profile');
    await playerPortalPage.fill('[data-testid="position-input"]', 'RB');
    await playerPortalPage.fill('[data-testid="graduation-year-input"]', '2026');
    await playerPortalPage.click('[data-testid="save-profile-button"]');

    // Verify changes are saved
    await expect(playerPortalPage.locator('[data-testid="position-display"]')).toContainText('RB');

    // Switch to O7C Hub and verify changes are reflected
    await o7cHubPage.goto(O7C_HUB_URL + '/roster');
    await o7cHubPage.click(`[data-testid="player-${testPlayer.email}"]`);

    // Verify updated data appears in O7C Hub
    await expect(o7cHubPage.locator('[data-testid="player-position"]')).toContainText('RB');
    await expect(o7cHubPage.locator('[data-testid="player-graduation-year"]')).toContainText('2026');
  });

  test('should sync coach updates to player data', async () => {
    // Coach updates player in O7C Hub
    await o7cHubPage.goto(O7C_HUB_URL + '/roster');
    await o7cHubPage.click(`[data-testid="player-${testPlayer.email}"]`);
    await o7cHubPage.selectOption('[data-testid="recruiting-status-select"]', 'offered');
    await o7cHubPage.fill('[data-testid="coach-notes-input"]', 'Excellent candidate for our program');
    await o7cHubPage.click('[data-testid="save-player-button"]');

    // Verify changes in O7C Hub
    await expect(o7cHubPage.locator('[data-testid="recruiting-status"]')).toContainText('offered');

    // Switch to Player Portal and verify player sees the updates
    await playerPortalPage.goto(PLAYER_PORTAL_URL + '/recruiting');
    await expect(playerPortalPage.locator('[data-testid="recruiting-status"]')).toContainText('offered');
    await expect(playerPortalPage.locator('[data-testid="coach-notes"]')).toContainText('Excellent candidate for our program');
  });

  test('should sync file uploads across applications', async () => {
    // Upload file in Player Portal
    await playerPortalPage.goto(PLAYER_PORTAL_URL + '/profile');
    await playerPortalPage.setInputFiles('[data-testid="file-upload"]', 'test-video.mp4');
    await playerPortalPage.click('[data-testid="upload-button"]');

    // Verify file appears in Player Portal
    await expect(playerPortalPage.locator('[data-testid="uploaded-files"]')).toContainText('test-video.mp4');

    // Verify file is accessible in O7C Hub
    await o7cHubPage.goto(O7C_HUB_URL + '/roster');
    await o7cHubPage.click(`[data-testid="player-${testPlayer.email}"]`);
    await expect(o7cHubPage.locator('[data-testid="player-files"]')).toContainText('test-video.mp4');

    // Test file download from O7C Hub
    const downloadPromise = o7cHubPage.waitForEvent('download');
    await o7cHubPage.click('[data-testid="download-file-test-video.mp4"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('test-video.mp4');
  });

  test('should handle real-time updates', async () => {
    // Start monitoring for real-time updates in Player Portal
    const statusPromise = playerPortalPage.waitForSelector('[data-testid="recruiting-status"]:has-text("offered")');

    // Make change in O7C Hub
    await o7cHubPage.goto(O7C_HUB_URL + '/roster');
    await o7cHubPage.click(`[data-testid="player-${testPlayer.email}"]`);
    await o7cHubPage.selectOption('[data-testid="recruiting-status-select"]', 'offered');
    await o7cHubPage.click('[data-testid="save-player-button"]');

    // Verify real-time update in Player Portal
    await statusPromise;
    await expect(playerPortalPage.locator('[data-testid="recruiting-status"]')).toContainText('offered');
  });

  test('should maintain data consistency during concurrent operations', async () => {
    // Start multiple operations simultaneously
    const operations = [
      // Update in O7C Hub
      o7cHubPage.evaluate(() => {
        // Simulate API call to update player stars
        return fetch('/api/players/test-player-id', {
          method: 'PUT',
          body: JSON.stringify({ stars: 5 }),
          headers: { 'Content-Type': 'application/json' }
        });
      }),

      // Update in Player Portal
      playerPortalPage.evaluate(() => {
        // Simulate API call to update player position
        return fetch('/api/players/test-player-id', {
          method: 'PUT',
          body: JSON.stringify({ position: 'WR' }),
          headers: { 'Content-Type': 'application/json' }
        });
      })
    ];

    // Execute concurrent operations
    await Promise.all(operations);

    // Verify final state is consistent in both apps
    await o7cHubPage.reload();
    await playerPortalPage.reload();

    // Check that both updates are reflected
    await expect(o7cHubPage.locator('[data-testid="player-stars"]')).toContainText('5');
    await expect(o7cHubPage.locator('[data-testid="player-position"]')).toContainText('WR');

    await expect(playerPortalPage.locator('[data-testid="player-stars"]')).toContainText('5');
    await expect(playerPortalPage.locator('[data-testid="player-position"]')).toContainText('WR');
  });

  test('should handle offline/online synchronization', async () => {
    // Simulate going offline in Player Portal
    await playerPortalPage.context().setOffline(true);

    // Attempt update while offline
    await playerPortalPage.goto(PLAYER_PORTAL_URL + '/profile');
    await playerPortalPage.fill('[data-testid="position-input"]', 'QB');
    await playerPortalPage.click('[data-testid="save-profile-button"]');

    // Should show offline indicator or queue update
    await expect(playerPortalPage.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Come back online
    await playerPortalPage.context().setOffline(false);

    // Trigger sync
    await playerPortalPage.click('[data-testid="sync-button"]');

    // Verify update is synced
    await expect(playerPortalPage.locator('[data-testid="position-display"]')).toContainText('QB');

    // Verify sync in O7C Hub
    await o7cHubPage.reload();
    await expect(o7cHubPage.locator('[data-testid="player-position"]')).toContainText('QB');
  });
});