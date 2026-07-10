import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Yifei Labs | 职业匹配与能力诊断",
  description:
    "基于简历的智能岗位匹配与目标岗位市场差距分析，帮助求职者明确投递优先级与能力补齐方向。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07080f" },
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('yl-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full overflow-x-clip bg-[var(--yl-bg)] text-[var(--yl-text)]">
        <ThemeProvider>
          <ToastProvider>
            <div className="flex min-h-screen min-w-0 flex-col bg-[var(--yl-bg)] text-[var(--yl-text)]">
              <Navbar />
              <main className="min-w-0 flex-1">{children}</main>
              <Footer />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
