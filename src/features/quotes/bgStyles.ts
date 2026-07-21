/** Maps a quote's `bg_style` token to a [top, bottom] gradient pair. */
export const BG_GRADIENTS: Record<string, [string, string]> = {
  emerald: ['#14B88C', '#0A6E55'],
  forest: ['#0E8F6E', '#0A5A44'],
  sunset: ['#FB923C', '#EF4444'],
  coral: ['#FB7185', '#E11D48'],
  ocean: ['#38BDF8', '#2563EB'],
  grape: ['#A78BFA', '#6D28D9'],
  noir: ['#374151', '#0B1411'],
  mint: ['#3DE38B', '#14B88C'],
};

const FALLBACK: [string, string] = ['#14B88C', '#0A6E55'];

export function gradientFor(style: string): [string, string] {
  return BG_GRADIENTS[style] ?? FALLBACK;
}
