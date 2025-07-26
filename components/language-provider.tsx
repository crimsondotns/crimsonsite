"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Translations {
  portfolio: string
  defaultPortfolio: string
  addPosition: string
  editPosition: string
  deletePosition: string
  searchPlaceholder: string
  token: string
  network: string
  price: string
  quantity: string
  invested: string
  avgPrice: string
  profitLoss: string
  contractAddress: string
  amount: string
  cancel: string
  save: string
  delete: string
  edit: string
  createPortfolio: string
  portfolioName: string
  alerts: string
  priceAlert: string
  targetPrice: string
  oneTime: string
  repeat: string
  login: string
  loginWithGoogle: string
  logout: string
  actions: string
  alert: string
  currentValue: string
  totalValue: string
  totalPnL: string
  positions: string
  noPositions: string
  addFirstPosition: string
  fetchingPrice: string
  tokenNotFound: string
  errorAddingPosition: string
  errorUpdatingPosition: string
  confirmDelete: string
  deletePortfolioConfirm: string
  cannotDeleteLast: string
  alertCreated: string
  testSound: string
  soundAlert: string
  crossPrice: string
  whenPriceCrosses: string
  notificationCenter: string
  activeAlerts: string
  triggeredAlerts: string
  noActiveAlerts: string
  alertTriggered: string
  exportCSV: string
  refreshing: string
  autoRefresh: string
  lastUpdated: string
  tokenInfo: string
  fetchingTokenInfo: string
  invalidAddress: string
  addAlert: string
  editAlert: string
  deleteAlert: string
  alertStatus: string
  triggered: string
  active: string
  createdAt: string
  lastTriggered: string
}

const translations: Record<string, Translations> = {
  en: {
    portfolio: "Portfolio",
    defaultPortfolio: "My Portfolio",
    addPosition: "Add Position",
    editPosition: "Edit Position",
    deletePosition: "Delete Position",
    searchPlaceholder: "Search tokens, networks, addresses...",
    token: "Token",
    network: "Network",
    price: "Price",
    quantity: "Quantity",
    invested: "Invested",
    avgPrice: "Avg Price",
    profitLoss: "Profit/Loss",
    contractAddress: "Contract Address",
    amount: "Amount (USD)",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    createPortfolio: "Create Portfolio",
    portfolioName: "Portfolio Name",
    alerts: "Alerts",
    priceAlert: "Price Alert",
    targetPrice: "Target Price",
    oneTime: "One Time",
    repeat: "Repeat",
    login: "Login",
    loginWithGoogle: "Login with Google",
    logout: "Logout",
    actions: "Actions",
    alert: "Alert",
    currentValue: "Current Value",
    totalValue: "Total Value",
    totalPnL: "Total P&L",
    positions: "positions",
    noPositions: "No positions yet",
    addFirstPosition: "Add your first position to get started",
    fetchingPrice: "Fetching price...",
    tokenNotFound: "Token not found. Please check the contract address.",
    errorAddingPosition: "Error adding position. Please try again.",
    errorUpdatingPosition: "Error updating position. Please try again.",
    confirmDelete: "Are you sure you want to delete this position?",
    deletePortfolioConfirm: "Are you sure you want to delete this portfolio?",
    cannotDeleteLast: "Cannot delete the last portfolio",
    alertCreated: "Alert created successfully!",
    testSound: "Test Sound",
    soundAlert: "Sound Alert",
    crossPrice: "Cross Price",
    whenPriceCrosses: "Alert when price crosses",
    notificationCenter: "Notification Center",
    activeAlerts: "Active Alerts",
    triggeredAlerts: "Triggered Alerts",
    noActiveAlerts: "No active alerts",
    alertTriggered: "Alert triggered",
    exportCSV: "Export CSV",
    refreshing: "Refreshing...",
    autoRefresh: "Auto-refresh every 15s",
    lastUpdated: "Last updated",
    tokenInfo: "Token Info",
    fetchingTokenInfo: "Fetching token info...",
    invalidAddress: "Invalid contract address",
    addAlert: "Add Alert",
    editAlert: "Edit Alert",
    deleteAlert: "Delete Alert",
    alertStatus: "Status",
    triggered: "Triggered",
    active: "Active",
    createdAt: "Created",
    lastTriggered: "Last Triggered",
  },
  th: {
    portfolio: "พอร์ตโฟลิโอ",
    defaultPortfolio: "พอร์ตโฟลิโอของฉัน",
    addPosition: "เพิ่มตำแหน่ง",
    editPosition: "แก้ไขตำแหน่ง",
    deletePosition: "ลบตำแหน่ง",
    searchPlaceholder: "ค้นหาโทเค็น, เครือข่าย, ที่อยู่...",
    token: "โทเค็น",
    network: "เครือข่าย",
    price: "ราคา",
    quantity: "จำนวน",
    invested: "ลงทุน",
    avgPrice: "ราคาเฉลี่ย",
    profitLoss: "กำไร/ขาดทุน",
    contractAddress: "ที่อยู่สัญญา",
    amount: "จำนวน (USD)",
    cancel: "ยกเลิก",
    save: "บันทึก",
    delete: "ลบ",
    edit: "แก้ไข",
    createPortfolio: "สร้างพอร์ตโฟลิโอ",
    portfolioName: "ชื่อพอร์ตโฟลิโอ",
    alerts: "การแจ้งเตือน",
    priceAlert: "แจ้งเตือนราคา",
    targetPrice: "ราคาเป้าหมาย",
    oneTime: "ครั้งเดียว",
    repeat: "ทำซ้ำ",
    login: "เข้าสู่ระบบ",
    loginWithGoogle: "เข้าสู่ระบบด้วย Google",
    logout: "ออกจากระบบ",
    actions: "การดำเนินการ",
    alert: "แจ้งเตือน",
    currentValue: "มูลค่าปัจจุบัน",
    totalValue: "มูลค่ารวม",
    totalPnL: "กำไร/ขาดทุนรวม",
    positions: "ตำแหน่ง",
    noPositions: "ยังไม่มีตำแหน่ง",
    addFirstPosition: "เพิ่มตำแหน่งแรกของคุณเพื่อเริ่มต้น",
    fetchingPrice: "กำลังดึงราคา...",
    tokenNotFound: "ไม่พบโทเค็น กรุณาตรวจสอบที่อยู่สัญญา",
    errorAddingPosition: "เกิดข้อผิดพลาดในการเพิ่มตำแหน่ง กรุณาลองใหม่",
    errorUpdatingPosition: "เกิดข้อผิดพลาดในการอัปเดตตำแหน่ง กรุณาลองใหม่",
    confirmDelete: "คุณแน่ใจหรือไม่ที่จะลบตำแหน่งนี้?",
    deletePortfolioConfirm: "คุณแน่ใจหรือไม่ที่จะลบพอร์ตโฟลิโอนี้?",
    cannotDeleteLast: "ไม่สามารถลบพอร์ตโฟลิโอสุดท้ายได้",
    alertCreated: "สร้างการแจ้งเตือนสำเร็จ!",
    testSound: "ทดสอบเสียง",
    soundAlert: "เสียงแจ้งเตือน",
    crossPrice: "ข้ามราคา",
    whenPriceCrosses: "แจ้งเตือนเมื่อราคาข้าม",
    notificationCenter: "ศูนย์การแจ้งเตือน",
    activeAlerts: "การแจ้งเตือนที่ใช้งาน",
    triggeredAlerts: "การแจ้งเตือนที่ถูกเรียก",
    noActiveAlerts: "ไม่มีการแจ้งเตือนที่ใช้งาน",
    alertTriggered: "การแจ้งเตือนถูกเรียก",
    exportCSV: "ส่งออก CSV",
    refreshing: "กำลังรีเฟรช...",
    autoRefresh: "รีเฟรชอัตโนมัติทุก 15 วินาที",
    lastUpdated: "อัปเดตล่าสุด",
    tokenInfo: "ข้อมูลโทเค็น",
    fetchingTokenInfo: "กำลังดึงข้อมูลโทเค็น...",
    invalidAddress: "ที่อยู่สัญญาไม่ถูกต้อง",
    addAlert: "เพิ่มการแจ้งเตือน",
    editAlert: "แก้ไขการแจ้งเตือน",
    deleteAlert: "ลบการแจ้งเตือน",
    alertStatus: "สถานะ",
    triggered: "ถูกเรียก",
    active: "ใช้งาน",
    createdAt: "สร้างเมื่อ",
    lastTriggered: "เรียกล่าสุด",
  },
}

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState("en")

  const value = {
    language,
    setLanguage,
    t: translations[language],
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
