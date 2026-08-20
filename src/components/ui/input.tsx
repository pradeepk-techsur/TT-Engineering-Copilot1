import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-lg border border-line-strong bg-raised px-3 py-1 text-[13px] text-fg transition-colors placeholder:text-fg-faint hover:border-fg-faint/60 focus-visible:border-accent-solid focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-solid/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-fail aria-invalid:ring-fail/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
