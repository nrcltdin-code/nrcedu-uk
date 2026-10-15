import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AuthDrawerProvider } from "@/components/auth/auth-drawer";
import { googleEnabled } from "@/lib/auth";
import { emailEnabled } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NRC Educational Consultants",
    template: "%s | NRC Educational Consultants",
  },
  description:
    "Study abroad and student visa consultancy: university admissions, applications and visa support.",
  openGraph: {
    type: "website",
    siteName: "NRC Educational Consultants",
    locale: "en_GB",
    images: ["/nrc-logo.jpeg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthDrawerProvider googleEnabled={googleEnabled} resetEnabled={emailEnabled}>{children}</AuthDrawerProvider>
      </body>
    </html>
  );
}
