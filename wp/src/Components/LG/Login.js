import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "./Login.css";

axios.defaults.withCredentials = true;

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3200/login",
        {
          username: username,
          password: password,
        },
        {
          withCredentials: true,
        }
      );
      const data = await res.data;
      localStorage.setItem("token", data.token);
      navigate("/chats");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="dark-background">
      <div className="login-container">
        <input
          className="input-field"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Password"
          value={password}
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="login-button" onClick={handleLogin}>
          Login
        </button>
        <p className="signup-link">
          Don't have an account? <Link to="/">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
