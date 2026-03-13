import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import middleware from "./middleware.js";
import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import {
  createRoomSchema,
  createUserSchema,
  signinSchema,
} from "../../../packages/common/dist/types.js"

import { prisma } from "../../../packages/db/dist/index.js";
const JWT_SECRET = process.env.JWT_SECRET!;

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000", 
      "http://localhost:3001",
      "http://localhost",
      "https://sketchydraw.bhagat.dev",
      `${process.env.EC2_INSTANCE_URL}`,
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use((req, res, next) => {
  // console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

app.post("/signup", async (req: Request, res: Response): Promise<any> => {
  const parsedData = createUserSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.status(401).json({
      message: "wrong inputs",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      username: parsedData.data.username,
    },
  });

  if (existingUser) {
    return res.status(409).json({
      message: "User already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name: parsedData.data.name,
        username: parsedData.data.username,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      user: user,
      message: "user created",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "something went wrong",
    });
  }
});

app.post("/signin", async (req: Request, res: Response): Promise<any> => {
  const parsedData = signinSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({ message: "wrong Inputs" }).status(401);
  }

  const user = await prisma.user.findFirst({
    where: {
      username: parsedData.data?.username,
    },
  });
  if (!user) {
    return res.status(403).json({ message: "No User exists" });
  }

  const correctPassword = bcrypt.compare(
    parsedData.data.password,
    user.password
  );
  if (!correctPassword) {
    return res.status(403).json({ message: "wrong password" });
  }

  const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET);
  res.status(200).json({
    token,
    message: "signin successful",
  });
});

app.post(
  "/room",
  middleware,
  async (req: Request, res: Response): Promise<any> => {
    const parsedData = createRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(401).json({ message: "Wrong Inputs" });
    }

    const userId = req.userId;
    try {
      const room = await prisma.room.create({
        data: {
          name: parsedData.data.name,
          creatorId: userId,
        },
      });

      return res.json({
        id: room.id,
        name: room.name,
        creatorId: room.creatorId,
        createdAt: room.createdAt,
      });
    } catch (error) {
      return res.status(400).json({ message: "Something went wrong!" });
    }
  }
);

app.delete(
  "/room",
  middleware,
  async (req: Request, res: Response): Promise<any> => {
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ message: "roomId is required" });
    }
    const userId = req.userId;
    try {
      const data = await prisma.room.findFirst({
        where: {
          id: roomId,
          creatorId: userId,
        },
      });
      if (!data) return res.json({ message: "You are not the Owner" });
      await prisma.room.delete({
        where: {
          id: roomId,
        },
      });
      return res.status(200).json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Error deleting room:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);
app.get(
  "/rooms",
  middleware,
  async (req: Request, res: Response): Promise<any> => {
    const userId = req.userId;
    try {
      const rooms = await prisma.room.findMany({
        where: {
          creatorId: userId,
        },
      });
      if (!rooms) {
        return res.status(401).json({ message: "No Room Found" });
      }
      return res.json(rooms);
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error,
      });
    }
  }
);
app.post(
  "/bulkShapes/:roomId",
  middleware,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { roomId } = req.params;
      // console.log("Saving shapes for room:", roomId);
      const { shapes } = req.body;
      const userId = req.userId;
      if (!roomId) {
        return res.status(400).json({ message: "roomId is required" });
      }

      if (!shapes || !Array.isArray(shapes)) {
        return res.status(400).json({ message: "Invalid shapes data" });
      }
      const savedShapes = await Promise.all(
        shapes.map(async (shape: any) => {
          return prisma.shape.create({
            data: {
              roomId,
              shapeId: shape.id,
              message: JSON.stringify(shape),
              userId,
            },
          });
        })
      );
      res.status(201).json({
        message: "Shapes saved successfully",
        count: savedShapes.length,
      });
    } catch (error) {
      console.error("Error saving shapes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.get(
  "/shapes/:roomId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const roomId = req.params.roomId;
      const messages = await prisma.shape.findMany({
        where: {
          roomId: roomId,
        },
      });

      return res.json({
        messages,
      });
    } catch (e) {
      // console.log(e);
      res.json({
        messages: [],
      });
    }
  }
);

app.listen(8000, () => {
  console.log("server started on port 8000");
});
