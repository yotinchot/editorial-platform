import {
  Cormorant_Garamond,
  Inter,
  JetBrains_Mono,
  Kanit,
  Noto_Sans_Thai,
  Noto_Serif_Thai,
} from "next/font/google";

export const fontSerif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Thai fallback fonts — cascade after Latin faces so Thai characters render
// with appropriate letterforms and generous x-height for long-form reading.
export const fontSerifThai = Noto_Serif_Thai({
  variable: "--font-serif-thai",
  subsets: ["thai"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const fontSansThai = Noto_Sans_Thai({
  variable: "--font-sans-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const fontKanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["500", "600"],
  display: "swap",
});

export const fontVariables = `${fontSerif.variable} ${fontSans.variable} ${fontMono.variable} ${fontSerifThai.variable} ${fontSansThai.variable} ${fontKanit.variable}`;
