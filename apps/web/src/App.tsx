import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import PatientsList from './pages/PatientsList'
import PatientForm from './pages/PatientForm'
import PatientProfile from './pages/PatientProfile'
import AppointmentsList from './pages/AppointmentsList'
import AppointmentForm from './pages/AppointmentForm'
import AppointmentDetail from './pages/AppointmentDetail'
import VisitsList from './pages/VisitsList'
import VisitForm from './pages/VisitForm'
import ServicesList from './pages/ServicesList'
import ServiceForm from './pages/ServiceForm'
import InvoicesList from './pages/InvoicesList'
import InvoiceForm from './pages/InvoiceForm'
import InvoiceDetail from './pages/InvoiceDetail'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient()

function Dashboard() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#111844]">لوحة التحكم</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-[#C4362B] text-white rounded-md hover:bg-[#a32b22] transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-[#5B6478]">مرحباً، {user?.name}</p>
          <p className="text-[#8991A6]">الدور: {user?.role === 'ADMIN' ? 'مدير' : 'استقبال'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => (window.location.href = '/patients')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-right"
          >
            <h3 className="text-xl font-bold text-[#111844] mb-2">المرضى</h3>
            <p className="text-[#8991A6]">إدارة بيانات المرضى</p>
          </button>
          <button
            onClick={() => (window.location.href = '/appointments')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-right"
          >
            <h3 className="text-xl font-bold text-[#111844] mb-2">المواعيد</h3>
            <p className="text-[#8991A6]">إدارة المواعيد</p>
          </button>
          <button
            onClick={() => (window.location.href = '/visits')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-right"
          >
            <h3 className="text-xl font-bold text-[#111844] mb-2">الزيارات</h3>
            <p className="text-[#8991A6]">إدارة الزيارات</p>
          </button>
          <button
            onClick={() => (window.location.href = '/invoices')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-right"
          >
            <h3 className="text-xl font-bold text-[#111844] mb-2">الفواتير</h3>
            <p className="text-[#8991A6]">إدارة الفواتير والمدفوعات</p>
          </button>
          {isAdmin && (
            <button
              onClick={() => (window.location.href = '/services')}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-right"
            >
              <h3 className="text-xl font-bold text-[#111844] mb-2">الخدمات</h3>
              <p className="text-[#8991A6]">إدارة الخدمات والأسعار</p>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <PatientsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/new"
              element={
                <ProtectedRoute>
                  <PatientForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:id/edit"
              element={
                <ProtectedRoute>
                  <PatientForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <ProtectedRoute>
                  <PatientProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <AppointmentsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments/new"
              element={
                <ProtectedRoute>
                  <AppointmentForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments/:id"
              element={
                <ProtectedRoute>
                  <AppointmentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/visits"
              element={
                <ProtectedRoute>
                  <VisitsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/visits/new"
              element={
                <ProtectedRoute>
                  <VisitForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <ServicesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/services/new"
              element={
                <ProtectedRoute>
                  <ServiceForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/services/:id/edit"
              element={
                <ProtectedRoute>
                  <ServiceForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <InvoicesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/new"
              element={
                <ProtectedRoute>
                  <InvoiceForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute>
                  <InvoiceDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
