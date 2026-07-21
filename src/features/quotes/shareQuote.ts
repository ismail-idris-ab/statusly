import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

/**
 * Writes a base64 PNG (from a QuoteCard's `Svg.toDataURL`) to app cache and
 * opens the share sheet so the user can post the card to their status.
 */
export async function shareQuoteImage(base64: string): Promise<void> {
  const path = `${FileSystem.cacheDirectory}quote_${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: 'image/png',
      dialogTitle: 'Share quote',
    });
  }
}
