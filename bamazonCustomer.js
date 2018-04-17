//Here is the info from mySql:

// USE bamazon_db;

// CREATE TABLE products (
//  item_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//  product_name VARCHAR(75) NOT NULL,
//  department_name VARCHAR(75) NOT NULL,
//  price INTEGER(7) NOT NULL,
//  stock_quantity INTEGER(10) NOT NULL
// );


var inquirer = require ('inquirer');

var mysql = require ('mysql');
var conn = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: 'root',
	database: 'bamazon_db'

});

conn.connect(function(error){
	if(error){
		throw error;
	};
	// console.log("Connected as id " + conn.threadID);
	displayItems();
	
});

function displayItems (){
	console.log("Here are the items in our store: \n");
	var itemArray = [];
	conn.query('SELECT * FROM `products`', function(error, productList){
		if(error){
			throw error;
		}
		// console.log(productList);
		// console.log("Item ID" + "    " + "Item" + "       " + "Price \n");
		for(i = 0; i < productList.length; i++){
			itemArray.push(productList[i].product_name);
			console.log(productList[i].item_id + " " + productList[i].product_name + "    Price: " + productList[i].price);
		}
		// console.log(itemArray);


		customerChoice(itemArray);
	})

};

function customerChoice (itemArray){
	// console.log("customer choice");
	console.log("\n");
	inquirer.prompt([
		{
			type: 'list',
			message: 'Which item would you like to buy?',
			choices: itemArray,
			name: 'itemSelect'
		}
		]).then(function(data){
			console.log("\n");
			inquirer.prompt([
				{
					type: 'input',
					message: 'You have chosen to purchase ' + data.itemSelect + '. How many would you like to buy?',
					name: 'userQuant'
				}
				]).then(function(quantData){
					console.log("\n");
					quantityCheck(quantData.userQuant, data.itemSelect);
				})
		})
};

function quantityCheck (requestedQuantity, item){
	conn.query('SELECT `stock_quantity` FROM `products` WHERE ?',
		[{product_name: item}],
		function(error, results){
			if(error){
				throw error;
			}
			// console.log(results[0].stock_quantity);
			var itemQuant = results[0].stock_quantity;
			if(requestedQuantity > itemQuant){
				console.log("\nSorry, insufficient stock in store : (\n");
				displayItems();
			}

			else{
				fulfillOrder(requestedQuantity, item, itemQuant);
			}
		}

		)
}


function fulfillOrder(requestedQuantity, item, itemQuant){
	conn.query('SELECT `price` FROM `products` WHERE ?',
		[{product_name: item}],
		function(error, priceResults){
			var price;
			if(error){
				throw error;
			};
			price = priceResults[0].price;
			// console.log(price);
			var custCost = price * requestedQuantity;
			inquirer.prompt([
				{
					type: 'confirm',
					message: 'You have chosen to purchase ' + requestedQuantity + " " + item + '\nThis will cost ' + custCost + ' dollars' + '\nAre you sure?',
					name: 'userChoice'
				}
			]).then(function(choice){
				if(choice.userChoice === true){
					updateDBQuantity(requestedQuantity, item, itemQuant, custCost);
				}
				else{
					console.log("\n");
					console.log("Ok, no problem");
					console.log("\n");
					displayItems();
				}
			})
		})
}

function updateDBQuantity(requestedQuantity, item, itemQuant, custCost){
	// console.log("updated");
	console.log("\n");
	conn.query('UPDATE `products` SET ? WHERE ?',
		[
			{
				stock_quantity: (itemQuant - requestedQuantity)
			},
			{
				product_name: item
			}
		],
		function(error, updateResult){
			if(error){
				throw error;
			}
			console.log("You have purchased " + requestedQuantity + " " + item + "\nTotal transaction cost: " + custCost + " dollars");
			console.log("\n");
			inquirer.prompt([
				{
					type: 'confirm',
					message: 'Do you want to make another purchase?',
					name: 'buyAnotherItem'
				}
			]).then(function(choice){
				if(choice.buyAnotherItem === true){
					displayItems();
				}
				else{
					conn.end();
				}
			})
		}
	)
}