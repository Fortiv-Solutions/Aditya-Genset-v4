import { ReactNode } from "react";
import { Navbar } from "@/components/site/Navbar";
import { useLocation } from "react-router-dom";

import { DemoModeBanner } from "./DemoModeBanner";

export function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isLoginPage = pathname === "/login";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isLoginPage && <DemoModeBanner />}
      {!isLoginPage && <Navbar />}
      <main className={isLoginPage ? "" : ""}>
        {children}
      </main>
    </div>
  );
}
