import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

/**
 * Typography system.
 *
 * - `serif` (Fraunces) — editorial display face for headings and pull quotes.
 *   Optical sizing gives it a soft, literary character at large sizes.
 * - `sans` (Inter) — body copy and UI. Neutral and highly legible at small sizes.
 * - `mono` (JetBrains Mono) — code blocks inside long-form content.
 */
export const fontSerif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
  weight: "variable",
});

export const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const fontVariables = `${fontSerif.variable} ${fontSans.variable} ${fontMono.variable}`;
