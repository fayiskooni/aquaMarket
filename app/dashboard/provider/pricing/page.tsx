"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Banknote, MapPin, Power, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function PricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // formData is used for the inputs (staged changes)
  const [formData, setFormData] = useState({
    pricePerLiter: 0,
    isAvailable: false,
    location: "",
  });

  // previewData is used for the Live Preview (actual saved state)
  const [previewData, setPreviewData] = useState({
    name: "",
    pricePerLiter: 0,
    isAvailable: false,
    location: "",
    ratingAverage: 5.0,
    totalRatings: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/provider/pricing");
        if (res.ok) {
          const profile = await res.json();
          const initialData = {
            name: profile.user?.name || "Provider",
            pricePerLiter: profile.pricePerLiter,
            isAvailable: profile.isAvailable,
            location: profile.location,
            ratingAverage: profile.ratingAverage || 5.0,
            totalRatings: profile.totalRatings || 0,
          };
          setPreviewData(initialData);
          setFormData({
            pricePerLiter: initialData.pricePerLiter,
            isAvailable: initialData.isAvailable,
            location: initialData.location,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/provider/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      
      // Update preview only after success
      setPreviewData(prev => ({
        ...prev,
        ...formData
      }));

      setShowSuccess(true);
      toast.success("Service profile updated successfully!");
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      toast.error("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing & Availability</h1>
          <p className="text-muted-foreground">Manage your demand price and current service status.</p>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors duration-500",
          previewData.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        )}>
          <div className={cn("h-2 w-2 rounded-full", previewData.isAvailable ? "bg-green-600 animate-pulse" : "bg-gray-400")} />
          {previewData.isAvailable ? "Online" : "Offline"}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Live Preview (How customers see you)</Label>
        <Card className={cn(
          "transition-all duration-500 overflow-hidden border-2 relative",
          previewData.isAvailable ? "border-blue-500/30 shadow-2xl shadow-blue-500/10 scale-[1.02]" : "border-transparent bg-gray-50 grayscale shadow-sm"
        )}>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black transition-colors duration-500 shadow-inner",
                previewData.isAvailable ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
              )}>
                {previewData.name?.[0] || "P"}
              </div>
              <div>
                <p className="font-bold text-xl text-gray-900">{previewData.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <button 
                    type="button"
                    onClick={() => document.getElementById('pricePer1000L')?.focus()}
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors group/item"
                  >
                    1000L: <span className="font-bold text-blue-600 group-hover/item:underline">₹{(previewData.pricePerLiter * 1000).toFixed(2)}</span>
                  </button>
                  <span className="text-gray-300">•</span>
                  <button 
                    type="button"
                    onClick={() => document.getElementById('location')?.focus()}
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors flex items-center gap-1 group/loc"
                  >
                    <MapPin className="h-3 w-3" /> <span className="group-hover/loc:underline">{previewData.location || "Set Location"}</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold flex items-center justify-end gap-1">
                  {previewData.ratingAverage.toFixed(1)} <span className="text-yellow-400">★</span>
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                  {previewData.totalRatings} Reviews
                </p>
              </div>
              <Button size="sm" className={cn(
                "h-9 px-5 font-bold rounded-lg transition-all",
                previewData.isAvailable ? "bg-blue-600 hover:bg-blue-700 shadow-md" : "bg-gray-300 pointer-events-none"
              )}>
                Request
              </Button>
            </div>
          </CardContent>
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-blue-600/5 backdrop-blur-[1px] flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-white px-4 py-2 rounded-full shadow-lg border border-blue-100 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-blue-600">Preview Updated!</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      <form onSubmit={handleSave} className="space-y-6 pt-2 border-t border-dashed">
        <Card className="border-none shadow-xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="bg-green-50 p-1.5 rounded-lg text-green-600">
                <Banknote className="h-5 w-5" />
              </div>
              Service Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="pricePer1000L" className="text-xs font-bold uppercase text-gray-400">Price per 1000 Liters (₹)</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 font-bold group-focus-within:text-blue-600 transition-colors">₹</div>
                <Input
                  id="pricePer1000L"
                  type="number"
                  step="0.01"
                  value={formData.pricePerLiter * 1000 || ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                    setFormData({ ...formData, pricePerLiter: val / 1000 });
                  }}
                  className="h-14 pl-10 text-2xl font-black bg-gray-50/50 border-gray-100 hover:border-gray-200 focus:bg-white transition-all rounded-xl"
                  required
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <p className="text-muted-foreground">Adjust your pricing based on demand.</p>
                <div className="font-bold text-blue-600 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                  Calculated: ₹{(formData.pricePerLiter || 0).toFixed(2)} / Liter
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold flex items-center gap-2">
                  <Power className={cn("h-4 w-4", formData.isAvailable ? "text-blue-500" : "text-gray-400")} />
                  Availability Status
                </Label>
                <p className="text-sm text-muted-foreground">Enable to appear in customer search results.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active-status"
                  className="h-7 w-14 appearance-none rounded-full bg-gray-200 transition-all checked:bg-blue-600 relative cursor-pointer outline-none before:content-[''] before:absolute before:h-6 before:w-6 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-7 shadow-inner"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                />
                <Label htmlFor="active-status" className="sr-only">Toggle Availability</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                <MapPin className="h-5 w-5" />
              </div>
              Base Hub
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs font-bold uppercase text-gray-400">Current Service Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Downtown, Hub A"
                className="h-12 bg-gray-50/50 border-gray-100 hover:border-gray-200 focus:bg-white"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={saving}
          className={cn(
            "w-full h-14 text-lg font-black rounded-2xl shadow-xl transition-all relative group overflow-hidden",
            showSuccess 
              ? "bg-green-500 hover:bg-green-600 shadow-green-200" 
              : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-[0.98]"
          )}
        >
          <AnimatePresence mode="wait">
            {saving ? (
              <motion.div 
                key="saving"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                Updating Service...
              </motion.div>
            ) : showSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                Service Updated!
              </motion.div>
            ) : (
              <motion.div 
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                Save Profile Changes
              </motion.div>
            )}
          </AnimatePresence>
          {!saving && !showSuccess && (
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          )}
        </Button>
      </form>
    </div>
  );
}
