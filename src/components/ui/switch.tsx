import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root className={cn("sensor-switch", className)} {...props}>
      <SwitchPrimitive.Thumb className="sensor-thumb" />
    </SwitchPrimitive.Root>
  );
}
