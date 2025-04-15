import { BookOpen, Award, TrendingUp, MessageSquare, Zap } from "lucide-react"
import { Badge } from "../ui/badge"

const ActivityFeed = () => {
  const activities = [
    {
      id: 1,
      type: "course_progress",
      title: 'Made progress in "Blockchain Fundamentals"',
      time: "2 hours ago",
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      detail: "75% complete",
    },
    {
      id: 2,
      type: "xp_gain",
      title: "Earned XP for completing a quiz",
      time: "5 hours ago",
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      detail: "+50 XP",
    },
    {
      id: 3,
      type: "token_reward",
      title: "Received LEARN tokens",
      time: "1 day ago",
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      detail: "+25 LEARN",
    },
    {
      id: 4,
      type: "certificate",
      title: 'Earned certificate for "Web3 Basics"',
      time: "2 days ago",
      icon: <Award className="h-5 w-5 text-green-500" />,
      detail: "Certificate #1234",
    },
    {
      id: 5,
      type: "comment",
      title: 'Commented on "Smart Contract Development"',
      time: "3 days ago",
      icon: <MessageSquare className="h-5 w-5 text-gray-500" />,
      detail: "Great explanation!",
    },
  ]

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-4">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            {activity.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{activity.title}</p>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500">{activity.time}</span>
              <span className="mx-2 text-gray-300">•</span>
              <Badge variant="outline" className="text-xs">
                {activity.detail}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityFeed
