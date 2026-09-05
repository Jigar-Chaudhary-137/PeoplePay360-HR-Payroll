import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Auth/Login';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { PayrollDashboard } from './pages/Payroll/PayrollDashboard';
import { EmployeeList } from './pages/Employees/EmployeeList';
import { EmployeeDetail } from './pages/Employees/EmployeeDetail';
import { ContractList } from './pages/Contracts/ContractList';
import { ScheduleList } from './pages/Schedules/ScheduleList';
import { AttendanceList } from './pages/Attendance/AttendanceList';
import { AttendanceDetail } from './pages/Attendance/AttendanceDetail';
import { TimeOffRequests } from './pages/TimeOff/TimeOffRequests';
import { TimeOffRequestDetail } from './pages/TimeOff/TimeOffRequestDetail';
import { TimeOffTypes } from './pages/TimeOff/TimeOffTypes';
import { TimeOffTypeDetail } from './pages/TimeOff/TimeOffTypeDetail';
import { SalaryStructures } from './pages/SalaryConfig/SalaryStructures';
import { PayrunList } from './pages/Payroll/PayrunList';
import { PayrunDetail } from './pages/Payroll/PayrunDetail';
import { PayslipList } from './pages/Payroll/PayslipList';
import { PayslipDetail } from './pages/Payroll/PayslipDetail';
import { EmployeePortal } from './pages/SelfService/EmployeePortal';
import { UserManagement } from './pages/Admin/UserManagement';
import { LoadingSpinner } from './components/common/CommonUI';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, loading, isEmployeeOnly } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Checking authentication and role permissions..." />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'Admin') {
    // If employee tries to access an unauthorized route, redirect to self-service
    return <Navigate to="/self-service" replace />;
  }

  return children;
}

function HomeRedirect() {
  const { user, isEmployeeOnly } = useAuth();
  if (isEmployeeOnly) return <Navigate to="/self-service" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected App Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomeRedirect />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User']}>
                    <PayrollDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User']}>
                    <EmployeeList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees/:id"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User']}>
                    <EmployeeDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="contracts"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User']}>
                    <ContractList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="schedules"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Admin']}>
                    <ScheduleList />
                  </ProtectedRoute>
                }
              />
              <Route path="attendance" element={<AttendanceList />} />
              <Route path="attendance/:attendanceId" element={<AttendanceDetail />} />
              <Route path="employees/:employeeId/attendance" element={<AttendanceList />} />
              <Route path="time-off" element={<TimeOffRequests />} />
              <Route path="time-off/requests" element={<TimeOffRequests />} />
              <Route path="time-off/types" element={<TimeOffTypes />} />
              <Route path="time-off/types/:typeId" element={<TimeOffTypeDetail />} />
              <Route
                path="payruns"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Payroll Admin', 'HR Payroll User']}>
                    <PayrunList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payruns/:id"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Payroll Admin', 'HR Payroll User']}>
                    <PayrunDetail />
                  </ProtectedRoute>
                }
              />
              <Route path="payslips" element={<PayslipList />} />
              <Route path="payslips/:id" element={<PayslipDetail />} />
              <Route
                path="salary-config"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'HR Payroll Admin']}>
                    <SalaryStructures />
                  </ProtectedRoute>
                }
              />
              <Route path="self-service" element={<EmployeePortal />} />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
