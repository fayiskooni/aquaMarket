"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Bell, BellDot, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/components/providers/socket-provider";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X as CloseIcon } from "lucide-react";

type Notification = {
  id: string;
  message: string;
  isRead: boolean;
  type: string | null;
  link: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        fetchNotifications();
      };
      
      socket.on("request-updated", handleUpdate);
      socket.on("request-created", handleUpdate);
      socket.on("provider-verified", handleUpdate);
      socket.on("dispute-updated", handleUpdate);
      
      return () => {
        socket.off("request-updated", handleUpdate);
        socket.off("request-created", handleUpdate);
        socket.off("provider-verified", handleUpdate);
        socket.off("dispute-updated", handleUpdate);
      };
    }
  }, [socket, fetchNotifications]);

  const markAsRead = async () => {
    try {
      if (unreadCount === 0) return;
      
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      
      await fetch("/api/notifications", {
        method: "PATCH",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const removeIndividual = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== id));
    const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error(err);
      fetchNotifications(); // Rollback if error
    }
  };

  const clearNotifications = async () => {
    try {
      if (notifications.length === 0) return;
      
      setIsClearingAll(true);
      
      // Wait for animation delay (matching the sequenced delay)
      setTimeout(() => {
        setNotifications([]);
        setUnreadCount(0);
        setIsClearingAll(false);
      }, notifications.length * 100 + 300);
      
      await fetch("/api/notifications", {
        method: "DELETE",
      });
    } catch (err) {
      console.error(err);
      setIsClearingAll(false);
    }
  };

  const getDisplayCount = () => {
    if (unreadCount === 0) return null;
    const role = session?.user?.role;
    if (role === "CUSTOMER") {
      return unreadCount > 9 ? "9+" : unreadCount;
    }
    // For Provider/Admin use 1-99 then 99+
    return unreadCount > 99 ? "99+" : unreadCount;
  };

  const countDisplay = getDisplayCount();

  return (
    <DropdownMenu onOpenChange={(open) => open && markAsRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full relative bg-background hover:bg-muted/50 transition-all border-none ring-1 ring-gray-200 shadow-sm">
          {unreadCount > 0 ? (
            <BellDot className="h-[18px] w-[18px] text-blue-600 animate-pulse" />
          ) : (
            <Bell className="h-[18px] w-[18px] text-muted-foreground" />
          )}
          {countDisplay && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-fit px-1 min-w-4 flex items-center justify-center rounded-full border-2 border-background shadow-xs">
              {countDisplay}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-hidden flex flex-col p-1 rounded-xl shadow-2xl border-gray-100">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
          <span className="text-gray-900 font-bold">Notifications</span>
          {unreadCount > 0 && <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{unreadCount} New</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 gap-2">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              <p className="text-xs text-muted-foreground animate-pulse">Loading updates...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center space-y-3">
              <div className="p-4 bg-gray-50 rounded-full">
                <Bell className="h-8 w-8 text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">No Notifications</p>
                <p className="text-xs text-muted-foreground mt-1">We'll alert you when something happens.</p>
              </div>
            </div>
          ) : (
            <div className="py-1">
              <AnimatePresence mode="popLayout">
                {notifications.map((n, index) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={isClearingAll ? { 
                      opacity: 0, 
                      x: 200, 
                      transition: { delay: index * 0.1, duration: 0.5, ease: "easeInOut" } 
                    } : { 
                      opacity: 1, 
                      x: 0 
                    }}
                    exit={{ opacity: 0, x: 200, transition: { duration: 0.3 } }}
                    className="relative group pr-8"
                  >
                    <DropdownMenuItem className={cn(
                      "flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg mx-1 transition-colors relative",
                      !n.isRead ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-muted/50"
                    )} asChild>
                      <Link href={n.link || "#"}>
                        <div className="flex justify-between w-full">
                          <span className={cn(
                            "text-[13px] leading-tight flex-1 pr-2",
                            !n.isRead ? "font-semibold text-gray-900" : "text-gray-600"
                          )}>
                            {n.message}
                          </span>
                          {!n.isRead && <div className="h-2 w-2 rounded-full bg-blue-600 mt-1 shrink-0 ml-1" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => removeIndividual(n.id, e)}
                      className="h-6 w-6 absolute right-2 top-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all rounded-full p-0.5 z-10"
                      title="Remove notification"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearNotifications} 
          disabled={notifications.length === 0 || isClearingAll}
          className="w-full text-blue-600 text-xs font-semibold py-2 rounded-lg hover:bg-blue-50 disabled:opacity-50"
        >
          <CheckCheck className="h-3 w-3 mr-2" />
          Clear all
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
