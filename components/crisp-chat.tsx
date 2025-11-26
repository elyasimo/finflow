'use client';

import { useEffect } from 'react';
import { Crisp } from 'crisp-sdk-web';

export default function CrispChat() {
  useEffect(() => {
    // Initialize Crisp
    // WICHTIG: Nach der Registrierung bei Crisp.chat die Website ID hier eintragen
    const CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID || 'YOUR_CRISP_WEBSITE_ID';
    
    if (CRISP_WEBSITE_ID && CRISP_WEBSITE_ID !== 'YOUR_CRISP_WEBSITE_ID') {
      Crisp.configure(CRISP_WEBSITE_ID);
      
      // Optional: Set user information if available
      // const user = useAuth().user;
      // if (user) {
      //   Crisp.user.setEmail(user.email);
      //   Crisp.user.setNickname(user.fullName || user.email);
      // }
    }
  }, []);

  return null;
}
