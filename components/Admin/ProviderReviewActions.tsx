"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Ban, Info, User, Mail, Phone, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ProviderData = {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
  verificationStatus: string;
  location?: string | null;
};

export function ProviderReviewActions({ provider }: { provider: ProviderData }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAction = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/providers/${provider.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Provider status updated to ${status}`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setOpen(true)}
          className="h-8 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium transition-all duration-200 border border-transparent hover:border-blue-100"
        >
          <Info className="h-4 w-4 mr-1.5" />
          Review
        </Button>
        <div className="h-4 w-px bg-gray-100 mx-0.5" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleAction("SUSPENDED")}
          disabled={loading || provider.verificationStatus === "SUSPENDED"}
          className="h-8 px-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
          title="Block Provider"
        >
          <Ban className="h-4 w-4 group-hover:scale-110 transition-transform" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="h-20 w-20 bg-white rounded-2xl p-1 shadow-lg ring-4 ring-white">
                <div className="h-full w-full bg-blue-50 rounded-xl flex items-center justify-center">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 right-6">
              <Badge 
                variant="outline" 
                className={`px-3 py-1 text-xs font-bold capitalize bg-white shadow-sm border-2 ${
                  provider.verificationStatus === 'APPROVED' ? 'border-green-200 text-green-700' :
                  provider.verificationStatus === 'REJECTED' || provider.verificationStatus === 'SUSPENDED' ? 'border-red-200 text-red-700' :
                  'border-orange-200 text-orange-700'
                }`}
              >
                {provider.verificationStatus.toLowerCase().replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <div className="pt-14 px-6 pb-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">{provider.name || "Service Provider"}</h2>
              <p className="text-sm text-gray-500 font-medium">{provider.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">Contact</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{provider.phone || "---"}</p>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">Base Location</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">{provider.location || "Not Set"}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100 h-11 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => handleAction("APPROVED")}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Provider
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-11 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => handleAction("REJECTED")}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
              <p className="text-[10px] text-center text-gray-400 italic mt-2">
                Last activity: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
