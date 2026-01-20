export function getRiskBadge(risk) {
   const badgeMap = {
      Low: "badge-success",
      Medium: "badge-warning",
      High: "badge-error"
   }
   return badgeMap[risk] || "badge-neutral"
}