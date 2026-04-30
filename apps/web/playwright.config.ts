import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          // Use snap run wrapper to bypass CLONE_NEWPID namespace restriction
          executablePath: '/home/mohan/Claude-Code/BookShelf/apps/web/firefox-wrapper.sh',
          timeout: 120000,
          env: {
            HOME: process.env['HOME'] ?? '/home/mohan',
            PATH: process.env['PATH'] ?? '/usr/local/bin:/usr/bin:/bin:/usr/bin/snap:/snap/bin',
            USER: process.env['USER'] ?? 'mohan',
            LOGNAME: process.env['LOGNAME'] ?? 'mohan',
            SHELL: process.env['SHELL'] ?? '/bin/bash',
            XDG_RUNTIME_DIR: process.env['XDG_RUNTIME_DIR'] ?? '/run/user/1000',
            TMPDIR: '/tmp',
            SNAP: process.env['SNAP'] ?? '/snap/firefox/8191',
            SNAP_COMMON: process.env['SNAP_COMMON'] ?? '/var/snap/firefox/common',
            SNAP_USER_COMMON: process.env['SNAP_USER_COMMON'] ?? '/home/mohan/snap/firefox/common',
            SNAP_USER_DATA: process.env['SNAP_USER_DATA'] ?? '/home/mohan/snap/firefox/8191',
            SNAP_NAME: 'firefox',
            SNAP_REVISION: '8191',
          },
        },
        firefoxUserPrefs: {
          'security.sandbox.content.level': 0,
          'security.sandbox.gpu.level': 0,
          'security.sandbox.rdd.level': 0,
          'security.sandbox.socket.process.level': 0,
        },
      },
    },
  ],
  webServer: {
    command: 'pnpm preview --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 30000,
    cwd: '/home/mohan/Claude-Code/BookShelf/apps/web',
    env: {
      PATH: process.env['PATH'] ?? '',
      VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_placeholder',
    },
  },
})
