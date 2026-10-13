import 'dotenv/config';
import cookieParser from "cookie-parser";
import express from "express";
import routes from './routes/v1/index.js';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

app.use("/api/v1", routes);

app.use(errorHandler);

const server = app.listen(parseInt(env.PORT), '0.0.0.0', () => {
	console.log(`Server running at http://localhost:${env.PORT}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
	process.on(signal, () => {
		console.log(`${signal} received, shutting down ...`);
		server.close(() => process.exit(0));
		setTimeout(() => process.exit(1), 10_000).unref();
	});
}
