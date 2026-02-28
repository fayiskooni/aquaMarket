"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AcceptJobButtonProps {
  requestId: string;
}

export function AcceptJobButton({ requestId }: AcceptJobButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/requests/${requestId}/accept`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept request");
      }

      toast.success("Job accepted successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      size="sm" 
      onClick={handleAccept} 
      disabled={loading}
    >
      {loading ? "Accepting..." : "Accept Job"}
    </Button>
  );
}
