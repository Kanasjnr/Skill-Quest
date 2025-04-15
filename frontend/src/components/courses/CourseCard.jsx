import { Link } from "react-router-dom"
import { Card, CardContent, CardFooter } from "../ui/card"
import { Progress } from "../ui/progress"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Clock, Award, Zap } from "lucide-react"

const CourseCard = ({ course }) => {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={course.image || "/placeholder.svg"}
          alt={course.title}
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-200"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{course.title}</h3>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {course.progress}% Complete
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mb-2">Instructor: {course.instructor}</p>
        <Progress value={course.progress} className="h-2 mb-4" />
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <Award className="h-4 w-4 mr-1 text-purple-600" />
            <span>{course.xpReward} XP</span>
          </div>
          <div className="flex items-center">
            <Zap className="h-4 w-4 mr-1 text-yellow-500" />
            <span>{course.tokenReward} LEARN</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-blue-500" />
            <span>2h left</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button variant="outline" asChild>
          <Link to={`/courses/${course.id}`}>View Details</Link>
        </Button>
        <Button className="bg-purple-600 hover:bg-purple-700">Continue</Button>
      </CardFooter>
    </Card>
  )
}

export default CourseCard
