"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Droplets, 
  History, 
  Settings, 
  Users, 
  FileText, 
  AlertCircle 
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const links = {
    CUSTOMER: [
      { name: "Dashboard", href: "/dashboard/user", icon: LayoutDashboard },
      { name: "New Request", href: "/dashboard/user/requests/new", icon: Droplets },
      { name: "My Requests", href: "/dashboard/user/requests", icon: History },
      { name: "Disputes", href: "/dashboard/user/disputes", icon: AlertCircle },
    ],
    PROVIDER: [
      { name: "Dashboard", href: "/dashboard/provider", icon: LayoutDashboard },
      { name: "Active Jobs", href: "/dashboard/provider/jobs", icon: Droplets },
      { name: "Earnings", href: "/dashboard/provider/earnings", icon: FileText },
      { name: "Profile", href: "/dashboard/provider/profile", icon: Settings },
    ],
    ADMIN: [
      { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      { name: "Providers", href: "/dashboard/admin/providers", icon: Users },
      { name: "Transactions", href: "/dashboard/admin/transactions", icon: FileText },
      { name: "Disputes", href: "/dashboard/admin/disputes", icon: AlertCircle },
    ],
  };

  const navLinks = role ? links[role as keyof typeof links] || [] : [];

  return (
    <div className="flex min-h-screen w-64 flex-col border-r bg-muted/20 flex-shrink-0">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Droplets className="h-6 w-6 text-blue-600" />
          <span className="text-lg">AquaMarket</span>
        </Link>
      </div>
      <div className="flex-1 py-4">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isActive ? "bg-muted text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
