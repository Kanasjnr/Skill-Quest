"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  ExternalLink,
  Play,
  Filter,
  Search,
  Calendar,
} from "lucide-react";
import { Input } from "../components/ui/input";
import useSkillQuestEnrollment from "../hooks/useSkillQuestEnrollment";
import useSkillQuestUser from "../hooks/useSkillQuestUser";
import useSignerOrProvider from "../hooks/useSignerOrProvider";
import { toast } from "react-toastify";

const MyLearning = () => {
  const {
    enrolledCourses,
    completedCourses,
    updateProgress,
    loading: enrollmentLoading,
    error: enrollmentError,
  } = useSkillQuestEnrollment();
  const {
    userData,
    loading: userLoading,
    error: userError,
  } = useSkillQuestUser();
  const { signer } = useSignerOrProvider();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEnrolled, setFilteredEnrolled] = useState([]);
  const [filteredCompleted, setFilteredCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(enrollmentLoading || userLoading);
  }, [enrollmentLoading, userLoading]);

  // Filter courses based on search query
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredEnrolled(
        enrolledCourses.filter((course) =>
          course.title.toLowerCase().includes(query)
        )
      );
      setFilteredCompleted(
        completedCourses.filter((course) =>
          course.title.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredEnrolled(enrolledCourses);
      setFilteredCompleted(completedCourses);
    }
  }, [searchQuery, enrolledCourses, completedCourses]);

  const handleUpdateProgress = async (courseId, newProgress) => {
    try {
      const success = await updateProgress(courseId, newProgress);
      if (success) {
        toast.success(`Progress updated to ${newProgress}%`);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading your courses...
      </div>
    );
  }

  if (enrollmentError || userError) {
    return (
      <div className="text-red-500">
        Error loading your learning data: {enrollmentError || userError}
      </div>
    );
  }

  if (!signer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
        <p className="text-gray-500">
          Please connect your wallet to view your learning progress
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Learning</h1>
        <Button className="bg-purple-600 hover:bg-purple-700" asChild>
          <a href="/courses">
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Courses
          </a>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search your courses..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <Tabs defaultValue="in-progress">
        <TabsList>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress" className="mt-6">
          <div className="space-y-4">
            {filteredEnrolled.filter((course) => Number(course.progress) < 100)
              .length > 0 ? (
              filteredEnrolled
                .filter((course) => Number(course.progress) < 100)
                .map((course) => (
                  <Card key={course.id}>
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/4 aspect-video md:aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="p-6 flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">
                                {course.title}
                              </h3>
                              <p className="text-sm text-gray-500 mb-2">
                                Instructor: {course.instructor.slice(0, 6)}...
                                {course.instructor.slice(-4)}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  <span>
                                    Enrolled:{" "}
                                    {new Date(
                                      course.enrollmentTime
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                {course.isPaused && (
                                  <Badge
                                    variant="outline"
                                    className="text-yellow-600 border-yellow-300 bg-yellow-50"
                                  >
                                    Course Paused
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 md:mt-0 flex flex-col items-end">
                              <div className="flex items-center space-x-2 mb-2">
                                <Award className="h-4 w-4 text-purple-600" />
                                <span className="text-sm">
                                  {course.xpReward} XP
                                </span>
                                <Clock className="h-4 w-4 text-blue-500 ml-2" />
                                <span className="text-sm">
                                  Reward: {course.tokenReward} LEARN
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" asChild>
                                  <a href={`/courses/${course.id}`}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Course
                                  </a>
                                </Button>
                                <Button
                                  className="bg-purple-600 hover:bg-purple-700"
                                  size="sm"
                                  asChild
                                >
                                  <a href={`/learn/${course.id}`}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Continue
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                Progress
                              </span>
                              <span className="text-sm text-gray-500">
                                {course.progress}%
                              </span>
                            </div>
                            <Progress
                              value={Number(course.progress)}
                              className="h-2"
                            />
                            <div className="flex justify-between pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateProgress(course.id, 25)
                                }
                                disabled={Number(course.progress) >= 25}
                              >
                                25%
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateProgress(course.id, 50)
                                }
                                disabled={Number(course.progress) >= 50}
                              >
                                50%
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateProgress(course.id, 75)
                                }
                                disabled={Number(course.progress) >= 75}
                              >
                                75%
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateProgress(course.id, 100)
                                }
                                disabled={Number(course.progress) >= 100}
                              >
                                Complete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <div className="text-center py-10">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Courses In Progress
                </h3>
                <p className="text-gray-500 mb-4">
                  Enroll in courses to start learning
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                  <a href="/courses">Browse Courses</a>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {filteredCompleted.length > 0 ||
            filteredEnrolled.filter((course) => Number(course.progress) === 100)
              .length > 0 ? (
              [
                ...filteredCompleted,
                ...filteredEnrolled.filter(
                  (course) => Number(course.progress) === 100
                ),
              ].map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 aspect-video md:aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                      </div>
                      <div className="p-6 flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-semibold text-lg mb-1">
                                {course.title}
                              </h3>
                              <Badge className="ml-2 bg-green-100 text-green-800">
                                Completed
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              Instructor: {course.instructor.slice(0, 6)}...
                              {course.instructor.slice(-4)}
                            </p>
                          </div>
                          <div className="mt-4 md:mt-0 flex flex-col items-end">
                            <div className="flex items-center space-x-2 mb-2">
                              <Award className="h-4 w-4 text-purple-600" />
                              <span className="text-sm">
                                {course.xpReward} XP
                              </span>
                              <Clock className="h-4 w-4 text-blue-500 ml-2" />
                              <span className="text-sm">
                                Reward: {course.tokenReward} LEARN
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/courses/${course.id}`}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Course
                                </a>
                              </Button>
                              <Button
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <Award className="h-4 w-4 mr-2" />
                                View Certificate
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Progress
                            </span>
                            <span className="text-sm text-gray-500">100%</span>
                          </div>
                          <Progress value={100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10">
                <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Completed Courses
                </h3>
                <p className="text-gray-500 mb-4">
                  Complete courses to see them here
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                  <a href="/courses">Browse Courses</a>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="certificates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              {userData?.totalCertificates > 0 ? (
                <div className="text-center py-10">
                  <Award className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    You have {userData.totalCertificates} certificates
                  </h3>
                  <p className="text-gray-500 mb-4">
                    View all your certificates in one place
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                    <a href="/certificates">View All Certificates</a>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No Certificates Yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Complete courses to earn certificates
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                    <a href="/courses">Browse Courses</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyLearning;
