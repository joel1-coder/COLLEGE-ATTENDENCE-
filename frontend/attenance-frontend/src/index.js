import React, { useContext } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import AttendanceForm from "./components/AttendanceForm";
import AdminAttendance from "./components/AdminAttendance";
import Login from "./components/Login";
import AdminLogin from "./components/AdminLogin";
import AdminLayout from "./pages/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStaff from "./pages/AdminStaff";
import AdminStudent from "./pages/AdminStudent";
import AdminReport from "./pages/AdminReport";
import AdminReportMonthly from "./pages/AdminReportMonthly";
import AdminReportReset from "./pages/AdminReportReset";
import AdminAssign from "./pages/AdminAssign";
import Creation from "./pages/Creation";
import NavBar from "./components/NavBar";
import PreviousAttendance from "./components/PreviousAttendance";
import EditAddStudent from "./components/EditAddStudent";
import EnterMarks from "./components/EnterMarks";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import { AuthProvider } from './context/AuthContext';
import { AuthContext } from './context/AuthContext';

function Protected({ children }) {
  const { user, initializing } = useContext(AuthContext);
  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace />; // redirect to login
  return children;
}

function AdminProtected({ children }) {
  const { user, initializing } = useContext(AuthContext);
  if (initializing) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function ErrorPage() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Unexpected Application Error!</h2>
      <p>404 Not Found</p>
      <p>Provide an errorElement or ErrorBoundary to customize this page.</p>
    </div>
  );
}

function Layout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      errorElement: <ErrorPage />,
      children: [
        { index: true, element: <Protected><AttendanceForm /></Protected> },
        {
          path: "admin",
          element: <AdminProtected><AdminLayout /></AdminProtected>,
          children: [
            { index: true, element: <AdminDashboard /> },
            { path: "staff", element: <AdminStaff /> },
            { path: "student", element: <AdminStudent /> },
            { path: "report", element: <AdminReport /> },
            { path: "report/monthly", element: <AdminReportMonthly /> },
            { path: "report/reset", element: <AdminReportReset /> },
            { path: "assign", element: <AdminAssign /> },
            { path: "attendance", element: <AdminAttendance /> },
          ],
        },
        { path: "admin/login", element: <AdminLogin /> },
        { path: "previous-attendance", element: <Protected><PreviousAttendance /></Protected> },
        { path: "editing-adding", element: <Protected><EditAddStudent /></Protected> },
        { path: "enter-marks", element: <Protected><EnterMarks /></Protected> },
        { path: "forgot-password", element: <ForgotPassword /> },
        { path: "reset-password", element: <ResetPassword /> },
        { path: "creation", element: <Protected><Creation /></Protected> },
        { path: "login", element: <Login /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);
