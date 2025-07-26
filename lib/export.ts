export function exportToCSV(positions: any[], portfolioName: string) {
  const headers = [
    "Token Symbol",
    "Token Name",
    "Network",
    "Contract Address",
    "Quantity",
    "Invested Amount",
    "Average Price",
    "Current Price",
    "Current Value",
    "Profit/Loss",
    "Profit/Loss %",
    "Last Updated",
  ]

  const csvData = positions.map((position) => [
    position.tokenSymbol,
    position.tokenName,
    position.network,
    position.contractAddress,
    position.quantity,
    position.investedAmount,
    position.averagePrice,
    position.currentPrice,
    position.currentPrice * position.quantity,
    position.profitLoss,
    position.profitLossPercent.toFixed(2) + "%",
    new Date(position.lastUpdated).toLocaleString(),
  ])

  const csvContent = [headers.join(","), ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${portfolioName}_portfolio_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
