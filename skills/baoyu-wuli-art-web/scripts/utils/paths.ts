import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const APP_DATA_DIR = 'baoyu-skills';
const WULI_DATA_DIR = 'wuli-art-web';
const COOKIE_FILE_NAME = 'cookies.json';
const PROFILE_DIR_NAME = 'chrome-profile';

export function resolveUserDataRoot(): string {
  if (process.platform === 'win32') {
    return process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support');
  }
  return process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share');
}

export function resolveWuliArtDataDir(): string {
  const override = process.env.WULI_ART_DATA_DIR?.trim();
  if (override) return path.resolve(override);
  return path.join(resolveUserDataRoot(), APP_DATA_DIR, WULI_DATA_DIR);
}

export function resolveWuliArtCookiePath(): string {
  const override = process.env.WULI_ART_COOKIE_PATH?.trim();
  if (override) return path.resolve(override);
  return path.join(resolveWuliArtDataDir(), COOKIE_FILE_NAME);
}

export function resolveWuliArtChromeProfileDir(): string {
  const override = process.env.WULI_ART_CHROME_PROFILE_DIR?.trim();
  if (override) return path.resolve(override);
  return path.join(resolveWuliArtDataDir(), PROFILE_DIR_NAME);
}
