import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await axios.post(
        "https://college-attendence.onrender.com/api/auth/login",
        { email, password }
      );

      localStorage.setItem("staffId", res.data.userId);
      navigate("/staff");
    } catch {
      alert("Invalid login");
    }
  };

  return (
    <div>
      <h2>Staff Login</h2>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
    </div>
  );
}
