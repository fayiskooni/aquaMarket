"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Droplets, Info, X } from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket } = useSocket();
  const initialProviderId = searchParams.get("providerId") || "broadcast";
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<any[]>([]);
  const [currentProviderId, setCurrentProviderId] = useState(initialProviderId);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch("/api/providers");
        if (res.ok) {
          const data = await res.json();
          setProviders(data);
        }
      } catch (err) {
        console.error("Failed to fetch providers", err);
      }
    };
    fetchProviders();
  }, []);

  // Update current provider ID if search params change (e.g. initial load)
  useEffect(() => {
    if (searchParams.get("providerId")) {
      setCurrentProviderId(searchParams.get("providerId") as string);
    }
  }, [searchParams]);

  const selectedProvider = providers.find(p => p.id === currentProviderId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const quantity = Number(formData.get("quantity"));
    const requestedBudget = Number(formData.get("budget"));
    const providerId = currentProviderId === "broadcast" ? formData.get("providerId")?.toString() : currentProviderId;

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          requestedBudget,
          providerId: providerId === "broadcast" ? undefined : providerId,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create request");
      }
      
      // Emit socket event for real-time updates
      if (socket) {
        socket.emit("new-request", responseData);
      }

      router.push("/dashboard/user/requests");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const isDirectRequest = currentProviderId !== "broadcast";

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isDirectRequest ? "Direct Request" : "New Request"}
        </h1>
        <p className="text-muted-foreground">
          {isDirectRequest 
            ? `Requesting specifically from ${selectedProvider?.name || "Provider"}...` 
            : "Create a new water delivery request."}
        </p>
      </div>

      <Card className={isDirectRequest ? "border-blue-200 shadow-md ring-1 ring-blue-100" : ""}>
        <CardHeader>
          <CardTitle className=" flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            {isDirectRequest ? "Direct Delivery Request" : "Request Water Delivery"}
          </CardTitle>
          <CardDescription>Fill out the details below to complete your request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (Liters)</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                placeholder="e.g. 1000"
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Your Budget (₹)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                placeholder="e.g. 500"
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Service Provider</Label>
              {isDirectRequest ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-full">
                      <Droplets className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedProvider?.name}</p>
                      <p className="text-xs text-blue-700">
                        ₹{(selectedProvider?.providerProfile?.pricePerLiter * 1000).toFixed(2)} per 1000L
                      </p>
                    </div>
                  </div>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    onClick={() => setCurrentProviderId("broadcast")}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel direct
                  </Button>
                </div>
              ) : (
                <>
                  <Select name="providerId" defaultValue="broadcast" onValueChange={setCurrentProviderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a provider or broadcast" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broadcast">Broadcast to All Providers (Recommended)</SelectItem>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (₹{(p.providerProfile?.pricePerLiter * 1000).toFixed(2)} for 1000L)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Info className="h-3 w-3 inline mr-1" />
                    If you don&apos;t select a provider, we will alert all nearby vendors.
                  </p>
                </>
              )}
            </div>
            
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!isDirectRequest && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Available Providers</h2>
          <div className="grid gap-4">
            {providers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No verified providers available right now.</p>
            ) : (
              providers.map((p) => (
                <Card key={p.id} className="hover:border-blue-400 transition-all group overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {p.name?.[0] || "P"}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{p.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Price for 1000L: <span className="font-bold text-blue-600">₹{(p.providerProfile?.pricePerLiter * 1000).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">Rating: {p.providerProfile?.ratingAverage?.toFixed(1) || "5.0"} ⭐</p>
                        <p className="text-xs text-muted-foreground">{p.providerProfile?.totalRatings} reviews</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="default"
                        className="bg-gray-100 text-gray-900 hover:bg-blue-600 hover:text-white border border-gray-200"
                        onClick={() => {
                          setCurrentProviderId(p.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


