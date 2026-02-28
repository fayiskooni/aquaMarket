import { Badge } from "@/components/ui/badge";

type Status = 
  | "PENDING_VERIFICATION" 
  | "DOCUMENT_REQUESTED" 
  | "APPROVED" 
  | "REJECTED" 
  | "SUSPENDED"
  | "CREATED"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "OPEN" 
  | "RESOLVED"
  | "DISPUTED";

const statusConfig: Record<Status, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  PENDING_VERIFICATION: { label: "Pending", variant: "warning" },
  DOCUMENT_REQUESTED: { label: "Doc Requested", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
  
  CREATED: { label: "Created", variant: "secondary" },
  ASSIGNED: { label: "Assigned", variant: "default" },
  IN_TRANSIT: { label: "In Transit", variant: "warning" },
  DELIVERED: { label: "Delivered", variant: "success" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  
  OPEN: { label: "Open", variant: "warning" },
  RESOLVED: { label: "Resolved", variant: "success" },
  DISPUTED: { label: "Disputed", variant: "destructive" },
};

// Assuming we add custom variants to Badge in our Tailwind config, 
// if not 'default' | 'secondary' | 'destructive' | 'outline' works.
// We'll map warning/success to custom colors for now.
export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  
  if (!config) return <Badge variant="outline">{status}</Badge>;

  const variantClasses = {
    default: "",
    secondary: "",
    destructive: "",
    outline: "",
    warning: "bg-orange-100 text-orange-800 hover:bg-orange-100/80 border-transparent",
    success: "bg-green-100 text-green-800 hover:bg-green-100/80 border-transparent",
  };

  const isCustom = ["warning", "success"].includes(config.variant);

  return (
    <Badge 
      variant={isCustom ? "outline" : config.variant as any} 
      className={isCustom ? variantClasses[config.variant as keyof typeof variantClasses] : ""}
    >
      {config.label}
    </Badge>
  );
}
