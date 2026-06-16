import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Credentia",
  description: "Personal finance tracking app"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('credentia-theme')||'light';var d=document.documentElement;var b=document.body;d.dataset.theme=t;d.classList.toggle('theme-dark',t==='dark');d.classList.toggle('theme-light',t==='light');d.style.colorScheme=t;if(b){b.dataset.theme=t;b.classList.toggle('theme-dark',t==='dark');b.classList.toggle('theme-light',t==='light');}}catch(e){}"
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
