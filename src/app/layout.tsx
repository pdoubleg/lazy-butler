import type { Metadata } from "next";
import { Suspense } from "react";

import AppNavbar from "@/app/components/app-navbar";
import Providers from "@/app/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoComps-GPT",
  description: "Find it yourself",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💲</text></svg>"
        />
      </head>
      <body className="h-screen w-screen bg-white dark:bg-gray-900 text-black dark:text-white">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <AppNavbar />
            <main className="flex-grow overflow-auto bg-[url(/light-bg.svg)] dark:bg-[url(/dark-bg.svg)] bg-cover">
            <Suspense>{children}</Suspense>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}