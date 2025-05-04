import { Clock } from "lucide-react"

function getActivityBadge(type) {
  switch (type) {
    case "course_completion":
      return (
        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
          Course Completion
        </span>
      )
    case "lesson_completion":
      return (
        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Lesson Completion</span>
      )
    case "quiz_completion":
      return (
        <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
          Quiz Completion
        </span>
      )
    default:
      return null
  }
}

function ActivityFeed({ activities = [] }) {
  // Update the return statement to handle empty state
  return (
    <div className="space-y-4">
      {activities.length > 0 ? (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-0.5 bg-slate-100 dark:bg-slate-700 p-2 rounded-full">{activity.icon}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">{activity.title}</h4>
                {getActivityBadge(activity.type)}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{activity.timestamp}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg border-slate-300 dark:border-slate-700">
          <Clock className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500 mb-2" />
          <p className="text-slate-600 dark:text-slate-400">No activity recorded yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            Start learning or complete courses to see your activity here
          </p>
        </div>
      )}
    </div>
  )
}

export default ActivityFeed
