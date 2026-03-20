import { useState, useEffect } from 'react';

export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      // Check if there's already a waiting worker
      if (reg.waiting) {
        setUpdateAvailable(true);
        return;
      }

      // Listen for new service worker installing
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });

    // Detect controller change (new SW activated) and reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  function applyUpdate() {
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.waiting?.postMessage('SKIP_WAITING');
    });
  }

  return { updateAvailable, applyUpdate };
}
