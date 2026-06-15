"use client"

import type React from "react"

declare global {
  interface Window {
    ethereum?: any
  }
}

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const storedAddress = localStorage.getItem("sentinel_address")
    if (storedAddress) {
      setAddress(storedAddress)
    }
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it to use this app.")
      return
    }
    
    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts.length > 0) {
        setAddress(accounts[0])
        localStorage.setItem("sentinel_address", accounts[0])
      }
    } catch (error) {
      console.error("Failed to connect to MetaMask", error)
      alert("Failed to connect to MetaMask. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAddress(null)
    localStorage.removeItem("sentinel_address")
  }

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.replace("#", "")
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
    setIsOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            
            <span className="text-lg font-semibold tracking-tight font-mono">SENTINEL</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "#features")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              How It Works
            </a>
            <a
              href="#developer-experience"
              onClick={(e) => handleSmoothScroll(e, "#developer-experience")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Agent Stack
            </a>
            <a
              href="#built-for-react"
              onClick={(e) => handleSmoothScroll(e, "#built-for-react")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Integration
            </a>
            <a
              href="#docs"
              onClick={(e) => handleSmoothScroll(e, "#docs")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Docs
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleSmoothScroll(e, "#pricing")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Pricing
            </a>
            <a
              href="#enterprise"
              onClick={(e) => handleSmoothScroll(e, "#enterprise")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Hackathon
            </a>
          </nav>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          {address ? (
            <>
              <span className="text-sm text-muted-foreground font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <Button variant="ghost" size="sm" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </Button>
          )}
        </div>
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {isOpen && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <nav className="flex flex-col gap-4 px-4 py-6">
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "#features")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              How It Works
            </a>
            <a
              href="#developer-experience"
              onClick={(e) => handleSmoothScroll(e, "#developer-experience")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Agent Stack
            </a>
            <a
              href="#built-for-react"
              onClick={(e) => handleSmoothScroll(e, "#built-for-react")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Integration
            </a>
            <a
              href="#docs"
              onClick={(e) => handleSmoothScroll(e, "#docs")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Docs
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleSmoothScroll(e, "#pricing")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Pricing
            </a>
            <a
              href="#enterprise"
              onClick={(e) => handleSmoothScroll(e, "#enterprise")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Hackathon
            </a>
            <div className="flex flex-col gap-2 pt-4">
              {address ? (
                <>
                  <span className="text-sm text-muted-foreground font-mono text-center mb-2">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                  <Button variant="ghost" size="sm" onClick={disconnectWallet}>
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={connectWallet} disabled={isConnecting}>
                  {isConnecting ? "Connecting..." : "Connect MetaMask"}
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
