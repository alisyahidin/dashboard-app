import 'dotenv/config';
import express from "express";
import routes from './routes/v1/index.js';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());

app.use("/api/v1", routes);

app.use(errorHandler);

app.listen(env.PORT, () => {
	console.log(`Server running at http://localhost:${env.PORT}`);
});
