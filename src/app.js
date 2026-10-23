import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import corsOptions from "./config/cors.js";
import env from "./config/env.js";
import { isDatabaseReady } from "./config/database.js";
import swaggerDocument from "./config/swagger.js";
import requestId from "./middlewares/requestId.js";
import securityHeaders from "./middlewares/securityHeaders.js";
import notFound from "./middlewares/notFound.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import routes from "./routes/index.js";

const app = express();

if (env.trustProxy) app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(requestId);
app.get("/api-docs.json", (_req, res) => res.status(200).json(swaggerDocument));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: "KhelYard API Documentation",
    customCss: "",
  }),
);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));

app.get("/health/live", (_req, res) => res.status(200).json({ status: "ok" }));
app.get("/health/ready", (_req, res) => {
  res.status(isDatabaseReady() ? 200 : 503).json({
    status: isDatabaseReady() ? "ready" : "not_ready",
  });
});

app.use("/api/v1", routes);
app.use(notFound);
app.use(globalErrorHandler);

export default app;
