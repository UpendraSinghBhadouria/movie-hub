import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/api\/?$/, "") ??
  "https://movie-hub-edbk.onrender.com";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(`${SOCKET_URL}/seat-lock`, {
      autoConnect: false,
      transports: ["polling", "websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("[Socket] connected:", socket?.id);
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] disconnected:", reason);
    });
  }

  return socket;
};

// import { io, Socket } from "socket.io-client";

// const SOCKET_URL =
//   process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/api\/?$/, "") ??
//   "http://localhost:8000";

// let socket: Socket | null = null;

// export const getSocket = (): Socket => {
//   if (!socket) {
//     socket = io(`${SOCKET_URL}/seats`, {
//       withCredentials: true,
//       transports: ["websocket"],
//       autoConnect: true,
//     });
//   }

//   return socket;
// };

// export const disconnectSocket = () => {
//   if (socket) {
//     socket.disconnect();
//     socket = null;
//   }
// };
