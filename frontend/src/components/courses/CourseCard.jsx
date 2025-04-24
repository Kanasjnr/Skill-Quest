import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { Award, Clock, Users, Zap, BookOpen, ExternalLink } from "lucide-react"

const CourseCard = ({ course }) => {
  // Determine if the course is in progress
  const isEnrolled = course.progress !== undefined
  const isCompleted = isEnrolled && Number(course.progress) === 100

  return (
    <Card className="overflow-hidden flex flex-col h-full bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
      <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {course.metadataURI ? (
          <img
            src={course.metadataURI || "/placeholder.svg"}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="h-12 w-12 text-slate-400" />
        )}
        {isEnrolled && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 bg-opacity-90 dark:bg-opacity-90 p-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Progress</span>
              <span className="text-slate-600 dark:text-slate-400">{course.progress}%</span>
            </div>
            <Progress value={Number(course.progress)} className="h-1" />
          </div>
        )}
        {course.isPaused && (
          <Badge className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 border-yellow-200">Paused</Badge>
        )}
      </div>
      <CardContent className="flex-1 flex flex-col p-4">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            {course.tags &&
              course.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {tag}
                </Badge>
              ))}
          </div>
          <h3 className="font-semibold text-lg mb-1 text-slate-900 dark:text-slate-100">{course.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
            {course.description || "Learn the fundamentals and advanced concepts in this comprehensive course."}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
            <div className="flex items-center">
              <Users className="h-3.5 w-3.5 mr-1" />
              <span>{course.enrollmentCount || 0} students</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>{course.duration || 30} days</span>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Award className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-1" />
              <span className="text-sm">{course.xpReward || 0} XP</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-4 w-4 text-yellow-500 dark:text-yellow-400 mr-1" />
              <span className="text-sm">{course.tokenReward || 0} LEARN</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {course.price ? `${course.price} LEARN` : "Free"}
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/courses/${course.id}`}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                {isCompleted ? "Review" : isEnrolled ? "Continue" : "View"}
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CourseCard
