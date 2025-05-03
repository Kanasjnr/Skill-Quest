"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  ImageIcon,
  Info,
  Loader2,
  Save,
  Trash2,
  Upload,
  Award,
  Coins,
  FileText,
  PlusCircle,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  GripVertical,
  FileQuestion,
} from "lucide-react"
import useSkillQuestCourses from "../hooks/useSkillQuestCourses"
import useSkillQuestInstructor from "../hooks/useSkillQuestInstructor"
import useSkillQuestQuiz from "../hooks/useSkillQuestQuiz"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { toast } from "react-toastify"
import { ethers } from "ethers"

const EditCourse = () => {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const { updateCourse, getCourseDetails, loading: courseLoading, error: courseError } = useSkillQuestCourses()
  const { instructorData, isRegistered, loading: instructorLoading } = useSkillQuestInstructor()
  const { createQuestion, loading: quizLoading } = useSkillQuestQuiz()
  const { signer } = useSignerOrProvider()

  // Form state
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    metadataURI: "",
    price: "0",
    duration: "0",
    xpReward: "0",
    tokenReward: "0",
    requiredCourses: [],
    tags: [],
  })

  // Validation state
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // UI state
  const [modules, setModules] = useState([])
  const [tagInput, setTagInput] = useState("")
  const [activeTab, setActiveTab] = useState("details")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // Quiz editing state
  const [activeQuizLesson, setActiveQuizLesson] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState({})
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    options: ["", ""],
    correctOptionIndex: 0,
    difficulty: 3,
  })

  // File handling state
  const [courseImage, setCourseImage] = useState(null)
  const [courseImageUrl, setCourseImageUrl] = useState("")
  const [courseVideo, setCourseVideo] = useState(null)
  const [courseVideoUrl, setCourseVideoUrl] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadType, setUploadType] = useState("")

  // Refs for drag and drop
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  // Load course data
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) return

      try {
        setLoading(true)
        const courseDetails = await getCourseDetails(courseId)
        
        if (courseDetails) {
          setCourseData({
            title: courseDetails.title || "",
            description: courseDetails.description || "",
            metadataURI: courseDetails.metadataURI || "",
            price: courseDetails.price ? ethers.formatEther(courseDetails.price) : "0",
            duration: courseDetails.duration || "0",
            xpReward: courseDetails.xpReward || "0",
            tokenReward: courseDetails.tokenReward ? ethers.formatEther(courseDetails.tokenReward) : "0",
            requiredCourses: courseDetails.prerequisites || [],
            tags: courseDetails.tags || [],
          })

          // Load modules and lessons
          if (courseDetails.moduleIds && courseDetails.moduleIds.length > 0) {
            const courseModules = await getCourseModules(courseId)
            if (courseModules && courseModules.length > 0) {
              // Transform the modules data to match the expected format
              const transformedModules = courseModules.map(module => ({
                id: module.id,
                title: module.title,
                expanded: true,
                lessons: module.lessonIds.map(lessonId => ({
                  id: lessonId,
                  title: "Loading lesson...",
                  duration: "0",
                  contentType: "text",
                  content: ""
                }))
              }))
              setModules(transformedModules)
            }
          }
        }
      } catch (err) {
        console.error("Error loading course data:", err)
        toast.error("Failed to load course data")
      } finally {
        setLoading(false)
      }
    }

    loadCourseData()
  }, [courseId, getCourseDetails, getCourseModules])

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Validate form
      const validationErrors = validateForm()
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        setTouched(Object.keys(validationErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
        return
      }

      // Update course
      const success = await updateCourse(courseId, {
        metadataURI: courseData.metadataURI,
        title: courseData.title,
        description: courseData.description,
        price: courseData.price,
        isActive: true,
      })

      if (success) {
        toast.success("Course updated successfully!")
        navigate("/instructor/courses")
      }
    } catch (err) {
      console.error("Error updating course:", err)
      toast.error("Failed to update course")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCourseData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // Mark field as touched
  const markAsTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Validate form
  const validateForm = () => {
    const errors = {}

    if (!courseData.title.trim()) {
      errors.title = "Title is required"
    }

    if (!courseData.description.trim()) {
      errors.description = "Description is required"
    }

    if (!courseData.price || Number(courseData.price) <= 0) {
      errors.price = "Price must be greater than 0"
    }

    if (!courseData.duration || Number(courseData.duration) <= 0) {
      errors.duration = "Duration must be greater than 0"
    }

    if (!courseData.xpReward || Number(courseData.xpReward) <= 0) {
      errors.xpReward = "XP reward must be greater than 0"
    }

    if (!courseData.tokenReward || Number(courseData.tokenReward) <= 0) {
      errors.tokenReward = "Token reward must be greater than 0"
    }

    return errors
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Edit Course</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate("/instructor/courses")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleSubmit}
            disabled={isSubmitting || courseLoading}
          >
            {isSubmitting || courseLoading ? (
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
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your course details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={courseData.title}
                  onChange={handleInputChange}
                  placeholder="Enter course title"
                  className={errors.title && touched.title ? "border-red-500" : ""}
                  onBlur={() => markAsTouched("title")}
                />
                {errors.title && touched.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={courseData.description}
                  onChange={handleInputChange}
                  placeholder="Enter course description"
                  className={errors.description && touched.description ? "border-red-500" : ""}
                  onBlur={() => markAsTouched("description")}
                />
                {errors.description && touched.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (LEARN)</Label>
                  <Input
                    type="number"
                    id="price"
                    name="price"
                    value={courseData.price}
                    onChange={handleInputChange}
                    placeholder="Enter price in LEARN tokens"
                    className={errors.price && touched.price ? "border-red-500" : ""}
                    onBlur={() => markAsTouched("price")}
                  />
                  {errors.price && touched.price && <p className="text-sm text-red-500">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    type="number"
                    id="duration"
                    name="duration"
                    value={courseData.duration}
                    onChange={handleInputChange}
                    placeholder="Enter duration in days"
                    className={errors.duration && touched.duration ? "border-red-500" : ""}
                    onBlur={() => markAsTouched("duration")}
                  />
                  {errors.duration && touched.duration && (
                    <p className="text-sm text-red-500">{errors.duration}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
              <CardDescription>Update your course content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Curriculum editing is not available in this version. Please contact support for assistance.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Rewards</CardTitle>
              <CardDescription>Update rewards for course completion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-purple-600" />
                    XP Reward
                  </Label>
                  <Input
                    type="number"
                    name="xpReward"
                    value={courseData.xpReward}
                    onChange={handleInputChange}
                    placeholder="e.g. 500"
                    className={errors.xpReward && touched.xpReward ? "border-red-500" : ""}
                    onBlur={() => markAsTouched("xpReward")}
                  />
                  {errors.xpReward && touched.xpReward && (
                    <p className="text-sm text-red-500">{errors.xpReward}</p>
                  )}
                  <p className="text-xs text-slate-500">XP points awarded upon course completion</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Coins className="h-4 w-4 mr-2 text-purple-600" />
                    Token Reward
                  </Label>
                  <Input
                    type="number"
                    name="tokenReward"
                    value={courseData.tokenReward}
                    onChange={handleInputChange}
                    placeholder="e.g. 50"
                    className={errors.tokenReward && touched.tokenReward ? "border-red-500" : ""}
                    onBlur={() => markAsTouched("tokenReward")}
                  />
                  {errors.tokenReward && touched.tokenReward && (
                    <p className="text-sm text-red-500">{errors.tokenReward}</p>
                  )}
                  <p className="text-xs text-slate-500">LEARN tokens awarded upon course completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EditCourse 