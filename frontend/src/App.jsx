import "./config/connection";
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomeLayout from './components/Layout/HomeLayout'
import DashboardLayout from './components/Layout/DashboardLayout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import CourseDetails from './pages/CourseDetails'
import MyLearning from './pages/MyLearning'
import Certificates from './pages/Certificates'
import Profile from './pages/Profile'
import InstructorDashboard from './pages/InstructorDashboard'
import CreateCourse from './pages/CreateCourse'

export const App = () => {
  return (
    <Routes>
      {/* Home Route */}
      <Route path="/" element={<HomeLayout />}>
        <Route index element={<Home />} />
      </Route>

      {/* Dashboard Route */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
      </Route>

      {/* Other Dashboard Routes */}
      <Route path="/courses" element={<DashboardLayout />}>
        <Route index element={<Courses />} />
        <Route path=":id" element={<CourseDetails />} />
      </Route>

      <Route path="/my-learning" element={<DashboardLayout />}>
        <Route index element={<MyLearning />} />
      </Route>

      <Route path="/certificates" element={<DashboardLayout />}>
        <Route index element={<Certificates />} />
      </Route>

      <Route path="/profile" element={<DashboardLayout />}>
        <Route index element={<Profile />} />
      </Route>

      {/* Instructor Routes */}
      <Route path="/instructor" element={<DashboardLayout />}>
        <Route index element={<InstructorDashboard />} />
        <Route path="create-course" element={<CreateCourse />} />
      </Route>

      {/* Redirect any unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App