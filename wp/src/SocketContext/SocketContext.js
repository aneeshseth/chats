import React, { createContext, useContext, useEffect } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();
export const SocketProvider = ({ children }) => {
  const socket = io.connect("http://localhost:3200/");
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
