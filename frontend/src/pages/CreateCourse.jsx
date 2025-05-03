"use client"

import { Progress } from "@/components/ui/progress"
import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Separator } from "../components/ui/separator"
import { Switch } from "../components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import {
  BookOpen,
  Plus,
  Trash2,
  Upload,
  Clock,
  Award,
  Zap,
  Save,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  DollarSign,
  AlertCircle,
  ImageIcon,
  Video,
  Info,
  FileText,
  Loader2,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  GripVertical,
  X,
  Edit,
  Check,
  ListChecks,
  Brain,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  RefreshCw,
  Copy,
  Filter,
  Search,
  CheckCircle2,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  ExternalLink,
} from "lucide-react"
import useSkillQuestCourses from "../hooks/useSkillQuestCourses"
import useSkillQuestInstructor from "../hooks/useSkillQuestInstructor"
import useSkillQuestQuiz from "../hooks/useSkillQuestQuiz"
import useSkillQuestToken from "../hooks/useSkillQuestToken"
import useSkillQuestTransactions from "../hooks/useSkillQuestTransactions"
import useSkillQuestCurriculum from "../hooks/useSkillQuestCurriculum"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"

const CreateCourse = () => {
  const navigate = useNavigate()
  const { createCourse, loading: courseLoading, error: courseError } = useSkillQuestCourses()
  const { instructorData, isRegistered, loading: instructorLoading } = useSkillQuestInstructor()
  const { createQuestion, loading: quizLoading } = useSkillQuestQuiz()
  const { createModule, createLesson } = useSkillQuestCurriculum()
  const { signer } = useSignerOrProvider()

  // Form state
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    metadataURI: "",
    price: "100",
    duration: "30", // days
    xpReward: "500",
    tokenReward: "50",
    requiredCourses: [],
    tags: [],
  })

  // Validation state
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // UI state
  const [modules, setModules] = useState([
    {
      id: 1,
      title: "Introduction",
      expanded: true,
      lessons: [
        { id: 1, title: "Getting Started", duration: "15", contentType: "text", content: "" },
        { id: 2, title: "Overview", duration: "20", contentType: "text", content: "" },
      ],
    },
  ])
  const [tagInput, setTagInput] = useState("")
  const [activeTab, setActiveTab] = useState("details")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [error, setError] = useState(null)

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

  // Check if user is connected and registered as instructor
  useEffect(() => {
    if (!signer) {
      toast.warning("Please connect your wallet to create a course")
    } else if (!isRegistered && !instructorLoading) {
      toast.error("You must be registered as an instructor to create courses")
      navigate("/instructor/register")
    }
  }, [signer, isRegistered, instructorLoading, navigate])

  // Mark fields as touched when they're changed
  const markAsTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Validate form fields
  const validateField = (name, value) => {
    let error = ""

    switch (name) {
      case "title":
        if (!value.trim()) error = "Course title is required"
        else if (value.length < 5) error = "Title must be at least 5 characters"
        else if (value.length > 100) error = "Title must be less than 100 characters"
        break
      case "description":
        if (!value.trim()) error = "Course description is required"
        else if (value.length < 20) error = "Description must be at least 20 characters"
        break
      case "price":
        if (value === "") error = "Price is required"
        else if (isNaN(value) || Number(value) < 0) error = "Price must be a positive number"
        break
      case "duration":
        if (value === "") error = "Duration is required"
        else if (isNaN(value) || Number(value) < 1) error = "Duration must be at least 1 day"
        break
      case "xpReward":
        if (value === "") error = "XP reward is required"
        else if (isNaN(value) || Number(value) < 0) error = "XP reward must be a positive number"
        break
      case "tokenReward":
        if (value === "") error = "Token reward is required"
        else if (isNaN(value) || Number(value) < 0) error = "Token reward must be a positive number"
        break
      default:
        break
    }

    return error
  }

  // Validate all form fields
  const validateForm = () => {
    const newErrors = {}

    // Validate each field
    Object.entries(courseData).forEach(([key, value]) => {
      if (key === "tags" || key === "requiredCourses" || key === "metadataURI") return
      const error = validateField(key, value)
      if (error) newErrors[key] = error
    })

    // Validate modules and lessons
    if (modules.length === 0) {
      newErrors.modules = "At least one module is required"
    } else {
      const emptyModules = modules.filter((module) => !module.title.trim())
      if (emptyModules.length > 0) {
        newErrors.modules = "All modules must have a title"
      }

      const modulesWithoutLessons = modules.filter((module) => module.lessons.length === 0)
      if (modulesWithoutLessons.length > 0) {
        newErrors.lessons = "Each module must have at least one lesson"
      }

      const emptyLessons = modules.flatMap((module) => module.lessons.filter((lesson) => !lesson.title.trim()))
      if (emptyLessons.length > 0) {
        newErrors.lessons = "All lessons must have a title"
      }
    }

    // Validate course image
    if (!courseImage && !courseImageUrl) {
      newErrors.courseImage = "Course thumbnail is required"
    }

    // Validate quiz lessons
    const quizLessons = modules.flatMap((module) => module.lessons.filter((lesson) => lesson.contentType === "quiz"))

    for (const lesson of quizLessons) {
      const lessonQuestions = quizQuestions[lesson.id] || []
      if (lessonQuestions.length === 0) {
        newErrors.quizzes = "All quiz lessons must have at least one question"
        break
      }

      for (const question of lessonQuestions) {
        if (!question.text.trim()) {
          newErrors.quizzes = "All quiz questions must have text"
          break
        }
        if (question.options.length < 2) {
          newErrors.quizzes = "All quiz questions must have at least 2 options"
          break
        }
        if (question.correctOptionIndex === undefined || question.correctOptionIndex === null) {
          newErrors.quizzes = "All quiz questions must have a correct answer selected"
          break
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCourseData((prev) => ({ ...prev, [name]: value }))

    // Validate the field
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
    markAsTouched(name)
  }

  // Handle tag input
  const handleTagAdd = () => {
    if (tagInput.trim() && !courseData.tags.includes(tagInput.trim())) {
      setCourseData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput("")
    }
  }

  // Remove a tag
  const handleTagRemove = (tag) => {
    setCourseData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  // Module management
  const addModule = () => {
    const newModule = {
      id: Date.now(),
      title: "New Module",
      expanded: true,
      lessons: [],
    }
    setModules((prev) => [...prev, newModule])
  }

  const toggleModule = (moduleId) => {
    setModules((prev) =>
      prev.map((module) => (module.id === moduleId ? { ...module, expanded: !module.expanded } : module)),
    )
  }

  const updateModuleTitle = (moduleId, title) => {
    setModules((prev) => prev.map((module) => (module.id === moduleId ? { ...module, title } : module)))
  }

  const removeModule = (moduleId) => {
    setModules((prev) => prev.filter((module) => module.id !== moduleId))
  }

  // Lesson management
  const addLesson = (moduleId) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: [
                ...module.lessons,
                {
                  id: Date.now(),
                  title: "New Lesson",
                  duration: "15",
                  contentType: "text",
                  content: "",
                },
              ],
            }
          : module,
      ),
    )
  }

  const updateLessonTitle = (moduleId, lessonId, title) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, title } : lesson)),
            }
          : module,
      ),
    )
  }

  const updateLessonDescription = (moduleId, lessonId, description) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, description } : lesson)),
            }
          : module,
      ),
    )
  }

  const updateLessonDuration = (moduleId, lessonId, duration) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, duration } : lesson)),
            }
          : module,
      ),
    )
  }

  const updateLessonContentType = (moduleId, lessonId, contentType) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, contentType } : lesson)),
            }
          : module,
      ),
    )

    // If changing to quiz type, initialize questions array
    if (contentType === "quiz" && !quizQuestions[lessonId]) {
      setQuizQuestions((prev) => ({
        ...prev,
        [lessonId]: [],
      }))
    }
  }

  const updateLessonContent = (moduleId, lessonId, content) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, content } : lesson)),
            }
          : module,
      ),
    )
  }

  const removeLesson = (moduleId, lessonId) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.filter((lesson) => lesson.id !== lessonId),
            }
          : module,
      ),
    )

    // Remove any quiz questions for this lesson
    if (quizQuestions[lessonId]) {
      const newQuizQuestions = { ...quizQuestions }
      delete newQuizQuestions[lessonId]
      setQuizQuestions(newQuizQuestions)
    }
  }

  // Quiz question management
  const openQuizEditor = (lessonId) => {
    setActiveQuizLesson(lessonId)
    setCurrentQuestion({
      text: "",
      options: ["", ""],
      correctOptionIndex: 0,
      difficulty: 3,
    })
    setEditingQuestionId(null)
  }

  const closeQuizEditor = () => {
    setActiveQuizLesson(null)
    setCurrentQuestion({
      text: "",
      options: ["", ""],
      correctOptionIndex: 0,
      difficulty: 3,
    })
    setEditingQuestionId(null)
  }

  const handleQuestionTextChange = (e) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      text: e.target.value,
    }))
  }

  const handleOptionChange = (index, value) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }))
  }

  const addOption = () => {
    if (currentQuestion.options.length < 5) {
      setCurrentQuestion((prev) => ({
        ...prev,
        options: [...prev.options, ""],
      }))
    } else {
      toast.warning("Maximum 5 options allowed per question")
    }
  }

  const removeOption = (index) => {
    if (currentQuestion.options.length > 2) {
      // Adjust correctOptionIndex if needed
      let newCorrectIndex = currentQuestion.correctOptionIndex
      if (index === currentQuestion.correctOptionIndex) {
        newCorrectIndex = 0
      } else if (index < currentQuestion.correctOptionIndex) {
        newCorrectIndex--
      }

      setCurrentQuestion((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
        correctOptionIndex: newCorrectIndex,
      }))
    } else {
      toast.warning("Minimum 2 options required per question")
    }
  }

  const setCorrectOption = (index) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      correctOptionIndex: index,
    }))
  }

  const handleDifficultyChange = (value) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      difficulty: Number.parseInt(value),
    }))
  }

  const addQuestion = () => {
    // Validate question
    if (!currentQuestion.text.trim()) {
      toast.error("Question text is required")
      return
    }

    if (currentQuestion.options.some((option) => !option.trim())) {
      toast.error("All options must have text")
      return
    }

    const newQuestion = {
      id: editingQuestionId || Date.now(),
      text: currentQuestion.text,
      options: currentQuestion.options,
      correctOptionIndex: currentQuestion.correctOptionIndex,
      difficulty: currentQuestion.difficulty,
    }

    if (editingQuestionId) {
      // Update existing question
      setQuizQuestions((prev) => ({
        ...prev,
        [activeQuizLesson]: prev[activeQuizLesson].map((q) => (q.id === editingQuestionId ? newQuestion : q)),
      }))
      setEditingQuestionId(null)
    } else {
      // Add new question
      setQuizQuestions((prev) => ({
        ...prev,
        [activeQuizLesson]: [...(prev[activeQuizLesson] || []), newQuestion],
      }))
    }

    // Reset form
    setCurrentQuestion({
      text: "",
      options: ["", ""],
      correctOptionIndex: 0,
      difficulty: 3,
    })

    toast.success(`Question ${editingQuestionId ? "updated" : "added"} successfully`)
  }

  const editQuestion = (question) => {
    setCurrentQuestion({
      text: question.text,
      options: [...question.options],
      correctOptionIndex: question.correctOptionIndex,
      difficulty: question.difficulty,
    })
    setEditingQuestionId(question.id)
  }

  const removeQuestion = (questionId) => {
    setQuizQuestions((prev) => ({
      ...prev,
      [activeQuizLesson]: prev[activeQuizLesson].filter((q) => q.id !== questionId),
    }))

    if (editingQuestionId === questionId) {
      setEditingQuestionId(null)
      setCurrentQuestion({
        text: "",
        options: ["", ""],
        correctOptionIndex: 0,
        difficulty: 3,
      })
    }

    toast.success("Question removed")
  }

  // Drag and drop for modules
  const handleDragStart = (e, position) => {
    dragItem.current = position
  }

  const handleDragEnter = (e, position) => {
    dragOverItem.current = position
  }

  const handleDragEnd = (e) => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newModules = [...modules]
      const draggedItem = newModules[dragItem.current]
      newModules.splice(dragItem.current, 1)
      newModules.splice(dragOverItem.current, 0, draggedItem)

      setModules(newModules)
      dragItem.current = null
      dragOverItem.current = null
    }
  }

  // File handling
  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    if (type === "image") {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }
      setCourseImage(file)
      setCourseImageUrl(URL.createObjectURL(file))

      // Clear image error if it exists
      setErrors((prev) => ({ ...prev, courseImage: "" }))
    } else if (type === "video") {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a video file")
        return
      }
      setCourseVideo(file)
      setCourseVideoUrl(URL.createObjectURL(file))
    }
  }

  // Upload file to storage service
  const uploadFile = useCallback(async (file, type) => {
    if (!file) return null

    setIsUploading(true)
    setUploadProgress(0)
    setUploadType(type)

    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", import.meta.env.VITE_APP_CLOUDINARY_UPLOAD_PRESET)
      formData.append("resource_type", type === "image" ? "image" : "video")

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 200)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME}/${type === "image" ? "image" : "video"}/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        },
      )

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Upload failed")
      }

      const data = await response.json()

      // Return the URL of the uploaded file
      return data.secure_url
    } catch (error) {
      console.error(`${type} upload error:`, error)
      toast.error(`Failed to upload ${type}: ${error.message}`)
      return null
    } finally {
      // Reset upload state after a delay to show 100% completion
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
        setUploadType("")
      }, 1000)
    }
  }, [])

  // Save course as draft
  const saveDraft = async () => {
    // In a real app, you would save the draft to a database or local storage
    setIsDraft(true)
    toast.success("Course saved as draft")

    // For demo purposes, we'll just store in localStorage
    try {
      const draftData = {
        courseData,
        modules,
        quizQuestions,
        courseImageUrl,
        courseVideoUrl,
        lastUpdated: new Date().toISOString(),
      }
      localStorage.setItem("courseDraft", JSON.stringify(draftData))
    } catch (error) {
      console.error("Error saving draft:", error)
    }
  }

  // Load draft
  const loadDraft = () => {
    try {
      const draftData = JSON.parse(localStorage.getItem("courseDraft"))
      if (draftData) {
        setCourseData(draftData.courseData)
        setModules(draftData.modules)
        setQuizQuestions(draftData.quizQuestions || {})
        setCourseImageUrl(draftData.courseImageUrl)
        setCourseVideoUrl(draftData.courseVideoUrl)
        setIsDraft(true)
        toast.info(`Loaded draft from ${new Date(draftData.lastUpdated).toLocaleString()}`)
      }
    } catch (error) {
      console.error("Error loading draft:", error)
    }
  }

  // Submit course
  const handleSubmit = async () => {
    if (!signer) {
      toast.error("Please connect your wallet")
      return
    }

    if (!isRegistered) {
      toast.error("You must be registered as an instructor to create courses")
      navigate("/instructor/register")
      return
    }

    // Validate form
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error("Please fix the errors in the form")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Upload course image if needed
      let metadataURI = courseData.metadataURI
      if (courseImage && !courseImageUrl) {
        setUploadType("image")
        setIsUploading(true)
        setUploadProgress(0)
        // Upload image and get URI
        metadataURI = await uploadFile(courseImage, "image")
        setIsUploading(false)
      }

      // Prepare modules and lessons data
      const formattedModules = modules.map((module, index) => ({
        title: module.title,
        description: module.description || "",
        orderIndex: index,
        lessons: module.lessons.map((lesson, lessonIndex) => ({
          title: lesson.title,
          description: lesson.description || "",
          contentType: lesson.contentType,
          contentURI: lesson.contentURI || "",
          duration: Number(lesson.duration),
          orderIndex: lessonIndex
        }))
      }))

      // Prepare quiz questions data
      const formattedQuestions = Object.entries(quizQuestions).flatMap(([lessonId, questions]) =>
        questions.map(question => ({
          questionText: question.text,
          options: question.options,
          correctOptionIndex: Number(question.correctOptionIndex),
          difficulty: Number(question.difficulty)
        }))
      )

      // Convert numeric values to numbers
      const formattedCourseData = {
        ...courseData,
        price: Number(courseData.price),
        duration: Number(courseData.duration),
        xpReward: Number(courseData.xpReward),
        tokenReward: Number(courseData.tokenReward),
        requiredCourses: courseData.requiredCourses.map(id => Number(id))
      }

      // Create course with new structured input
      console.log("[DEBUG] Creating course with data:", {
        ...formattedCourseData,
        metadataURI,
        modules: formattedModules,
        questions: formattedQuestions
      })

      const courseId = await createCourse({
        ...formattedCourseData,
        metadataURI,
        modules: formattedModules,
        questions: formattedQuestions
      })

      console.log("[DEBUG] Course created with ID:", courseId)

      if (!courseId) {
        throw new Error("Failed to create course")
      }

      toast.success("Course created successfully!")
      navigate(`/instructor/courses/${courseId}`)
    } catch (err) {
      console.error("Error creating course:", err)
      setError("Failed to create course: " + (err.message || "Unknown error"))
      toast.error("Failed to create course: " + (err.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate course statistics
  const getTotalLessons = () => {
    return modules.reduce((total, module) => total + module.lessons.length, 0)
  }

  const getTotalDuration = () => {
    return modules.reduce(
      (total, module) => total + module.lessons.reduce((sum, lesson) => sum + Number.parseInt(lesson.duration || 0), 0),
      0,
    )
  }

  const getTotalQuestions = () => {
    return Object.values(quizQuestions).reduce((total, questions) => total + questions.length, 0)
  }

  // Navigation between tabs
  const goToNextTab = () => {
    const tabs = ["details", "curriculum", "pricing", "preview"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }

  const goToPrevTab = () => {
    const tabs = ["details", "curriculum", "pricing", "preview"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
    }
  }

  // Check if user can create course
  const canCreateCourse = signer && isRegistered && !instructorLoading

  // Find the active quiz lesson details
  const getActiveQuizLessonDetails = () => {
    if (!activeQuizLesson) return null

    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (lesson.id === activeQuizLesson) {
          return {
            moduleTitle: module.title,
            lessonTitle: lesson.title,
            moduleId: module.id,
            lessonId: lesson.id,
          }
        }
      }
    }
    return null
  }

  const activeQuizLessonDetails = getActiveQuizLessonDetails()

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Create New Course</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={saveDraft} disabled={isSubmitting || !canCreateCourse}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleSubmit}
            disabled={isSubmitting || courseLoading || !canCreateCourse}
          >
            {isSubmitting || courseLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish Course
              </>
            )}
          </Button>
        </div>
      </div>

      {!canCreateCourse && !instructorLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Registered</AlertTitle>
          <AlertDescription>
            You must be registered as an instructor to create courses.{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-red-600 hover:text-red-700"
              onClick={() => navigate("/instructor/register")}
            >
              Register now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isDraft && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Draft Loaded</AlertTitle>
          <AlertDescription>You are working on a draft. Your changes are automatically saved.</AlertDescription>
        </Alert>
      )}

      {courseError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{courseError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" disabled={isSubmitting}>
            <span className="hidden md:inline">Course Details</span>
            <span className="md:hidden">Details</span>
          </TabsTrigger>
          <TabsTrigger value="curriculum" disabled={isSubmitting}>
            <span className="hidden md:inline">Curriculum</span>
            <span className="md:hidden">Content</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" disabled={isSubmitting}>
            <span className="hidden md:inline">Pricing & Rewards</span>
            <span className="md:hidden">Pricing</span>
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={isSubmitting}>
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Details Tab Content */}
        <TabsContent value="details" className="space-y-6 mt-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set the basic details for your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Course Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center">
                  Course Title
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={courseData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Blockchain Fundamentals"
                  className={errors.title && touched.title ? "border-red-500" : ""}
                  onBlur={() => markAsTouched("title")}
                />
                {errors.title && touched.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              {/* Course Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center">
                  Course Description
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={courseData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what students will learn in this course"
                  className={`min-h-32 ${errors.description && touched.description ? "border-red-500" : ""}`}
                  onBlur={() => markAsTouched("description")}
                />
                {errors.description && touched.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
                <p className="text-xs text-slate-500">
                  Minimum 20 characters. Include what students will learn, requirements, and target audience.
                </p>
              </div>

              {/* Course Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tagInput"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === "Enter" && handleTagAdd()}
                  />
                  <Button type="button" onClick={handleTagAdd} variant="secondary">
                    Add
                  </Button>
                </div>
                {courseData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {courseData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="flex items-center gap-1 bg-slate-100 text-slate-800 hover:bg-slate-200"
                      >
                        {tag}
                        <button
                          onClick={() => handleTagRemove(tag)}
                          className="ml-1 rounded-full hover:bg-slate-300 p-0.5"
                          aria-label={`Remove ${tag} tag`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Add relevant tags to help students find your course. Press Enter or click Add after each tag.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Course Media Card */}
          <Card>
            <CardHeader>
              <CardTitle>Course Media</CardTitle>
              <CardDescription>Upload images and preview media for your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Course Thumbnail */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  Course Thumbnail
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center ${
                    errors.courseImage && touched.courseImage ? "border-red-500 bg-red-50" : "border-slate-300"
                  }`}
                >
                  {courseImage || courseImageUrl ? (
                    <div className="relative w-full">
                      <img
                        src={courseImageUrl || "/placeholder.svg"}
                        alt="Course thumbnail preview"
                        className="w-full h-40 object-cover rounded-md mb-2"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 bg-white hover:bg-red-50"
                        onClick={() => {
                          setCourseImage(null)
                          setCourseImageUrl("")

                          // Reset error if it exists
                          setErrors((prev) => ({ ...prev, courseImage: "" }))
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500">Drag and drop an image, or click to browse</p>
                      <p className="text-xs text-slate-400 mt-1">Recommended size: 1280x720px (16:9)</p>
                    </>
                  )}

                  <div className="mt-4">
                    <input
                      type="file"
                      id="courseImage"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "image")}
                    />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById("courseImage").click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      {courseImage ? "Change Image" : "Upload Image"}
                    </Button>
                  </div>
                </div>
                {errors.courseImage && touched.courseImage && (
                  <p className="text-sm text-red-500">{errors.courseImage}</p>
                )}
              </div>

              {/* Course Preview Video */}
              <div className="space-y-2">
                <Label>Course Preview Video (optional)</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center">
                  {courseVideo ? (
                    <div className="relative w-full">
                      <video src={courseVideoUrl} controls className="w-full h-40 object-cover rounded-md mb-2" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 bg-white hover:bg-red-50"
                        onClick={() => {
                          setCourseVideo(null)
                          setCourseVideoUrl("")
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Video className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500">Upload a preview video for your course</p>
                      <p className="text-xs text-slate-400 mt-1">Max size: 100MB</p>
                    </>
                  )}

                  <div className="mt-4">
                    <input
                      type="file"
                      id="courseVideo"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "video")}
                    />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById("courseVideo").click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      {courseVideo ? "Change Video" : "Upload Video"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading {uploadType}...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Metadata URI */}
              <div className="space-y-2">
                <Label htmlFor="metadataURI">Metadata URI (optional)</Label>
                <Input
                  id="metadataURI"
                  name="metadataURI"
                  value={courseData.metadataURI}
                  onChange={handleInputChange}
                  placeholder="e.g. https://ipfs.io/ipfs/..."
                />
                <p className="text-xs text-slate-500">URI to additional course metadata (IPFS recommended)</p>
              </div>
            </CardContent>
          </Card>

          {/* Prerequisites Card */}
          <Card>
            <CardHeader>
              <CardTitle>Prerequisites</CardTitle>
              <CardDescription>What should students know before taking this course?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="requiredCourses">Required Courses (optional)</Label>
                <Input
                  id="requiredCourses"
                  placeholder="Enter course IDs separated by commas (e.g. 1,2,3)"
                  onChange={(e) => {
                    const courseIds = e.target.value
                      .split(",")
                      .map((id) => id.trim())
                      .filter((id) => id && !isNaN(id))
                    setCourseData({
                      ...courseData,
                      requiredCourses: courseIds,
                    })
                  }}
                  value={courseData.requiredCourses.join(", ")}
                />
                <p className="text-xs text-slate-500">Students must complete these courses before enrolling</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button onClick={goToNextTab} className="bg-purple-600 hover:bg-purple-700 text-white">
                Next: Curriculum
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Curriculum Tab Content */}
        <TabsContent value="curriculum" className="space-y-6 mt-6">
          {/* Quiz Editor Modal */}
          {activeQuizLesson && activeQuizLessonDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        Quiz Questions for "{activeQuizLessonDetails.lessonTitle}"
                      </h3>
                      <p className="text-sm text-slate-500">Module: {activeQuizLessonDetails.moduleTitle}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={closeQuizEditor}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator />

                  {/* Question List */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center">
                      <ListChecks className="h-4 w-4 mr-2" />
                      Questions ({(quizQuestions[activeQuizLesson] || []).length})
                    </h4>

                    {(quizQuestions[activeQuizLesson] || []).length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md">
                        <HelpCircle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-slate-500">No questions yet. Add your first question below.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(quizQuestions[activeQuizLesson] || []).map((question, index) => (
                          <div
                            key={question.id}
                            className={`p-4 border rounded-md ${
                              editingQuestionId === question.id ? "border-purple-500 bg-purple-50" : ""
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center">
                                  <Badge className="mr-2">Q{index + 1}</Badge>
                                  <h5 className="font-medium">{question.text}</h5>
                                </div>
                                <div className="pl-10 space-y-1">
                                  {question.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center">
                                      <Badge
                                        variant={optionIndex === question.correctOptionIndex ? "default" : "outline"}
                                        className={
                                          optionIndex === question.correctOptionIndex
                                            ? "bg-green-500 hover:bg-green-600"
                                            : ""
                                        }
                                      >
                                        {String.fromCharCode(65 + optionIndex)}
                                      </Badge>
                                      <span className="ml-2">{option}</span>
                                      {optionIndex === question.correctOptionIndex && (
                                        <Check className="h-4 w-4 ml-2 text-green-500" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="pl-10 mt-2">
                                  <Badge variant="outline">Difficulty: {question.difficulty}/5</Badge>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => editQuestion(question)}>
                                  <Edit className="h-4 w-4 text-slate-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeQuestion(question.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Question Form */}
                  <div className="space-y-4">
                    <h4 className="font-medium">{editingQuestionId ? "Edit Question" : "Add New Question"}</h4>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="questionText">Question Text</Label>
                        <Textarea
                          id="questionText"
                          value={currentQuestion.text}
                          onChange={handleQuestionTextChange}
                          placeholder="Enter your question here"
                          className="min-h-20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Options</Label>
                        <div className="space-y-2">
                          {currentQuestion.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <RadioGroup value={String(currentQuestion.correctOptionIndex)}>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value={String(index)}
                                    id={`option-${index}`}
                                    checked={currentQuestion.correctOptionIndex === index}
                                    onClick={() => setCorrectOption(index)}
                                  />
                                </div>
                              </RadioGroup>
                              <Input
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(index)}
                                disabled={currentQuestion.options.length <= 2}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                          disabled={currentQuestion.options.length >= 5}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                        <p className="text-xs text-slate-500">
                          Select the radio button next to the correct answer. Minimum 2, maximum 5 options.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select value={String(currentQuestion.difficulty)} onValueChange={handleDifficultyChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Very Easy</SelectItem>
                            <SelectItem value="2">2 - Easy</SelectItem>
                            <SelectItem value="3">3 - Medium</SelectItem>
                            <SelectItem value="4">4 - Hard</SelectItem>
                            <SelectItem value="5">5 - Very Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={closeQuizEditor}>
                      Cancel
                    </Button>
                    <Button onClick={addQuestion} className="bg-purple-600 hover:bg-purple-700 text-white">
                      {editingQuestionId ? "Update Question" : "Add Question"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Course Curriculum Card */}
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
              <CardDescription>Organize your course content into modules and lessons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.modules && touched.modules && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.modules}</AlertDescription>
                </Alert>
              )}

              {errors.lessons && touched.lessons && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.lessons}</AlertDescription>
                </Alert>
              )}

              {errors.quizQuestions && touched.quizQuestions && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.quizQuestions}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="border rounded-lg overflow-hidden"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="flex items-center flex-1">
                        <div className="cursor-move mr-2 text-slate-400" title="Drag to reorder">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        {module.expanded ? (
                          <ChevronDown className="h-5 w-5 mr-2 text-slate-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 mr-2 text-slate-500" />
                        )}
                        <Input
                          value={module.title}
                          onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                          className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Module title"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-white">
                          {module.lessons.length} {module.lessons.length === 1 ? "lesson" : "lessons"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeModule(module.id)
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {module.expanded && (
                      <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                        {module.lessons.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 border border-dashed rounded-md">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No lessons yet. Add your first lesson.</p>
                          </div>
                        ) : (
                          module.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center space-x-2 p-3 border rounded-md bg-slate-50 dark:bg-slate-800"
                            >
                              <BookOpen className="h-4 w-4 text-slate-500" />
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={lesson.title}
                                  onChange={(e) => updateLessonTitle(module.id, lesson.id, e.target.value)}
                                  className="flex-1"
                                  placeholder="Lesson title"
                                />
                                <Textarea
                                  value={lesson.description || ""}
                                  onChange={(e) => updateLessonDescription(module.id, lesson.id, e.target.value)}
                                  className="flex-1"
                                  placeholder="Lesson description"
                                  rows={2}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Select
                                  value={lesson.contentType}
                                  onValueChange={(value) => updateLessonContentType(module.id, lesson.id, value)}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="quiz">Quiz</SelectItem>
                                  </SelectContent>
                                </Select>

                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-slate-500" />
                                  <Input
                                    value={lesson.duration}
                                    onChange={(e) => updateLessonDuration(module.id, lesson.id, e.target.value)}
                                    className="w-16"
                                    placeholder="Min"
                                  />
                                  <span className="text-sm text-slate-500">min</span>
                                </div>

                                {lesson.contentType === "quiz" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openQuizEditor(lesson.id)}
                                    className="flex items-center"
                                  >
                                    <ListChecks className="h-4 w-4 mr-1" />
                                    <span>
                                      {quizQuestions[lesson.id]?.length || 0}{" "}
                                      {quizQuestions[lesson.id]?.length === 1 ? "Q" : "Qs"}
                                    </span>
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLesson(module.id, lesson.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}

                        <Button variant="outline" size="sm" className="w-full" onClick={() => addLesson(module.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Lesson
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addModule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={goToPrevTab}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back: Details
              </Button>
              <Button onClick={goToNextTab} className="bg-purple-600 hover:bg-purple-700 text-white">
                Next: Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Pricing Tab Content */}
        <TabsContent value="pricing" className="space-y-6 mt-6">
          {/* Course Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle>Course Pricing</CardTitle>
              <CardDescription>Set the price for your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center">
                  Price (in LEARN tokens)
                  <span className="text-red-500 ml-1">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-1 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Set to 0 for a free course</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={courseData.price}
                  onChange={handleInputChange}
                  placeholder="e.g. 100"
                  className={errors.price && touched.price ? "border-red-500" : ""}
                  onBlur={() => markAsTouched("price")}
                />
                {errors.price && touched.price && <p className="text-sm text-red-500">{errors.price}</p>}
                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-500">Platform fee: 5% of course price</p>
                  <p className="font-medium">You receive: {Number(courseData.price) * 0.95} LEARN per enrollment</p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="free-course"
                    checked={courseData.price === "0"}
                    onCheckedChange={(checked) => {
                      setCourseData((prev) => ({
                        ...prev,
                        price: checked ? "0" : "100",
                      }))
                    }}
                  />
                  <Label htmlFor="free-course">Make this a free course</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rewards Card */}
          <Card>
            <CardHeader>
              <CardTitle>Rewards</CardTitle>
              <CardDescription>Set rewards for students who complete your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-purple-600" />
                    XP Reward
                    <span className="text-red-500 ml-1">*</span>
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
                  {errors.xpReward && touched.xpReward && <p className="text-sm text-red-500">{errors.xpReward}</p>}
                  <p className="text-xs text-slate-500">XP points awarded upon course completion</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                    Token Reward
                    <span className="text-red-500 ml-1">*</span>
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

          {/* Duration Card */}
          <Card>
            <CardHeader>
              <CardTitle>Duration</CardTitle>
              <CardDescription>Set the duration for your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center">
                  Duration (in days)
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={courseData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g. 30"
                  className={errors.duration && touched.duration ? "border-red-500" : ""}
                  onBlur={() => markAsTouched("duration")}
                />
                {errors.duration && touched.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
                <p className="text-sm text-slate-500">
                  Students will have access to the course for this many days after enrollment
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={goToPrevTab}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back: Curriculum
              </Button>
              <Button onClick={goToNextTab} className="bg-purple-600 hover:bg-purple-700 text-white">
                Next: Preview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Preview Tab Content */}
        <TabsContent value="preview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Preview</CardTitle>
              <CardDescription>Review your course before publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                {courseImage || courseImageUrl ? (
                  <img
                    src={courseImageUrl || "/placeholder.svg"}
                    alt="Course thumbnail preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-slate-500">No course thumbnail uploaded</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {courseData.title || "Course Title"}
                </h2>
                <p className="text-slate-700 dark:text-slate-300">
                  {courseData.description || "Course description will appear here."}
                </p>

                {courseData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {courseData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-800">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-slate-500" />
                  <span>{getTotalLessons()} lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-slate-500" />
                  <span>{getTotalDuration()} minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <span>{courseData.xpReward} XP reward</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span>{courseData.tokenReward} LEARN reward</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>{courseData.price === "0" ? "Free" : `${courseData.price} LEARN`}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ListChecks className="h-5 w-5 text-blue-600" />
                  <span>{getTotalQuestions()} quiz questions</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Course Curriculum</h3>
                {modules.map((module, index) => (
                  <div key={module.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-center">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          Module {index + 1}: {module.title}
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">{module.lessons.length} lessons</span>
                    </div>
                    <div className="p-4 space-y-2 bg-white dark:bg-slate-900">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="flex items-center space-x-2 p-2 border-b last:border-0"
                        >
                          {lesson.contentType === "quiz" ? (
                            <Brain className="h-4 w-4 text-purple-500" />
                          ) : lesson.contentType === "video" ? (
                            <Video className="h-4 w-4 text-blue-500" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-slate-500" />
                          )}
                          <span className="flex-1 text-slate-900 dark:text-slate-100">
                            {lessonIndex + 1}. {lesson.title}
                          </span>
                          <Badge variant="outline" className="capitalize">
                            {lesson.contentType}
                          </Badge>
                          {lesson.contentType === "quiz" && quizQuestions[lesson.id]?.length > 0 && (
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                              {quizQuestions[lesson.id].length} questions
                            </Badge>
                          )}
                          <span className="text-sm text-slate-500">{lesson.duration} min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={goToPrevTab}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Edit
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleSubmit}
                  disabled={isSubmitting || courseLoading || !canCreateCourse}
                >
                  {isSubmitting || courseLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish Course
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CreateCourse
