"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  GitBranch,
  CheckCircle2,
  Zap,
  TrendingUp,
  Users,
  Eye,
  Globe,
  Clock,
  Activity,
  Database,
  Cpu,
  HardDrive,
} from "lucide-react"

export function HeroSection() {
  const router = useRouter()
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [codeLineIndex, setCodeLineIndex] = useState(0)
  const [displayedText1, setDisplayedText1] = useState("")
  const [displayedText2, setDisplayedText2] = useState("")
  const [isTypingDone, setIsTypingDone] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const text1 = "Intelligence,"
  const text2 = "autonomous."

  useEffect(() => {
    const storedAddress = localStorage.getItem("sentinel_address")
    if (storedAddress) {
      setAddress(storedAddress)
    }
  }, [])

  const connectWalletAndRedirect = async () => {
    if (address) {
      router.push("/setup")
      return
    }

    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it to use this app.")
      return
    }
    
    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      if (accounts.length > 0) {
        setAddress(accounts[0])
        localStorage.setItem("sentinel_address", accounts[0])
        router.push("/setup")
      }
    } catch (error) {
      console.error("Failed to connect to MetaMask", error)
      alert("Failed to connect to MetaMask. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const codeLines = [
    "import { chiefAgent } from '@sentinel/agents'",
    "import { grantWeeklyBudget } from '@sentinel/permissions'",
    "",
    "const mission = await chiefAgent.start({",
    "  brief: 'Monitor dev tooling competitors',",
    "  weeklyBudget: 10_000_000n // $10 USDC",
    "})",
    "",
    "// ERC-7715 permission granted — agents running",
    "export const scout = await mission.spawnScout({",
    "  sources: ['HackerNews', 'GitHub', 'Serper'],",
    "  budgetSlice: 3_000_000n // $3/week",
    "})",
    "",
    "// Scout pays for data via x402 autonomously",
    "export async function fetchIntelligence() {",
    "  const data = await scout.fetch('/api/trends')",
    "  // 402 → pay → retry → insight card",
    "  return analyst.synthesize(data)",
    "}",
    "",
    "// Audit trail: every action on-chain",
    "export async function GET(request: Request) {",
    "  const feed = await mission.getInsightFeed({",
    "    urgency: ['high', 'medium'],",
    "    since: '24h'",
    "  })",
    "  return Response.json(feed)",
    "}",
    "",
    "// CFO Agent: autonomous DIEM optimization",
    "export function cfoAgent(req: Request) {",
    "  const spend = req.headers.get('x-weekly-usdc')",
    "  return cfo.evaluateStaking(spend)",
    "}",
  ]

  useEffect(() => {
    let currentIndex = 0
    const fullText = text1 + "|" + text2 // Use | as separator

    const typeInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        const currentChar = fullText.substring(0, currentIndex)
        const parts = currentChar.split("|")
        setDisplayedText1(parts[0] || "")
        setDisplayedText2(parts[1] || "")
        currentIndex++
      } else {
        clearInterval(typeInterval)
        setIsTypingDone(true)
      }
    }, 80)

    return () => clearInterval(typeInterval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCodeLineIndex((prev) => (prev + 1) % codeLines.length)
    }, 800)
    return () => clearInterval(interval)
  }, [codeLines.length])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    interface GridDot {
      x: number
      y: number
      direction: "horizontal" | "vertical"
      speed: number
      size: number
      opacity: number
      color: string
      targetX: number
      targetY: number
      trail: { x: number; y: number }[]
    }

    const colors = ["rgba(255, 255, 255, 0.5)"] // Changed colors array to white with 0.5 opacity
    const gridSize = 64 // 4rem = 64px to match the grid background
    const dotCount = 30 // Increased dot count from 12 to 30

    const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize

    const gridDots: GridDot[] = []

    for (let i = 0; i < dotCount; i++) {
      const isHorizontal = Math.random() > 0.5
      const x = snapToGrid(Math.random() * canvas.offsetWidth)
      const y = snapToGrid(Math.random() * canvas.offsetHeight)

      gridDots.push({
        x,
        y,
        direction: isHorizontal ? "horizontal" : "vertical",
        speed: Math.random() * 9 + 7.5,
        size: Math.random() * 2 + 2,
        opacity: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        targetX: x,
        targetY: y,
        trail: [],
      })
    }

    let animationId: number
    let lastTime = 0
    const frameInterval = 1000 / 30

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate)

      const deltaTime = currentTime - lastTime
      if (deltaTime < frameInterval) return
      lastTime = currentTime - (deltaTime % frameInterval)

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      gridDots.forEach((dot) => {
        dot.trail.unshift({ x: dot.x, y: dot.y })
        if (dot.trail.length > 10) dot.trail.pop()

        if (dot.direction === "horizontal") {
          if (Math.abs(dot.x - dot.targetX) < dot.speed) {
            dot.x = dot.targetX
            if (Math.random() > 0.7) {
              dot.direction = "vertical"
              const steps = Math.floor(Math.random() * 5) + 1
              dot.targetY = dot.y + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize
            } else {
              const steps = Math.floor(Math.random() * 8) + 2
              dot.targetX = dot.x + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize
            }
          } else {
            dot.x += dot.x < dot.targetX ? dot.speed : -dot.speed
          }
        } else {
          if (Math.abs(dot.y - dot.targetY) < dot.speed) {
            dot.y = dot.targetY
            if (Math.random() > 0.7) {
              dot.direction = "horizontal"
              const steps = Math.floor(Math.random() * 8) + 2
              dot.targetX = dot.x + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize
            } else {
              const steps = Math.floor(Math.random() * 5) + 1
              dot.targetY = dot.y + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize
            }
          } else {
            dot.y += dot.y < dot.targetY ? dot.speed : -dot.speed
          }
        }

        if (dot.x < -gridSize) {
          dot.x = canvas.offsetWidth + gridSize
          dot.targetX = dot.x
          dot.trail = []
        }
        if (dot.x > canvas.offsetWidth + gridSize) {
          dot.x = -gridSize
          dot.targetX = dot.x
          dot.trail = []
        }
        if (dot.y < -gridSize) {
          dot.y = canvas.offsetHeight + gridSize
          dot.targetY = dot.y
          dot.trail = []
        }
        if (dot.y > canvas.offsetHeight + gridSize) {
          dot.y = -gridSize
          dot.targetY = dot.y
          dot.trail = []
        }

        if (dot.trail.length > 1) {
          ctx.beginPath()
          ctx.moveTo(dot.x, dot.y)
          for (let i = 0; i < dot.trail.length; i++) {
            ctx.lineTo(dot.trail[i].x, dot.trail[i].y)
          }
          ctx.strokeStyle = dot.color
          ctx.globalAlpha = dot.opacity * 0.4
          ctx.lineWidth = dot.size
          ctx.lineCap = "round"
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size * 4, 0, Math.PI * 2)
        ctx.fillStyle = dot.color
        ctx.globalAlpha = dot.opacity * 0.15
        ctx.fill()

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fillStyle = dot.color
        ctx.globalAlpha = dot.opacity
        ctx.fill()
      })

      ctx.globalAlpha = 1
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  const chartData = [
    { label: "Scout", value: 30, color: "#239AAA" },
    { label: "Analyst", value: 60, color: "#7B5FD4" },
    { label: "CFO", value: 10, color: "#E27625" },
  ]

  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercent = 0

  return (
    <section className="relative overflow-hidden pt-20 pb-10 sm:pt-28 sm:pb-16 lg:pt-36">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Now live — Hackathon Build
          </div>

          <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl relative">
            <span className="invisible" aria-hidden="true">
              <span className="text-balance">Intelligence,</span>
              <br />
              <span className="text-balance">autonomous.</span>
            </span>

            <span className="absolute inset-0 flex flex-col items-center">
              <span className="text-balance bg-gradient-to-r from-[#FFEFBA] to-[#FFFFFF] bg-clip-text text-transparent">
                {displayedText1}
                {displayedText2 === "" && (
                  <span className="inline-block w-[3px] h-[0.9em] bg-accent ml-1 animate-pulse" />
                )}
              </span>
              <span className="text-balance bg-gradient-to-r from-[#E44D26] to-[#F16529] bg-clip-text text-transparent">
                {displayedText2}
                {displayedText2 !== "" && (
                  <span
                    className={`inline-block w-[3px] h-[0.9em] bg-accent ml-1 ${
                      isTypingDone ? "animate-blink" : "animate-pulse"
                    }`}
                  />
                )}
              </span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl lg:text-2xl">
            Grant a weekly USDC budget once. SENTINEL's agent workforce buys intelligence on the open web,
            synthesizes it privately on Venice AI, and delivers insights to your dashboard — autonomously, forever.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" onClick={connectWalletAndRedirect} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : (address ? "Launch SENTINEL" : "Connect to Launch")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent" onClick={() => router.push("/dashboard")}>
              View Mission Control
            </Button>
          </div>
        </div>

        <div className="mt-20 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 blur-3xl opacity-50" />

          <div className="relative overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <div className="relative rounded-xl border border-border/60 bg-[#141414] backdrop-blur-sm overflow-hidden shadow-2xl min-w-[900px] lg:min-w-0">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">sentinel mission control</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <span>base-mainnet</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>100% on-chain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-xs text-accent">Agents Running</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 p-4 border-b border-border/60 bg-[#181818]">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Activity className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold">$7.23</span>
                    <p className="text-[10px] text-muted-foreground">Budget Used</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Cpu className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold">3</span>
                    <p className="text-[10px] text-muted-foreground">Agents Active</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Database className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold">47</span>
                    <p className="text-[10px] text-muted-foreground">Insights Today</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <HardDrive className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold">$0.006</span>
                    <p className="text-[10px] text-muted-foreground">Cost/Insight</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 divide-x divide-border/60 min-h-[420px]">
                <div className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Agent Activity</h3>
                  <div className="space-y-2">
                    {[
                      { branch: "chief", status: "success", time: "2s ago", env: "Orchestrating", hash: "a3f8c21" },
                      { branch: "scout", status: "success", time: "15s ago", env: "x402 Fetching", hash: "b7d2e09" },
                      {
                        branch: "scout/serper",
                        status: "building",
                        time: "Just now",
                        env: "Paying $0.002",
                        hash: "c9a1f34",
                      },
                      {
                        branch: "analyst",
                        status: "success",
                        time: "1m ago",
                        env: "Venice AI",
                        hash: "d4e6b78",
                      },
                      { branch: "analyst/card", status: "success", time: "1m ago", env: "Insight #47", hash: "e2c9d56" },
                      {
                        branch: "cfo",
                        status: "success",
                        time: "3h ago",
                        env: "DIEM Check",
                        hash: "f1a8c23",
                      },
                    ].map((deploy, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#1c1c1c] border border-border/40"
                      >
                        <div className="flex items-center gap-2">
                          {deploy.status === "success" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <GitBranch className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-mono">{deploy.branch}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">{deploy.env}</span>
                              <span className="text-[10px] text-muted-foreground/60 font-mono">{deploy.hash}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{deploy.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Budget Allocation</h3>
                  <div className="flex flex-col items-center">
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {chartData.map((item, index) => {
                          const percent = (item.value / total) * 100
                          const dashArray = `${percent * 2.51327} ${251.327 - percent * 2.51327}`
                          const dashOffset = -cumulativePercent * 2.51327
                          cumulativePercent += percent
                          return (
                            <circle
                              key={index}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="12"
                              strokeDasharray={dashArray}
                              strokeDashoffset={dashOffset}
                              className="transition-all duration-1000"
                            />
                          )
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-mono font-bold">$10</span>
                        <span className="text-[10px] text-muted-foreground">weekly</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      {chartData.map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] text-muted-foreground">{item.label}</span>
                          <span className="text-[10px] font-mono text-foreground">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground">Agent Cost Split</h4>
                    {[
                      { label: "Scout", value: 30, color: "bg-[#239AAA]" },
                      { label: "Analyst", value: 60, color: "bg-[#7B5FD4]" },
                      { label: "CFO", value: 10, color: "bg-[#E27625]" },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-mono">{item.value}%</span>
                        </div>
                        <div className="h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Intelligence Feed</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span className="text-xs text-muted-foreground">Insights Generated</span>
                        </div>
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          +12%
                        </span>
                      </div>
                      <span className="text-xl font-mono font-bold">47</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-purple-400" />
                          <span className="text-xs text-muted-foreground">x402 Payments</span>
                        </div>
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          +8%
                        </span>
                      </div>
                      <span className="text-xl font-mono font-bold">$0.84</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-accent" />
                          <span className="text-xs text-muted-foreground">Venice AI calls</span>
                        </div>
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          +5%
                        </span>
                      </div>
                      <span className="text-xl font-mono font-bold">142</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-cyan-400" />
                          <span className="text-xs text-muted-foreground">Data Sources</span>
                        </div>
                      </div>
                      <span className="text-xl font-mono font-bold">6</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-orange-400" />
                          <span className="text-xs text-muted-foreground">Budget Remaining</span>
                        </div>
                      </div>
                      <span className="text-xl font-mono font-bold">72.3%</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Audit Trail</h3>
                  <div className="rounded-lg bg-[#0d0d0d] border border-border/40 p-3 font-mono text-[11px] h-[340px] overflow-hidden">
                    <div
                      className="transition-transform duration-300 ease-out"
                      style={{ transform: `translateY(-${codeLineIndex * 22}px)` }}
                    >
                      {[...codeLines, ...codeLines].map((line, i) => (
                        <div
                          key={i}
                          className={`h-[22px] leading-[22px] ${
                            line.startsWith("import")
                              ? "text-purple-400"
                              : line.startsWith("export")
                                ? "text-blue-400"
                                : line.startsWith("const")
                                  ? "text-accent"
                                  : line.includes("return")
                                    ? "text-pink-400"
                                    : line.includes("await")
                                      ? "text-yellow-400"
                                      : line.startsWith("//")
                                        ? "text-muted-foreground/60 italic"
                                        : "text-muted-foreground"
                          }`}
                        >
                          {line || " "}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:hidden flex justify-center mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Scroll to explore</span>
              <ArrowRight className="h-3 w-3 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
