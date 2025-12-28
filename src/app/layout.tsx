import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { clsx } from "clsx";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const hardRock = localFont({
    src: "./fonts/HardRock.ttf",
    variable: "--font-hard-rock",
});

export const metadata: Metadata = {
    title: "CIA | Dashboard",
    description: "Personal Finance Intelligence",
    icons: {
        icon: "/favicon/favicon.ico",
        apple: "/favicon/apple-touch-icon.png",
    },
    manifest: "/favicon/site.webmanifest",
};

import { Providers } from "@/components/Providers";
import { SettingsProvider } from "@/contexts/SettingsContext";

import { Toaster } from "sonner";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="min-h-full">
            <body className={clsx(inter.variable, hardRock.variable, "min-h-full font-sans antialiased bg-zinc-100 dark:bg-[#111111] text-zinc-900 dark:text-zinc-100")}>

                <Providers>
                    <SettingsProvider>
                        {children}
                        <Toaster position="top-center" richColors />
                    </SettingsProvider>
                </Providers>
            </body>
        </html>
    );
}
