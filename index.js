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
							name: process.env.AUTOR_NOMBRE,
							lastname: process.env.AUTOR_APELLIDO
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

app.get("/api/items/:id", (req, res) => {
	let id = req.params.id;

	try {
		request({
			uri: "https://api.mercadolibre.com/items/" + id,
		},
			function (error, response, body) {
				let Cuerpo = JSON.parse(body);

				if (Cuerpo.error) {
					switch (Cuerpo.error) {
						case "resource not found":
							res.status(404).json({
								ok: false,
								msg: "No se encuentra el producto."
							});
							break;

						default:
							res.status(500).json({
								ok: false,
								msg: Cuerpo.error
							});
					}
				}
				else {
					if (!error && response.statusCode === 200) {
						let Item = JSON.parse(body);

						console.log(Item);

						res.json({
							author: {
								name: process.env.AUTOR_NOMBRE,
								lastname: process.env.AUTOR_APELLIDO
							},
							item: {
								id: Item.id,
								title: Item.title,
								price: {
									currency: Item.currency_id,
									amount: Item.price,
									decimals: 0
								},
								picture: Item.pictures[0].url,
								condition: Item.condition,
								free_shipping: Item.free_shipping,
								sold_quantity: Item.sold_quantity,
								description: ""
							}
						});
					} else {
						console.log(body);
						res.json(error);
					}
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

	//https://api.mercadolibre.com/items/ :id /description
});

app.listen(process.env.PUERTO, () => {
	console.log("Servidor iniciado en el puerto " + process.env.PUERTO);
});