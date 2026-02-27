"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets } from "lucide-react";

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Using a mock timeout to simulate creation and redirect for now
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard/user/requests");
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Request</h1>
        <p className="text-muted-foreground">Create a new water delivery request.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className=" flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            Request Water Delivery
          </CardTitle>
          <CardDescription>Fill out the details below to request a new water delivery.</CardDescription>
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
              <Label htmlFor="budget">Your Budget ($)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                placeholder="e.g. 50"
                min="1"
                required
              />
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
    </div>
  );
}
