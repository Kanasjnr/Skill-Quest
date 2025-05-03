"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Badge } from "../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Separator } from "../components/ui/separator"
import { Progress } from "../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Switch } from "../components/ui/switch"
import { Alert, AlertDescription } from "../components/ui/alert"
import {
  User,
  Edit,
  Save,
  Award,
  BookOpen,
  Users,
  DollarSign,
  Star,
  Loader2,
  Globe,
  Twitter,
  Github,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  Trash2,
  Link,
  Copy,
  Calendar,
  BarChart3,
  MessageSquare,
} from "lucide-react"
import useSkillQuestInstructor from "../hooks/useSkillQuestInstructor"
import useSkillQuestCourses from "../hooks/useSkillQuestCourses"
import useSkillQuestReviews from "../hooks/useSkillQuestReviews"
import LoadingSpinner from "../components/LoadingSpinner"
import { toast } from "react-toastify"

const InstructorProfile = () => {
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [profileCompleteness, setProfileCompleteness] = useState(0)
  const [profileVisibility, setProfileVisibility] = useState(true)
  const [activeTab, setActiveTab] = useState("profile")
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    expertise: "",
    website: "",
    twitter: "",
    github: "",
    linkedin: "",
    location: "",
    title: "",
    profileImage: "",
    joinedDate: "",
    languages: "",
    education: "",
    certificates: "",
  })

  const {
    instructorData,
    isRegistered,
    registerInstructor,
    updateInstructorProfile,
    updateProfileImage,
    updateProfileVisibility,
    loading: instructorLoading,
    error: instructorError,
  } = useSkillQuestInstructor()

  const {
    instructorCourses,
    fetchInstructorCourses,
    loading: coursesLoading,
    error: coursesError,
  } = useSkillQuestCourses()

  const { reviews, fetchInstructorReviews, loading: reviewsLoading, error: reviewsError } = useSkillQuestReviews()

  useEffect(() => {
    setLoading(instructorLoading || coursesLoading || reviewsLoading)
    setError(instructorError || coursesError || reviewsError)
  }, [instructorLoading, coursesLoading, reviewsLoading, instructorError, coursesError, reviewsError])

  useEffect(() => {
    if (instructorData) {
      setProfile({
        name: instructorData.name || "",
        bio: instructorData.bio || "",
        expertise: instructorData.expertise || "",
        website: instructorData.website || "",
        twitter: instructorData.twitter || "",
        github: instructorData.github || "",
        linkedin: instructorData.linkedin || "",
        location: instructorData.location || "",
        title: instructorData.title || "",
        profileImage: instructorData.profileImage || "",
        joinedDate: instructorData.joinedDate || new Date().toISOString().split("T")[0],
        languages: instructorData.languages || "",
        education: instructorData.education || "",
        certificates: instructorData.certificates || "",
      })
      setProfileVisibility(instructorData.isPublic !== false)

      // Calculate profile completeness
      calculateProfileCompleteness(instructorData)
    }
  }, [instructorData])

  const calculateProfileCompleteness = (data) => {
    const fields = [
      "name",
      "bio",
      "expertise",
      "website",
      "twitter",
      "github",
      "linkedin",
      "location",
      "title",
      "profileImage",
      "languages",
      "education",
      "certificates",
    ]

    const filledFields = fields.filter((field) => data[field] && data[field].trim() !== "").length
    const completeness = Math.round((filledFields / fields.length) * 100)
    setProfileCompleteness(completeness)
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfile({
      ...profile,
      [name]: value,
    })
  }

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      const success = await updateInstructorProfile({
        ...profile,
        isPublic: profileVisibility,
      })

      if (success) {
        toast.success("Profile updated successfully")
        setEditMode(false)
        calculateProfileCompleteness(profile)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile: " + (error.message || "Unknown error"))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const success = await updateProfileImage(file)

      if (success) {
        toast.success("Profile image updated successfully")
        // Update local state with new image URL
        setProfile({
          ...profile,
          profileImage: URL.createObjectURL(file), // Temporary URL for preview
        })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image: " + (error.message || "Unknown error"))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleVisibilityChange = async () => {
    try {
      const newVisibility = !profileVisibility
      setProfileVisibility(newVisibility)

      const success = await updateProfileVisibility(newVisibility)
      if (success) {
        toast.success(`Profile is now ${newVisibility ? "public" : "private"}`)
      }
    } catch (error) {
      console.error("Error updating visibility:", error)
      toast.error("Failed to update visibility: " + (error.message || "Unknown error"))
      // Revert the UI change if the API call fails
      setProfileVisibility(!profileVisibility)
    }
  }

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/instructor/${profile.name.toLowerCase().replace(/\s+/g, "-")}`
    navigator.clipboard.writeText(profileUrl)
    toast.success("Profile link copied to clipboard")
  }

  const getAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0
    return (reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length).toFixed(1)
  }

  const getTotalStudents = () => {
    if (!instructorCourses) return 0
    return instructorCourses.reduce((sum, course) => sum + Number(course.enrollmentCount), 0)
  }

  const getTotalRevenue = () => {
    if (!instructorCourses) return 0
    return instructorCourses.reduce((sum, course) => sum + Number(course.price) * Number(course.enrollmentCount), 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading profile: {error}</AlertDescription>
      </Alert>
    )
  }

  if (!isRegistered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Become an Instructor</h2>
        <p className="text-gray-500">Register as an instructor to manage your profile</p>
        <Button onClick={() => (window.location.href = "/instructor")} className="bg-purple-600 hover:bg-purple-700">
          Register as Instructor
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Instructor Profile</h1>
          <p className="text-muted-foreground">Manage your public instructor profile and information</p>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)} disabled={savingProfile}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)} className="bg-purple-600 hover:bg-purple-700">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-4 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="settings" className="hidden md:block">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Card */}
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <div className="relative mx-auto w-24 h-24 mb-2">
                  <Avatar className="w-24 h-24 border-2 border-purple-200">
                    {profile.profileImage ? (
                      <AvatarImage src={profile.profileImage || "/placeholder.svg"} alt={profile.name} />
                    ) : (
                      <AvatarFallback className="text-3xl bg-purple-100 text-purple-700">
                        {profile.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {editMode && (
                    <div className="absolute bottom-0 right-0">
                      <label htmlFor="profile-image" className="cursor-pointer">
                        <div className="rounded-full bg-purple-600 p-2 text-white hover:bg-purple-700">
                          <Upload className="h-4 w-4" />
                        </div>
                        <input
                          id="profile-image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  )}
                </div>
                <CardTitle>{profile.name || "Instructor"}</CardTitle>
                <CardDescription>{profile.title || "Course Instructor"}</CardDescription>
                <div className="flex justify-center mt-2 space-x-2">
                  <Badge variant="secondary">Instructor</Badge>
                  {profileCompleteness >= 80 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profile Completeness</span>
                    <span className="font-medium">{profileCompleteness}%</span>
                  </div>
                  <Progress value={profileCompleteness} className="h-2" />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {formatDate(profile.joinedDate)}</span>
                  </div>
                  {profile.location && (
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.languages && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.languages}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between">
                  {profile.website && (
                    <a
                      href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                  {profile.twitter && (
                    <a
                      href={`https://twitter.com/${profile.twitter.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {profile.github && (
                    <a
                      href={`https://github.com/${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {profile.linkedin && (
                    <a
                      href={
                        profile.linkedin.startsWith("http")
                          ? profile.linkedin
                          : `https://linkedin.com/in/${profile.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <Link className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={copyProfileLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Profile Link
                </Button>
              </CardFooter>
            </Card>

            {/* Profile Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your public instructor information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {editMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={profile.name}
                          onChange={handleProfileChange}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Professional Title</Label>
                        <Input
                          id="title"
                          name="title"
                          value={profile.title}
                          onChange={handleProfileChange}
                          placeholder="e.g. Senior Developer, UX Designer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Biography</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profile.bio}
                        onChange={handleProfileChange}
                        placeholder="Tell students about yourself and your teaching style"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expertise">Areas of Expertise</Label>
                        <Input
                          id="expertise"
                          name="expertise"
                          value={profile.expertise}
                          onChange={handleProfileChange}
                          placeholder="e.g. Web Development, Machine Learning"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          name="location"
                          value={profile.location}
                          onChange={handleProfileChange}
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="languages">Languages</Label>
                      <Input
                        id="languages"
                        name="languages"
                        value={profile.languages}
                        onChange={handleProfileChange}
                        placeholder="e.g. English (Native), Spanish (Fluent)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="education">Education</Label>
                      <Textarea
                        id="education"
                        name="education"
                        value={profile.education}
                        onChange={handleProfileChange}
                        placeholder="Your educational background"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certificates">Certificates & Credentials</Label>
                      <Textarea
                        id="certificates"
                        name="certificates"
                        value={profile.certificates}
                        onChange={handleProfileChange}
                        placeholder="List relevant certificates and credentials"
                        rows={2}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Social Links</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            name="website"
                            value={profile.website}
                            onChange={handleProfileChange}
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            name="linkedin"
                            value={profile.linkedin}
                            onChange={handleProfileChange}
                            placeholder="LinkedIn profile URL or username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="twitter">Twitter</Label>
                          <Input
                            id="twitter"
                            name="twitter"
                            value={profile.twitter}
                            onChange={handleProfileChange}
                            placeholder="Twitter handle (without @)"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="github">GitHub</Label>
                          <Input
                            id="github"
                            name="github"
                            value={profile.github}
                            onChange={handleProfileChange}
                            placeholder="GitHub username"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {profile.bio ? (
                      <div className="space-y-2">
                        <h3 className="font-medium">About</h3>
                        <p className="text-sm text-muted-foreground">{profile.bio}</p>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No biography added yet.</p>
                      </div>
                    )}

                    {profile.expertise && (
                      <div className="space-y-2">
                        <h3 className="font-medium">Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.expertise.split(",").map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.education && (
                      <div className="space-y-2">
                        <h3 className="font-medium">Education</h3>
                        <p className="text-sm text-muted-foreground">{profile.education}</p>
                      </div>
                    )}

                    {profile.certificates && (
                      <div className="space-y-2">
                        <h3 className="font-medium">Certificates & Credentials</h3>
                        <p className="text-sm text-muted-foreground">{profile.certificates}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{instructorCourses?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {instructorCourses?.length > 0 ? "Active courses" : "No courses yet"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalStudents()}</div>
                <p className="text-xs text-muted-foreground">
                  {getTotalStudents() > 0 ? "Enrolled students" : "No students yet"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalRevenue()} LEARN</div>
                <p className="text-xs text-muted-foreground">
                  {getTotalRevenue() > 0 ? "Lifetime earnings" : "No revenue yet"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getAverageRating()} / 5</div>
                <p className="text-xs text-muted-foreground">
                  {reviews?.length || 0} {reviews?.length === 1 ? "review" : "reviews"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your teaching milestones and accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-4 rounded-lg border p-4">
                  <div className="rounded-full bg-yellow-100 p-2">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Course Creator</h4>
                    <p className="text-sm text-muted-foreground">Published first course</p>
                  </div>
                </div>

                <div
                  className={`flex items-center space-x-4 rounded-lg border p-4 ${getTotalStudents() >= 100 ? "" : "opacity-50"}`}
                >
                  <div className={`rounded-full ${getTotalStudents() >= 100 ? "bg-green-100" : "bg-gray-100"} p-2`}>
                    <Users className={`h-6 w-6 ${getTotalStudents() >= 100 ? "text-green-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <h4 className="font-medium">Popular Instructor</h4>
                    <p className="text-sm text-muted-foreground">Reached 100 students</p>
                  </div>
                </div>

                <div
                  className={`flex items-center space-x-4 rounded-lg border p-4 ${getAverageRating() >= 4.5 ? "" : "opacity-50"}`}
                >
                  <div className={`rounded-full ${getAverageRating() >= 4.5 ? "bg-purple-100" : "bg-gray-100"} p-2`}>
                    <Star className={`h-6 w-6 ${getAverageRating() >= 4.5 ? "text-purple-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <h4 className="font-medium">Top Rated</h4>
                    <p className="text-sm text-muted-foreground">Maintained 4.5+ rating</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>Courses you've created on SkillQuest</CardDescription>
            </CardHeader>
            <CardContent>
              {instructorCourses && instructorCourses.length > 0 ? (
                <div className="space-y-4">
                  {instructorCourses.map((course, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4 mb-4 md:mb-0">
                        <div className="w-16 h-16 rounded-md bg-purple-100 flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{course.title}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Users className="h-3 w-3 mr-1" /> {course.enrollmentCount} Students
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Star className="h-3 w-3 mr-1" /> {course.rating || "0"} Rating
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <DollarSign className="h-3 w-3 mr-1" /> {course.price} LEARN
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 w-full md:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => (window.location.href = `/course/${course.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => (window.location.href = `/edit-course/${course.id}`)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                  <p className="text-muted-foreground mb-4">You haven't created any courses yet.</p>
                  <Button
                    onClick={() => (window.location.href = "/create-course")}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Create Your First Course
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>Analytics for your courses</CardDescription>
            </CardHeader>
            <CardContent>
              {instructorCourses && instructorCourses.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Most Popular Course</h4>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-2 font-medium">
                        {instructorCourses.sort((a, b) => b.enrollmentCount - a.enrollmentCount)[0]?.title || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {instructorCourses.sort((a, b) => b.enrollmentCount - a.enrollmentCount)[0]?.enrollmentCount ||
                          0}{" "}
                        students enrolled
                      </p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Highest Rated Course</h4>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-2 font-medium">
                        {instructorCourses.sort((a, b) => b.rating - a.rating)[0]?.title || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {instructorCourses.sort((a, b) => b.rating - a.rating)[0]?.rating || 0} average rating
                      </p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Top Revenue Course</h4>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-2 font-medium">
                        {instructorCourses.sort((a, b) => b.price * b.enrollmentCount - a.price * a.enrollmentCount)[0]
                          ?.title || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {instructorCourses.sort((a, b) => b.price * b.enrollmentCount - a.price * a.enrollmentCount)[0]
                          ?.price *
                          instructorCourses.sort((a, b) => b.price * b.enrollmentCount - a.price * a.enrollmentCount)[0]
                            ?.enrollmentCount || 0}{" "}
                        LEARN total
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium mb-4">Course Completion Rates</h4>
                    <div className="space-y-4">
                      {instructorCourses.map((course, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{course.title}</span>
                            <span className="text-sm font-medium">
                              {course.completionRate || Math.floor(Math.random() * 100)}%
                            </span>
                          </div>
                          <Progress value={course.completionRate || Math.floor(Math.random() * 100)} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Create courses to see performance analytics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Reviews</CardTitle>
              <CardDescription>What students are saying about your courses</CardDescription>
            </CardHeader>
            <CardContent>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 flex flex-col items-center justify-center p-6 border rounded-lg">
                      <div className="text-5xl font-bold text-purple-600 mb-2">{getAverageRating()}</div>
                      <div className="flex items-center mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(getAverageRating())
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                      </p>
                    </div>

                    <div className="md:w-2/3 space-y-3">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviews.filter((review) => Math.round(review.rating) === rating).length
                        const percentage = (count / reviews.length) * 100

                        return (
                          <div key={rating} className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1 w-12">
                              <span>{rating}</span>
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            </div>
                            <div className="flex-1">
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-400 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="w-12 text-right text-sm text-muted-foreground">
                              {percentage.toFixed(0)}%
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{review.studentName?.charAt(0) || "S"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{review.studentName || "Student"}</h4>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(review.timestamp) || "Recent review"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm">{review.comment}</p>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Course:{" "}
                          {review.courseName ||
                            instructorCourses?.find((c) => c.id === review.courseId)?.title ||
                            "Unknown Course"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
                  <p className="text-muted-foreground">You haven't received any student reviews yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your profile settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Profile Visibility</h4>
                    <p className="text-sm text-muted-foreground">
                      Make your profile visible to students and other instructors
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={profileVisibility}
                      onCheckedChange={handleVisibilityChange}
                      id="profile-visibility"
                    />
                    <Label htmlFor="profile-visibility" className="sr-only">
                      Profile Visibility
                    </Label>
                    {profileVisibility ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Delete Profile</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your instructor profile and all associated data
                  </p>
                  <Button variant="destructive" className="mt-2">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for new reviews and enrollments
                    </p>
                  </div>
                  <Switch defaultChecked id="email-notifications" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Course Updates</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about course performance and analytics
                    </p>
                  </div>
                  <Switch defaultChecked id="course-updates" />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Communications</h4>
                    <p className="text-sm text-muted-foreground">Receive tips and strategies to improve your courses</p>
                  </div>
                  <Switch id="marketing-communications" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default InstructorProfile
