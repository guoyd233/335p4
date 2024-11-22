const fs = require('fs');
const path = require('path');
const express = require('express');
const readline = require('readline');
const process = require('process');

class Item {
  #cost;

  constructor(name, cost) {
    this.name = name;
    this.#cost = cost;
  }

  getCost() {
    return this.#cost;
  }
}

// if cmd > 3
if (process.argv.length !== 3) {
  console.log('Usage supermarketServer.js jsonFile');
  process.exit(1);
}

const jsonFile = process.argv[2];

let items;
const data = fs.readFileSync(jsonFile, 'utf8');
const getData = JSON.parse(data);
items = getData.itemsList.map(item => new Item(item.name, item.cost));

const app = express();
const port = 5001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/catalog', (req, res) => {
  let itemsTable = `
    <table border="1">
    <thead>
    <tr>
        <th>Item</th>
        <th>Cost</th>
    </tr>
    </thead>
    <tbody>
  `;

  items.forEach(item => {
    itemsTable += `
      <tr>
        <td>${item.name}</td>
        <td>${item.getCost().toFixed(2)}</td>
      </tr>
    `;
  });

  itemsTable += `</tbody></table>`;

  res.render('displayItems', { itemsTable });
});

app.get('/order', (req, res) => {
  const itemsSelect = items.map(item => `
    <option value="${item.name}">${item.name} - $${item.getCost().toFixed(2)}</option>
  `).join('');

  res.render('placeOrder', { items: itemsSelect });
});

app.post('/order', (req, res) => {
    const { name, email, delivery, itemsSelected } = req.body;
    const selectedItemsArray = Array.isArray(itemsSelected) ? itemsSelected : [itemsSelected];
    const itemsNeeded = items.filter(item => selectedItemsArray.includes(item.name));
    const totalCost = itemsNeeded.reduce((sum, item) => sum + item.getCost(), 0).toFixed(2);
    
    const orderTable = `
      <table border="1">
        <thead>
          <tr>
            <th>Item</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          ${itemsNeeded.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.getCost().toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr>
            <td>Total</td>
            <td>${totalCost}</td>
          </tr>
        </tbody>
      </table>
    `;
  
    res.render('orderConfirmation', {
      name,
      email,
      delivery,
      orderTable
    });
  });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const promptUser = () => {
  rl.question('Type itemsList or stop to shutdown the server: ', (answer) => {
    if (answer === 'stop') {
      console.log('Shutting down the server');
      process.exit(0);
    } else if (answer === 'itemsList') {

      console.log('[');
      items.forEach((item, index) => {
        const comma = index < items.length - 1 ? ',' : '';
        const itemString = `  { name: '${item.name}', cost: ${item.getCost()} }${comma}`;
        console.log(itemString);
      });
      console.log(']');

      promptUser();
    } else {
      console.log(`Invalid command: ${answer}`);
      promptUser();
    }
  });
};

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  promptUser();
});
