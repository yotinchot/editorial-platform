import {
  Fraunces,
  Inter,
  JetBrains_Mono,
  Noto_Sans_Thai,
  Noto_Serif_Thai,
} from "next/font/google";

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

export const fontVariables = `${fontSerif.variable} ${fontSans.variable} ${fontMono.variable} ${fontSerifThai.variable} ${fontSansThai.variable}`;
