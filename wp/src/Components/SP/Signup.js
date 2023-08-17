import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "./Signup.css";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [file, setFile] = useState();
  const [images, setImages] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  async function postImage({ image, description }) {
    console.log(image);
    const formData = new FormData();
    formData.append("image", image);
    formData.append("description", username);
    const res = await axios.post("http://localhost:3200/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
  const submit = async (event) => {
    event.preventDefault();
    const result = await postImage({ image: file, username });
    setImages([result.image, ...images]);
  };

  const fileSelected = (event) => {
    const file = event.target.files[0];
    setFile(file);
  };

  const handleSignup = async () => {
    try {
      const res = await axios.post("http://localhost:3200/signup", {
        name: name,
        email: email,
        password: password,
        username: username,
        image: username,
      });
      const data = await res.data;
      return data;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dark-background">
      <div className="signup-container">
        <h2>Sign Up</h2>
        <input
          className="input-field"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Password"
          value={password}
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="App">
          <form onSubmit={submit}>
            <input onChange={fileSelected} type="file" accept="image/*"></input>
            <button type="submit">Submit</button>
          </form>
        </div>
        <button
          className="signup-button"
          onClick={() => {
            handleSignup().then((data) => {
              localStorage.setItem("token", data.token);
              navigate("/chats");
            });
          }}
        >
          Sign Up
        </button>
        <p className="login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
