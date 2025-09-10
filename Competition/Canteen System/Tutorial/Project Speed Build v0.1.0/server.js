const express = require("express");
const bodyParser = require("body-parser");
var multiparty = require("multiparty");

const app = express();
const PORT = process.env.PORT || 3000;
const fs = require("fs");

app.use("/", express.static("Order"));
app.use("/orders", express.static("database"));
app.use("/login", express.static("Login"));
app.use("/admin", express.static("Admin"));
app.use("/data", express.static("Data"));
app.use("/contact", express.static("Contact"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.post("/submit", (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	if (!username || !password) {
		return res.status(400).send("Username and password are required.");
	}

	var data = fs.readFileSync("test.json");
	data = JSON.parse(data);
	newUser = {
		username: username,
		password: password,
	};

	data.users.push(newUser);
	var newData = JSON.stringify(data);
	res.send(`Received: Username - ${username}, Password - ${password} FULL: ${newData}`);

	fs.writeFile("test.json", newData, (err) => {
		if (err) throw err;
	});
});

app.post("/doneOrder", (req, res) => {
	var index = req.body.orderIndex.split(",");
	var data = fs.readFileSync("Data/orders.json");
	data = JSON.parse(data);

	data.orders[index[0]].order[index[1]].done = data.orders[index[0]].order[index[1]].done ? false : true;
	console.log(data.orders[index[0]].order[index[1]]);
	var newData = JSON.stringify(data);
	fs.writeFile("Data/orders.json", newData, (err) => {
		if (err) throw err;
		console.log(`Order: ${req.body.orderIndex} ${data.orders[index[0]].order[index[1]].done ? "Undone" : "Done"}.`);
	});
});

app.post("/newOrder", (req, res) => {
	console.log(req.body.name, req.body.class, req.body.time, req.body.orders, req.body.pay, req.body.price);
	var name = req.body.name;
	var className = req.body.class;
	var time = req.body.time;
	var orders = () => {
		let order = req.body.orders.split("/");
		for (i = 0; i < order.length; i++) {
			order[i] = {
				done: false,
				index: order[i].split(","),
			};
		}
		return order;
	};
	var payNow = req.body.pay;
	var returnCheck = 0;
	console.log(payNow == "true");
	if (payNow == "true") {
		var users = JSON.parse(fs.readFileSync("Data/users.json"));
		var price = req.body.price;
		var id = Number(req.body.id);
		var paid = false;
		console.log(users.users[id].money, price);
		if (users.users[id].money >= price) {
			users.users[id].money -= price;
			users.users[id].money == Math.round(users.users[id].money * 100) / 100;
			fs.writeFile("Data/users.json", JSON.stringify(users), (err) => {
				if (err) throw err;
			});
			paid = true;
		} else {
			returnCheck = 1;
			return;
		}
	}
	if (returnCheck) return;

	const newObject = {
		name: name,
		class: className,
		order: orders(),
		time: time,
		paid: paid,
	};

	var data = fs.readFileSync("Data/orders.json");
	data = JSON.parse(data);
	data.orders.push(newObject);
	var newData = JSON.stringify(data);
	fs.writeFile("Data/orders.json", newData, (err) => {
		if (err) throw err;
	});
	res.sendStatus(200).send("Done");
});

app.post("/newUser", (req, res) => {
	var username = req.body.username;
	var password = req.body.password;
	var className = req.body.class;
	var uid = req.body.uid;
	var admin = req.body.admin;

	var data = fs.readFileSync("Data/users.json");
	data = JSON.parse(data);
	data.users.push({
		username: username,
		password: password,
	});
	let curUser = data.users.length - 1;
	if (!!className) data.users[curUser].class = className;
	if (!!uid) data.users[curUser].uid = uid.split(" ");
	if (admin) data.users[curUser].admin = true;
	var newData = JSON.stringify(data);
	fs.writeFile("Data/users.json", newData, (err) => {
		if (err) throw err;
	});
});

app.post("/editItem", (req, res) => {
	var name, price, image, index;
	var form = new multiparty.Form();
	form.parse(req, function (err, fields, files) {
		name = fields.name[0];
		price = fields.price[0];
		index = fields.index[0].split(",");
		image = files.image[0];

		saveData();
	});

	function saveData() {
		var data = fs.readFileSync("Data/items.json");
		data = JSON.parse(data);
		data.subMenu[index[0]][index[1]] = name;
		data.subMenuPrice[index[0]][index[1]] = Number(price);

		fs.rename(image.path, `Data/ItemImage/${index.join(",")}.png`, function (err) {
			if (err) throw err;
		});

		fs.writeFile("Data/items.json", JSON.stringify(data), (err) => {
			if (err) throw err;
		});

		res.sendStatus(200);
	}
});

app.post("/newItem", (req, res) => {
	var name, price, image, index;
	var form = new multiparty.Form();
	form.parse(req, function (err, fields, files) {
		name = fields.name[0];
		price = fields.price[0];
		index = fields.index[0];
		image = files.image[0];

		saveData();
	});

	function saveData() {
		var data = fs.readFileSync("Data/items.json");
		data = JSON.parse(data);
		data.subMenu[index].push(name);
		data.subMenuPrice[index].push(Number(price));

		fs.rename(image.path, `Data/ItemImage/${index},${data.subMenu[index].length - 1}.png`, function (err) {
			if (err) throw err;
		});

		fs.writeFile("Data/items.json", JSON.stringify(data), (err) => {
			if (err) throw err;
		});

		res.sendStatus(200);
	}
});

app.post("/deleteItem", (req, res) => {
	var index = req.body.index.split(",");
	var data = fs.readFileSync("Data/items.json");
	data = JSON.parse(data);
	data.subMenu[index[0]].splice(index[1], 1);
	data.subMenuPrice[index[0]].splice(index[1], 1);

  if (fs.existsSync(`Data/ItemImage/${index[0]},${index[1]}.png`)) {
    fs.unlink(`Data/ItemImage/${index[0]},${index[1]}.png`, (err) => {
      if (err) throw err; //handle your error the way you want to;
    });
  }

	for (let i = index[1]; i < data.subMenu[index[0]].length; i++) {
		if (fs.existsSync(`Data/ItemImage/${index[0]},${Number(i) + Number(1)}.png`)) {
			fs.rename(`Data/ItemImage/${index[0]},${Number(i) + Number(1)}.png`, `Data/ItemImage/${index[0]},${i}.png`, function (err) {
				if (err) throw err;
			});
		}
	}

	fs.writeFile("Data/items.json", JSON.stringify(data), (err) => {
		if (err) throw err;
	});
	res.sendStatus(200);
});

// app.get('/checkUsername', (req, res) => {
//   var data = JSON.parse(fs.readFileSync('Data/users.json'));
//   var uid = req.query.uid;
//   var sent = 0;

//   data.users.forEach((value) => {
//     if (!value.uid) return;
//     if (value.uid.join(",") == uid) {
//       sent = 1;
//       res.status(200).send(value.username);
//       res.end;
//     }
//   })
//   if (sent == 0) res.status(200).send("none");
//   // res.status = 200;
// })

// app.get('/checkClass', (req, res) => {
//   var data = JSON.parse(fs.readFileSync('Data/users.json'));
//   var uid = req.query.uid;
//   var sent = 0;

//   data.users.forEach((value) => {
//     if (!value.uid) return;
//     if (value.uid.join(",") == uid) {
//       sent = 1;
//       res.status(200).send(!value.class ? "Teacher" : value.class);
//       res.end;
//     }
//   })
//   if (sent == 0) res.status(200).send("none");
// })

app.get("/checkUser", (req, res) => {
	var data = JSON.parse(fs.readFileSync("Data/users.json"));
	var uid = req.query.uid;
	var sent = 0;

	data.users.forEach((value, index) => {
		if (!value.uid) return;
		if (value.uid.join(",") == uid) {
			sent = 1;
			res.status(200).send({
				name: value.username,
				class: !value.class ? "Teacher" : value.class,
				money: value.money,
				fingerprint: value.fingerprint,
				id: index,
			});
			return;
		}
	});
	if (sent == 0) res.status(200).send("none");
});

app.get("/getMenu", (req, res) => {
	var data = JSON.parse(fs.readFileSync("Data/items.json"));
	var subMenu = "";
	for (let i = 0; i < data.subMenu.length; i++) {
		for (let j = 0; j < data.subMenu[i].length; j++) {
			subMenu += `${data.subMenu[i][j]},`;
		}
		subMenu = subMenu.substring(0, subMenu.length - 1);
		subMenu += "/";
	}
	res.status(200).send(subMenu);
});

app.get("/getMenuPrice", (req, res) => {
	var data = JSON.parse(fs.readFileSync("Data/items.json"));
	var subMenuPrice = "";
	for (let i = 0; i < data.subMenuPrice.length; i++) {
		for (let j = 0; j < data.subMenuPrice[i].length; j++) {
			subMenuPrice += `${data.subMenuPrice[i][j]},`;
		}
		subMenuPrice = subMenuPrice.substring(0, subMenuPrice.length - 1);
		subMenuPrice += "/";
	}
	res.status(200).send(subMenuPrice);
});
// app.get('/test', (req, res) => {
//   res.sendFile(__dirname + '/Database/index.html')
// })
app.post("/editUser", (req, res) => {
	var name = req.body.name;
	var className = req.body.class;
	var password = req.body.password;
	var uid = req.body.uid;
	var money = req.body.money;
	var id = req.body.id;

	var data = JSON.parse(fs.readFileSync("Data/users.json"));
	data.users[id].username = name;
	data.users[id].class = className;
	data.users[id].password = password;
	data.users[id].uid = uid.split(",");
	data.users[id].money = Number(money);

	var newData = JSON.stringify(data);
	fs.writeFile("Data/users.json", newData, (err) => {
		if (err) throw err;
	});
});

app.post("/deleteUser", (req, res) => {
	var id = req.body.id;

	var data = JSON.parse(fs.readFileSync("Data/users.json"));

	data.users.splice(id, 1);

	var newData = JSON.stringify(data);
	fs.writeFile("Data/users.json", newData, (err) => {
		if (err) throw err;
	});
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
