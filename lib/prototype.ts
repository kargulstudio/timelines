import { toast } from "sonner"

/**
 * Every control on the page does *something*. Controls that would open
 * screens or flows that don't exist in this design prototype say so instead
 * of silently doing nothing (one shared toast id, so repeated clicks don't stack).
 */
export function comingSoon(feature: string) {
  toast(`${feature} is coming soon`, { id: "coming-soon" })
}
