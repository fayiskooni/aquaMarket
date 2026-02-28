"use client";

import { MoreHorizontal, FileText, CheckCircle2, Truck, Clock } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RequestStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface JobActionMenuProps {
  jobId: string;
  currentStatus: string;
}

export function JobActionMenu({ jobId, currentStatus }: JobActionMenuProps) {
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const handleStatusUpdate = async (newStatus: RequestStatus) => {
    if (newStatus === currentStatus) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`/api/provider/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Job status updated to ${newStatus}`);
      router.refresh();
    } catch (error) {
      toast.error("Error updating job status");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  if (currentStatus === RequestStatus.COMPLETED || currentStatus === RequestStatus.CANCELLED) {
    return (
      <div className="px-2 py-1 text-[10px] font-black uppercase text-gray-300 tracking-widest border border-dashed rounded-lg">
        {currentStatus} Entry
      </div>
    );
  }

  const isNextStatus = (status: RequestStatus) => {
    if (currentStatus === RequestStatus.ASSIGNED || currentStatus === RequestStatus.APPROVED) {
      return status === RequestStatus.IN_TRANSIT;
    }
    if (currentStatus === RequestStatus.IN_TRANSIT) {
      return status === RequestStatus.DELIVERED;
    }
    if (currentStatus === RequestStatus.DELIVERED) {
      return status === RequestStatus.COMPLETED;
    }
    return false;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-blue-100/50 rounded-2xl transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-blue-100 flex items-center justify-center">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 glassmorphism border-blue-100/50 shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] rounded-[2rem] p-3 backdrop-blur-2xl bg-white/95">
        <DropdownMenuLabel className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] px-4 py-3 mb-1 border-b border-gray-50/50">Next Delivery Phase</DropdownMenuLabel>
        
        <div className="space-y-1 mt-2">
          <DropdownMenuItem 
            onClick={() => handleStatusUpdate(RequestStatus.IN_TRANSIT)}
            disabled={updating || !isNextStatus(RequestStatus.IN_TRANSIT)}
            className={cn(
              "rounded-2xl flex items-center gap-4 px-4 py-3 text-sm font-black transition-all cursor-pointer",
              isNextStatus(RequestStatus.IN_TRANSIT) 
                ? "bg-orange-50/50 text-orange-700 hover:bg-orange-100/80 focus:bg-orange-100/80" 
                : "opacity-30 grayscale cursor-not-allowed hidden"
            )}
          >
            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
               <Truck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span>Start Delivery</span>
              <span className="text-[10px] opacity-60 uppercase tracking-tighter">Mark as In Transit</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleStatusUpdate(RequestStatus.DELIVERED)}
            disabled={updating || !isNextStatus(RequestStatus.DELIVERED)}
            className={cn(
              "rounded-2xl flex items-center gap-4 px-4 py-3 text-sm font-black transition-all cursor-pointer",
              isNextStatus(RequestStatus.DELIVERED) 
                ? "bg-green-50/50 text-green-700 hover:bg-green-100/80 focus:bg-green-100/80 ring-2 ring-green-100/50" 
                : "opacity-30 grayscale cursor-not-allowed hidden"
            )}
          >
            <div className="h-10 w-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shadow-inner">
               <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span>Finish Drop-off</span>
              <span className="text-[10px] opacity-60 uppercase tracking-tighter">Mark as Delivered</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleStatusUpdate(RequestStatus.COMPLETED)}
            disabled={updating || !isNextStatus(RequestStatus.COMPLETED)}
            className={cn(
              "rounded-2xl flex items-center gap-4 px-4 py-3 text-sm font-black transition-all cursor-pointer",
              isNextStatus(RequestStatus.COMPLETED) 
                ? "bg-blue-50/50 text-blue-700 hover:bg-blue-100/80 focus:bg-blue-100/80" 
                : "opacity-30 grayscale cursor-not-allowed hidden"
            )}
          >
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
               <Clock className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span>Close Entry</span>
              <span className="text-[10px] opacity-60 uppercase tracking-tighter">Mark as Completed</span>
            </div>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-gray-100/50 my-2 mx-2" />
        <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest pb-2 opacity-50 px-4">
          Status history cannot be reversed
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
