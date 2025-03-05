"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import PayPalButton from "@/lib/paypal.tsx"

export default function BillingPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    fetchBalance()
    fetchTransactions()
  }, [])

  async function fetchBalance() {
    const res = await fetch("/api/user/balance")
    const data = await res.json()
    setBalance(data.balance)
  }

  async function fetchTransactions() {
    const res = await fetch("/api/transactions")
    const data = await res.json()
    setTransactions(data.transactions)
  }

  async function handlePayPalSuccess(details) {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: details.purchase_units[0].amount.value,
        type: "DEPOSIT",
      }),
    })
    fetchBalance()
    fetchTransactions()
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>Your current account balance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
        </CardContent>
        <CardFooter>
          <PayPalButton amount="10.00" onSuccess={handlePayPalSuccess} />
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex justify-between py-2">
              <span>{transaction.type}</span>
              <span>${transaction.amount.toFixed(2)}</span>
              <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

