/* NekoAssist background service worker.
   Content scripts can't message each other, so frames talk through here:
   - top frame  -> all frames   (fill / teach / stop commands)
   - sub-frames -> top frame    (results and status text)
   It also remembers which tabs are "armed" for auto-follow (multi-step forms). */

const ARM_TTL_MS = 30 * 60 * 1000;
const armKey = (tabId) => `armed_${tabId}`;

const broadcast = (tabId, message) =>
    chrome.tabs.sendMessage(tabId, message).catch(() => { /* frames without a listener */ });

async function setArmed(tabId, host) {
    await chrome.storage.session.set({ [armKey(tabId)]: { host, at: Date.now() } });
}

async function clearArmed(tabId) {
    await chrome.storage.session.remove(armKey(tabId));
}

async function isArmed(tabId, topHost) {
    const stored = (await chrome.storage.session.get(armKey(tabId)))[armKey(tabId)];
    if (!stored) return false;
    const expired = Date.now() - stored.at > ARM_TTL_MS;
    const wentElsewhere = topHost && stored.host && stored.host !== topHost;
    if (expired || wentElsewhere) {
        await clearArmed(tabId);
        return false;
    }
    return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const tabId = sender.tab && sender.tab.id;
    if (tabId === undefined) return false;

    switch (message && message.type) {
        case 'neko-fill-request':
            (async () => {
                if (message.arm) await setArmed(tabId, message.host);
                else await clearArmed(tabId);
                await broadcast(tabId, { type: 'neko-run-fill', arm: Boolean(message.arm) });
                sendResponse({ ok: true });
            })();
            return true;

        case 'neko-hello':
            (async () => {
                const topHost = message.isTop ? message.host : null;
                sendResponse({ armed: await isArmed(tabId, topHost) });
            })();
            return true;

        case 'neko-disarm':
            (async () => {
                await clearArmed(tabId);
                await broadcast(tabId, { type: 'neko-stop' });
                sendResponse({ ok: true });
            })();
            return true;

        case 'neko-teach':
            broadcast(tabId, { type: 'neko-teach' });
            return false;

        case 'neko-stop-teach':
            broadcast(tabId, { type: 'neko-stop-teach' });
            return false;

        case 'neko-to-top':
            chrome.tabs.sendMessage(tabId, { type: 'neko-top-payload', payload: message.payload }, { frameId: 0 })
                .catch(() => { /* top frame gone */ });
            return false;

        default:
            return false;
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    clearArmed(tabId).catch(() => {});
});
