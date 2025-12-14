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
    title: "Rock Money",
    description: "Minimalist Expense Tracker",
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
        <html lang="en" className="h-full w-full overflow-hidden">
            <body className={clsx(inter.variable, hardRock.variable, "h-full w-full overflow-hidden font-sans antialiased bg-stone-100 dark:bg-zinc-950 text-zinc-900 dark:text-white")}>
                {/* Minimalist Grid Background - Light/Dark adaptable */}
                <div className="fixed inset-0 -z-10 h-full w-full 
                    bg-stone-100 dark:bg-zinc-950 
                    bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] 
                    dark:bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] 
                    bg-[size:32px_32px]" />

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
