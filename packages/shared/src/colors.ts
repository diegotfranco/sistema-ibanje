export const brandColors = {
  primary: { oklch: 'oklch(0.44 0.11 240.79)', hex: '#005889' },
  primarySoftLight: { oklch: 'oklch(0.44 0.11 240.79)', hex: '#005889' },
  primarySoftDark: { oklch: 'oklch(0.707 0.165 254.624)', hex: '#51a2ff' },
  primaryForeground: { oklch: 'oklch(0.97 0.014 254.604)', hex: '#eff6ff' }
} as const;

export type BrandColorKey = keyof typeof brandColors;
