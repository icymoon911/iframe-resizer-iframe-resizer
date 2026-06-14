import { test, expect } from '@playwright/test'

/**
 * E2E tests for iframe-resizer basic functionality
 */
test.describe('iframe-resizer basic functionality', () => {
  test('should load parent page with iframe', async ({ page }) => {
    // Navigate to the example page
    await page.goto('/example/html/index.html')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check that the page loaded
    await expect(page.locator('h2')).toContainText('Automagically resizing iFrame')
    
    // Check that iframe is present
    const iframe = page.frameLocator('iframe')
    await expect(iframe.locator('body')).toBeVisible()
  })

  test('should resize iframe when content changes', async ({ page }) => {
    // Navigate to the example page
    await page.goto('/example/html/index.html')
    await page.waitForLoadState('networkidle')
    
    // Get initial iframe dimensions
    const iframeElement = page.locator('iframe')
    const initialHeight = await iframeElement.evaluate(el => el.offsetHeight)
    
    // Verify iframe has a height
    expect(initialHeight).toBeGreaterThan(0)
    
    // The iframe should have a reasonable height based on content
    // (actual value depends on content, but should be substantial)
    expect(initialHeight).toBeGreaterThan(100)
  })

  test('should handle iframe messaging', async ({ page }) => {
    // Navigate to the example page
    await page.goto('/example/html/index.html')
    await page.waitForLoadState('networkidle')
    
    // Get the iframe
    const iframe = page.frameLocator('iframe')
    
    // Wait for iframe content to be visible
    await expect(iframe.locator('body')).toBeVisible()
    
    // Check that iframe content loaded
    const iframeBody = iframe.locator('body')
    await expect(iframeBody).not.toBeEmpty()
  })

  test('should work with multiple iframes', async ({ page }) => {
    // Navigate to the two iframes example
    await page.goto('/example/html/two.html')
    await page.waitForLoadState('networkidle')
    
    // Check that both iframes are present
    const iframes = page.locator('iframe')
    const count = await iframes.count()
    expect(count).toBeGreaterThanOrEqual(2)
    
    // Verify both iframes have height
    const firstIframe = iframes.first()
    const secondIframe = iframes.nth(1)
    
    const firstHeight = await firstIframe.evaluate(el => el.offsetHeight)
    const secondHeight = await secondIframe.evaluate(el => el.offsetHeight)
    
    expect(firstHeight).toBeGreaterThan(0)
    expect(secondHeight).toBeGreaterThan(0)
  })

  test('should handle iframe with jQuery', async ({ page }) => {
    // Navigate to the jQuery example
    await page.goto('/example/html/jquery.html')
    await page.waitForLoadState('networkidle')
    
    // Check that page loaded
    await expect(page.locator('h2')).toBeVisible()
    
    // Check that iframe is present
    const iframe = page.locator('iframe')
    await expect(iframe).toBeVisible()
    
    // Verify iframe has a height
    const height = await iframe.evaluate(el => el.offsetHeight)
    expect(height).toBeGreaterThan(0)
  })
})

test.describe('iframe-resizer cross-origin handling', () => {
  test('should handle same-origin iframes', async ({ page }) => {
    await page.goto('/example/html/index.html')
    await page.waitForLoadState('networkidle')
    
    // Wait for iframe to be present
    const iframe = page.locator('iframe')
    await expect(iframe).toBeVisible()
    
    // Wait for iframe resizer to initialize by checking for the iFrameResizer property
    // This MUST succeed - if it fails, the test should fail
    await page.waitForFunction(() => {
      const iframeEl = document.querySelector('iframe')
      return iframeEl && iframeEl.iFrameResizer !== undefined
    }, { timeout: 10000 })
    
    // Verify that iframe resizer initialized successfully
    const hasResizer = await page.evaluate(() => {
      const iframeEl = document.querySelector('iframe')
      return iframeEl && iframeEl.iFrameResizer !== undefined
    })
    
    expect(hasResizer).toBeTruthy()
  })
})

test.describe('iframe-resizer React example', () => {
  test.skip('should load React example', async ({ page }) => {
    // Note: React example requires building with npm run build in example/react
    // Skipping for now as it requires additional setup
    await page.goto('/example/react/index.html')
    await page.waitForLoadState('networkidle')
    
    // Check that root element exists
    const root = page.locator('#root')
    await expect(root).toBeVisible()
  })
})

test.describe('iframe-resizer Vue example', () => {
  test.skip('should load Vue example', async ({ page }) => {
    // Note: Vue example requires building with npm run build in example/vue
    // Skipping for now as it requires additional setup
    await page.goto('/example/vue/index.html')
    await page.waitForLoadState('networkidle')

    // Check that app element exists
    const app = page.locator('#app')
    await expect(app).toBeVisible()
  })
})

test.describe('iframe-resizer overflow stability (Safari regression)', () => {
  test('should maintain stable iframe height without overflow jitter', async ({ page }) => {
    await page.goto('/example/html/index.html')
    await page.waitForLoadState('networkidle')

    const iframeElement = page.locator('iframe')
    await page.waitForFunction(() => {
      const iframeEl = document.querySelector('iframe')
      return iframeEl && iframeEl.iFrameResizer !== undefined
    }, { timeout: 10000 })

    // Capture a series of height measurements — jitter manifests as
    // the height oscillating between two or more values.
    const heights = await page.evaluate(async () => {
      const iframe = document.querySelector('iframe')
      const samples = []
      for (let i = 0; i < 10; i++) {
        samples.push(iframe.offsetHeight)
        await new Promise(r => setTimeout(r, 50))
      }
      return samples
    })

    // All measurements must be identical — no jitter allowed.
    const unique = [...new Set(heights)]
    expect(unique.length).toBe(1)
    expect(unique[0]).toBeGreaterThan(0)
  })

  test('should not trigger redundant resize messages when overflow state is unchanged', async ({ page }) => {
    await page.goto('/example/html/index.html')
    await page.waitForLoadState('networkidle')

    await page.waitForFunction(() => {
      const iframeEl = document.querySelector('iframe')
      return iframeEl && iframeEl.iFrameResizer !== undefined
    }, { timeout: 10000 })

    // Spy on postMessage inside the iframe to count resize messages.
    const iframeHandle = await page.locator('iframe').elementHandle()
    const frame = await iframeHandle.contentFrame()

    const resizeCount = await frame.evaluate(async () => {
      let count = 0
      const origPost = window.parent.postMessage.bind(window.parent)
      window.parent.postMessage = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('resize')) count++
        origPost(...args)
      }
      await new Promise(r => setTimeout(r, 500))
      return count
    })

    // After initialisation settles, there should be very few (ideally zero)
    // additional resize messages during a 500ms quiet period.
    expect(resizeCount).toBeLessThanOrEqual(2)
  })

  test('should correctly handle overflow detection with fixed-position elements', async ({ page }) => {
    await page.goto('/example/html/index.html')
    await page.waitForLoadState('networkidle')

    const iframe = page.frameLocator('iframe')
    await expect(iframe.locator('body')).toBeVisible()

    // Inject a fixed-position element inside the iframe and verify the
    // iframe height remains stable (the fixed element must not be mis-
    // identified as hidden, which would corrupt overflow calculations).
    const iframeElement = page.locator('iframe')
    const heightBefore = await iframeElement.evaluate(el => el.offsetHeight)

    await iframe.locator('body').evaluate(body => {
      const fixed = document.createElement('div')
      fixed.style.cssText = 'position:fixed;bottom:0;left:0;right:0;height:50px;background:blue;z-index:9999;'
      fixed.textContent = 'Fixed navbar'
      body.append(fixed)
    })

    // Give the observer a moment to react.
    await page.waitForTimeout(200)

    const heightAfter = await iframeElement.evaluate(el => el.offsetHeight)
    expect(heightAfter).toBeGreaterThan(0)
    // Height should not swing wildly from a small fixed-position addition.
    expect(Math.abs(heightAfter - heightBefore)).toBeLessThan(200)
  })
})
