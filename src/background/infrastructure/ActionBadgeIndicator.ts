import type { StatusIndicator } from '../application/ports';

const BUSY_COLOR = '#2563eb';
const ERROR_COLOR = '#dc2626';
const ERROR_VISIBLE_MS = 6000;

/** {@link StatusIndicator} on the toolbar icon: a badge, and the tooltip for error details. */
export class ActionBadgeIndicator implements StatusIndicator {
  constructor(private readonly defaultTitle: string) {}

  async showBusy(tabId: number): Promise<void> {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: BUSY_COLOR });
    await chrome.action.setBadgeText({ tabId, text: '…' });
  }

  async clear(tabId: number): Promise<void> {
    await chrome.action.setBadgeText({ tabId, text: '' });
  }

  async showError(tabId: number, message: string): Promise<void> {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: ERROR_COLOR }).catch(() => {});
    await chrome.action.setBadgeText({ tabId, text: '!' }).catch(() => {});
    await chrome.action.setTitle({ tabId, title: message }).catch(() => {});
    setTimeout(() => {
      chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
      chrome.action.setTitle({ tabId, title: this.defaultTitle }).catch(() => {});
    }, ERROR_VISIBLE_MS);
  }
}
