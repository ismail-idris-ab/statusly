import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { ensureStatusAccess } from '@/native/StatusAccessModule';

type Target = '/status' | '/onboarding';

/**
 * Splash gate (S0). Checks the (still-valid) WhatsApp folder grant and routes:
 * granted → Status, otherwise → Onboarding (Doc 03). The native splash stays
 * visible until the decision is made, so there is no intermediate flash.
 */
export default function Index() {
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      let granted = false;
      try {
        granted = await ensureStatusAccess('whatsapp');
      } catch {
        granted = false;
      }
      if (!active) {
        return;
      }
      setTarget(granted ? '/status' : '/onboarding');
      await SplashScreen.hideAsync().catch(() => undefined);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!target) {
    return null; // native splash remains visible
  }
  return <Redirect href={target} />;
}
