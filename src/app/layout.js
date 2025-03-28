// SPDX-License-Identifier: BSD-3-Clause
/*
 * NXUI - A User interface for NX500 devices and other NexGen Tools products.
 * Developed for NexGen Tools LLC
 * Source Code: https://github.com/hoogmin/nexgentoolsnxui
 * 
 * Copyright (c) 2025 Javier Martinez
*/

import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto"
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-roboto-mono"
});

export const metadata = {
  title: "NexGen Tools NX Control Panel",
  description: "NX user interface for safe-locksmith.com devices.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${robotoMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
