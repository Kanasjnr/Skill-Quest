import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"

const LeaderboardCard = () => {
  const leaderboardData = [
    { id: 1, name: "Sarah Johnson", xp: 2450, level: 18, avatar: null, initials: "SJ" },
    { id: 2, name: "John Smith", xp: 1250, level: 12, avatar: null, initials: "JS" },
    { id: 3, name: "Maria Garcia", xp: 1100, level: 11, avatar: null, initials: "MG" },
    { id: 4, name: "David Lee", xp: 980, level: 10, avatar: null, initials: "DL" },
    { id: 5, name: "Emma Wilson", xp: 820, level: 9, avatar: null, initials: "EW" },
  ]

  return (
    <div className="space-y-4">
      {leaderboardData.map((user, index) => (
        <div key={user.id} className="flex items-center space-x-4">
          <div className="flex-shrink-0 w-8 text-center font-bold text-gray-500">#{index + 1}</div>
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-purple-500 text-white">{user.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-500">Level {user.level}</p>
          </div>
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">{user.xp} XP</Badge>
        </div>
      ))}
    </div>
  )
}

export default LeaderboardCard
