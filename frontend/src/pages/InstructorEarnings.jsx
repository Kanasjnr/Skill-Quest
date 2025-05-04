"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Wallet,
  RefreshCw,
  Copy,
  Filter,
  Search,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  BarChart3,
  LineChart,
  PieChart,
  Clock,
  Download,
  ExternalLink,
} from "lucide-react"
import useSkillQuestInstructor from "@/hooks/useSkillQuestInstructor"
import useSkillQuestCourses from "@/hooks/useSkillQuestCourses"
import useSkillQuestToken from "@/hooks/useSkillQuestToken"
import useSkillQuestTransactions from "@/hooks/useSkillQuestTransactions"
import useSignerOrProvider from "@/hooks/useSignerOrProvider"
import { toast } from "react-toastify"
import { ethers } from "ethers"
import LoadingSpinner from "@/components/LoadingSpinner"

const InstructorEarnings = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [processingWithdraw, setProcessingWithdraw] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationDetails, setConfirmationDetails] = useState({
    amount: 0,
    recipient: "",
    isToSelf: true,
  })
  const [transactionFilter, setTransactionFilter] = useState("all")
  const [transactionSort, setTransactionSort] = useState("newest")
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [timeframe, setTimeframe] = useState("month")
  const [stats, setStats] = useState({
    totalEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    monthlyEarnings: 0,
    monthlyGrowth: 0,
    yearlyEarnings: 0,
    yearlyGrowth: 0,
    weeklyEarnings: 0,
    weeklyGrowth: 0,
    projectedEarnings: 0,
    averagePerStudent: 0,
    totalStudents: 0,
  })

  const { isRegistered, loading: instructorLoading, error: instructorError } = useSkillQuestInstructor()

  const { instructorCourses, loading: coursesLoading, error: coursesError } = useSkillQuestCourses()

  console.log("[DEBUG] Before useSkillQuestToken hook");
  const { transferTokens, getTokenBalance, loading: tokenLoading, error: tokenError } = useSkillQuestToken()
  console.log("[DEBUG] After useSkillQuestToken hook:", {
    hasTransferTokens: typeof transferTokens === 'function',
    hasGetTokenBalance: typeof getTokenBalance === 'function',
    tokenLoading,
    tokenError
  });

  const {
    transactions,
    availableBalance,
    fetchTransactionHistory,
    loading: transactionsLoading,
    error: transactionsError,
  } = useSkillQuestTransactions()

  const { signer } = useSignerOrProvider()

  useEffect(() => {
    setLoading(instructorLoading || coursesLoading || tokenLoading || transactionsLoading)
    setError(instructorError || coursesError || tokenError || transactionsError)
  }, [
    instructorLoading,
    coursesLoading,
    tokenLoading,
    transactionsLoading,
    instructorError,
    coursesError,
    tokenError,
    transactionsError,
  ])

  // Get wallet address and load data when signer is available
  useEffect(() => {
    const loadData = async () => {
      if (signer) {
        try {
          const address = await signer.getAddress()
          setWalletAddress(address)
          
          // Fetch transaction history
          await fetchTransactionHistory()

          // Calculate course stats
          let courseStats = {
            totalEarnings: 0,
            totalStudents: 0,
            monthlyEarnings: 0,
            weeklyEarnings: 0,
            yearlyEarnings: 0,
            projectedEarnings: 0,
            averagePerStudent: 0,
            pendingBalance: 0
          }

          if (instructorCourses && instructorCourses.length > 0) {
            const totalStudents = instructorCourses.reduce((sum, course) => sum + Number(course.enrollmentCount), 0)
            const totalEarnings = instructorCourses.reduce(
              (sum, course) => sum + Number(course.price) * Number(course.enrollmentCount),
              0
            )

            courseStats = {
              totalEarnings,
              totalStudents,
              monthlyEarnings: totalEarnings * 0.3,
              weeklyEarnings: totalEarnings * 0.075,
              yearlyEarnings: totalEarnings * 3.6,
              projectedEarnings: totalEarnings * 0.3 * 1.05 * 3,
              averagePerStudent: totalStudents > 0 ? totalEarnings / totalStudents : 0,
              pendingBalance: totalEarnings * 0.2
            }
          }

          // Update all stats at once
          setStats(prev => ({
            ...prev,
            ...courseStats,
            availableBalance: Number(availableBalance)
          }))
        } catch (err) {
          console.error("Error loading data:", err)
          setError(err.message)
        } finally {
          setLoading(false)
        }
      }
    }

    loadData()
  }, [signer, instructorCourses, availableBalance])

  // Add a separate effect to update stats when transactions or courses change
  useEffect(() => {
    if (signer) {
      // Calculate course stats
      let courseStats = {
        totalEarnings: 0,
        totalStudents: 0,
        monthlyEarnings: 0,
        weeklyEarnings: 0,
        yearlyEarnings: 0,
        projectedEarnings: 0,
        averagePerStudent: 0,
        pendingBalance: 0
      }

      if (instructorCourses && instructorCourses.length > 0) {
        const totalStudents = instructorCourses.reduce((sum, course) => sum + Number(course.enrollmentCount), 0)
        const totalEarnings = instructorCourses.reduce(
          (sum, course) => sum + Number(course.price) * Number(course.enrollmentCount),
          0
        )

        courseStats = {
          totalEarnings,
          totalStudents,
          monthlyEarnings: totalEarnings * 0.3,
          weeklyEarnings: totalEarnings * 0.075,
          yearlyEarnings: totalEarnings * 3.6,
          projectedEarnings: totalEarnings * 0.3 * 1.05 * 3,
          averagePerStudent: totalStudents > 0 ? totalEarnings / totalStudents : 0,
          pendingBalance: totalEarnings * 0.2
        }
      }

      // Update all stats at once
      setStats(prev => ({
        ...prev,
        ...courseStats,
        availableBalance: Number(availableBalance)
      }))
    }
  }, [transactions, instructorCourses, availableBalance])

  const initiateWithdraw = (isToSelf = true) => {
    const amount = isToSelf ? withdrawAmount : transferAmount
    console.log("Initiating withdrawal:", {
      amount,
      isToSelf,
      availableBalance: stats.availableBalance
    })

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      console.log("Invalid amount:", amount)
      toast.error("Please enter a valid amount")
      return
    }

    if (Number(amount) > stats.availableBalance) {
      console.log("Amount exceeds balance:", {
        amount: Number(amount),
        balance: stats.availableBalance
      })
      toast.error("Amount exceeds available balance")
      return
    }

    if (!isToSelf && !ethers.isAddress(recipientAddress)) {
      console.log("Invalid recipient address:", recipientAddress)
      toast.error("Please enter a valid recipient address")
      return
    }

    // Set confirmation details and open dialog
    const details = {
      amount: Number(amount),
      recipient: isToSelf ? walletAddress : recipientAddress,
      isToSelf,
    }
    console.log("Setting confirmation details:", details)
    setConfirmationDetails(details)
    setConfirmationOpen(true)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success("Address copied to clipboard")
  }

  const formatAddress = (address) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp) => {
    // Convert Unix timestamp (seconds) to milliseconds
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount) => {
    return Number.parseFloat(amount).toFixed(2)
  }

  // Filter and sort transactions
  const processedTransactions = useMemo(() => {
    // First filter by search query
    let filtered = transactions.filter((transaction) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        transaction.type.toLowerCase().includes(searchLower) ||
        formatAddress(transaction.from).toLowerCase().includes(searchLower) ||
        formatAddress(transaction.to).toLowerCase().includes(searchLower) ||
        transaction.amount.toString().includes(searchLower)
      )
    })

    // Then filter by type
    if (transactionFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.type === transactionFilter)
    }

    // Then sort
    return filtered.sort((a, b) => {
      if (transactionSort === "newest") {
        return b.timestamp - a.timestamp
      } else if (transactionSort === "oldest") {
        return a.timestamp - b.timestamp
      } else if (transactionSort === "highest") {
        return b.amount - a.amount
      } else if (transactionSort === "lowest") {
        return a.amount - b.amount
      }
      return 0
    })
  }, [transactions, searchQuery, transactionFilter, transactionSort])

  // Course earnings data
  const courseEarnings = useMemo(() => {
    if (!instructorCourses) return []

    return instructorCourses
      .map((course) => ({
        id: course.id,
        title: course.title,
        students: Number(course.enrollmentCount),
        price: Number(course.price),
        earnings: Number(course.price) * Number(course.enrollmentCount),
        percentOfTotal:
          instructorCourses.reduce((sum, c) => sum + Number(c.price) * Number(c.enrollmentCount), 0) > 0
            ? (
                ((Number(course.price) * Number(course.enrollmentCount)) /
                  instructorCourses.reduce((sum, c) => sum + Number(c.price) * Number(c.enrollmentCount), 0)) *
                100
              ).toFixed(1)
            : 0,
      }))
      .sort((a, b) => b.earnings - a.earnings)
  }, [instructorCourses])

  // Time-based earnings data for the selected timeframe
  const timeframeData = useMemo(() => {
    switch (timeframe) {
      case "week":
        return {
          earnings: stats.weeklyEarnings,
          growth: stats.weeklyGrowth,
          label: "This Week",
          previousLabel: "Last Week",
        }
      case "month":
        return {
          earnings: stats.monthlyEarnings,
          growth: stats.monthlyGrowth,
          label: "This Month",
          previousLabel: "Last Month",
        }
      case "year":
        return {
          earnings: stats.yearlyEarnings,
          growth: stats.yearlyGrowth,
          label: "This Year",
          previousLabel: "Last Year",
        }
      default:
        return {
          earnings: stats.monthlyEarnings,
          growth: stats.monthlyGrowth,
          label: "This Month",
          previousLabel: "Last Month",
        }
    }
  }, [timeframe, stats])

  if (loading) {
    return <LoadingSpinner message="Loading earnings data..." />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Error Loading Data</h2>
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (!isRegistered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Become an Instructor</h2>
        <p className="text-gray-500">Register as an instructor to view earnings</p>
        <Button onClick={() => (window.location.href = "/dashboard")} className="bg-purple-600 hover:bg-purple-700">
          Go to Dashboard
        </Button>
      </div>
    )
  }

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
        <p className="text-gray-500">Please connect your wallet to view and manage earnings</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Instructor Earnings</h1>
          <p className="text-gray-500">Manage your earnings and transfers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              fetchTransactionHistory()
              toast.success("Data refreshed")
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)} LEARN</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-gray-500">Lifetime earnings from {stats.totalStudents} students</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.availableBalance)} LEARN</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-gray-500">Ready for withdrawal</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{timeframeData.label}</CardTitle>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="h-6 w-24 text-xs border-none p-0 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {timeframeData.growth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(timeframeData.earnings)} LEARN</div>
            <div className="flex items-center pt-1">
              <span className={`text-xs ${timeframeData.growth >= 0 ? "text-green-500" : "text-red-500"}`}>
                {timeframeData.growth >= 0 ? "+" : ""}
                {timeframeData.growth}% from {timeframeData.previousLabel.toLowerCase()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Earnings</CardTitle>
            <LineChart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.projectedEarnings)} LEARN</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-gray-500">Next 3 months forecast</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Withdrawal Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Transfer Funds</CardTitle>
            <CardDescription>Transfer your earnings to your wallet or another address</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="withdraw" className="space-y-4">
              <TabsList>
                <TabsTrigger value="withdraw">Withdraw to Wallet</TabsTrigger>
                <TabsTrigger value="transfer">Send to Address</TabsTrigger>
              </TabsList>

              <TabsContent value="withdraw" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount to Withdraw</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="amount"
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount in LEARN"
                      className="flex-1"
                      min="0"
                      step="0.01"
                    />
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        console.log("Withdraw button clicked")
                        initiateWithdraw(true)
                      }}
                      disabled={
                        processingWithdraw ||
                        !withdrawAmount ||
                        Number(withdrawAmount) <= 0 ||
                        Number(withdrawAmount) > stats.availableBalance
                      }
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {processingWithdraw ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          Withdraw
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Wallet className="h-4 w-4" />
                    <span>Your wallet address:</span>
                    <span className="font-mono">{formatAddress(walletAddress)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => copyToClipboard(walletAddress)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Available for withdrawal: {formatCurrency(stats.availableBalance)} LEARN
                    </p>
                    <Button
                      variant="link"
                      className="text-xs p-0 h-auto"
                      onClick={() => setWithdrawAmount(stats.availableBalance.toString())}
                    >
                      Max
                    </Button>
                  </div>
                  {Number(withdrawAmount) > 0 && (
                    <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between text-sm">
                        <span>Amount:</span>
                        <span className="font-medium">{formatCurrency(withdrawAmount)} LEARN</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span>Remaining Balance:</span>
                        <span className="font-medium">
                          {formatCurrency(stats.availableBalance - Number(withdrawAmount))} LEARN
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="transfer" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input
                    id="recipient"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Enter recipient's wallet address"
                    className="font-mono"
                  />
                  {recipientAddress && !ethers.isAddress(recipientAddress) && (
                    <p className="text-sm text-red-500">Please enter a valid Ethereum address</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferAmount">Amount to Send</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="transferAmount"
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="Enter amount in LEARN"
                      className="flex-1"
                      min="0"
                      step="0.01"
                    />
                    <Button
                      onClick={() => initiateWithdraw(false)}
                      disabled={
                        processingWithdraw ||
                        !transferAmount ||
                        Number(transferAmount) <= 0 ||
                        Number(transferAmount) > stats.availableBalance ||
                        !recipientAddress ||
                        !ethers.isAddress(recipientAddress)
                      }
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {processingWithdraw ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Available for transfer: {formatCurrency(stats.availableBalance)} LEARN
                    </p>
                    <Button
                      variant="link"
                      className="text-xs p-0 h-auto"
                      onClick={() => setTransferAmount(stats.availableBalance.toString())}
                    >
                      Max
                    </Button>
                  </div>
                  {Number(transferAmount) > 0 && (
                    <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between text-sm">
                        <span>Amount:</span>
                        <span className="font-medium">{formatCurrency(transferAmount)} LEARN</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span>Recipient:</span>
                        <span className="font-mono">{formatAddress(recipientAddress)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span>Remaining Balance:</span>
                        <span className="font-medium">
                          {formatCurrency(stats.availableBalance - Number(transferAmount))} LEARN
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
            <CardDescription>Revenue by source</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center h-40">
              <PieChart className="h-24 w-24 text-gray-300" />
            </div>
            <div className="space-y-2">
              {courseEarnings.slice(0, 3).map((course) => (
                <div key={course.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full bg-purple-${600 - courseEarnings.indexOf(course) * 100}`}
                    ></div>
                    <span className="text-sm truncate max-w-[150px]">{course.title}</span>
                  </div>
                  <div className="text-sm font-medium">{course.percentOfTotal}%</div>
                </div>
              ))}
              {courseEarnings.length > 3 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <span className="text-sm">Other Courses</span>
                  </div>
                  <div className="text-sm font-medium">
                    {(
                      100 -
                      courseEarnings
                        .slice(0, 3)
                        .reduce((sum, course) => sum + Number.parseFloat(course.percentOfTotal), 0)
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/instructor-analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Detailed Analytics
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Course Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings by Course</CardTitle>
          <CardDescription>Revenue breakdown per course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-5 bg-gray-50 dark:bg-gray-800 p-3 text-sm font-medium">
              <div className="col-span-2">Course</div>
              <div className="text-right">Students</div>
              <div className="text-right">Price</div>
              <div className="text-right">Total Earnings</div>
            </div>
            <div className="divide-y">
              {courseEarnings.length > 0 ? (
                courseEarnings.map((course) => (
                  <div key={course.id} className="grid grid-cols-5 p-3 text-sm">
                    <div className="col-span-2 font-medium truncate">{course.title}</div>
                    <div className="text-right">{course.students}</div>
                    <div className="text-right">{formatCurrency(course.price)} LEARN</div>
                    <div className="text-right font-medium">{formatCurrency(course.earnings)} LEARN</div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first course to start earning</p>
                  <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                    <a href="/create-course">Create Course</a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="earning">Earnings</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="transfer">Transfers</SelectItem>
                </SelectContent>
              </Select>
              <Select value={transactionSort} onValueChange={setTransactionSort}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest">Highest Amount</SelectItem>
                  <SelectItem value="lowest">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <div className="grid grid-cols-5 bg-gray-50 dark:bg-gray-800 p-3 text-sm font-medium">
                <div>Type</div>
                <div>Amount</div>
                <div>From/To</div>
                <div>Date</div>
                <div>Status</div>
              </div>
              <div className="divide-y">
                {processedTransactions.length > 0 ? (
                  processedTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="grid grid-cols-5 p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <div className="flex items-center gap-2">
                        {transaction.type === "received" ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className="capitalize">{transaction.method}</span>
                      </div>
                      <div className="font-medium">
                        {transaction.type === "received" ? "+" : "-"}
                        {formatCurrency(transaction.amount)} LEARN
                      </div>
                      <div className="truncate">
                        {transaction.type === "received" ? (
                          <span title={transaction.from}>
                            From: {formatAddress(transaction.from)}
                          </span>
                        ) : (
                          <span title={transaction.to}>
                            To: {formatAddress(transaction.to)}
                          </span>
                        )}
                      </div>
                      <div>{formatDate(transaction.timestamp)}</div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === "confirmed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                        >
                          {transaction.status === "confirmed" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
                    <p className="text-gray-500">Your transaction history will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent>
          {selectedTransaction && (
            <>
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
                <DialogDescription>
                  {formatDate(selectedTransaction.timestamp)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="capitalize">{selectedTransaction.method}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="font-medium">
                    {selectedTransaction.type === "received" ? "+" : "-"}
                    {formatCurrency(selectedTransaction.amount)} LEARN
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">From</span>
                  <span className="font-mono">{selectedTransaction.from}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">To</span>
                  <span className="font-mono">{selectedTransaction.to}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTransaction.status === "confirmed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {selectedTransaction.status === "confirmed" ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {selectedTransaction.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Transaction Hash</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{formatAddress(selectedTransaction.hash)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTransaction.hash)
                        toast.success("Transaction hash copied to clipboard")
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmationOpen} 
        onOpenChange={(open) => {
          console.log("[DEBUG] Dialog open state changing to:", open);
          // Only allow closing if we're not processing
          if (!open && !processingWithdraw) {
            console.log("[DEBUG] Closing dialog - not processing");
            setConfirmationOpen(false);
          } else if (!open && processingWithdraw) {
            console.log("[DEBUG] Preventing dialog close - processing in progress");
          }
        }}
      >
        <DialogContent>
          <form onSubmit={async (e) => {
            e.preventDefault();
            console.log("[DEBUG] Form submitted");
            console.log("[DEBUG] Confirmation details:", confirmationDetails);
            console.log("[DEBUG] transferTokens function:", transferTokens);
            
            if (!transferTokens || typeof transferTokens !== 'function') {
              console.error("[DEBUG] transferTokens is not a function:", transferTokens);
              toast.error("Transfer function not available");
              return;
            }

            try {
              console.log("[DEBUG] Setting processing state to true");
              setProcessingWithdraw(true);
              const loadingToastId = toast.loading(`Processing ${confirmationDetails.isToSelf ? "withdrawal" : "transfer"}...`);

              console.log("[DEBUG] About to call transferTokens...");
              console.log("[DEBUG] Parameters:", { 
                recipient: confirmationDetails.recipient, 
                amount: confirmationDetails.amount 
              });
              
              const transferSuccess = await transferTokens(confirmationDetails.recipient, confirmationDetails.amount);
              console.log("[DEBUG] Transfer result:", transferSuccess);
              
              toast.dismiss(loadingToastId);

              if (transferSuccess) {
                console.log("[DEBUG] Transfer successful");
                toast.success(`${confirmationDetails.isToSelf ? "Withdrawal" : "Transfer"} of ${confirmationDetails.amount} LEARN successful`);
                setWithdrawAmount("");
                setTransferAmount("");
                setRecipientAddress("");
                setConfirmationOpen(false);

                console.log("[DEBUG] Fetching updated transaction history...");
                await fetchTransactionHistory();

                setStats((prev) => ({
                  ...prev,
                  availableBalance: prev.availableBalance - confirmationDetails.amount,
                }));
              } else {
                console.log("[DEBUG] Transfer failed");
                throw new Error("Transfer failed");
              }
            } catch (error) {
              console.error("[DEBUG] Transfer error:", error);
              toast.error(`Failed to process ${confirmationDetails.isToSelf ? "withdrawal" : "transfer"}: ${error.message || "Unknown error"}`);
            } finally {
              console.log("[DEBUG] Setting processing state to false");
              setProcessingWithdraw(false);
            }
          }}>
            <DialogHeader>
              <DialogTitle>Confirm {confirmationDetails.isToSelf ? "Withdrawal" : "Transfer"}</DialogTitle>
              <DialogDescription>
                Please review the details before proceeding with the {confirmationDetails.isToSelf ? "withdrawal" : "transfer"}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Amount:</span>
                  <span className="font-medium">{formatCurrency(confirmationDetails.amount)} LEARN</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Recipient:</span>
                  <span className="font-mono">{formatAddress(confirmationDetails.recipient)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Remaining Balance:</span>
                  <span className="font-medium">
                    {formatCurrency(stats.availableBalance - confirmationDetails.amount)} LEARN
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">
                    This action cannot be undone. Please make sure all details are correct before proceeding.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  console.log("[DEBUG] Cancel button clicked");
                  if (!processingWithdraw) {
                    setConfirmationOpen(false);
                  }
                }}
                disabled={processingWithdraw}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processingWithdraw}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {processingWithdraw ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm {confirmationDetails.isToSelf ? "Withdrawal" : "Transfer"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InstructorEarnings
