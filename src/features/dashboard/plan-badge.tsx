import { Badge } from "@/components/ui/badge"
import type { Plan } from "@/types/contracts"

export function PlanBadge({ plan }: { plan: Plan }) {
    if (plan === "PRO") {
        return <Badge variant="pro">PRO</Badge>
    }

    if (plan === "ENTERPRISE") {
        return <Badge variant="enterprise">ENTERPRISE</Badge>
    }

    return <Badge variant="free">FREE</Badge>
}
