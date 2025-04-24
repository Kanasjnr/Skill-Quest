"use client"

import { Progress } from "@/components/ui/progress"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
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
} from "lucide-react"
import useSkillQuestCourses from "../hooks/useSkillQuestCourses"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { toast } from "react-toastify"

const CreateCourse = () => {
  const { createCourse, loading, error } = useSkillQuestCourses()
  const { signer } = useSignerOrProvider()
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
  const [modules, setModules] = useState([
    {
      id: 1,
      title: "Introduction",
      expanded: true,
      lessons: [
        { id: 1, title: "Getting Started", duration: "15" },
        { id: 2, title: "Overview", duration: "20" },
      ],
    },
  ])
  const [tagInput, setTagInput] = useState("")
  const [activeTab, setActiveTab] = useState("details")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [courseImage, setCourseImage] = useState(null)
  const [courseVideo, setCourseVideo] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Check if user is connected
  useEffect(() => {
    if (!signer) {
      toast.warning("Please connect your wallet to create a course")
    }
  }, [signer])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCourseData({
      ...courseData,
      [name]: value,
    })
  }

  const handleTagAdd = () => {
    if (tagInput.trim() && !courseData.tags.includes(tagInput.trim())) {
      setCourseData({
        ...courseData,
        tags: [...courseData.tags, tagInput.trim()],
      })
      setTagInput("")
    }
  }

  const handleTagRemove = (tag) => {
    setCourseData({
      ...courseData,
      tags: courseData.tags.filter((t) => t !== tag),
    })
  }

  const addModule = () => {
    const newModule = {
      id: modules.length + 1,
      title: "New Module",
      expanded: true,
      lessons: [],
    }
    setModules([...modules, newModule])
  }

  const toggleModule = (moduleId) => {
    setModules(modules.map((module) => (module.id === moduleId ? { ...module, expanded: !module.expanded } : module)))
  }

  const updateModuleTitle = (moduleId, title) => {
    setModules(modules.map((module) => (module.id === moduleId ? { ...module, title } : module)))
  }

  const removeModule = (moduleId) => {
    setModules(modules.filter((module) => module.id !== moduleId))
  }

  const addLesson = (moduleId) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: [
                ...module.lessons,
                {
                  id: module.lessons.length + 1,
                  title: "New Lesson",
                  duration: "15",
                },
              ],
            }
          : module,
      ),
    )
  }

  const updateLessonTitle = (moduleId, lessonId, title) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, title } : lesson)),
            }
          : module,
      ),
    )
  }

  const updateLessonDuration = (moduleId, lessonId, duration) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, duration } : lesson)),
            }
          : module,
      ),
    )
  }

  const removeLesson = (moduleId, lessonId) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.filter((lesson) => lesson.id !== lessonId),
            }
          : module,
      ),
    )
  }

  // Handle file selection
  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    if (type === "image") {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }
      setCourseImage(file)
    } else if (type === "video") {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a video file")
        return
      }
      setCourseVideo(file)
    }
  }

  // Upload file to Cloudinary
  const uploadToCloudinary = useCallback(async (file, resourceType) => {
    if (!file) return null

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "skillquest") // Replace with your Cloudinary upload preset
      formData.append("resource_type", resourceType)

      // Simulate upload progress (in a real app, you'd use XHR or fetch with progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      // Upload to Cloudinary
      const response = await fetch(`https://api.cloudinary.com/v1_1/dn2ed9k6p/${resourceType}/upload`, {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      return data.secure_url
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(`Failed to upload ${resourceType}: ${error.message}`)
      return null
    } finally {
      setIsUploading(false)
    }
  }, [])

  const handleSubmit = async () => {
    if (!signer) {
      toast.error("Please connect your wallet to create a course")
      return
    }

    // Validate required fields
    if (!courseData.title || !courseData.description) {
      toast.error("Title and description are required")
      return
    }

    try {
      setIsSubmitting(true)

      // Upload image and video to Cloudinary if provided
      let metadataURI = courseData.metadataURI

      if (courseImage) {
        const imageUrl = await uploadToCloudinary(courseImage, "image")
        if (imageUrl) {
          metadataURI = imageUrl
        }
      }

      // Create metadata object with course details and modules
      const metadata = {
        title: courseData.title,
        description: courseData.description,
        modules: modules,
        imageUrl: metadataURI,
        // Add any other metadata you want to store
      }

      // In a real app, you would upload this to IPFS or another storage solution
      // For now, we'll just use the image URL as the metadata URI
      const courseToCreate = {
        ...courseData,
        metadataURI,
        // Convert string values to appropriate types
        price: courseData.price,
        duration: Number.parseInt(courseData.duration),
        xpReward: Number.parseInt(courseData.xpReward),
        tokenReward: courseData.tokenReward,
        requiredCourses: courseData.requiredCourses.map(Number),
      }

      const courseId = await createCourse(courseToCreate)

      if (courseId) {
        toast.success(`Course created successfully! Course ID: ${courseId}`)
        // Reset form or redirect to course page
      }
    } catch (err) {
      console.error("Error creating course:", err)
      toast.error("Failed to create course: " + (err.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTotalLessons = () => {
    return modules.reduce((total, module) => total + module.lessons.length, 0)
  }

  const getTotalDuration = () => {
    return modules.reduce(
      (total, module) => total + module.lessons.reduce((sum, lesson) => sum + Number.parseInt(lesson.duration || 0), 0),
      0,
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Create New Course</h1>
        <div className="flex space-x-2">
          <Button variant="outline">Save Draft</Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleSubmit}
            disabled={isSubmitting || loading || !signer}
          >
            {isSubmitting || loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Publish Course
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Rewards</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set the basic details for your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={courseData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Blockchain Fundamentals"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={courseData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what students will learn in this course"
                  className="min-h-32"
                />
              </div>

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
                  <Button type="button" onClick={handleTagAdd}>
                    Add
                  </Button>
                </div>
                {courseData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {courseData.tags.map((tag) => (
                      <Badge key={tag} className="flex items-center gap-1">
                        {tag}
                        <button
                          onClick={() => handleTagRemove(tag)}
                          className="ml-1 h-4 w-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Media</CardTitle>
              <CardDescription>Upload images and preview media for your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Course Thumbnail</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                  {courseImage ? (
                    <div className="relative w-full">
                      <img
                        src={URL.createObjectURL(courseImage) || "/placeholder.svg"}
                        alt="Course thumbnail preview"
                        className="w-full h-40 object-cover rounded-md mb-2"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 bg-white"
                        onClick={() => setCourseImage(null)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Drag and drop an image, or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">Recommended size: 1280x720px (16:9)</p>
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
              </div>

              <div className="space-y-2">
                <Label>Course Preview Video (optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                  {courseVideo ? (
                    <div className="relative w-full">
                      <video
                        src={URL.createObjectURL(courseVideo)}
                        controls
                        className="w-full h-40 object-cover rounded-md mb-2"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 bg-white"
                        onClick={() => setCourseVideo(null)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Video className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Upload a preview video for your course</p>
                      <p className="text-xs text-gray-400 mt-1">Max size: 100MB</p>
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

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="metadataURI">Metadata URI (optional)</Label>
                <Input
                  id="metadataURI"
                  name="metadataURI"
                  value={courseData.metadataURI}
                  onChange={handleInputChange}
                  placeholder="e.g. https://ipfs.io/ipfs/..."
                />
                <p className="text-xs text-gray-500">URI to additional course metadata (IPFS recommended)</p>
              </div>
            </CardContent>
          </Card>

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
                />
                <p className="text-xs text-gray-500">Students must complete these courses before enrolling</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
              <CardDescription>Organize your course content into modules and lessons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {modules.map((module) => (
                  <div key={module.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="flex items-center">
                        {module.expanded ? (
                          <ChevronDown className="h-5 w-5 mr-2 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 mr-2 text-gray-500" />
                        )}
                        <Input
                          value={module.title}
                          onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                          className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeModule(module.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {module.expanded && (
                      <div className="p-4 space-y-3">
                        {module.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center space-x-2 p-2 border rounded-md">
                            <BookOpen className="h-4 w-4 text-gray-500" />
                            <Input
                              value={lesson.title}
                              onChange={(e) => updateLessonTitle(module.id, lesson.id, e.target.value)}
                              className="flex-1"
                              placeholder="Lesson title"
                            />
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <Input
                                value={lesson.duration}
                                onChange={(e) => updateLessonDuration(module.id, lesson.id, e.target.value)}
                                className="w-16"
                                placeholder="Min"
                              />
                              <span className="text-sm text-gray-500">min</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeLesson(module.id, lesson.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}

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
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Pricing</CardTitle>
              <CardDescription>Set the price for your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (in LEARN tokens)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={courseData.price}
                  onChange={handleInputChange}
                  placeholder="e.g. 100"
                />
                <p className="text-sm text-gray-500">Platform fee: 5% of course price</p>
              </div>
            </CardContent>
          </Card>

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
                  </Label>
                  <Input
                    type="number"
                    name="xpReward"
                    value={courseData.xpReward}
                    onChange={handleInputChange}
                    placeholder="e.g. 500"
                  />
                  <p className="text-xs text-gray-500">XP points awarded upon course completion</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                    Token Reward
                  </Label>
                  <Input
                    type="number"
                    name="tokenReward"
                    value={courseData.tokenReward}
                    onChange={handleInputChange}
                    placeholder="e.g. 50"
                  />
                  <p className="text-xs text-gray-500">LEARN tokens awarded upon course completion</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duration</CardTitle>
              <CardDescription>Set the duration for your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (in days)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={courseData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g. 30"
                />
                <p className="text-sm text-gray-500">
                  Students will have access to the course for this many days after enrollment
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Preview</CardTitle>
              <CardDescription>Review your course before publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                {courseImage ? (
                  <img
                    src={URL.createObjectURL(courseImage) || "/placeholder.svg"}
                    alt="Course thumbnail preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <p className="text-gray-500">Course thumbnail preview</p>
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{courseData.title || "Course Title"}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {courseData.description || "Course description will appear here."}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-gray-500" />
                  <span>{getTotalLessons()} lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span>{getTotalDuration()} minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-gray-500" />
                  <span>{courseData.xpReward} XP reward</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-gray-500" />
                  <span>{courseData.tokenReward} LEARN reward</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <span>{courseData.price} LEARN</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Course Curriculum</h3>
                {modules.map((module, index) => (
                  <div key={module.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center">
                        <span className="font-medium">
                          Module {index + 1}: {module.title}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{module.lessons.length} lessons</span>
                    </div>
                    <div className="p-4 space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.id} className="flex items-center space-x-2 p-2">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <span className="flex-1">
                            Lesson {lessonIndex + 1}: {lesson.title}
                          </span>
                          <span className="text-sm text-gray-500">{lesson.duration} min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("details")}>
                  Back to Edit
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleSubmit}
                  disabled={isSubmitting || loading || !signer}
                >
                  {isSubmitting || loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
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
