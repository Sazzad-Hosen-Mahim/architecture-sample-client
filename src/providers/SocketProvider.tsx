import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { notificationApi } from "@/redux/api/notificationApi";
import { useDispatch } from "react-redux";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user?.id) {
      const newSocket = io("http://localhost:3000/notifications", {
        query: { userId: user.id },
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        console.log("WebSocket connected:", newSocket.id);
      });

      newSocket.on("newNotification", (notification) => {
        console.log("New notification received:", notification);
        // Refresh notifications query in RTK Query
        dispatch(notificationApi.util.invalidateTags(["Notification"]));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user?.id, dispatch]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
