'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { MonitorDown } from 'lucide-react';
import { Button, IconButton } from './ui';
import { useToast } from './notifications/useToast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function subscribeStandalone(onChange: () => void): () => void {
  const mq = window.matchMedia('(display-mode: standalone)');
  mq.addEventListener('change', onChange);
  window.addEventListener('appinstalled', onChange);
  return () => {
    mq.removeEventListener('change', onChange);
    window.removeEventListener('appinstalled', onChange);
  };
}

function isStandaloneSnapshot(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  return false;
}

function useIsIOS(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream,
    () => false
  );
}

/** Captured install prompt. setState only runs in event callbacks, never sync in effects. */
function useInstallPrompt(): BeforeInstallPromptEvent | null {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  return deferred;
}

/**
 * Makes the PWA installable by the user: Chrome/Edge/Android fire
 * `beforeinstallprompt`, which we capture and trigger from an explicit
 * Install button. iOS has no such event, so we show share-sheet instructions.
 * Hidden entirely once running as an installed app.
 */
export function PwaInstallButton({ variant = 'icon' }: { variant?: 'icon' | 'full' }) {
  const toast = useToast();
  const deferred = useInstallPrompt();
  const installed = useSyncExternalStore(subscribeStandalone, isStandaloneSnapshot, () => false);
  const ios = useIsIOS();

  const iosInstructions = useCallback(() => {
    toast.info('To install: Share → Add to Home Screen. It then works offline, even with no network.', { duration: 8000 });
  }, [toast]);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    // 'appinstalled' listener clears the prompt on acceptance
  }, [deferred]);

  if (installed) return null;

  if (deferred) {
    if (variant === 'full') {
      return (
        <Button variant="primary" onClick={() => void install()} className="w-full gap-2">
          <MonitorDown className="w-5 h-5" aria-hidden="true" />
          Install app for offline use
        </Button>
      );
    }
    return (
      <IconButton label="Install app for offline use" onClick={() => void install()}>
        <MonitorDown className="w-5 h-5" aria-hidden="true" />
      </IconButton>
    );
  }

  // iOS: no install event exists — offer instructions instead of nothing
  if (ios) {
    if (variant === 'full') {
      return (
        <Button variant="secondary" onClick={iosInstructions} className="w-full gap-2">
          <MonitorDown className="w-5 h-5" aria-hidden="true" />
          How to install this app
        </Button>
      );
    }
    return (
      <IconButton label="How to install this app" onClick={iosInstructions}>
        <MonitorDown className="w-5 h-5" aria-hidden="true" />
      </IconButton>
    );
  }

  return null;
}

/** Small offline pill: proves at a glance the app survives no-network. */
export function OfflineBadge() {
  const online = useSyncExternalStore(
    (onChange) => {
      window.addEventListener('offline', onChange);
      window.addEventListener('online', onChange);
      return () => {
        window.removeEventListener('offline', onChange);
        window.removeEventListener('online', onChange);
      };
    },
    () => navigator.onLine,
    () => true
  );

  if (online) return null;
  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 rounded-full text-xs font-medium bg-[var(--color-warning)]/15 text-[var(--sidebar-fg)] border border-[var(--color-warning)]"
      title="You are offline. Editing and saving keep working locally."
    >
      <span className="h-2 w-2 rounded-full bg-[var(--color-warning)]" aria-hidden="true" />
      Offline — changes save locally
    </span>
  );
}
