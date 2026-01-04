import { Routes, Route, Navigate } from "react-router-dom";
import AttendanceForm from "./components/AttendanceForm";
import AdminAttendance from "./components/AdminAttendance";
import PreviousAttendance from "./components/PreviousAttendance";
import Login from "./components/Login";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";


function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Protected>
            <AttendanceForm />
          </Protected>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <Protected>
            <AdminAttendance />
          </Protected>
        }
      />
      <Route
        path="/previous-attendance"
        element={
          <Protected>
            <PreviousAttendance />
          </Protected>
        }
      />
      <Route path="/login" element={<Login />} />

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
