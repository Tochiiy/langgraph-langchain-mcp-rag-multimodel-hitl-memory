// import type { Metadata } from "next";

"use client"; // 👈 this makes it a Client Component

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from 'next-themes'

import { Provider } from "react-redux";

import { store } from "@/stores";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?
  family=Slabo+13px&
  family=Roboto+Slab:wght@300;400;500&
  family=Inconsolata:wght@400;600&
  family=Ubuntu+Mono:wght@400;700&
  display=swap"
          rel="stylesheet"
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >



        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >

          <Provider store={store}>
            {children}
          </Provider>
        </ThemeProvider>

      </body>
    </html>
  );
}
