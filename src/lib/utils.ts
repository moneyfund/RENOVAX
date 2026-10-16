import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const formatTime = (value: string | number) =>
  new Intl.DateTimeFormat("es-NI", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Managua",
  }).format(new Date(value));
