'use client';

import { useEffect } from 'react';

// This component injects the official Crisp chat script on the client only.
// We avoid importing any server-side package so Next.js won't try to resolve
// the module during SSR/build time (resolves the "Module not found" build error).
export default function CrispChat() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID || 'YOUR_CRISP_WEBSITE_ID';
    if (!WEBSITE_ID || WEBSITE_ID === 'YOUR_CRISP_WEBSITE_ID') return;

    // Avoid injecting multiple times
    if ((window as any).$crisp) return;

    (window as any).$crisp = [];
    (window as any).CRISP_WEBSITE_ID = WEBSITE_ID;

    const d = document;
    const s = d.createElement('script');
    s.src = 'https://client.crisp.chat/l.js';
    s.async = true;
    s.defer = true;
    s.setAttribute('data-website-id', WEBSITE_ID);
    d.head.appendChild(s);

    // Optional: expose helper to open chat programmatically
    (window as any).openCrispChat = () => {
      try {
        if (!(window as any).$crisp) return;
        (window as any).$crisp.push(['do', 'chat:open']);
      } catch (e) {
        // ignore
      }
    };

    return () => {
      // cleanup: remove script and window globals if needed
      const existing = d.querySelector('script[src="https://client.crisp.chat/l.js"]');
      if (existing) existing.remove();
      try {
        delete (window as any).$crisp;
        delete (window as any).CRISP_WEBSITE_ID;
        delete (window as any).openCrispChat;
      } catch (e) {}
    };
  }, []);

  return null;
}
