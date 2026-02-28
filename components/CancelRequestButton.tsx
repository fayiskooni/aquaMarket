"use client";

import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

interface CancelRequestButtonProps {
  requestId: string;
}

export function CancelRequestButton({ requestId }: CancelRequestButtonProps) {
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/user/requests/${requestId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel request");
      }

      toast.success("Request cancelled successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error cancelling request");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-2 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all rounded-lg font-black uppercase text-[10px] tracking-widest"
        >
          <XCircle className="h-3 w-3" />
          Cancel Order
        </Button>
      </DialogTrigger>
      <DialogContent className="glassmorphism border-red-50 rounded-3xl p-8 max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Cancel Water Request?</DialogTitle>
          <DialogDescription className="text-gray-500 font-medium leading-relaxed">
            Are you sure you want to cancel this request? This action cannot be undone. 
            Orders that are already out for delivery cannot be cancelled.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-8 gap-3 sm:gap-0">
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-gray-100">
              Go Back
            </Button>
          </DialogClose>
          <Button 
            onClick={handleCancel}
            disabled={cancelling}
            className="bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] px-8 shadow-xl shadow-red-500/20 py-6"
          >
            {cancelling ? "Processing..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
