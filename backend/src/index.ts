import express from "express";

const port = process.env.PORT ?? 5000;
const url = process.env.BASE_URL ?? "localhost";

const app = express();

app.use(express.json());

app.listen(port, () => {
  console.log(`Servidor escutando a porta http://${url}:${port}`);
});
