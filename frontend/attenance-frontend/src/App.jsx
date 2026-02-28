import React, { useState } from "react";
import AttendanceForm from "./components/AttendanceForm";

const App = () => {
  const [staffId, setStaffId] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (staffId.trim() !== "") {
      setLoggedIn(true);
    } else {
      alert("Enter valid Staff ID");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      {!loggedIn ? (
        <form onSubmit={handleLogin}>
          <h2>Staff Login</h2>
          <input
            type="text"
            placeholder="Enter Staff ID"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <AttendanceForm staffId={staffId} />
      )}
    </div>
  );
};

export default App;
