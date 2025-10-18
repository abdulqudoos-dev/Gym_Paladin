import type { Metadata } from "next";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";
import SiteShell from "@/components/SiteShell";
import { ProgressProvider } from "@/contexts/ProgressContext";

export const metadata: Metadata = {
  title: "PALADIN - Transform Your Body",
  description: "Achieve your fitness goals with structured programs and expert coaching",
  icons: {
    icon: "/assets/Fitmaker_logo-removebg-preview.png",
    shortcut: "/assets/Fitmaker_logo-removebg-preview.png",
    apple: "/assets/Fitmaker_logo-removebg-preview.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ProgressProvider>
          <SplashScreen />
          <main className={`min-h-screen relative`}>
            <div className="pointer-events-none fixed inset-0 opacity-[0.04] bg-[radial-gradient(ellipse_at_top,rgba(255,56,56,0.2)_0%,transparent_60%)]" />
            <div className="pointer-events-none fixed inset-0 gym-noise" />
            <SiteShell>
              {children}
            </SiteShell>
          </main>
        </ProgressProvider>
      </body>
    </html>
  );
}
