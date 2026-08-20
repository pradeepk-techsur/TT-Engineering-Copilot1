import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[68px] w-full rounded-lg border border-line-strong bg-raised px-3 py-2 text-[13px] leading-relaxed text-fg transition-colors placeholder:text-fg-faint hover:border-fg-faint/60 focus-visible:border-accent-solid focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-solid/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-fail aria-invalid:ring-fail/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
