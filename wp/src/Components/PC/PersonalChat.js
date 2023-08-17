import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useRecoilState } from "recoil";
import { useLocation } from "react-router-dom";
import { username } from "../../Store/Selectors/userSelectors";
import { useSocket } from "../../SocketContext/SocketContext";
import { userChatWith } from "../../Store/Selectors/inChatWithSelector";
import { Video } from "../VC/Video";
import { Grid } from "@mui/material";
import "./PersonalChat.css";

function PersonalChat() {
  const { id } = useParams();
  const chatWith = useRecoilState(userChatWith);
  const socket = useSocket();
  const userUsername = useRecoilState(username);
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState("");
  const location = useLocation();
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [videoStream, setVideoStream] = useState();
  const [remoteVideoStream, setRemoteVideoStream] = useState();
  useEffect(() => {
    socket.emit("join:room", { id, userUsername });
    const receiveMessageHandler = (data) => {
      console.log(data);
      setChats((prevChats) => [...prevChats, data]);
    };

    socket.on("receive_message", receiveMessageHandler);
    const handleCloseTab = () => {
      if (document.hidden) {
        socket.emit("disconecting", "disconnect hoja bhai pls");
      }
    };
    document.addEventListener("visibilitychange", handleCloseTab);
    const fetchChats = async () => {
      const res = await axios.get(`http://localhost:3200/chats/${id}`);
      const data = await res.data;
      return data;
    };
    fetchChats().then((data) => {
      setChats(data);
    });
    const cleanupFunction = () => {
      socket.emit("remove:cache", { userUsername, id });
    };
    window.addEventListener("beforeunload", cleanupFunction);
    window.navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then(async (stream) => {
        setVideoStream(stream);
      });
    socket.on("localDescription", async ({ description }) => {
      let pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });

      pc.setRemoteDescription(description);
      pc.ontrack = (e) => {
        setRemoteVideoStream(new MediaStream([e.track]));
      };

      socket.on("iceCandidate", ({ candidate }) => {
        pc.addIceCandidate(candidate);
      });

      pc.onicecandidate = ({ candidate }) => {
        socket.emit("iceCandidateReply", { candidate });
      };

      await pc.setLocalDescription(await pc.createAnswer());
      socket.emit("remoteDescription", { description: pc.localDescription });
    });
    return () => {
      console.log("Component is about to unmount.");
      socket.emit("remove:cache", { userUsername, id });
      window.removeEventListener("beforeunload", cleanupFunction);
      socket.off("receive_message", receiveMessageHandler);
    };
  }, []);
  const sendMessage = () => {
    socket.emit("send:message", {
      message,
      id,
      userUsername,
      otherUser: chatWith,
    });
  };
  if (chats.length == 0) {
    if (chats.length === 0) {
      return <div className="loading-container">Loading Chats...</div>;
    }
  }
  if (!videoStream) {
    return <div>Loading...</div>;
  }
  if (meetingJoined) {
    return (
      <Grid
        container
        spacing={2}
        alignContent={"center"}
        justifyContent={"center"}
      >
        <Grid item xs={12} md={6} lg={4}>
          <Video stream={videoStream} />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Video stream={remoteVideoStream} />
        </Grid>
      </Grid>
    );
  } else {
    return (
      <div className="personal-chat-container">
        {chats.length > 0 ? (
          <div className="chat-messages">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`message ${
                  chat.sender === userUsername ? "sent" : "received"
                }`}
              >
                {chat.content} - {chat.status}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-chats">No chats!</div>
        )}
        <div className="input-container">
          <input
            className="message-input"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="send-button" onClick={sendMessage}>
            Send
          </button>
        </div>
        <button
          className="send-button"
          onClick={() => {
            let pc = new RTCPeerConnection({
              iceServers: [
                {
                  urls: "stun:stun.l.google.com:19302",
                },
              ],
            });
            pc.onicecandidate = ({ candidate }) => {
              socket.emit("iceCandidate", { candidate });
            };
            pc.addTrack(videoStream.getVideoTracks()[0]);
            pc.onnegotiationneeded = async () => {
              try {
                await pc.setLocalDescription(await pc.createOffer());
                console.log(pc.localDescription);
                socket.emit("localDescription", {
                  description: pc.localDescription,
                });
              } catch (err) {
                console.error(err);
              }
            };
            socket.on("remoteDescription", async ({ description }) => {
              await pc.setRemoteDescription(description);
            });
            socket.on("iceCandidateReply", ({ candidate }) => {
              pc.addIceCandidate(candidate);
            });
            setMeetingJoined(true);
          }}
        >
          Call
        </button>
      </div>
    );
  }
}

export default PersonalChat;
