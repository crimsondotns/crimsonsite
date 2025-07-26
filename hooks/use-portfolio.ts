"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Position {
  id: string
  contractAddress: string
  tokenName: string
  tokenSymbol: string
  network: string
  quantity: number
  investedAmount: number
  averagePrice: number
  currentPrice: number
  profitLoss: number
  profitLossPercent: number
  logoUrl?: string
  lastUpdated: Date
}

interface Portfolio {
  id: string
  name: string
  positions: Position[]
  createdAt: Date
  updatedAt: Date
}

export function usePortfolio() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [activePortfolio, setActivePortfolio] = useState<string>("")
  const { isAuthenticated, user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      loadPortfolios()
    }
  }, [isAuthenticated, user, authLoading])

  const loadPortfolios = async () => {
    try {
      let savedPortfolios: Portfolio[] = []

      if (isAuthenticated && user && isSupabaseConfigured && supabase) {
        // Load from Supabase
        const { data, error } = await supabase
          .from("portfolios")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })

        if (error) {
          console.error("Error loading portfolios from Supabase:", error)
          // Fallback to localStorage if Supabase fails
          const savedData = localStorage.getItem("crypto-portfolios")
          if (savedData) {
            savedPortfolios = JSON.parse(savedData)
          }
        } else {
          savedPortfolios = data.map((portfolio) => ({
            id: portfolio.id,
            name: portfolio.name,
            positions: portfolio.positions || [],
            createdAt: new Date(portfolio.created_at),
            updatedAt: new Date(portfolio.updated_at),
          }))
        }
      } else {
        // Load from localStorage
        const savedData = localStorage.getItem("crypto-portfolios")
        if (savedData) {
          savedPortfolios = JSON.parse(savedData)
        }
      }

      if (savedPortfolios.length === 0) {
        const defaultPortfolio: Portfolio = {
          id: "default",
          name: "My Portfolio",
          positions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        savedPortfolios = [defaultPortfolio]
        await savePortfolios(savedPortfolios)
      }

      setPortfolios(savedPortfolios)
      setActivePortfolio(savedPortfolios[0].id)
    } catch (error) {
      console.error("Error loading portfolios:", error)
    }
  }

  const savePortfolios = async (updatedPortfolios: Portfolio[]) => {
    try {
      if (isAuthenticated && user && isSupabaseConfigured && supabase) {
        // Save to Supabase
        for (const portfolio of updatedPortfolios) {
          const { error } = await supabase.from("portfolios").upsert({
            id: portfolio.id,
            user_id: user.id,
            name: portfolio.name,
            positions: portfolio.positions,
            created_at: portfolio.createdAt.toISOString(),
            updated_at: portfolio.updatedAt.toISOString(),
          })

          if (error) {
            console.error("Error saving portfolio to Supabase:", error)
            // Fallback to localStorage if Supabase fails
            localStorage.setItem("crypto-portfolios", JSON.stringify(updatedPortfolios))
          }
        }
      } else {
        // Save to localStorage
        localStorage.setItem("crypto-portfolios", JSON.stringify(updatedPortfolios))
      }
    } catch (error) {
      console.error("Error saving portfolios:", error)
      // Always fallback to localStorage
      localStorage.setItem("crypto-portfolios", JSON.stringify(updatedPortfolios))
    }
  }

  const addPortfolio = async (name: string) => {
    const newPortfolio: Portfolio = {
      id: Date.now().toString(),
      name,
      positions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const updatedPortfolios = [...portfolios, newPortfolio]
    setPortfolios(updatedPortfolios)
    await savePortfolios(updatedPortfolios)
    setActivePortfolio(newPortfolio.id)
  }

  const deletePortfolio = async (portfolioId: string) => {
    if (portfolios.length <= 1) return false

    const updatedPortfolios = portfolios.filter((p) => p.id !== portfolioId)
    setPortfolios(updatedPortfolios)
    await savePortfolios(updatedPortfolios)

    // Also delete from Supabase if authenticated
    if (isAuthenticated && user && isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("portfolios").delete().eq("id", portfolioId).eq("user_id", user.id)

      if (error) {
        console.error("Error deleting portfolio from Supabase:", error)
      }
    }

    if (activePortfolio === portfolioId) {
      setActivePortfolio(updatedPortfolios[0].id)
    }
    return true
  }

  const updatePortfolio = async (portfolioId: string, updates: Partial<Portfolio>) => {
    const updatedPortfolios = portfolios.map((p) =>
      p.id === portfolioId ? { ...p, ...updates, updatedAt: new Date() } : p,
    )
    setPortfolios(updatedPortfolios)
    await savePortfolios(updatedPortfolios)
  }

  const addPosition = async (portfolioId: string, positionData: Omit<Position, "id" | "lastUpdated">) => {
    const newPosition: Position = {
      ...positionData,
      id: Date.now().toString(),
      lastUpdated: new Date(),
    }

    const updatedPortfolios = portfolios.map((portfolio) =>
      portfolio.id === portfolioId
        ? {
            ...portfolio,
            positions: [...portfolio.positions, newPosition],
            updatedAt: new Date(),
          }
        : portfolio,
    )

    setPortfolios(updatedPortfolios)
    await savePortfolios(updatedPortfolios)
  }

  const updatePosition = async (portfolioId: string, updatedPosition: Position) => {
    const updatedPortfolios = portfolios.map((portfolio) =>
      portfolio.id === portfolioId
        ? {
            ...portfolio,
            positions: portfolio.positions.map((p) =>
              p.id === updatedPosition.id ? { ...updatedPosition, lastUpdated: new Date() } : p,
            ),
            updatedAt: new Date(),
          }
        : portfolio,
    )

    setPortfolios(updatedPortfolios)
    await savePortfolios(updatedPortfolios)
  }

  const deletePosition = async (portfolioId: string, positionId: string) => {
    const updatedPortfolios = portfolios.map((portfolio) =>
      portfolio.id === portfolioId
        ? {
            ...portfolio,
            positions: portfolio.positions.filter((p) => p.id !== positionId),
            updatedAt: new Date(),
          }
        : portfolio,
    )

    setPortfolios(updatedPortfolios)
    await savePortfolios(updatedPortfolios)
  }

  return {
    portfolios,
    activePortfolio,
    setActivePortfolio,
    addPortfolio,
    deletePortfolio,
    updatePortfolio,
    addPosition,
    updatePosition,
    deletePosition,
  }
}
