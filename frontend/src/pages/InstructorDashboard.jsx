"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Edit,
  Pause,
  Play,
  Plus,
  BarChart2,
} from "lucide-react";
import useSkillQuestCourses from "../hooks/useSkillQuestCourses";
import useSignerOrProvider from "../hooks/useSignerOrProvider";
import { toast } from "react-toastify";

const InstructorDashboard = () => {
  const {
    instructorCourses,
    fetchInstructorCourses,
    toggleCoursePause,
    loading,
    error,
  } = useSkillQuestCourses();
  const { signer } = useSignerOrProvider();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    totalCourses: 0,
    completionRate: 0,
  });

  useEffect(() => {
    if (signer) {
      fetchInstructorCourses();
    }
  }, [signer, fetchInstructorCourses]);

  // Calculate instructor stats from courses
  useEffect(() => {
    if (instructorCourses.length > 0) {
      const totalStudents = instructorCourses.reduce(
        (sum, course) => sum + Number(course.enrollmentCount),
        0
      );

      const totalRevenue = instructorCourses.reduce(
        (sum, course) =>
          sum + Number(course.price) * Number(course.enrollmentCount),
        0
      );

      const totalCompletions = instructorCourses.reduce(
        (sum, course) => sum + Number(course.completionCount),
        0
      );

      const completionRate =
        totalStudents > 0
          ? Math.round((totalCompletions / totalStudents) * 100)
          : 0;

      setStats({
        totalStudents,
        totalRevenue,
        totalCourses: instructorCourses.length,
        completionRate,
      });
    }
  }, [instructorCourses]);

  const handleTogglePause = async (courseId, isPaused) => {
    try {
      const success = await toggleCoursePause(courseId, !isPaused);
      if (success) {
        toast.success(
          `Course ${isPaused ? "unpaused" : "paused"} successfully`
        );
      }
    } catch (error) {
      console.error("Error toggling course pause:", error);
      toast.error(`Failed to ${isPaused ? "unpause" : "pause"} course`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading instructor data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">Error loading instructor data: {error}</div>
    );
  }

  if (!signer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
        <p className="text-gray-500">
          Please connect your wallet to view your instructor dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Instructor Dashboard
        </h1>
        <Button className="bg-purple-600 hover:bg-purple-700" asChild>
          <a href="/create-course">
            <Plus className="h-4 w-4 mr-2" />
            Create New Course
          </a>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue} LEARN</div>
            <p className="text-xs text-gray-500">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-gray-500">Published courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-gray-500">Average across all courses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>Manage your published courses</CardDescription>
            </CardHeader>
            <CardContent>
              {instructorCourses.length > 0 ? (
                <div className="space-y-4">
                  {instructorCourses.map((course) => (
                    <div
                      key={course.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{course.title}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {course.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-4 md:mt-0">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/courses/${course.id}`}>
                              <BookOpen className="h-4 w-4 mr-2" />
                              View
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/edit-course/${course.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleTogglePause(course.id, course.isPaused)
                            }
                          >
                            {course.isPaused ? (
                              <>
                                <Play className="h-4 w-4 mr-2 text-green-500" />
                                Unpause
                              </>
                            ) : (
                              <>
                                <Pause className="h-4 w-4 mr-2 text-orange-500" />
                                Pause
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Students</p>
                          <p className="font-semibold">
                            {course.enrollmentCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Completions</p>
                          <p className="font-semibold">
                            {course.completionCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="font-semibold">{course.price} LEARN</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Revenue</p>
                          <p className="font-semibold">
                            {Number(course.price) *
                              Number(course.enrollmentCount)}{" "}
                            LEARN
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first course to start teaching
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                    <a href="/create-course">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Course
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
              <CardDescription>
                Performance metrics for your courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {instructorCourses.length > 0 ? (
                <div className="space-y-6">
                  {instructorCourses.map((course) => (
                    <div key={course.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{course.title}</h3>
                        <Badge
                          variant={course.isPaused ? "outline" : "default"}
                        >
                          {course.isPaused ? "Paused" : "Active"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              Enrollment Rate
                            </span>
                            <span className="font-medium">
                              {course.enrollmentCount} students
                            </span>
                          </div>
                          <Progress
                            value={Math.min(
                              Number(course.enrollmentCount) * 2,
                              100
                            )}
                            className="h-2"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              Completion Rate
                            </span>
                            <span className="font-medium">
                              {Number(course.enrollmentCount) > 0
                                ? Math.round(
                                    (Number(course.completionCount) /
                                      Number(course.enrollmentCount)) *
                                      100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              Number(course.enrollmentCount) > 0
                                ? (Number(course.completionCount) /
                                    Number(course.enrollmentCount)) *
                                  100
                                : 0
                            }
                            className="h-2"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Revenue</span>
                            <span className="font-medium">
                              {Number(course.price) *
                                Number(course.enrollmentCount)}{" "}
                              LEARN
                            </span>
                          </div>
                          <Progress
                            value={Math.min(
                              (Number(course.price) *
                                Number(course.enrollmentCount)) /
                                10,
                              100
                            )}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4">
                    <Button variant="outline" className="w-full">
                      <BarChart2 className="h-4 w-4 mr-2" />
                      View Detailed Analytics
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <BarChart2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No Analytics Available
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Create courses to see analytics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Overview</CardTitle>
              <CardDescription>
                Your revenue and payment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.totalRevenue} LEARN
                      </div>
                      <p className="text-xs text-gray-500">Lifetime earnings</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round(stats.totalRevenue * 0.3)} LEARN
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="text-green-500">↑ 12%</span> from last
                        month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Average Per Course
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.totalCourses > 0
                          ? Math.round(stats.totalRevenue / stats.totalCourses)
                          : 0}{" "}
                        LEARN
                      </div>
                      <p className="text-xs text-gray-500">
                        Per course average
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Earnings by Course</h3>
                  <div className="space-y-4">
                    {instructorCourses.length > 0 ? (
                      instructorCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{course.title}</h4>
                              <p className="text-sm text-gray-500">
                                {course.enrollmentCount} students
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {Number(course.price) *
                                Number(course.enrollmentCount)}{" "}
                              LEARN
                            </p>
                            <p className="text-sm text-gray-500">
                              {course.price} LEARN per student
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 border rounded-lg">
                        <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No Earnings Yet
                        </h3>
                        <p className="text-gray-500">
                          Create and sell courses to start earning
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstructorDashboard;
