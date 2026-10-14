import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout'
import ProtectedRoute from './components/protectedRoute'
import Login from './pages/login'
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


//const Placeholder = ({ name }: { name: string }) => (
//  <h2 className="text-xl text-slate-700">{name} (coming soon)</h2>
//)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Must be logged in */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
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
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}