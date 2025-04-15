"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
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
} from "lucide-react"

const CreateCourse = () => {
  const [modules, setModules] = useState([
    {
      id: 1,
      title: "Introduction to Blockchain",
      expanded: true,
      lessons: [
        { id: 1, title: "What is Blockchain?", duration: "15" },
        { id: 2, title: "History of Blockchain", duration: "20" },
      ],
    },
    {
      id: 2,
      title: "Cryptography Basics",
      expanded: false,
      lessons: [{ id: 1, title: "Cryptographic Hash Functions", duration: "30" }],
    },
  ])

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Create New Course</h1>
        <div className="flex space-x-2">
          <Button variant="outline">Save Draft</Button>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Save className="h-4 w-4 mr-2" />
            Publish Course
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
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
                <Input id="title" placeholder="e.g. Blockchain Fundamentals" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn in this course"
                  className="min-h-32"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select id="category" className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select a category</option>
                    <option value="blockchain">Blockchain</option>
                    <option value="smart-contracts">Smart Contracts</option>
                    <option value="defi">DeFi</option>
                    <option value="nft">NFT</option>
                    <option value="web3">Web3</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Difficulty Level</Label>
                  <select id="level" className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select a level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input id="tags" placeholder="e.g. blockchain, crypto, web3" />
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
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Drag and drop an image, or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">Recommended size: 1280x720px (16:9)</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Upload Image
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Promotional Video (optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Upload a short promotional video</p>
                  <p className="text-xs text-gray-400 mt-1">Max size: 100MB, Format: MP4</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Upload Video
                  </Button>
                </div>
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
                <Label htmlFor="prerequisites">Prerequisites (optional)</Label>
                <Textarea
                  id="prerequisites"
                  placeholder="e.g. Basic programming knowledge, Understanding of cryptography"
                  className="min-h-20"
                />
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
                          onChange={(e) => {
                            setModules(modules.map((m) => (m.id === module.id ? { ...m, title: e.target.value } : m)))
                          }}
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
                            // Remove module logic
                            setModules(modules.filter((m) => m.id !== module.id))
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
                              onChange={(e) => {
                                setModules(
                                  modules.map((m) =>
                                    m.id === module.id
                                      ? {
                                          ...m,
                                          lessons: m.lessons.map((l) =>
                                            l.id === lesson.id ? { ...l, title: e.target.value } : l,
                                          ),
                                        }
                                      : m,
                                  ),
                                )
                              }}
                              className="flex-1"
                              placeholder="Lesson title"
                            />
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <Input
                                value={lesson.duration}
                                onChange={(e) => {
                                  setModules(
                                    modules.map((m) =>
                                      m.id === module.id
                                        ? {
                                            ...m,
                                            lessons: m.lessons.map((l) =>
                                              l.id === lesson.id ? { ...l, duration: e.target.value } : l,
                                            ),
                                          }
                                        : m,
                                    ),
                                  )
                                }}
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
                <Input id="price" type="number" placeholder="e.g. 100" />
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
                  <Input type="number" placeholder="e.g. 500" />
                  <p className="text-xs text-gray-500">XP points awarded upon course completion</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                    Token Reward
                  </Label>
                  <Input type="number" placeholder="e.g. 50" />
                  <p className="text-xs text-gray-500">LEARN tokens awarded upon course completion</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certificate Settings</CardTitle>
              <CardDescription>Configure the certificate awarded to students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificate-title">Certificate Title</Label>
                <Input id="certificate-title" placeholder="e.g. Certificate of Completion" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate-description">Certificate Description</Label>
                <Textarea
                  id="certificate-description"
                  placeholder="e.g. This certifies that the student has successfully completed the course"
                  className="min-h-20"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="certificate-expiry"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <Label htmlFor="certificate-expiry">Set certificate expiry date</Label>
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
                <p className="text-gray-500">Course thumbnail preview</p>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Blockchain Fundamentals</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  Learn the core concepts of blockchain technology, including distributed ledgers, consensus mechanisms,
                  and cryptographic principles.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-gray-500" />
                  <span>{modules.reduce((acc, module) => acc + module.lessons.length, 0)} lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span>
                    {modules.reduce(
                      (acc, module) =>
                        acc + module.lessons.reduce((sum, lesson) => sum + (Number.parseInt(lesson.duration) || 0), 0),
                      0,
                    )}{" "}
                    minutes
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-gray-500" />
                  <span>500 XP reward</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-gray-500" />
                  <span>50 LEARN reward</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <span>100 LEARN</span>
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
                <Button variant="outline">Back to Edit</Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Publish Course
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
