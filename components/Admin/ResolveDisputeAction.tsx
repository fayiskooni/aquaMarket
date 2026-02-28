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
import { CheckCircle, XCircle, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface ResolveDisputeActionProps {
  disputeId: string;
  requestId: string;
}

export function ResolveDisputeAction({ disputeId, requestId }: ResolveDisputeActionProps) {
  const [open, setOpen] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState<"RESOLVED" | "REJECTED" | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAction = async () => {
    if (!resolutionStatus) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: resolutionStatus, resolutionNote: note }),
      });

      if (response.ok) {
        toast.success(`Dispute marked as ${resolutionStatus.toLowerCase()}.`);
        setOpen(false);
        setNote("");
        router.refresh();
      } else {
        toast.error("Failed to update dispute.");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResolveDialog = (status: "RESOLVED" | "REJECTED") => {
    setResolutionStatus(status);
    setOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-gray-100 transition-colors">
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 bg-white ring-1 ring-black/5">
          <DropdownMenuItem 
            onClick={() => openResolveDialog("RESOLVED")}
            className="flex items-center gap-2 rounded-xl py-2.5 px-3 text-xs font-black uppercase tracking-widest text-green-600 hover:bg-green-50 transition-all cursor-pointer"
          >
            <CheckCircle className="h-4 w-4" />
            Resolve
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => openResolveDialog("REJECTED")}
            className="flex items-center gap-2 rounded-xl py-2.5 px-3 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all cursor-pointer"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl p-8 bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <div className={`h-12 w-12 ${resolutionStatus === 'RESOLVED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-2xl flex items-center justify-center mb-4`}>
              {resolutionStatus === 'RESOLVED' ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            </div>
            <DialogTitle className="text-2xl font-black text-gray-900 leading-tight">
              {resolutionStatus === 'RESOLVED' ? "Resolve Dispute" : "Reject Dispute"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium lowercase italic first-letter:uppercase tracking-tight mt-2">
              Add an optional note to explain your decision to the involved parties.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal resolution note/reason for closing..."
              className="min-h-[100px] rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-medium text-sm placeholder:text-gray-300 transition-all"
            />
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" className="rounded-2xl font-black uppercase text-[11px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-12 px-6" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={isSubmitting} 
              className={`rounded-2xl font-black uppercase text-[11px] tracking-widest ${resolutionStatus === 'RESOLVED' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'} text-white h-12 px-8 shadow-xl transition-all active:scale-95`}
            >
              {isSubmitting ? "Updating..." : "Confirm Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
