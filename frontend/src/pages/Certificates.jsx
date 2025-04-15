"use client"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Award, Download, Share2, ExternalLink, CheckCircle } from "lucide-react"

const Certificates = () => {
  // Mock data
  const certificates = [
    {
      id: 1,
      title: "Blockchain Fundamentals",
      issueDate: "2023-06-15",
      instructor: "Alex Johnson",
      courseId: 1,
      image: "/placeholder.svg?height=300&width=400",
      shared: true,
    },
    {
      id: 2,
      title: "Web3 Basics",
      issueDate: "2023-05-20",
      instructor: "David Lee",
      courseId: 3,
      image: "/placeholder.svg?height=300&width=400",
      shared: false,
    },
    {
      id: 3,
      title: "Cryptocurrency Economics",
      issueDate: "2023-04-10",
      instructor: "Sarah Wilson",
      courseId: 4,
      image: "/placeholder.svg?height=300&width=400",
      shared: true,
    },
  ]

  // Achievements
  const achievements = [
    {
      id: 1,
      title: "Course Completer",
      description: "Complete 5 courses",
      image: "/placeholder.svg?height=100&width=100",
      earnedDate: "2023-06-20",
      xp: 100,
    },
    {
      id: 2,
      title: "Fast Learner",
      description: "Complete a course in less than a week",
      image: "/placeholder.svg?height=100&width=100",
      earnedDate: "2023-05-25",
      xp: 50,
    },
    {
      id: 3,
      title: "Social Learner",
      description: "Invite 3 friends to the platform",
      image: "/placeholder.svg?height=100&width=100",
      earnedDate: "2023-05-10",
      xp: 75,
    },
  ]

  const toggleShare = (id) => {
    // In a real app, this would update the state
    console.log(`Toggle share for certificate ${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Certificates & Achievements</h1>
      </div>

      <Tabs defaultValue="certificates">
        <TabsList>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <Card key={certificate.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <img
                    src={certificate.image || "/placeholder.svg"}
                    alt={certificate.title}
                    className="w-full h-full object-contain p-4"
                  />
                  <div className="absolute top-2 right-2">
                    {certificate.shared && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{certificate.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Issued on {new Date(certificate.issueDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">Instructor: {certificate.instructor}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant={certificate.shared ? "outline" : "default"}
                      className={certificate.shared ? "flex-1" : "flex-1 bg-purple-600 hover:bg-purple-700"}
                      onClick={() => toggleShare(certificate.id)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {certificate.shared ? "Shared" : "Share"}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <a href={`/courses/${certificate.courseId}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Course
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => (
              <Card key={achievement.id}>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <Award className="h-12 w-12 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{achievement.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{achievement.description}</p>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 mb-2">+{achievement.xp} XP</Badge>
                  <p className="text-xs text-gray-400">
                    Earned on {new Date(achievement.earnedDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Certificates
