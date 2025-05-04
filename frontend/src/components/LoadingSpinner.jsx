import React from 'react'

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
      <p className="text-lg font-medium text-gray-600">{message}</p>
    </div>
  )
}

export default LoadingSpinner 