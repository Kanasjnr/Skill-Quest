"use client"

import { useEffect, useState, useRef } from "react"
import { Award, BookOpen, TrendingUp, Zap, GraduationCap, User, ChevronRight, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Progress } from "../components/ui/progress"
import { Button } from "../components/ui/button"
import CourseCard from "../components/courses/CourseCard"
import AchievementCard from "../components/achivement/AchievementCard"
import LeaderboardCard from "../components/Leaderboard/LeaderboardCard"
import ActivityFeed from "../components/activity/ActivityFeed"
import useSkillQuestUser from "../hooks/useSkillQuestUser"
import useSkillQuestInstructor from "../hooks/useSkillQuestInstructor"
import useSkillQuestEnrollment from "../hooks/useSkillQuestEnrollment"
import useSkillQuestToken from "../hooks/useSkillQuestToken"
import useSkillQuestAchievements from "../hooks/useSkillQuestAchievements"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
import LoadingSpinner from "../components/LoadingSpinner"

const Dashboard = () => {
  console.log("[DEBUG] Dashboard component rendered")
  const { userData, isRegistered, registerUser, loading: userLoading, error: userError } = useSkillQuestUser()
  const { registerInstructor, loading: instructorLoading } = useSkillQuestInstructor()
  const {
    enrolledCourses,
    completedCourses,
    loading: enrollmentLoading,
    error: enrollmentError,
    fetchEnrolledCourses,
  } = useSkillQuestEnrollment()
  const { balance, loading: tokenLoading, error: tokenError, fetchBalance } = useSkillQuestToken()
  const {
    achievements,
    fetchUserAchievements,
    loading: achievementsLoading,
    error: achievementsError,
  } = useSkillQuestAchievements()
  const { signer } = useSignerOrProvider()
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState(null)
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const isMounted = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Calculate user level and progress to next level
  const calculateLevelInfo = (xp) => {
    const xpValue = Number(xp || 0)
    const currentLevel = Math.floor(xpValue / 100) + 1
    const nextLevelXp = currentLevel * 100
    const currentLevelXp = (currentLevel - 1) * 100
    const progress = ((xpValue - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100

    return {
      level: currentLevel,
      progress: progress,
      xpToNextLevel: nextLevelXp - xpValue,
    }
  }

  // Load user data and achievements when wallet is connected
  useEffect(() => {
    const loadUserData = async () => {
      if (signer && isMounted.current) {
        try {
          setLoading(true)
          const address = await signer.getAddress()

          // Only fetch data if user is registered
          if (isRegistered) {
            await Promise.all([
              fetchUserAchievements(address),
              fetchEnrolledCourses(),
              fetchBalance()
            ])
            
            if (isMounted.current) {
              // Get actual activities from blockchain
              const userActivities = [
                ...enrolledCourses.map((course) => ({
                  id: course.id,
                  type: "course_enrollment",
                  title: `Enrolled in ${course.title}`,
                  timestamp: course.enrollmentTime || new Date().toLocaleString(),
                  icon: <BookOpen className="h-4 w-4" />
                })),
                ...completedCourses.map((course) => ({
                  id: course.id,
                  type: "course_completion",
                  title: `Completed ${course.title}`,
                  timestamp: course.completionTime || new Date().toLocaleString(),
                  icon: <GraduationCap className="h-4 w-4" />
                }))
              ]
              // Sort activities by timestamp in descending order
              userActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              setActivities(userActivities)
            }
          } else {
            if (isMounted.current) {
              setActivities([])
            }
          }
        } catch (err) {
          console.error("Dashboard data loading error:", err.message)
          toast.error("Failed to load your dashboard data")
        } finally {
          if (isMounted.current) {
            setLoading(false)
          }
        }
      } else {
        if (isMounted.current) {
          setActivities([])
        }
      }
    }

    loadUserData()
  }, [signer, isRegistered, fetchUserAchievements, fetchEnrolledCourses, fetchBalance])

  // Update activities when enrolled or completed courses change
  useEffect(() => {
    if (isRegistered && enrolledCourses.length > 0 || completedCourses.length > 0) {
      const userActivities = [
        ...enrolledCourses.map((course) => ({
          id: course.id,
          type: "course_enrollment",
          title: `Enrolled in ${course.title}`,
          timestamp: course.enrollmentTime || new Date().toLocaleString(),
          icon: <BookOpen className="h-4 w-4" />
        })),
        ...completedCourses.map((course) => ({
          id: course.id,
          type: "course_completion",
          title: `Completed ${course.title}`,
          timestamp: course.completionTime || new Date().toLocaleString(),
          icon: <GraduationCap className="h-4 w-4" />
        }))
      ]
      userActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setActivities(userActivities)
    }
  }, [enrolledCourses, completedCourses, isRegistered])

  // Update loading state to include all loading states
  useEffect(() => {
    setLoading(userLoading || instructorLoading || enrollmentLoading || achievementsLoading || tokenLoading)
  }, [userLoading, instructorLoading, enrollmentLoading, achievementsLoading, tokenLoading])

  // Handle registration if user is not registered
  const handleRegistration = async (name, role, bio, expertise) => {
    console.log("[DEBUG] handleRegistration called with:", { name, role, bio, expertise })
    
    if (!signer) {
      console.error("[DEBUG] No signer available")
      toast.error("Please connect your wallet")
      return
    }

    try {
      console.log("[DEBUG] Starting registration process")
      setLoading(true)
      let success = false

      if (role === "instructor") {
        console.log("[DEBUG] Attempting instructor registration")
        // Use instructor registration for instructor role
        success = await registerInstructor(name, bio, "", expertise)
      } else {
        console.log("[DEBUG] Attempting student registration")
        // Use user registration for student role
        success = await registerUser(name, role, bio, "")
      }

      console.log("[DEBUG] Registration success:", success)

      if (success) {
        console.log("[DEBUG] Registration successful, showing success message")
        toast.success("Registration successful!")
        // Wait for the registration to be processed and state to be updated
        console.log("[DEBUG] Waiting for state update...")
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Check if registration was successful by verifying the role
        console.log("[DEBUG] Navigating based on role:", role)
        if (role === "instructor") {
          navigate("/instructor")
        } else {
          navigate("/dashboard")
        }
      }
    } catch (error) {
      console.error("[DEBUG] Registration error:", error.message)
      toast.error("Registration failed: " + (error.message || "Unknown error"))
      // Reset role selection on error
      setSelectedRole(null)
    } finally {
      setLoading(false)
    }
  }

  // Consistent Icon Color
  const iconColor = "text-sky-600 dark:text-sky-400"
  const accentIconColor = "text-yellow-500 dark:text-yellow-400"
  const positiveIconColor = "text-green-500 dark:text-green-400"

  // Show loading state while checking registration status
  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />
  }

  // Show wallet connection prompt if not connected
  if (!signer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
        <p className="text-gray-500">Please connect your wallet to view your dashboard</p>
      </div>
    )
  }

  // Show registration form if not registered or if user data is empty
  if (!isRegistered || !userData?.name) {
    console.log("[DEBUG] User is not registered or has empty data, showing registration form")
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome to SkillQuest</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Choose your role to get started</p>
        </div>

        {!selectedRole ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <Card
              className="cursor-pointer hover:border-sky-500 transition-colors"
              onClick={() => {
                console.log("[DEBUG] Student role selected")
                setSelectedRole("student")
              }}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                <User className="h-12 w-12 text-sky-600" />
                <h3 className="text-xl font-semibold">Student</h3>
                <p className="text-center text-slate-600 dark:text-slate-400">Learn new skills and earn certificates</p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:border-sky-500 transition-colors"
              onClick={() => {
                console.log("[DEBUG] Instructor role selected")
                setSelectedRole("instructor")
              }}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                <GraduationCap className="h-12 w-12 text-sky-600" />
                <h3 className="text-xl font-semibold">Instructor</h3>
                <p className="text-center text-slate-600 dark:text-slate-400">Create courses and earn rewards</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                console.log("[DEBUG] Registration form submitted")
                const formData = new FormData(e.target)
                const name = formData.get("name")
                const bio = formData.get("bio")
                const expertise = formData.get("expertise")

                if (!name?.trim()) {
                  toast.error("Name is required")
                  return
                }

                if (selectedRole === "instructor" && !expertise?.trim()) {
                  toast.error("Expertise is required for instructors")
                  return
                }

                console.log("[DEBUG] Calling handleRegistration with:", { 
                  name, 
                  role: selectedRole, 
                  bio, 
                  expertise 
                })
                await handleRegistration(
                  name.trim(), 
                  selectedRole, 
                  bio?.trim() || "", 
                  expertise?.trim() || "Web3 Development"
                )
              }}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:bg-slate-700 dark:text-white sm:text-sm"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    id="bio"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:bg-slate-700 dark:text-white sm:text-sm"
                    placeholder="Tell us about yourself"
                  />
                </div>

                {selectedRole === "instructor" && (
                  <div>
                    <label htmlFor="expertise" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Expertise
                    </label>
                    <select
                      name="expertise"
                      id="expertise"
                      required
                      className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:bg-slate-700 dark:text-white sm:text-sm"
                    >
                      <option value="">Select your expertise</option>
                      <option value="Web3 Development">Web3 Development</option>
                      <option value="Blockchain Development">Blockchain Development</option>
                      <option value="Smart Contract Development">Smart Contract Development</option>
                      <option value="DeFi Development">DeFi Development</option>
                      <option value="NFT Development">NFT Development</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile Development">Mobile Development</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Machine Learning">Machine Learning</option>
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRole(null)}
                    className="flex-1 py-2 px-4 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={userLoading}
                    className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
                      userLoading ? "bg-slate-400 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-700"
                    }`}
                  >
                    {userLoading ? "Registering..." : "Register Now"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    )
  }

  // If user is registered but not a student, redirect to instructor dashboard
  if (userData?.role === "instructor") {
    navigate("/instructor")
    return null
  }

  // Show student dashboard if registered
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {userData?.name || "Learner"}!</h1>
            <p className="mt-1 text-sky-100">Continue your learning journey</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center bg-white/20 rounded-lg px-4 py-2">
            <Award className="h-5 w-5 mr-2 text-yellow-300" />
            <span>Level {calculateLevelInfo(userData?.xp).level}</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Award className={iconColor} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.xp || 0}</div>
            <p className="text-xs text-muted-foreground">Level {calculateLevelInfo(userData?.xp).level}</p>
            <Progress value={calculateLevelInfo(userData?.xp).progress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {calculateLevelInfo(userData?.xp).xpToNextLevel} XP to next level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LEARN Tokens</CardTitle>
            <Zap className={accentIconColor} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance || 0}</div>
            <p className="text-xs text-muted-foreground">Available for enrollment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className={positiveIconColor} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledCourses.length}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
            <TrendingUp className={positiveIconColor} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCourses.length}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Continue Learning</h2>
          <Button variant="outline" size="sm" onClick={() => navigate("/courses")}>
            View All Courses <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {enrollmentLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner message="Loading your courses..." />
          </div>
        ) : enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} onClick={() => navigate(`/course/${course.id}`)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-100">No courses yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Explore our course catalog and start learning today!
            </p>
            <Button className="mt-4" onClick={() => navigate("/courses")}>
              Browse Courses
            </Button>
          </div>
        )}
      </div>

      {/* Learning Progress */}
      {enrolledCourses.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Learning Progress</h2>
          <div className="space-y-4">
            {enrolledCourses.slice(0, 3).map((course) => (
              <Card key={course.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{course.title}</h3>
                    <span className="text-sm font-medium">{course.progress || 0}%</span>
                  </div>
                  <Progress value={course.progress || 0} className="h-2" />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-500">
                      {course.completedLessons || 0}/{course.totalLessons || 0} lessons
                    </span>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sky-600 dark:text-sky-400"
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Achievements</h2>
          {achievements.length > 3 && (
            <Button variant="outline" size="sm" onClick={() => navigate("/achievements")}>
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>

        {achievementsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner message="Loading your achievements..." />
          </div>
        ) : achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.slice(0, 3).map((achievement) => (
              <AchievementCard
                key={achievement.id}
                title={achievement.title}
                description={achievement.description}
                icon={<Award className="h-5 w-5 text-yellow-500" />}
                date={achievement.date || "Recently earned"}
                xp={achievement.xpReward || 50}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <Award className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-100">No achievements yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Complete courses and quizzes to earn achievements!
            </p>
          </div>
        )}
      </div>

      {/* Two Column Layout for Leaderboard and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
          <LeaderboardCard />
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Recommended Courses */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recommended For You</h2>
        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.slice(0, 3).map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="h-40 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-1">{course.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    {course.description || "Continue your learning journey"}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm">{course.tokenReward} LEARN</span>
                    </div>
                    <Button size="sm" onClick={() => navigate(`/course/${course.id}`)}>
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-100">No courses yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Explore our course catalog and start learning today!
            </p>
            <Button className="mt-4" onClick={() => navigate("/courses")}>
              Browse Courses
            </Button>
          </div>
        )}
      </div>

      {/* Learning Streak */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Your Learning Streak</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Keep learning daily to maintain your streak!</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span className="font-medium">{userData?.streak || 0} days</span>
            </div>
          </div>

          <div className="flex justify-between">
            {[1, 2, 3, 4, 5, 6, 7].map((day, i) => {
              const isActive = i < (userData?.streak || 0)
              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      isActive
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {isActive && <Award className="h-4 w-4" />}
                  </div>
                  <span className="text-xs">
                    {i === 0
                      ? "Mon"
                      : i === 1
                        ? "Tue"
                        : i === 2
                          ? "Wed"
                          : i === 3
                            ? "Thu"
                            : i === 4
                              ? "Fri"
                              : i === 5
                                ? "Sat"
                                : "Sun"}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
