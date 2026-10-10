import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastContainerWrapper } from './components/notifications';
import { SwRegister } from "./components/SwRegister";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Markdown Converter",
    description: "A powerful markdown editor and converter with offline support",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "MD Editor",
    },
    icons: {
        icon: "/favicon.ico",
    }
};

export const viewport = {
    width: "device-width",
    initialScale: 1
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Monaco loads from CDN at runtime (deliberate: bundling adds ~10MB, see M6) */}
                <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ThemeProvider>
                    {children}
                    <ToastContainerWrapper />
                    <SwRegister />
                </ThemeProvider>
            </body>
        </html>
    );
}
