import { useCallback, useEffect } from 'react';
import { useIAP } from 'react-native-iap';

import { env } from '@/lib/env';
import { useEntitlements } from '@/store/useEntitlements';

const SKU = env.iap.removeAdsSku;

type UseRemoveAds = {
  removedAds: boolean;
  connected: boolean;
  price: string;
  buy: () => Promise<void>;
  restore: () => Promise<void>;
};

/**
 * One-time "Remove Ads" non-consumable purchase (Play Billing) via
 * react-native-iap. Purchase/restore both flip the reactive entitlement so ads
 * disappear immediately.
 */
export function useRemoveAds(): UseRemoveAds {
  const removedAds = useEntitlements((s) => s.removedAds);
  const setRemovedAds = useEntitlements((s) => s.setRemovedAds);

  const {
    connected,
    products,
    availablePurchases,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    getAvailablePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      setRemovedAds(true);
      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch {
        // Non-consumables can be re-finished on the next launch; ignore.
      }
    },
  });

  // Once connected, load the product and any existing (restorable) purchases.
  useEffect(() => {
    if (!connected) {
      return;
    }
    void fetchProducts({ skus: [SKU], type: 'in-app' });
    void getAvailablePurchases();
  }, [connected, fetchProducts, getAvailablePurchases]);

  // Grant entitlement if the user already owns the product (fresh install /
  // reinstall restore).
  useEffect(() => {
    const owned = availablePurchases.some(
      (p) => p.productId === SKU || (p.ids?.includes(SKU) ?? false),
    );
    if (owned) {
      setRemovedAds(true);
    }
  }, [availablePurchases, setRemovedAds]);

  const product = products.find((p) => p.id === SKU) ?? products[0];
  const price = product?.displayPrice ?? '';

  const buy = useCallback(async () => {
    try {
      await requestPurchase({
        request: { google: { skus: [SKU] } },
        type: 'in-app',
      });
    } catch {
      // Surfaced via the store UI; nothing to do here.
    }
  }, [requestPurchase]);

  const restore = useCallback(async () => {
    try {
      await getAvailablePurchases();
    } catch {
      // Ignore — entitlement stays as-is.
    }
  }, [getAvailablePurchases]);

  return { removedAds, connected, price, buy, restore };
}
