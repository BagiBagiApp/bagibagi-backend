import express from "express";
import cors from  "cors";

import usersRouter from "./routes/userRoutes.js";
import orgRouters from "./routes/organizationRoutes.js";
import productsRouter from "./routes/produkRoutes.js";

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

app.use('/users', usersRouter);
app.use('/org', orgRouters);
app.use('/product', productsRouter);

app.listen(PORT, () => {
    console.log(`Server started on port: http://localhost:${PORT}`);
});