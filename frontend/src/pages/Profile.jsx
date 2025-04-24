"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { User, Award, BookOpen, Zap, Clock, Copy, CheckCircle, Send, ExternalLink, Edit, Save } from "lucide-react"
import useSkillQuestUser from "../hooks/useSkillQuestUser"
import useSkillQuestToken from "../hooks/useSkillQuestToken"
import useSkillQuestCertificates from "../hooks/useSkillQuestCertificates"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { toast } from "react-toastify"

const Profile = () => {
  const { userData, loading: userLoading, error: userError } = useSkillQuestUser()
  const { balance, transferTokens, loading: tokenLoading, error: tokenError } = useSkillQuestToken()
  const { certificates, loading: certLoading, error: certError } = useSkillQuestCertificates()
  const { signer } = useSignerOrProvider()
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [userProfile, setUserProfile] = useState({
    username: "",
    bio: "",
    website: "",
    twitter: "",
    github: "",
  })
  const [transferData, setTransferData] = useState({
    recipient: "",
    amount: "",
  })

  useEffect(() => {
    setLoading(userLoading || tokenLoading || certLoading)
  }, [userLoading, tokenLoading, certLoading])

  // Load profile data from localStorage
  useEffect(() => {
    if (signer) {
      const savedProfile = localStorage.getItem("userProfile")
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile))
      }
    }
  }, [signer])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setUserProfile({
      ...userProfile,
      [name]: value,
    })
  }

  const saveProfile = () => {
    localStorage.setItem("userProfile", JSON.stringify(userProfile))
    setEditMode(false)
    toast.success("Profile updated successfully")
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

    try {
      const success = await transferTokens(transferData.recipient, transferData.amount)
      if (success) {
        toast.success(`Successfully transferred ${transferData.amount} LEARN tokens`)
        setTransferData({
          recipient: "",
          amount: "",
        })
      }
    } catch (error) {
      console.error("Transfer error:", error)
      toast.error("Transfer failed: " + (error.message || "Unknown error"))
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading profile data...</div>
  }

  if (userError || tokenError || certError) {
    return <div className="text-red-500">Error loading profile data: {userError || tokenError || certError}</div>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        {!editMode ? (
          <Button variant="outline" onClick={() => setEditMode(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={saveProfile}>
            <Save className="h-4 w-4 mr-2" />
            Save Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <User className="h-12 w-12 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold mb-1">{userProfile.username || "SkillQuest User"}</h2>
                <p className="text-sm text-gray-500 mb-2">User ID: {userData?.userId || "N/A"}</p>
                <div className="flex items-center space-x-1 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => copyToClipboard(signer?.address || signer?._address)}
                  >
                    {signer?.address ? 
                      `${signer.address.slice(0, 6)}...${signer.address.slice(-4)}` :
                      signer?._address ? 
                        `${signer._address.slice(0, 6)}...${signer._address.slice(-4)}` :
                        'No Address'}
                    <Copy className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                    Level {Math.floor((userData?.xp || 0) / 100) + 1}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {userData?.totalCertificates || 0} Certificates
                  </Badge>
                </div>
                <div className="w-full space-y-1 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">XP Progress</span>
                    <span>
                      {userData?.xp % 100}/100 XP to Level {Math.floor((userData?.xp || 0) / 100) + 2}
                    </span>
                  </div>
                  <Progress value={(userData?.xp || 0) % 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wallet</CardTitle>
              <CardDescription>Your token balance and transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="font-medium">LEARN Balance</span>
                </div>
                <span className="font-bold">{balance} LEARN</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient">Transfer Tokens</Label>
                <Input
                  id="recipient"
                  name="recipient"
                  placeholder="Recipient address"
                  value={transferData.recipient}
                  onChange={handleTransferChange}
                />
                <div className="flex space-x-2">
                  <Input
                    id="amount"
                    name="amount"
                    placeholder="Amount"
                    type="number"
                    value={transferData.amount}
                    onChange={handleTransferChange}
                  />
                  <Button onClick={handleTransferTokens}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
              <CardDescription>Your learning statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
                  <span>Courses Enrolled</span>
                </div>
                <span>{userData?.enrolledCourses?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>Courses Completed</span>
                </div>
                <span>{userData?.completedCourses?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-purple-600 mr-2" />
                  <span>Certificates Earned</span>
                </div>
                <span>{userData?.totalCertificates || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-orange-500 mr-2" />
                  <span>Member Since</span>
                </div>
                <span>
                  {userData?.registrationTime ? new Date(userData.registrationTime).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Manage your public profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editMode ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          value={userProfile.username}
                          onChange={handleProfileChange}
                          placeholder="Your username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={userProfile.bio}
                          onChange={handleProfileChange}
                          placeholder="Tell us about yourself"
                          className="min-h-32"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          name="website"
                          value={userProfile.website}
                          onChange={handleProfileChange}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="twitter">Twitter</Label>
                          <Input
                            id="twitter"
                            name="twitter"
                            value={userProfile.twitter}
                            onChange={handleProfileChange}
                            placeholder="@username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="github">GitHub</Label>
                          <Input
                            id="github"
                            name="github"
                            value={userProfile.github}
                            onChange={handleProfileChange}
                            placeholder="username"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-1">Bio</h3>
                        <p className="text-gray-700 dark:text-gray-300">{userProfile.bio || "No bio provided yet."}</p>
                      </div>
                      {userProfile.website && (
                        <div>
                          <h3 className="font-medium mb-1">Website</h3>
                          <a
                            href={userProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {userProfile.website}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {userProfile.twitter && (
                          <div>
                            <h3 className="font-medium mb-1">Twitter</h3>
                            <a
                              href={`https://twitter.com/${userProfile.twitter.replace("@", "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              {userProfile.twitter}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                        {userProfile.github && (
                          <div>
                            <h3 className="font-medium mb-1">GitHub</h3>
                            <a
                              href={`https://github.com/${userProfile.github}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              {userProfile.github}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certificates" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Certificates</CardTitle>
                  <CardDescription>Certificates you've earned</CardDescription>
                </CardHeader>
                <CardContent>
                  {certificates.length > 0 ? (
                    <div className="space-y-4">
                      {certificates.slice(0, 3).map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Award className="h-10 w-10 text-purple-600" />
                            <div>
                              <h4 className="font-medium">{cert.courseTitle}</h4>
                              <p className="text-sm text-gray-500">
                                Issued on {new Date(cert.issueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/certificates/${cert.id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                      {certificates.length > 3 && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href="/certificates">View All {certificates.length} Certificates</a>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Certificates Yet</h3>
                      <p className="text-gray-500 mb-4">Complete courses to earn certificates</p>
                      <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                        <a href="/courses">Browse Courses</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Achievements</CardTitle>
                  <CardDescription>Badges and achievements you've unlocked</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border rounded-lg p-4 flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Course Completer</h4>
                        <p className="text-sm text-gray-500">Complete 5 courses</p>
                        <Badge className="mt-1 bg-purple-100 text-purple-700 border-purple-200">+100 XP</Badge>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Fast Learner</h4>
                        <p className="text-sm text-gray-500">Complete a course in less than a week</p>
                        <Badge className="mt-1 bg-blue-100 text-blue-700 border-blue-200">+50 XP</Badge>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <Award className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Certificate Collector</h4>
                        <p className="text-sm text-gray-500">Earn 10 certificates</p>
                        <Badge className="mt-1 bg-green-100 text-green-700 border-green-200">+200 XP</Badge>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Token Master</h4>
                        <p className="text-sm text-gray-500">Earn 1000 LEARN tokens</p>
                        <Badge className="mt-1 bg-yellow-100 text-yellow-700 border-yellow-200">+150 XP</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Profile
