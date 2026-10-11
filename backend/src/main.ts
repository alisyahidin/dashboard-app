import dotenv from 'dotenv';
import express from "express";
import routes from './routes/v1/index.js';
import { env } from './config/env.js';

dotenv.config();

const app = express();
const port = env.PORT;

app.get("/", (_, res) => {
	res.json({
		message: 'Hello World'
	})
});

app.use("/api/v1", routes);

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
