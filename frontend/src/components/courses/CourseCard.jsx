import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Award, Clock, Users, Zap, BookOpen, CheckCircle, List } from 'lucide-react'

const CourseCard = ({ course }) => {
  const navigate = useNavigate()
  
  // Determine course status
  const isEnrolled = course.isEnrolled || course.progress !== undefined
  const isCompleted = course.isCompleted || (isEnrolled && Number(course.progress) === 100)

  // Format price display
  const formattedPrice = Number(course.price) === 0 
    ? "Free" 
    : `${course.price} LEARN`
    
  // Handle card click to navigate to course details
  const handleCardClick = () => {
    navigate(`/courses/${course.id}`)
  }

  // Calculate total lessons
  const totalLessons = course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0

  return (
    <Card 
      className="overflow-hidden flex flex-col h-full bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-sky-200 dark:hover:border-sky-800"
      onClick={handleCardClick}
      tabIndex={0}
      role="link"
      aria-label={`View details for ${course.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
    >
      <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
        {course.metadataURI ? (
          <img
            src={course.metadataURI || "/placeholder.svg?height=200&width=300&query=online course"}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <BookOpen className="h-12 w-12 text-slate-400" />
        )}
        
        {/* Status indicators */}
        {isEnrolled && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 bg-opacity-90 dark:bg-opacity-90 p-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {isCompleted ? "Completed" : "Progress"}
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                {isCompleted ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  `${course.progress || 0}%`
                )}
              </span>
            </div>
            <Progress 
              value={isCompleted ? 100 : Number(course.progress || 0)} 
              className="h-1"
            />
          </div>
        )}
        
        {/* Course status badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {course.isPaused && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Paused
            </Badge>
          )}
          {Number(course.price) === 0 && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Free
            </Badge>
          )}
          {isCompleted && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Completed
            </Badge>
          )}
        </div>
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
            {course.tags && course.tags.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
              >
                +{course.tags.length - 3}
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-lg mb-1 text-slate-900 dark:text-slate-100 line-clamp-2">
            {course.title}
          </h3>
          
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
            <div className="flex items-center">
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              <span>{course.modules?.length || 0} modules</span>
            </div>
            <div className="flex items-center">
              <List className="h-3.5 w-3.5 mr-1" />
              <span>{totalLessons} lessons</span>
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
              {formattedPrice}
            </div>
            <div className="text-sm font-medium text-sky-600 dark:text-sky-400">
              {isCompleted ? "Review Course" : isEnrolled ? "Continue Learning" : "View Course"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CourseCard