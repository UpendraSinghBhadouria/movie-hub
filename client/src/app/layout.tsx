import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Footer } from "@/components/Footer";
import { LocationProvider } from "@/components/providers/LocationProvider";
import Providers from "@/components/providers/QueryClientProvider";
import { SeatProvider } from "@/components/providers/SeatProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MovieHub",
  description: "Book movies, events, plays and more",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <AuthProvider>
            <ThemeProvider>
              <LocationProvider>
                <SeatProvider>
                  <Navbar />
                  {children}
                  <Footer />
                </SeatProvider>
              </LocationProvider>
            </ThemeProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
