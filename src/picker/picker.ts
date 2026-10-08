/*
 * Injected into the page by the service worker (bundled as a classic script) — from the toolbar
 * button, the keyboard shortcut or the context menu. See launchPicker for what it does.
 */
import { launchPicker } from './launchPicker';

launchPicker(request => chrome.runtime.sendMessage(request));
