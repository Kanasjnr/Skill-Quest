"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Certificate from "../pages/Certificates"
import LoadingSpinner from "@/components/LoadingSpinner"
import {
  Award,
  BookOpen,
  Copy,
  Send,
  Edit,
  Save,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Shield,
  Wallet,
  RefreshCw,
  Coins,
  User,
  Settings,
  History,
  Github,
  Twitter,
  Globe,
  Target,
  Clock,
  CheckCircle,
  Flame,
  Trophy,
  Star,
  Sparkles,
  Zap,
  FileText,
  Download,
  Share2,
  PlusCircle,
  Trash2,
  Camera,
  Pencil,
  MessageSquare,
  BookMarked,
  Hexagon,
  Play,
} from "lucide-react"
import useSkillQuestUser from "../hooks/useSkillQuestUser"
import useSkillQuestToken from "../hooks/useSkillQuestToken"
import useSkillQuestCertificates from "../hooks/useSkillQuestCertificates"
import useSkillQuestEnrollment from "../hooks/useSkillQuestEnrollment"
import useSkillQuestTransactions from "../hooks/useSkillQuestTransactions"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { toast } from "react-toastify"
import { ethers } from "ethers"

const Profile = () => {
  const { userData, loading: userLoading, error: userError, updateUserProfile } = useSkillQuestUser()
  const { balance, transferTokens, loading: tokenLoading, error: tokenError } = useSkillQuestToken()
  const { certificates, loading: certLoading, error: certError } = useSkillQuestCertificates()
  const { enrolledCourses, completedCourses, loading: coursesLoading, error: coursesError } = useSkillQuestEnrollment()
  const { transactions, loading: txLoading, error: txError, fetchTransactionHistory } = useSkillQuestTransactions()
  const { signer } = useSignerOrProvider()

  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [userProfile, setUserProfile] = useState({
    username: "",
    bio: "",
    website: "",
    twitter: "",
    github: "",
    interests: [],
    learningGoals: [],
    profileImage: "",
    coverImage: "",
  })
  const [transferData, setTransferData] = useState({
    recipient: "",
    amount: "",
  })
  const [processingTransfer, setProcessingTransfer] = useState(false)
  const [processingProfileUpdate, setProcessingProfileUpdate] = useState(false)
  const [userAddress, setUserAddress] = useState("")
  const [refreshingTx, setRefreshingTx] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [newInterest, setNewInterest] = useState("")
  const [newGoal, setNewGoal] = useState("")
  const [timeframe, setTimeframe] = useState("weekly")
  const [showShareOptions, setShowShareOptions] = useState(false)

  // Calculate overall loading state
  useEffect(() => {
    setLoading(userLoading || tokenLoading || certLoading || coursesLoading || txLoading)
  }, [userLoading, tokenLoading, certLoading, coursesLoading, txLoading])

  // Load profile data from blockchain and localStorage
  useEffect(() => {
    if (userData && !userLoading) {
      // First try to get profile from blockchain
      if (userData.name) {
        setUserProfile((prevProfile) => ({
          ...prevProfile,
          username: userData.name || prevProfile.username,
          bio: userData.bio || prevProfile.bio,
        }))
      }

      // Then supplement with localStorage data for fields not in blockchain
      const savedProfile = localStorage.getItem("userProfile")
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile)
        setUserProfile((prevProfile) => ({
          ...prevProfile,
          website: parsedProfile.website || prevProfile.website,
          twitter: parsedProfile.twitter || prevProfile.twitter,
          github: parsedProfile.github || prevProfile.github,
          interests: parsedProfile.interests || [],
          learningGoals: parsedProfile.learningGoals || [],
          profileImage: parsedProfile.profileImage || "",
          coverImage: parsedProfile.coverImage || "",
        }))
      }
    }
  }, [userData, userLoading])

  useEffect(() => {
    const getAddress = async () => {
      if (signer) {
        try {
          const address = await signer.getAddress()
          setUserAddress(address)
        } catch (err) {
          console.error("Error getting address:", err)
        }
      }
    }

    getAddress()
  }, [signer])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setUserProfile({
      ...userProfile,
      [name]: value,
    })
  }

  const addInterest = () => {
    if (newInterest && !userProfile.interests.includes(newInterest)) {
      setUserProfile({
        ...userProfile,
        interests: [...userProfile.interests, newInterest],
      })
      setNewInterest("")
    }
  }

  const removeInterest = (interest) => {
    setUserProfile({
      ...userProfile,
      interests: userProfile.interests.filter((i) => i !== interest),
    })
  }

  const addGoal = () => {
    if (newGoal && !userProfile.learningGoals.includes(newGoal)) {
      setUserProfile({
        ...userProfile,
        learningGoals: [...userProfile.learningGoals, newGoal],
      })
      setNewGoal("")
    }
  }

  const removeGoal = (goal) => {
    setUserProfile({
      ...userProfile,
      learningGoals: userProfile.learningGoals.filter((g) => g !== goal),
    })
  }

  const saveProfile = async () => {
    setProcessingProfileUpdate(true)

    try {
      // Save blockchain data if connected
      if (signer && updateUserProfile) {
        // Only update blockchain data if username or bio changed
        const blockchainUpdateNeeded =
          userProfile.username !== (userData?.name || "") || userProfile.bio !== (userData?.bio || "")

        if (blockchainUpdateNeeded) {
          const success = await updateUserProfile(userProfile.username || "SkillQuest User", userProfile.bio || "")

          if (!success) {
            toast.warning("Profile partially updated. Blockchain update failed.")
          }
        }
      }

      // Always save to localStorage for fields not in blockchain
      localStorage.setItem("userProfile", JSON.stringify(userProfile))
      setEditMode(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Profile update error:", error)
      toast.error("Failed to update profile: " + (error.message || "Unknown error"))
    } finally {
      setProcessingProfileUpdate(false)
    }
  }

  const handleTransferChange = (e) => {
    const { name, value } = e.target
    setTransferData({
      ...transferData,
      [name]: value,
    })
  }

  const handleTransferTokens = async () => {
    if (!transferData.recipient || !transferData.amount) {
      toast.error("Please enter recipient address and amount")
      return
    }

    if (!ethers.isAddress(transferData.recipient)) {
      toast.error("Invalid recipient address")
      return
    }

    if (isNaN(Number.parseFloat(transferData.amount)) || Number.parseFloat(transferData.amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (Number.parseFloat(transferData.amount) > Number.parseFloat(balance)) {
      toast.error("Insufficient balance")
      return
    }

    setProcessingTransfer(true)

    try {
      const success = await transferTokens(transferData.recipient, transferData.amount)
      if (success) {
        toast.success(`Successfully transferred ${transferData.amount} LEARN tokens`)
        setTransferData({
          recipient: "",
          amount: "",
        })
        // Refresh transaction history after successful transfer
        await fetchTransactionHistory()
      }
    } catch (error) {
      console.error("Transfer error:", error)
      toast.error("Transfer failed: " + (error.message || "Unknown error"))
    } finally {
      setProcessingTransfer(false)
    }
  }

  const refreshTransactions = async () => {
    setRefreshingTx(true)
    await fetchTransactionHistory()
    setRefreshingTx(false)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "Invalid date"
    try {
      const date = new Date(timestamp * 1000)
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getTransactionTypeDisplay = (type) => {
    return {
      sent: { icon: <ArrowUpRight className="w-4 h-4 text-red-500" />, text: "Sent", color: "text-red-500" },
      received: {
        icon: <ArrowDownLeft className="w-4 h-4 text-green-500" />,
        text: "Received",
        color: "text-green-500",
      },
    }[type]
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case "course_progress":
        return <BookOpen className="h-5 w-5 text-blue-500" />
      case "certificate_earned":
        return <Award className="h-5 w-5 text-purple-500" />
      case "quiz_completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "course_started":
        return <Play className="h-5 w-5 text-orange-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  // Calculate user stats
  const userStats = useMemo(() => {
    const level = Math.floor((userData?.xp || 0) / 100) + 1
    const nextLevelXp = level * 100
    const currentLevelXp = (level - 1) * 100
    const xpProgress = ((userData?.xp || 0) - currentLevelXp) / (nextLevelXp - currentLevelXp) * 100

    return {
      level,
      xp: userData?.xp || 0,
      nextLevelXp,
      xpProgress
    }
  }, [userData?.xp])

  // Calculate learning stats from actual data
  const learningStats = useMemo(() => {
    const totalHours = enrolledCourses?.reduce((acc, course) => acc + (Number(course.duration) || 0), 0) || 0
    const completedCount = completedCourses?.length || 0
    const enrolledCount = enrolledCourses?.length || 0
    const completionRate = enrolledCount > 0 ? (completedCount / enrolledCount) * 100 : 0
    const weeklyAverage = enrolledCount > 0 ? totalHours / enrolledCount : 0

    return {
      totalHours,
      completionRate,
      enrolledCount,
      completedCount,
      certificateCount: certificates?.length || 0,
      weeklyAverage
    }
  }, [enrolledCourses, completedCourses, certificates])

  // Calculate skill growth from completed courses
  const skillGrowth = useMemo(() => {
    if (!completedCourses) return []
    
    const skills = new Map()
    completedCourses.forEach(course => {
      if (course.tags) {
        course.tags.forEach(tag => {
          const current = skills.get(tag) || 0
          skills.set(tag, current + 1)
        })
      }
    })

    return Array.from(skills.entries()).map(([name, count]) => ({
      name,
      growth: Math.min((count / completedCourses.length) * 100, 100)
    }))
  }, [completedCourses])

  // Calculate achievements from actual data
  const achievements = useMemo(() => {
    if (!userData) return []

    const userAchievements = []
    
    // Course completion achievements
    if (completedCourses?.length >= 5) {
      userAchievements.push({
        id: 1,
        name: "Fast Learner",
        description: "Complete 5 courses",
        icon: <Zap className="h-5 w-5" />,
        earned: true
      })
    }

    // Certificate achievements
    if (certificates?.length >= 3) {
      userAchievements.push({
        id: 2,
        name: "Certified Expert",
        description: "Earn 3 certificates",
        icon: <Award className="h-5 w-5" />,
        earned: true
      })
    }

    // XP achievements
    if (userData.xp >= 1000) {
      userAchievements.push({
        id: 3,
        name: "XP Master",
        description: "Reach 1000 XP",
        icon: <Star className="h-5 w-5" />,
        earned: true
      })
    }

    return userAchievements
  }, [userData, completedCourses, certificates])

  // Calculate recent activity from actual data
  const recentActivity = useMemo(() => {
    const activities = []

    // Helper function to ensure valid UNIX timestamp
    const ensureValidTimestamp = (date) => {
      if (!date) return Math.floor(Date.now() / 1000)
      
      if (typeof date === "string") {
        // Try to parse ISO string to timestamp
        const parsed = Date.parse(date)
        return !isNaN(parsed) ? Math.floor(parsed / 1000) : Math.floor(Date.now() / 1000)
      }
      
      if (typeof date === "number") {
        // If it's already a number, ensure it's in seconds
        return date > 1000000000000 ? Math.floor(date / 1000) : Math.floor(date)
      }
      
      return Math.floor(Date.now() / 1000)
    }

    // Add course completions
    completedCourses?.forEach(course => {
      activities.push({
        id: `course-${course.id}`,
        type: "course_completion",
        course: course.title,
        date: ensureValidTimestamp(course.completionTime)
      })
    })

    // Add certificate earnings
    certificates?.forEach(cert => {
      activities.push({
        id: `cert-${cert.id}`,
        type: "certificate_earned",
        course: cert.courseTitle,
        date: ensureValidTimestamp(cert.issueDate)
      })
    })

    // Sort by date and take most recent 5
    return activities
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
  }, [completedCourses, certificates])

  if (loading) {
    return <LoadingSpinner message="Loading your profile..." />
  }

  if ((userError || tokenError || certError || coursesError) && !userData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <h2 className="text-xl font-semibold text-red-500">Error Loading Profile</h2>
        <p className="text-gray-500 text-center max-w-md">
          {userError || tokenError || certError || coursesError || "Failed to load profile data"}
        </p>
        <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90">
          Retry
        </Button>
      </div>
    )
  }

  if (!signer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
        <p className="text-gray-500">Please connect your wallet to view your profile</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Cover Image */}
        <div className="h-48 md:h-64 w-full rounded-xl overflow-hidden relative">
          {userProfile.coverImage ? (
            <img
              src={userProfile.coverImage || "/placeholder.svg"}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20"></div>
          )}

          {editMode && (
            <div className="absolute bottom-4 right-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="sm" className="rounded-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Change Cover
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload a new cover image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 z-10"></div>
        </div>

        {/* Profile Info */}
        <div className="relative z-20 px-4 sm:px-6 -mt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background rounded-full">
                {userProfile.profileImage ? (
                  <AvatarImage
                    src={userProfile.profileImage || "/placeholder.svg"}
                    alt={userProfile.username || "User"}
                  />
                ) : (
                  <AvatarFallback className="text-2xl bg-primary/10 font-bold">
                    {userProfile.username?.charAt(0) || "?"}
                  </AvatarFallback>
                )}
              </Avatar>

              {editMode && (
                <Button variant="secondary" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{userProfile.username || "SkillQuest User"}</h1>
                <Badge className="bg-primary/20 text-primary border-primary/20">Level {userStats.level}</Badge>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground font-medium">
                <Wallet className="h-4 w-4" />
                <span>{formatAddress(userAddress)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(userAddress)}>
                  <Copy className="h-3 w-3" />
                  <span className="sr-only">Copy address</span>
                </Button>
              </div>
            </div>

            <div className="flex gap-2 mt-4 sm:mt-0">
              {!editMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setShowShareOptions(!showShareOptions)}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    onClick={() => setEditMode(true)}
                    size="sm"
                    className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </>
              ) : (
                <Button
                  onClick={saveProfile}
                  disabled={processingProfileUpdate}
                  size="sm"
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {processingProfileUpdate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              )}
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-4 max-w-md">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">XP: {userStats.xp}</span>
              <span className="text-muted-foreground">Next level: {userStats.nextLevelXp}</span>
            </div>
            <Progress value={userStats.xpProgress} className="h-2" />
          </div>

          {/* Bio */}
          {!editMode ? (
            <div className="mt-4 max-w-2xl">
              <p className="text-muted-foreground">
                {userProfile.bio || "No bio provided yet. Click Edit Profile to add one."}
              </p>
            </div>
          ) : null}

          {/* Social Links */}
          {!editMode && (
            <div className="flex flex-wrap gap-4 mt-4">
              {userProfile.website && (
                <a
                  href={userProfile.website.startsWith("http") ? userProfile.website : `https://${userProfile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              {userProfile.twitter && (
                <a
                  href={`https://twitter.com/${userProfile.twitter.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  {userProfile.twitter}
                </a>
              )}
              {userProfile.github && (
                <a
                  href={`https://github.com/${userProfile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-4 w-4" />
                  {userProfile.github}
                </a>
              )}
            </div>
          )}

          {/* Interests Tags */}
          {!editMode && userProfile.interests && userProfile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {userProfile.interests.map((interest, index) => (
                <Badge key={index} variant="outline" className="bg-secondary/50">
                  {interest}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab} value={activeTab}>
        <div className="border-b">
          <div className="container flex-col sm:flex-row flex items-start sm:items-center justify-between py-2">
            <TabsList className="mb-4 sm:mb-0">
              <TabsTrigger value="overview" className="text-sm">
                <User className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="learning" className="text-sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="wallet" className="text-sm">
                <Wallet className="h-4 w-4 mr-2" />
                Wallet
              </TabsTrigger>
              <TabsTrigger value="certificates" className="text-sm">
                <Shield className="h-4 w-4 mr-2" />
                Certificates
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Coins className="h-3.5 w-3.5 mr-1" />
                {balance || "0.00"} LEARN
              </Badge>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Stats Summary */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Learning Summary</CardTitle>
                <CardDescription>Your learning progress and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                    <BookOpen className="h-8 w-8 text-primary mb-2" />
                    <div className="text-2xl font-bold">{learningStats.enrolledCount}</div>
                    <p className="text-xs text-muted-foreground">Enrolled Courses</p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                    <div className="text-2xl font-bold">{learningStats.completedCount}</div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                    <Award className="h-8 w-8 text-purple-500 mb-2" />
                    <div className="text-2xl font-bold">{learningStats.certificateCount}</div>
                    <p className="text-xs text-muted-foreground">Certificates</p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                    <Clock className="h-8 w-8 text-blue-500 mb-2" />
                    <div className="text-2xl font-bold">{learningStats.totalHours}</div>
                    <p className="text-xs text-muted-foreground">Learning Hours</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Completion Rate</h3>
                  <div className="flex items-center">
                    <Progress value={learningStats.completionRate} className="h-2 flex-1" />
                    <span className="ml-2 text-sm font-medium">{learningStats.completionRate}%</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/my-learning">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View All Courses
                  </a>
                </Button>
              </CardFooter>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Badges and milestones you've earned</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/10">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {achievement.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{achievement.name}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("learning")}>
                  <Trophy className="h-4 w-4 mr-2" />
                  View All Achievements
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest learning activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          {activity.type === "course_progress" && `Updated progress on ${activity.course}`}
                          {activity.type === "certificate_earned" && `Earned certificate for ${activity.course}`}
                          {activity.type === "quiz_completed" && `Completed quiz in ${activity.course}`}
                          {activity.type === "course_started" && `Started learning ${activity.course}`}
                        </h4>
                        <span className="text-xs text-muted-foreground">{formatDate(activity.date)}</span>
                      </div>
                      {activity.type === "course_progress" && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{activity.progress}%</span>
                          </div>
                          <Progress value={activity.progress} className="h-1.5" />
                        </div>
                      )}
                      {activity.type === "quiz_completed" && (
                        <p className="text-xs text-muted-foreground mt-1">Score: {activity.score}%</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Learning Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Goals</CardTitle>
              <CardDescription>Track your learning objectives</CardDescription>
            </CardHeader>
            <CardContent>
              {userProfile.learningGoals && userProfile.learningGoals.length > 0 ? (
                <div className="space-y-3">
                  {userProfile.learningGoals.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-primary" />
                        <span>{goal}</span>
                      </div>
                      <Badge variant="outline" className="bg-secondary/20">
                        In Progress
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No Goals Set</h3>
                  <p className="text-sm text-muted-foreground mb-4">Set learning goals to track your progress</p>
                  <Button onClick={() => setActiveTab("settings")} variant="outline">
                    Add Goals
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="space-y-6">
          {/* Learning Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Analytics</CardTitle>
              <CardDescription>Insights into your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Weekly Average</h3>
                      <p className="text-2xl font-bold">{learningStats.weeklyAverage.toFixed(1)} hours</p>
                    </div>
                    <Clock className="h-8 w-8 text-primary/40" />
                  </div>

                  <Select defaultValue={timeframe}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium mb-3">Learning Streak</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-16 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <Flame className="h-6 w-6 text-orange-500" />
                        <span className="text-2xl font-bold">{learningStats.enrolledCount}</span>
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                    </div>
                    <div className="flex-1 h-16 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        <span className="text-2xl font-bold">{learningStats.completedCount}</span>
                        <span className="text-sm text-muted-foreground">avg. score</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-sm font-medium mb-4">Skill Growth</h3>
                <div className="space-y-4">
                  {skillGrowth.map((skill, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{skill.name}</span>
                        <span className="text-muted-foreground">{skill.growth}%</span>
                      </div>
                      <Progress value={skill.growth} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Badges and rewards you've earned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border flex flex-col items-center text-center ${
                      achievement.earned ? "bg-primary/5 border-primary/20" : "bg-muted/20 opacity-60"
                    }`}
                  >
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${
                        achievement.earned ? "bg-primary/20" : "bg-muted"
                      }`}
                    >
                      {achievement.icon}
                    </div>
                    <h4 className="font-medium">{achievement.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                    {achievement.earned ? (
                      <Badge className="mt-3 bg-primary/20 text-primary border-primary/10">Earned</Badge>
                    ) : (
                      <Badge variant="outline" className="mt-3">
                        Locked
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Course Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Course Progress</CardTitle>
              <CardDescription>Track your ongoing courses</CardDescription>
            </CardHeader>
            <CardContent>
              {enrolledCourses && enrolledCourses.length > 0 ? (
                <div className="space-y-4">
                  {enrolledCourses.slice(0, 3).map((course, index) => (
                    <div key={index} className="p-4 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{course.title}</h4>
                        <Badge variant="outline" className="bg-secondary/20">
                          {course.progress || 0}% Complete
                        </Badge>
                      </div>
                      <Progress value={Number(course.progress || 0)} className="h-2 mb-3" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Enrolled: {new Date(course.enrollmentTime).toLocaleDateString()}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/learn/${course.id}`}>Continue</a>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {enrolledCourses.length > 3 && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href="/my-learning">View All Courses</a>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No Courses In Progress</h3>
                  <p className="text-sm text-muted-foreground mb-4">Enroll in courses to start learning</p>
                  <Button asChild>
                    <a href="/courses">Browse Courses</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Balance Card */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>LEARN Balance</CardTitle>
                <CardDescription>Your current token balance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                      <Coins className="h-10 w-10 text-primary" />
                    </div>
                    <div className="text-3xl font-bold">{balance || "0.00"}</div>
                    <p className="text-sm text-muted-foreground mt-1">LEARN Tokens</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transfer Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Transfer Tokens</CardTitle>
                <CardDescription>Send LEARN tokens to another address</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                      id="recipient"
                      name="recipient"
                      placeholder="0x..."
                      value={transferData.recipient}
                      onChange={handleTransferChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="amount">Amount</Label>
                      <span className="text-sm text-muted-foreground">Balance: {balance || "0.00"}</span>
                    </div>
                    <div className="relative">
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        placeholder="0.00"
                        value={transferData.amount}
                        onChange={handleTransferChange}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-sm text-muted-foreground">LEARN</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleTransferTokens}
                  disabled={processingTransfer || !transferData.recipient || !transferData.amount}
                  className="w-full sm:w-auto"
                >
                  {processingTransfer ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Tokens
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction History</CardTitle>
                <Button
                  onClick={refreshTransactions}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={refreshingTx}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshingTx ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              <CardDescription>Your complete LEARN token transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            transaction.type === "received"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-blue-100 dark:bg-blue-900/30"
                          }`}
                        >
                          {transaction.type === "received" ? (
                            <ArrowDownLeft
                              className={`h-5 w-5 ${
                                transaction.type === "received"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-blue-600 dark:text-blue-400"
                              }`}
                            />
                          ) : (
                            <ArrowUpRight
                              className={`h-5 w-5 ${
                                transaction.type === "received"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-blue-600 dark:text-blue-400"
                              }`}
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {transaction.type === "received" ? "Received from" : "Sent to"}{" "}
                            {formatAddress(transaction.type === "received" ? transaction.from : transaction.to)}
                          </h4>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.timestamp)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            transaction.type === "received"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {transaction.type === "received" ? "+" : "-"}
                          {transaction.amount} LEARN
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                    <History className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Transactions Found</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Your transaction history will appear here once you start sending or receiving LEARN tokens.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-6">
          <Card>
            {/* <CardHeader>
              <CardTitle className="font-bold">Certificates</CardTitle>
              <CardDescription>View and manage your earned certificates</CardDescription>
            </CardHeader> */}
            <CardContent>
              {certificates?.length > 0 ? (
                <div className="grid gap-6">
                  {certificates.map((certificate) => (
                    <Certificate key={certificate.id} certificate={certificate} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                    <Shield className="h-6 w-6 text-muted-foreground font-bold" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">No Certificates Yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto font-medium">
                    Complete courses to earn certificates that verify your skills.
                  </p>
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                    <a href="/courses">Browse Courses</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-username">Username</Label>
                <Input
                  id="settings-username"
                  name="username"
                  value={userProfile.username}
                  onChange={handleProfileChange}
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-bio">Bio</Label>
                <Textarea
                  id="settings-bio"
                  name="bio"
                  value={userProfile.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-website">Website</Label>
                <Input
                  id="settings-website"
                  name="website"
                  value={userProfile.website}
                  onChange={handleProfileChange}
                  placeholder="Your website URL"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-twitter">Twitter</Label>
                  <Input
                    id="settings-twitter"
                    name="twitter"
                    value={userProfile.twitter}
                    onChange={handleProfileChange}
                    placeholder="Twitter handle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-github">GitHub</Label>
                  <Input
                    id="settings-github"
                    name="github"
                    value={userProfile.github}
                    onChange={handleProfileChange}
                    placeholder="GitHub username"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Interests</CardTitle>
              <CardDescription>Add topics you're interested in learning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {userProfile.interests &&
                    userProfile.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {interest}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-transparent"
                          onClick={() => removeInterest(interest)}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </Badge>
                    ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add a new interest"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addInterest} disabled={!newInterest}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Goals</CardTitle>
              <CardDescription>Set goals for your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  {userProfile.learningGoals &&
                    userProfile.learningGoals.map((goal, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-primary" />
                          <span>{goal}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeGoal(goal)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add a new learning goal"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addGoal} disabled={!newGoal}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your blockchain account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <div className="flex items-center">
                  <Input value={userAddress} readOnly className="font-mono" />
                  <Button variant="ghost" size="icon" className="ml-2" onClick={() => copyToClipboard(userAddress)}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy address</span>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="p-3 rounded-md border bg-muted/50">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {userData?.registrationTime
                        ? new Date(Number(userData.registrationTime) * 1000).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Not registered yet"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Profile
