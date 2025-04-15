import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"

const AchievementCard = ({ title, description, icon, date, xp }) => {
  return (
    <Card>
      <CardContent className="p-4 flex items-center space-x-4">
        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400">{date}</span>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200">+{xp} XP</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AchievementCard
