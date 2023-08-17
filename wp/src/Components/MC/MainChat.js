import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSetRecoilState, useRecoilState } from "recoil";
import { userState } from "../../Store/Atoms/user";
import { username } from "../../Store/Selectors/userSelectors";
import { useSocket } from "../../SocketContext/SocketContext";
import { inPcChatWith } from "../../Store/Atoms/inChatWith";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "./MainChat.css";
axios.defaults.withCredentials = true;

function MainChat() {
  const setUser = useSetRecoilState(userState);
  const userUsername = useRecoilState(username);
  const setInPcWith = useSetRecoilState(inPcChatWith);
  const [myChatGroups, setMyChatGroups] = useState([]);
  const location = useLocation();
  const socket = useSocket();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const fetchChatGroups = async () => {
    const res = await axios.get("http://localhost:3200/chatGroups", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
    const data = await res.data;
    return data;
  };
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:3200/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
        const data = await res.data;
        setUser(data);
        return data;
      } catch (err) {
        console.log(err);
      }
    };
    const allFuncCalls = async () => {
      await fetchUser().then(async (data) => {
        socket.emit("status:online", data.username);
        await fetchChatGroups().then((data) => {
          setMyChatGroups(data);
        });
      });
    };
    allFuncCalls();
  }, []);
  return (
    <div className="main-chat-container">
      <h1 style={{ color: "white", margin: "30px" }}>Chats:</h1>
      {myChatGroups &&
        myChatGroups.map((chat) => (
          <div key={chat.id} className="chat-item">
            {chat.isGC ? (
              <div className="group-chat">GROUPCHAT</div>
            ) : (
              <button
                className="user-chat-button"
                onClick={() => {
                  setInPcWith(
                    chat.users.find((username) => username !== userUsername[0])
                  );
                  navigate(`/chats/pc/${chat.chatid}`);
                }}
              >
                {chat.users.find((username) => username !== userUsername[0]) +
                  " =>"}
              </button>
            )}
          </div>
        ))}
    </div>
  );
}

export default MainChat;
