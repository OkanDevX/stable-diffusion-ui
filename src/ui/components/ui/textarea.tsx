import * as React from "react";

import { cn } from "@/lib/utils/cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm transition-all duration-200",
        "placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        "hover:border-ring/50",
        "resize-vertical",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
