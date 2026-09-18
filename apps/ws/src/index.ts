import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "../../../packages/db/dist/index.js";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET!;

const wss = new WebSocketServer({ port: 8080 });

interface User {
  userId: string;
  name: string;
  ws: WebSocket;
  rooms: string[];
}

let users: User[] = [];

type DecodedToken = {
  userId: string;
  name?: string;
};

function authUser(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken | string;

    if (typeof decoded == "string") {
      console.error("Decoded token is a string, expected object");
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }

    return {
      userId: decoded.userId,
      name: decoded.name || "User",
    };
  } catch (error) {
    return null;
  }
}

function broadcastParticipants(roomId: string) {
  const participants = users
    .filter((user) => user.rooms.includes(roomId))
    .map((user) => ({ userId: user.userId, name: user.name }));

  users.forEach((user) => {
    if (user.rooms.includes(roomId) && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(
        JSON.stringify({
          type: "participants-update",
          roomId,
          participants,
        })
      );
    }
  });
}

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token");
  if (!token) {
    ws.close();
    return;
  }

  const authedUser = authUser(token);
  if (!authedUser) {
    ws.close();
    return;
  }

  const currentUser: User = {
    userId: authedUser.userId,
    name: authedUser.name,
    ws,
    rooms: [],
  };
  users.push(currentUser);

  // console.log(`User connected: ${authedUser.userId}`);

  ws.send(JSON.stringify({ message: "Connected to WebSocket server." }));

  ws.on("message", async (data) => {
    let parsedData;
    try {
      parsedData =
        typeof data === "string"
          ? JSON.parse(data)
          : JSON.parse(data.toString());
    } catch (err) {
      console.error("Invalid JSON received:", data);
      return;
    }

    if (parsedData.type === "join-room") {
      const roomId = parsedData.roomId;
      const room = await prisma.room.findUnique({ where: { id: roomId } });

      if (!room) {
        console.log("Room not found");
        ws.close();
        return;
      }

      if (!currentUser.rooms.includes(roomId)) {
        currentUser.rooms.push(roomId);
      }

      broadcastParticipants(roomId);

      const existingShapes = await prisma.shape.findMany({ where: { roomId } });

      existingShapes.forEach((shape: any) => {
        try {
          const parsedShape = JSON.parse(shape.message); // parse from DB string
          ws.send(
            JSON.stringify({
              type: "chat",
              roomId,
              message: parsedShape,
            })
          );
        } catch (err) {
          console.error("Failed to parse stored shape:", shape.message);
        }
      });
    }

    if (parsedData.type === "leave-room") {
      const room = await prisma.room.findUnique({
        where: { name: parsedData.name },
      });

      if (!room) {
        console.error("No room exists");
        return;
      }

      currentUser.rooms = currentUser.rooms.filter((id) => id !== room.id);
      broadcastParticipants(room.id);
    }

    if (parsedData.type === "chat") {
      const { roomId, message } = parsedData;
      const shapeId = message.id;
      // console.log(message);

      try {
        if (message.type === "deleted") {
          await prisma.shape.deleteMany({
            where: {
              roomId,
              shapeId,
            },
          });
        } else {
          const existing = await prisma.shape.findFirst({
            where: {
              roomId,
              shapeId,
            },
          });
          if (existing) {
            await prisma.shape.update({
              where: { id: existing.id },
              data: { message: JSON.stringify(message) },
            });
          } else {
            await prisma.shape.create({
              data: {
                roomId,
                shapeId,
                userId: currentUser.userId,
                message: JSON.stringify(message),
              },
            });
          }
        }
      } catch (error) {
        console.error("Failed to save shape:", error);
      }

      users.forEach((user) => {
        if (
          user.rooms.includes(roomId) &&
          user.ws.readyState === WebSocket.OPEN &&
          user.ws !== ws
        ) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              roomId,
              message,
            })
          );
        }
      });
    }
  });

  ws.on("close", () => {
    const user = users.find((u) => u.ws === ws);
    if (user) {
      const roomsToUpdate = [...user.rooms];
      users = users.filter((u) => u.ws !== ws);
      roomsToUpdate.forEach((roomId) => broadcastParticipants(roomId));
      return;
    }

    users = users.filter((u) => u.ws !== ws);
  });
});
