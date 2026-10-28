"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
type InstallEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
    }>;
};
type AppState = {
    online: boolean;
    installed: boolean;
    canInstall: boolean;
    offlineReady: boolean;
    updateReady: boolean;
    workerError: string;
    install: () => Promise<void>;
    update: () => void;
};
const AppContext = createContext<AppState | null>(null);
export function useWebApp() { const state = useContext(AppContext); if (!state)
    throw new Error('Web app provider missing'); return state; }
export default function WebAppProvider({ children }: {
    children: ReactNode;
}) {
    const [online, setOnline] = useState(true), [installed, setInstalled] = useState(false), [canInstall, setCanInstall] = useState(false), [offlineReady, setOfflineReady] = useState(false), [updateReady, setUpdateReady] = useState(false), [workerError, setWorkerError] = useState('');
    const installEvent = useRef<InstallEvent | null>(null);
    const registration = useRef<ServiceWorkerRegistration | null>(null);
    const reloadOnControl = useRef(false);
    useEffect(() => {
        let alive = true;
        const display = matchMedia('(display-mode: standalone)');
        const connection = () => setOnline(navigator.onLine);
        const mode = () => setInstalled(display.matches || Boolean((navigator as Navigator & {
            standalone?: boolean;
        }).standalone));
        Promise.resolve().then(() => { connection(); mode(); });
        function before(event: Event) { event.preventDefault(); installEvent.current = event as InstallEvent; setCanInstall(true); }
        function installedEvent() { setInstalled(true); setCanInstall(false); installEvent.current = null; }
        window.addEventListener('online', connection);
        window.addEventListener('offline', connection);
        window.addEventListener('beforeinstallprompt', before);
        window.addEventListener('appinstalled', installedEvent);
        display.addEventListener('change', mode);
        const changed = () => { if (reloadOnControl.current)
            location.reload(); };
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', changed);
            if (process.env.NODE_ENV === 'production' && window.isSecureContext) {
                navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(reg => {
                    if (!alive)
                        return;
                    registration.current = reg;
                    if (reg.waiting)
                        setUpdateReady(true);
                    reg.addEventListener('updatefound', () => { const worker = reg.installing; worker?.addEventListener('statechange', () => { if (alive && worker.state === 'installed' && navigator.serviceWorker.controller)
                        setUpdateReady(true); }); });
                    navigator.serviceWorker.ready.then(async () => { if (alive)
                        setOfflineReady(Boolean(await caches.match('/offline-menu.json'))); });
                }).catch(() => { if (alive)
                    setWorkerError('Offline setup could not finish. Reconnect and reload to try again.'); });
            }
        }
        return () => { alive = false; window.removeEventListener('online', connection); window.removeEventListener('offline', connection); window.removeEventListener('beforeinstallprompt', before); window.removeEventListener('appinstalled', installedEvent); display.removeEventListener('change', mode); if ('serviceWorker' in navigator)
            navigator.serviceWorker.removeEventListener('controllerchange', changed); };
    }, []);
    async function install() { const prompt = installEvent.current; if (!prompt)
        return; await prompt.prompt(); await prompt.userChoice; installEvent.current = null; setCanInstall(false); }
    function update() { const waiting = registration.current?.waiting; if (waiting) {
        reloadOnControl.current = true;
        waiting.postMessage({ type: 'SKIP_WAITING' });
    } }
    return <AppContext.Provider value={{ online, installed, canInstall, offlineReady, updateReady, workerError, install, update }}>{children}</AppContext.Provider>;
}
