import { Badge } from "../ui/badge"

const AchievementCard = ({ title, description, icon, date, xp }) => {
  return (
    <div className="flex items-start space-x-4 p-4 border rounded-lg bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
          </div>
          <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-800">
            +{xp} XP
          </Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{date}</p>
      </div>
    </div>
  )
}

export default AchievementCard
