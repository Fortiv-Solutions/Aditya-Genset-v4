import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, Home, Box, LogOut, UserCircle, Monitor } from "lucide-react";

import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/brand/logo.png";

const links = [
  { to: "/", label: "Welcome", icon: Home },
  { to: "/products", label: "Products", icon: Box },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { user, profile, signOut } = useAuth();
  const [isPresentMode, setIsPresentMode] = useState(false);

  const accountLabel = profile?.full_name || user?.email || "Account";

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const allLinks = [...links];

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Listen for ESC key to exit present mode
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPresentMode(false);
        document.body.classList.remove("present-mode");
        window.dispatchEvent(new CustomEvent("presentModeChange", { detail: false }));
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const togglePresentMode = () => {
    const newValue = !isPresentMode;
    setIsPresentMode(newValue);
    if (newValue) {
      document.body.classList.add("present-mode");
      toast.info("Entering Presentation Mode. Press ESC to exit.");
    } else {
      document.body.classList.remove("present-mode");
    }
    
    // Dispatch event for other components (like ScrollStory) to listen
    window.dispatchEvent(new CustomEvent("presentModeChange", { detail: newValue }));
  };


  return (
    <>
      {/* Desktop & Mobile Independent Logo (Top Left) */}
      <div className="fixed top-0 left-0 z-50">
        <Link to="/" className="group inline-block rounded-br-lg bg-brand-warm-gray/80 backdrop-blur-md px-3 py-2 shadow-sm border-r border-b border-white/20 transition-all duration-300 hover:bg-white/90 hover:shadow-md">
          <img
            src={logo}
            alt="Aditya"
            className="h-8 w-auto mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
      </div>

      {/* Account Control & Logout (Top Right) */}
      <div className="fixed right-4 top-4 z-50">
        <button
          onClick={handleLogout}
          title="Logout"
          className="group flex h-9 max-w-[220px] items-center gap-2 rounded-full border border-border bg-brand-warm-gray/80 px-3 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-foreground hover:shadow-md"
        >
          <UserCircle size={15} className="shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
          <span className="max-w-[130px] truncate hidden sm:inline-block">{accountLabel}</span>
          <LogOut size={14} className="shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
        </button>
      </div>
    </>
  );
}

export default Navbar;
