import "./App.css";
import { Routes, Route } from "react-router-dom";
import Signup from "./Components/SP/Signup";
import Login from "./Components/LG/Login";
import MainChat from "./Components/MC/MainChat";
import PersonalChat from "./Components/PC/PersonalChat";

function App() {
  return (
    <Routes>
      <Route path="/" Component={Signup} />
      <Route path="/login" Component={Login} />
      <Route path="/chats" Component={MainChat} />
      <Route path="/chats/pc/:id" Component={PersonalChat} />
    </Routes>
  );
}

export default App;
