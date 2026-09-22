/**
 * App shell — design.md §4.
 * Navy damask desktop backdrop + centered phone-shell column (max-w 480px;
 * on md+ the shell floats as a rounded "phone card"). Renders the sticky
 * Navbar (normal flow — pages need no offset bookkeeping), the routed page
 * via <Outlet/>, the Footer, and the fixed BottomTabBar.
 */
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import Lenis from "lenis";
import Navbar from "@/components/Navbar";
import BottomTabBar from "@/components/BottomTabBar";
import Footer from "@/components/Footer";

export default function Layout() {
  const { pathname } = useLocation();

  // Reset scroll on route change.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  // Lenis smooth scroll on non-touch (desktop) only — design.md §5.
  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || reduced) return;
    const lenis = new Lenis({ lerp: 0.12 });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="desktop-damask min-h-[100dvh] md:py-8">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col overflow-x-clip bg-navy-950 shadow-2xl md:min-h-[calc(100dvh-4rem)] md:rounded-[2rem] md:border md:border-navy-800">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <BottomTabBar />
      </div>
    </div>
  );
}
