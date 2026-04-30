# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pwa.spec.ts >> PWA assets and metadata >> PWA manifest.json is accessible and returns 200
- Location: e2e/pwa.spec.ts:4:3

# Error details

```
TimeoutError: browserType.launch: Timeout 120000ms exceeded.
Call log:
  - <launching> /home/mohan/Claude-Code/BookShelf/apps/web/firefox-wrapper.sh -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-BMWNE0 -juggler-pipe -silent
  - <launched> pid=1070781
  - [pid=1070781][err] *** You are running in headless mode.
  - [pid=1070781][out] [GFX1-]: RenderCompositorSWGL failed mapping default framebuffer, no dt

```