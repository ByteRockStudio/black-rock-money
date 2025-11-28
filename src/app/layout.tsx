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
};

import { Providers } from "@/components/Providers";
import { SettingsProvider } from "@/contexts/SettingsContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={clsx(inter.variable, hardRock.variable, "min-h-screen bg-background font-sans antialiased")}>
                <Providers>
                    <SettingsProvider>
                        {children}
                    </SettingsProvider>
                </Providers>
            </body>
        </html>
    );
}
