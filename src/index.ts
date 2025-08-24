import express, { Application } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import bodyParser from "body-parser";
import apiRouter from "./routes";
const cors = require("cors");

const app: Application = express();

mongoose.set("strictQuery", false);
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}`
  )
  .then(() => {
    app.listen(process.env.PORT, () => {
      // Server started successfully
    });
  })
  .catch((err) => {
    // MongoDB connection error
  });

app.use(cors());
app.options("*", cors());

// Middleware pour les webhooks Stripe (body brut)
app.use(
  "/api/subscription/webhook",
  bodyParser.raw({ type: "application/json" })
);

// Middleware pour les autres routes (body JSON)
app.use(bodyParser.json());

app.use("/api/", apiRouter);

export default app;
