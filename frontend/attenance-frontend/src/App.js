import { Routes, Route, Navigate } from "react-router-dom";
import AttendanceForm from "./components/AttendanceForm";
import AdminAttendance from "./components/AdminAttendance";
import PreviousAttendance from "./components/PreviousAttendance";
import Login from "./components/Login";
import PageTransition from "./components/PageTransition";
import NotFound from "./components/NotFound";
import AdminCreateAdmin from "./components/AdminCreateAdmin";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";


function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Protected>
            <PageTransition>
              <AttendanceForm />
            </PageTransition>
          </Protected>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <Protected>
            <PageTransition>
              <AdminAttendance />
            </PageTransition>
          </Protected>
        }
      />
      <Route path="/admin/create-admin" element={
        <Protected>
          <PageTransition>
            <AdminCreateAdmin />
          </PageTransition>
        </Protected>
      } />
      <Route
        path="/previous-attendance"
        element={
          <Protected>
            <PageTransition>
              <PreviousAttendance />
            </PageTransition>
          </Protected>
        }
      />
      <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
      <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />

    </Routes>
  );
}

function Protected({ children }) {
  const { user, initializing } = useContext(AuthContext);
  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default App;
