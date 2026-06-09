import path from 'node:path';
import { createRequire } from 'node:module';
import { Font } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import { brandColors } from '@sistema-ibanje/shared/colors';

// Resolve each @fontsource package independently rather than via a hardcoded relative
// path: the dev server runs from source (tsx) while prod runs from dist/, so a fixed
// `../..` chain points at the wrong depth in one of them. Resolving per-package also
// works under pnpm, where @fontsource/roboto and @fontsource/noto-sans live in separate
// isolated stores (not as siblings under one @fontsource dir).
const require = createRequire(import.meta.url);
const ROBOTO_DIR = path.dirname(require.resolve('@fontsource/roboto/package.json'));
const NOTO_DIR = path.dirname(require.resolve('@fontsource/noto-sans/package.json'));

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

// Registered once for the whole process. Every PDF template imports `tw` from here
// instead of re-registering its own fonts and rebuilding its own createTw config.
Font.register({
  family: 'Roboto',
  fonts: WEIGHTS.map((w) => ({
    src: path.join(ROBOTO_DIR, 'files', `roboto-latin-${w}-normal.woff`),
    fontWeight: w
  }))
});

Font.register({
  family: 'NotoSans',
  fonts: WEIGHTS.map((w) => ({
    src: path.join(NOTO_DIR, 'files', `noto-sans-latin-${w}-normal.woff`),
    fontWeight: w
  }))
});

export const tw = createTw({
  colors: {
    brand: {
      primary: brandColors.primary.hex,
      soft: brandColors.primarySoftLight.hex,
      fg: brandColors.primaryForeground.hex
    } as unknown as Record<number, string>
  },
  fontFamily: {
    roboto: ['Roboto'],
    noto: ['NotoSans']
  }
});
