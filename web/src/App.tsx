import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout'
import ProtectedRoute from './components/protectedRoute'
import Login from './pages/login'
import Signup from './pages/signup'
import StudentDashboard from './pages/studentDashboard'
import LessonPage from './pages/lessonPage'
import AdminLessons from './pages/admin/adminLessons'
import AdminLessonNew from './pages/admin/adminLessonNew'
import AdminLessonEdit from './pages/admin/adminLessonEdit'
import AdminStudents from './pages/admin/adminStudents'
import AdminStudentDetail from './pages/admin/adminStudentDetail'
import AdminHomework from './pages/admin/adminHomework'
import AdminHomeworkNew from './pages/admin/adminHomeworkNew'
import AdminHomeworkEdit from './pages/admin/adminHomeworkEdit'
import MyHomework from './pages/myHomework'
import HomeworkDetailPage from './pages/homeworkDetailPage'
import AdminSubmissions from './pages/admin/adminSubmissions'
import AdminPayments from './pages/admin/adminPayments'
import Account from './pages/account'
import ForgotPassword from './pages/forgotPassword'
import SetPassword from './pages/setPassword'
import PlacementTest from './pages/placementTest'
import AdminPlacement from './pages/admin/adminPlacement'
import AdminPlacementStudent from './pages/admin/adminPlacementStudent'


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/placement-test" element={<PlacementTest />} />

      {/* Must be logged in */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/account" element={<Account />} />
          {/* Students only */}
          <Route element={<ProtectedRoute role="student" />}>
            <Route path="/" element={<StudentDashboard />} />
            <Route path="/lessons/:id" element={<LessonPage />} />
            <Route path="/homework" element={<MyHomework />} />
            <Route path="/homework/:id" element={<HomeworkDetailPage />} />
          </Route>

          {/* Teacher only */}
          <Route element={<ProtectedRoute role="teacher" />}>
            <Route path="/admin/lessons" element={<AdminLessons />} />
            <Route path="/admin/lessons/new" element={<AdminLessonNew />} />
            <Route path="/admin/lessons/:id/edit" element={<AdminLessonEdit />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
            <Route path="/admin/homework" element={<AdminHomework />} />
            <Route path="/admin/homework/new" element={<AdminHomeworkNew />} />
            <Route path="/admin/homework/:id/edit" element={<AdminHomeworkEdit />} />
            <Route path="/admin/submissions" element={<AdminSubmissions />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/placement" element={<AdminPlacement />} />
            <Route path="/admin/placement/:id" element={<AdminPlacementStudent />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}