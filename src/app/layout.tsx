import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { clsx } from "clsx";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Budget App",
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
            <body className={clsx(inter.className, "min-h-screen bg-background font-sans antialiased")}>
                <Providers>
                    <SettingsProvider>
                        {children}
                    </SettingsProvider>
                </Providers>
            </body>
        </html>
    );
}
