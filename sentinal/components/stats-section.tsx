const stats = [
  { value: "$0.006", label: "average cost per intelligence insight" },
  { value: "2h", label: "of daily monitoring automated away" },
  { value: "$5–15", label: "per week for full intelligence coverage" },
  { value: "15–25", label: "insight cards delivered per week" },
]

export function StatsSection() {
  return (
    <section className="border-y border-border/40 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center lg:text-center">
              <p className="font-mono font-bold tracking-tight text-5xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
