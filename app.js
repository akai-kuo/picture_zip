import express from "express";
import imageRoutes from "./backend/routes/image.routes.js";
import { errorHandler, notFoundHandler } from "./backend/middlewares/error.middleware.js";

const app = express();

app.disable("x-powered-by");

// 處理一般 JSON API 請求。
// multipart/form-data 由 Multer 處理。
app.use(
  express.json({
    limit: "100kb",
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
  });
});

app.use("/api/images", imageRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
