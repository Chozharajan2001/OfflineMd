'use client';

import { useCallback, useEffect, useState } from 'react';
import { MonitorDown } from 'lucide-react';
import { Button, IconButton } from './ui';
import { useToast } from './notifications/useToast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  return false;
}

function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

/**
 * Makes the PWA installable by the user: Chrome/Edge/Android fire
 * `beforeinstallprompt`, which we capture and trigger from an explicit
 * Install button. iOS has no such event, so we show share-sheet instructions.
 * Hidden entirely once running as an installed app.
 */
export function PwaInstallButton({ variant = 'icon' }: { variant?: 'icon' | 'full' }) {
  const toast = useToast();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIOS());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setDeferred(null);
  }, [deferred]);

  const iosInstructions = useCallback(() => {
    toast.info('To install: Share → Add to Home Screen. It then works offline.', { duration: 8000 });
  }, [toast]);

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
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOff = () => setOnline(false);
    const goOn = () => setOnline(true);
    window.addEventListener('offline', goOff);
    window.addEventListener('online', goOn);
    return () => {
      window.removeEventListener('offline', goOff);
      window.removeEventListener('online', goOn);
    };
  }, []);

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
