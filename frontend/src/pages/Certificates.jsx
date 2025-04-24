"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Award, Download, Share2, ExternalLink, CheckCircle } from "lucide-react"
import useSkillQuestCertificates from "../hooks/useSkillQuestCertificates"
import useSkillQuestUser from "../hooks/useSkillQuestUser"
import useSignerOrProvider from "../hooks/useSignerOrProvider"

const Certificates = () => {
  const { certificates, fetchCertificates, loading, error } = useSkillQuestCertificates()
  const { userProfile } = useSkillQuestUser()
  const { signer } = useSignerOrProvider()
  const [sharedCertificates, setSharedCertificates] = useState({})

  // Achievements - this would ideally come from a separate hook
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

  useEffect(() => {
    if (signer) {
      fetchCertificates()
    }
  }, [signer, fetchCertificates])

  // Initialize shared status from localStorage
  useEffect(() => {
    const savedSharedStatus = localStorage.getItem("sharedCertificates")
    if (savedSharedStatus) {
      setSharedCertificates(JSON.parse(savedSharedStatus))
    }
  }, [])

  const toggleShare = (id) => {
    const newSharedStatus = {
      ...sharedCertificates,
      [id]: !sharedCertificates[id],
    }
    setSharedCertificates(newSharedStatus)
    localStorage.setItem("sharedCertificates", JSON.stringify(newSharedStatus))
  }

  const downloadCertificate = (certificate) => {
    // In a real app, this would generate and download a PDF certificate
    console.log(`Downloading certificate ${certificate.id}`)
    alert(`Certificate ${certificate.id} download started`)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading certificates...</div>
  }

  if (error) {
    return <div className="text-red-500">Error loading certificates: {error}</div>
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
            {certificates.length > 0 ? (
              certificates.map((certificate) => (
                <Card key={certificate.id} className="overflow-hidden">
                  <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <img
                      src={certificate.metadataURI || "/placeholder.svg?height=300&width=400"}
                      alt={certificate.courseTitle}
                      className="w-full h-full object-contain p-4"
                    />
                    <div className="absolute top-2 right-2">
                      {sharedCertificates[certificate.id] && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{certificate.courseTitle}</h3>
                    <p className="text-sm text-gray-500 mb-2">Issued on {certificate.issueDate}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      {certificate.isRevoked ? (
                        <span className="text-red-500">Certificate Revoked</span>
                      ) : (
                        <span>Valid Certificate</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => downloadCertificate(certificate)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant={sharedCertificates[certificate.id] ? "outline" : "default"}
                        className={
                          sharedCertificates[certificate.id] ? "flex-1" : "flex-1 bg-purple-600 hover:bg-purple-700"
                        }
                        onClick={() => toggleShare(certificate.id)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        {sharedCertificates[certificate.id] ? "Shared" : "Share"}
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
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Certificates Yet</h3>
                <p className="text-gray-500 mb-4">Complete courses to earn certificates</p>
                <Button asChild>
                  <a href="/courses">Browse Courses</a>
                </Button>
              </div>
            )}
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
