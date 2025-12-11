"use client";

import { usePWAInstaller } from '@/hooks/use-pwa-installer';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function PWAInstallButton() {
  const { isInstallable, installPWA } = usePWAInstaller();

  if (!isInstallable) {
    return null;
  }

  return (
    <Button 
      onClick={installPWA}
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      Install App
    </Button>
  );
}