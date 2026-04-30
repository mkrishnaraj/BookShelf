# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pwa.spec.ts >> PWA assets and metadata >> PWA manifest has correct short_name
- Location: e2e/pwa.spec.ts:16:3

# Error details

```
TimeoutError: browserType.launch: Timeout 120000ms exceeded.
Call log:
  - <launching> /home/mohan/Claude-Code/BookShelf/apps/web/firefox-wrapper.sh -no-remote -headless -profile /tmp/playwright_firefoxdev_profile-ep7xJI -juggler-pipe -silent
  - <launched> pid=1072213
  - [pid=1072213][err] *** You are running in headless mode.
  - [pid=1072213][out] [GFX1-]: RenderCompositorSWGL failed mapping default framebuffer, no dt

```