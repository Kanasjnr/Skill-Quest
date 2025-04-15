"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Progress } from "../components/ui/progress"
import { Badge } from "../components/ui/badge"
import { User, Settings, Shield, Wallet, Edit, Save, LogOut } from "lucide-react"

const Profile = () => {
  const [editing, setEditing] = useState(false)

  // Mock user data
  const user = {
    name: "John Smith",
    username: "johnsmith",
    email: "john.smith@example.com",
    bio: "Blockchain enthusiast and lifelong learner. Passionate about decentralized technologies and their potential to transform industries.",
    avatar: null,
    initials: "JS",
    level: 12,
    xp: 1250,
    nextLevelXp: 1500,
    joinDate: "2023-01-15",
    completedCourses: 5,
    certificates: 3,
    achievements: 8,
    tokenBalance: 250,
    walletAddress: "0x1234...5678",
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <Button
          variant={editing ? "default" : "outline"}
          className={editing ? "bg-purple-600 hover:bg-purple-700" : ""}
          onClick={() => setEditing(!editing)}
        >
          {editing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-purple-500 text-white text-xl">{user.initials}</AvatarFallback>
            </Avatar>

            {editing ? (
              <div className="w-full space-y-2 mb-4">
                <Input defaultValue={user.name} placeholder="Name" />
                <Input defaultValue={user.username} placeholder="Username" />
                <Textarea defaultValue={user.bio} placeholder="Bio" className="h-24" />
                <Button variant="outline" className="w-full">
                  Change Avatar
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-gray-500 mb-1">@{user.username}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{user.bio}</p>
              </>
            )}

            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Level {user.level}</span>
                <span className="text-sm text-gray-500">
                  {user.xp}/{user.nextLevelXp} XP
                </span>
              </div>
              <Progress value={(user.xp / user.nextLevelXp) * 100} className="h-2 mb-4" />
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="text-center">
                <div className="text-2xl font-bold">{user.completedCourses}</div>
                <p className="text-sm text-gray-500">Courses</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{user.certificates}</div>
                <p className="text-sm text-gray-500">Certificates</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{user.achievements}</div>
                <p className="text-sm text-gray-500">Achievements</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{user.tokenBalance}</div>
                <p className="text-sm text-gray-500">LEARN</p>
              </div>
            </div>

            <div className="w-full mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 mb-2">Member since {new Date(user.joinDate).toLocaleDateString()}</p>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="account">
            <TabsList>
              <TabsTrigger value="account">
                <User className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger value="wallet">
                <Wallet className="h-4 w-4 mr-2" />
                Wallet
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Manage your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input defaultValue={user.email} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <Input type="password" value="********" />
                      </div>
                      <Button variant="outline">Change Password</Button>
                    </>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p>{user.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Password</h3>
                        <p>********</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Learning Statistics</CardTitle>
                  <CardDescription>Your learning journey at a glance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Total Learning Time</h3>
                        <p className="text-sm text-gray-500">Time spent on courses</p>
                      </div>
                      <Badge className="text-lg py-1 px-3">42h 15m</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Average Session</h3>
                        <p className="text-sm text-gray-500">Average learning session</p>
                      </div>
                      <Badge className="text-lg py-1 px-3">45m</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Learning Streak</h3>
                        <p className="text-sm text-gray-500">Consecutive days learning</p>
                      </div>
                      <Badge className="text-lg py-1 px-3">7 days</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Quiz Accuracy</h3>
                        <p className="text-sm text-gray-500">Average quiz score</p>
                      </div>
                      <Badge className="text-lg py-1 px-3">82%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Information</CardTitle>
                  <CardDescription>Manage your LEARN tokens</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">LEARN Balance</h3>
                      <div className="text-2xl font-bold">{user.tokenBalance} LEARN</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button className="flex-1 bg-purple-600 hover:bg-purple-700">Send</Button>
                      <Button className="flex-1 bg-purple-600 hover:bg-purple-700">Receive</Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Wallet Address</h3>
                    <div className="flex items-center space-x-2">
                      <code className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm flex-1 overflow-x-auto">
                        {user.walletAddress}
                      </code>
                      <Button variant="outline" size="sm">
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Transaction History</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">Course Completion Reward</p>
                          <p className="text-sm text-gray-500">2 days ago</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">+50 LEARN</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">Course Enrollment</p>
                          <p className="text-sm text-gray-500">1 week ago</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">-100 LEARN</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">Welcome Bonus</p>
                          <p className="text-sm text-gray-500">1 month ago</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">+10 LEARN</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Login History</h3>
                      <p className="text-sm text-gray-500">View your recent login activity</p>
                    </div>
                    <Button variant="outline">View</Button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Connected Devices</h3>
                      <p className="text-sm text-gray-500">Manage devices connected to your account</p>
                    </div>
                    <Button variant="outline">Manage</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive updates via email</p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        id="email-notifications"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Course Reminders</h3>
                      <p className="text-sm text-gray-500">Get reminded about your courses</p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        id="course-reminders"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">New Course Alerts</h3>
                      <p className="text-sm text-gray-500">Be notified about new courses</p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        id="new-course-alerts"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Achievement Notifications</h3>
                      <p className="text-sm text-gray-500">Get notified about new achievements</p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        id="achievement-notifications"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                  <CardDescription>Customize your learning experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Dark Mode</h3>
                      <p className="text-sm text-gray-500">Toggle between light and dark mode</p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        id="dark-mode"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Show XP Notifications</h3>
                      <p className="text-sm text-gray-500">Display XP gain notifications</p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        id="xp-notifications"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
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
