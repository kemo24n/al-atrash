import type { Metadata, Viewport } from "next";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/900.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "الأطرش أونلاين · كل مستلزمات البيت لباب بيتك", template: "%s | الأطرش" },
  description: "سلسلة محلات الأطرش بحلب: اطلب أونلاين والتوصيل مجاني لكل المناطق. شيبسات، مشروبات، قهوة، ألبان، منظفات وكل أغراض البيت.",
  applicationName: "الأطرش",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/brand/mark.svg", apple: "/brand/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "الأطرش", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#FFD21F", width: "device-width", initialScale: 1, maximumScale: 5 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
