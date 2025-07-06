import { Outlet } from "react-router";
import { Sparkles } from "lucide-react";
import Logo from "../ui/logo";

export default function MainLayout() {
  return (
    <div className="min-h-screen text-foreground">
      {/* Modern Header with Glass Effect */}
      <nav className="relative border-b border-foreground/10 dark:border-foreground/10">
        <div className="relative z-10 container mx-auto flex h-20 items-center justify-between px-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <Logo />
            <div className="flex flex-col">
              <span className="text-2xl font-bold gradient-text dark:gradient-text-dark">
                Stable Diffusion UI
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Open Source AI-Powered Image Generation UI
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Ready
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative">
        <Outlet />
      </main>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-indigo-400/20 to-cyan-400/20 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
}
