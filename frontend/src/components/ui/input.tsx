import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-slate-400 selection:bg-blue-600 selection:text-white flex h-12 w-full min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-base bg-slate-50 hover:bg-slate-100/50 transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-sm",
        "focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/20",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-500",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
