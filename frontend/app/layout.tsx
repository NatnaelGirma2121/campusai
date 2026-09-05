
import type { Metadata } from "next";

import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

import { AuthProvider } from "@/lib/auth-context";

import { ThemeProvider } from "@/lib/theme-context";

const display = Space_Grotesk({

  subsets: ["latin"],

  variable: "--font-display",

  weight: ["500", "700"],

});

const body = Inter({ subsets: ["latin"], variable: "--font-body" });

const mono = JetBrains_Mono({

  subsets: ["latin"],

  variable: "--font-mono",

  weight: ["400", "500"],

});

export const metadata: Metadata = {

  title: "CampusAI",

  description: "Your personal AI assistant for university life.",

};

// Runs before React hydrates, so the correct theme applies on the very

// first paint — without this, the page would flash dark (the default)

// even for a user whose stored/system preference is light.

const themeInitScript = `

(function() {

  try {

    var stored = localStorage.getItem('campusai_theme');

    var theme = stored === 'light' || stored === 'dark'

      ? stored

      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

    document.documentElement.setAttribute('data-theme', theme);

  } catch (e) {}

})();

`;

export default function RootLayout({

  children,

}: {

  children: React.ReactNode;

}) {

  return (

    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>

      <head>

        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

      </head>

      <body className="font-body">

        <ThemeProvider>

          <AuthProvider>{children}</AuthProvider>

        </ThemeProvider>

      </body>

    </html>

  );

}

