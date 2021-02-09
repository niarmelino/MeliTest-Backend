const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());

app.get("/", (req, res) => {
	res.json({
		ok: true,
		msg: "Servidor ok"
	})
});

app.listen(process.env.PUERTO, () => {
	console.log("Servidor iniciado en el puerto " + process.env.PUERTO);
});