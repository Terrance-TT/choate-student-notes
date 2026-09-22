/**
 * Bottom tab bar — design.md §7.2. Primary navigation: fixed bottom on
 * mobile, vertical rail on the left edge of the phone shell on md+.
 */
import { NavLink, useLocation } from "react-router";
import { motion } from "framer-motion";
import { Home, Sparkles, LayoutGrid, Plus, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Tab {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Elevated gold center-action style. */
  action?: boolean;
}

const TABS: Tab[] = [
  { label: "Home", path: "/", icon: Home },
  { label: "Digest", path: "/digest", icon: Sparkles },
  { label: "Departments", path: "/departments", icon: LayoutGrid },
  { label: "Submit", path: "/submit", icon: Plus, action: true },
  { label: "Settings", path: "/settings", icon: Settings },
];

function isActive(pathname: string, tab: Tab): boolean {
  if (tab.path === "/") return pathname === "/";
  return pathname.startsWith(tab.path);
}

export default function BottomTabBar() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 rounded-t-2xl border-t border-navy-800 bg-navy-900 pb-[env(safe-area-inset-bottom)] md:bottom-auto md:top-1/2 md:left-[calc(50%-240px-4.5rem)] md:w-16 md:translate-x-0 md:-translate-y-1/2 md:rounded-2xl md:border md:pb-0"
    >
      <ul className="flex items-end justify-around px-2 md:flex-col md:items-center md:gap-2 md:px-0 md:py-3">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab);
          const Icon = tab.icon;

          if (tab.action) {
            return (
              <li key={tab.path} className="flex flex-col items-center">
                <NavLink
                  to={tab.path}
                  aria-label={tab.label}
                  title={tab.label}
                  className="group flex -translate-y-3 flex-col items-center md:translate-y-0"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-gold-500/25 transition-transform active:scale-95 ${
                      active ? "bg-gold-400" : "bg-gold-500 group-hover:bg-gold-400"
                    }`}
                  >
                    <Icon className="h-6 w-6 text-navy-950" strokeWidth={2.4} />
                  </span>
                  <span className="meta-label mt-1 hidden text-gold-300 md:hidden min-[380px]:block">
                    {tab.label}
                  </span>
                </NavLink>
              </li>
            );
          }

          return (
            <li key={tab.path} className="flex flex-col items-center">
              <NavLink
                to={tab.path}
                title={tab.label}
                className="relative flex min-h-[56px] w-16 flex-col items-center justify-center gap-1 md:min-h-[52px] md:w-full"
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active ? "text-gold-500" : "text-ivory/50 hover:text-ivory/80"
                  } ${tab.path === "/digest" ? "text-gold-500/90" : ""} ${
                    tab.path === "/digest" && !active ? "opacity-70" : ""
                  }`}
                />
                <span
                  className={`meta-label md:hidden ${
                    active ? "text-gold-500" : "text-ivory/45"
                  }`}
                  style={{ fontSize: "0.5625rem" }}
                >
                  {tab.label}
                </span>
                {active && (
                  <motion.span
                    layoutId="tab-dot"
                    className="absolute -top-[5px] h-1.5 w-1.5 rounded-full bg-gold-500 md:-left-[9px] md:top-1/2 md:-translate-y-1/2"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
