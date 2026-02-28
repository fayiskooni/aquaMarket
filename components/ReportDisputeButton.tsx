"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Flag } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ReportDisputeButtonProps {
  requestId: string;
  providerName?: string;
  isProvider?: boolean;
}

export function ReportDisputeButton({ requestId, providerName, isProvider }: ReportDisputeButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the report.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/requests/${requestId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast.success("Dispute raised. Admin will review this shortly.");
        setOpen(false);
        setReason("");
        router.refresh();
      } else {
        const errorData = await response.text();
        toast.error(errorData || "Failed to raise dispute");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:bg-red-50 transition-all rounded-xl">
          <Flag className="h-3 w-3" />
          Report {isProvider ? "Customer" : "Provider"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl p-8 bg-white/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-4 animate-pulse">
            <AlertCircle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-black text-gray-900 leading-tight">Raise a Dispute</DialogTitle>
          <DialogDescription className="text-gray-500 font-medium lowercase italic first-letter:uppercase tracking-tight mt-2">
            Briefly explain the issue with {isProvider ? "this customer's" : "your delivery from " + providerName}. Admins will investigate and take any necessary actions.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <Textarea
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
            placeholder="e.g., Water quality issue, delayed delivery, provider behavior..."
            className="min-h-[120px] rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-red-500/20 focus:border-red-500 resize-none font-medium text-sm placeholder:text-gray-300 transition-all"
          />
        </div>
        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="ghost" className="rounded-2xl font-black uppercase text-[11px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-12 px-6" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="rounded-2xl font-black uppercase text-[11px] tracking-widest bg-red-600 hover:bg-red-700 text-white h-12 px-8 shadow-xl shadow-red-500/20 transition-all active:scale-95"
          >
            {isSubmitting ? "Processing..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
