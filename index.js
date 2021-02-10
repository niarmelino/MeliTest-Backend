const express = require("express");
const cors = require("cors");
require("dotenv").config();
const request = require('request');

const app = express();
app.use(cors());

app.get("/", (req, res) => {
	res.json({
		ok: true,
		msg: "Servidor ok"
	})
});

app.get("/api/items", (req, res) => {
	let query = req.query.q;

	try {
		request({
			uri: "https://api.mercadolibre.com/sites/MLA/search",
			qs: {
				limit: process.env.CANT_PRODUCTOS,
				q: query
			}
		},
			function (error, response, body) {
				if (!error && response.statusCode === 200) {
					body = JSON.parse(body);

					let Articulos = [];

					for (let item of body.results) {
						Articulos.push({
							id: item.id,
							title: item.title,
							price: {
								currency: item.currency_id,
								amount: item.price,
								decimals: 0
							},
							picture: item.thumbnail,
							condition: item.condition,
							free_shipping: item.shipping.free_shipping
						});
					}

					res.json({
						author: {
							name: "Nicolás",
							lastname: "Armelino"
						},
						items: Articulos
					});
				} else {
					res.json(error);
				}
			}
		);
	}
	catch (err) {
		console.log(err);

		res.status(500).json({
			ok: false,
			msg: "Error de servidor."
		})
	}
});

app.listen(process.env.PUERTO, () => {
	console.log("Servidor iniciado en el puerto " + process.env.PUERTO);
});