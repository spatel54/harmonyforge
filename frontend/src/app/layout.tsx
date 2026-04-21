import {
  Inter,
  Instrument_Serif,
  Fraunces,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";
import { buildRootMetadata } from "@/lib/siteMeta";
import { ThemeProvider } from "@/components/atoms/ThemeProvider";
import { StudySessionProvider } from "@/components/study/StudySessionProvider";
import { StudyConsentGate } from "@/components/study/StudyConsentGate";
import { NonBlockingFontshareLink } from "@/components/atoms/NonBlockingFontshareLink";
import { CoachmarkOverlayLazy } from "@/components/organisms/CoachmarkOverlayLazy";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
});
const fraunces = Fraunces({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-fraunces",
});
const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

export const metadata = buildRootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${fraunces.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased overflow-hidden w-screen h-screen"
        suppressHydrationWarning
      >
        <NonBlockingFontshareLink />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <StudySessionProvider>
            <StudyConsentGate>
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <main id="main-content" className="w-full h-full relative">
                {children}
              </main>
              <CoachmarkOverlayLazy />
            </StudyConsentGate>
          </StudySessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
