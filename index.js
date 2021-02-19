var express = require('express');
var https = require('https');
var cors = require("cors"); 
require("dotenv").config();

const app = express();
app.use(cors());

app.get("/", (req, res) => {
	res.json({
		ok: true,
		msg: "Servidor ok"
	})
});

app.get("/api/items", (req, res) => {
	let url = process.env.URL_MLA.concat('sites/MLA/search?q=:', req.query.q, '&limit=', process.env.CANT_PRODUCTOS);

	https.get(url, (resp) => {
		let data = '';

		resp.on('data', (chunk) => {
			data += chunk;
		});

		resp.on('end', () => {
			let datos = JSON.parse(data);

			//Categories  
			let categories = [];
			if (datos.filters[0] && datos.filters[0].values[0]) {
				datos.filters[0].values[0].path_from_root.forEach(element => {
					categories.push(element)
				});
			}

			//Items
			let promises = [];

			datos.results.forEach(element => {
				let urlCurrency = process.env.URL_MLA.concat('currencies/', element.currency_id);

				promises.push(
					new Promise((resolve, reject) => {
						https.get(urlCurrency, (resp) => {
							let currency = '';

							resp.on('data', (chunk) => {
								currency += chunk;
							});

							resp.on('end', () => {
								let symbol = JSON.parse(currency).symbol;

								let jsonItem = {
									id: element.id,
									title: element.title,
									price: {
										currency: symbol,
										amount: Math.trunc(element.price).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'),
										decimals: Math.round((element.price % 1) * 100).toString().padStart(2, "0")
									},
									picture: element.thumbnail,
									address: element.address.state_name,
                                    free_shipping: element.shipping.free_shipping,
                                    state: element.seller_address.state.name
								}

								resolve(jsonItem);
							})
						})
					})
				);
			});

			Promise.all(promises).then((items) => {
				let jsonData = {
					author: {
						name: process.env.AUTOR_NOMBRE,
						lastname: process.env.AUTOR_APELLIDO
					},
					categories: categories,
					items: items
				}

				res.json(jsonData);
			})
		});

	}).on("error", (err) => {
		console.log("err")
		console.log("Error: " + err.message);
	});
});

app.get("/api/items/:id", (req, res) => {
    let urlItem = process.env.URL_MLA.concat('items/', req.params.id);

    https.get(urlItem, (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
            data += chunk;
        });

        resp.on('end', () => {
            let element = JSON.parse(data);
            let urlCurrency = process.env.URL_MLA.concat('currencies/', element.currency_id);

            https.get(urlCurrency, (resp) => {
                let currency = '';

                resp.on('data', (chunk) => {
                    currency += chunk;
                });

                resp.on('end', () => {
                    let symbol = JSON.parse(currency).symbol;
                    let urlDescription = process.env.URL_MLA.concat('items/', req.params.id, '/description');

                    https.get(urlDescription, (resp) => {
                        let descripcion = '';

                        resp.on('data', (chunk) => {
                            descripcion += chunk;
                        });

                        resp.on('end', () => {
                            let description = JSON.parse(descripcion).plain_text;
                            let urlCategory = process.env.URL_MLA.concat('categories/', element.category_id);

                            https.get(urlCategory, (resp) => {
                                let categories = '';

                                resp.on('data', (chunk) => {
                                    categories += chunk;
                                });

                                resp.on('end', () => {
                                    let categorias = JSON.parse(categories).path_from_root;

                                    let item = {
                                        id: element.id,
                                        title: element.title,
                                        price: {
                                            currency: symbol,
                                            amount: Math.trunc(element.price).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'),
                                            decimals: Math.round((element.price % 1) * 100).toString().padStart(2, "0")
                                        },
                                        picture: element.thumbnail,
                                        condition: element.condition,
                                        free_shipping: element.shipping.free_shipping,
                                        sold_quantity: element.sold_quantity,
                                        description: description,
                                        categories: categorias
                                    }

                                    let jsonData = {
                                        author: {
                                            name: process.env.AUTOR_NOMBRE,
                                            lastname: process.env.AUTOR_APELLIDO
                                        },
                                        item: item
                                    }

                                    res.json(jsonData);
                                });
                            }).on("error", (err) => {
                                console.log("err")
                                console.log("Error: " + err.message);
                            });
                        });
                    }).on("error", (err) => {
                        console.log("err")
                        console.log("Error: " + err.message);
                    });
                });
            }).on("error", (err) => {
                console.log("err")
                console.log("Error: " + err.message);
            });
        })
    }).on("error", (err) => {
        console.log("err")
        console.log("Error: " + err.message);
    });
});

app.listen(process.env.PUERTO, () => {
	console.log("Servidor iniciado en el puerto " + process.env.PUERTO);
});