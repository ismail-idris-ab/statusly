import { forwardRef } from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Rect,
  Stop,
  Text as SvgText,
  TSpan,
} from 'react-native-svg';

import { gradientFor } from '@/features/quotes/bgStyles';
import type { Quote } from '@/db/types';

type QuoteCardProps = {
  quote: Quote;
  size: number;
};

/** Greedy word-wrap into at most `maxChars`-wide lines. */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

/**
 * A quote status card rendered entirely in SVG (gradient + wrapped text) so the
 * same component works both for display and for exporting a shareable PNG via
 * the Svg ref's `toDataURL`.
 */
export const QuoteCard = forwardRef<Svg, QuoteCardProps>(function QuoteCard(
  { quote, size },
  ref,
) {
  const [top, bottom] = gradientFor(quote.bgStyle);
  const fontSize = size / 15;
  const lineHeight = fontSize * 1.35;
  const lines = wrapText(quote.text, 24);
  const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2;

  return (
    <Svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={size} height={size} rx={size * 0.06} fill="url(#bg)" />
      <SvgText
        x={size / 2}
        y={startY}
        fill="#FFFFFF"
        fontSize={fontSize}
        fontWeight="700"
        textAnchor="middle"
      >
        {lines.map((line, i) => (
          <TSpan key={i} x={size / 2} dy={i === 0 ? 0 : lineHeight}>
            {line}
          </TSpan>
        ))}
      </SvgText>
      <SvgText
        x={size / 2}
        y={size - size * 0.06}
        fill="rgba(255,255,255,0.7)"
        fontSize={fontSize * 0.5}
        textAnchor="middle"
      >
        Statusly
      </SvgText>
    </Svg>
  );
});
