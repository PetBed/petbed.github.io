const express = require("express");
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const fs = require('fs');

app.use('/orders', express.static("database"));
app.use('/login', express.static("Login"));
app.use('/', express.static("Order"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.post('/submit', (req, res) => {
  // accessing form fields from req.body
  const username = req.body.username;
  const password = req.body.password;
  // verification steps 
  if (!username || !password) {
      return res.status(400).send('Username and password are required.');
  }
  
  var data = fs.readFileSync('test.json');
  data = JSON.parse(data);
  newUser = {
    "username": username,
    "password": password
  }

  data.users.push(newUser);
  var newData = JSON.stringify(data);
  res.send(`Received: Username - ${username}, Password - ${password} FULL: ${newData}`);

  fs.writeFile('test.json', newData, err => {
    // error checking
    if(err) throw err;
    
    console.log("New data added");
  });   
});

app.post('/doneOrder', (req, res) => {
  var index = req.body.orderIndex.split(",");
  var data = fs.readFileSync('Public/data.json');
  data = JSON.parse(data);

  data.orders[index[0]].order[index[1]].done = data.orders[index[0]].order[index[1]].done ? false : true;
  console.log(data.orders[index[0]].order[index[1]])
  var newData = JSON.stringify(data);
  fs.writeFile('Public/data.json', newData, err => {
    if(err) throw err;
    console.log(`Order: ${req.body.orderIndex} ${data.orders[index[0]].order[index[1]].done ? "Undone" : "Done"}.`);
  });   
});

app.post('/newOrder', (req, res) => {
  var name = req.body.name;
  var className = req.body.class;
  var time = req.body.time;
  var orders = () => {
    let order = req.body.orders.split("/")
    for (i = 0; i < order.length; i++) {
      order[i] = {
        "done": false,
        "index": order[i].split(",")}
    }
    return order;
  };

  const newObject = {
    "name": name,
    "class": className,
    "order": orders(),
    "time": time
  };
  
  var data = fs.readFileSync('Public/data.json');
  data = JSON.parse(data);
  data.orders.push(newObject);
  var newData = JSON.stringify(data);
  fs.writeFile('Public/data.json', newData, err => {
    if(err) throw err;
  });
})

app.get('/test', (req, res) => {
  // app.use(express.static("Public"));
  res.sendFile(__dirname + '/Public/index.html')
})

// app.get('/style.css', function(req, res) {
//   res.sendFile(__dirname + "/Public/style.css");
// });


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});