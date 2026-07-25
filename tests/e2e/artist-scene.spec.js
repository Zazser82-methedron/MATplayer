// tests/e2e/artist-scene.spec.js
import { test, expect } from '@playwright/test'

test('artist scene reaches a ready WebGL frame with a visible canvas', async ({ page }) => {
  await page.goto('/MATplayer/')
  await page.waitForSelector('html[data-matplayer-ready="true"]', { timeout: 15000 })
  await expect(page.locator('canvas')).toBeVisible()
})

test('pressing n switches the active artist', async ({ page }) => {
  await page.goto('/MATplayer/')
  await page.waitForSelector('html[data-matplayer-ready="true"]', { timeout: 15000 })
  await expect(page.locator('[data-testid="current-artist"]')).toHaveAttribute('data-artist-id', 'cupsize')
  await page.keyboard.press('n')
  await expect(page.locator('[data-testid="current-artist"]')).toHaveAttribute(
    'data-artist-id',
    'placeholder_a',
    { timeout: 5000 },
  )
})
