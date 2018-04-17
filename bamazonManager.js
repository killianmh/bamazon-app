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
	managerChoice();
	
});

function managerChoice (){
	var managerChoices = ["View Products for Sale","View Low Inventory","Add to Inventory","Add New Product"];
	var itemArray = [];
	conn.query('SELECT * FROM `products`', function(error, productList){
		if(error){
			throw error;
		}
		for(i = 0; i < productList.length; i++){
			itemArray.push(productList[i].product_name);
		}
	})
	console.log("\n");
	inquirer.prompt([
		{
			type: 'list',
			message: 'What do you want to do?',
			choices: managerChoices,
			name: 'managerChoice'
		}
		]).then(function(data){
			console.log("\n");
			if(data.managerChoice === "View Products for Sale"){
				viewProducts();
			}
			if(data.managerChoice === "View Low Inventory"){
				viewLowInventory();
			}
			if(data.managerChoice === "Add to Inventory"){
				addToInventory(itemArray);
			}
			if(data.managerChoice === "Add New Product"){
				addNewProduct(itemArray);
			}
		})
};

function viewProducts(){
	conn.query('SELECT * FROM `products`', function(error, productList){
		if(error){
			throw error;
		}
		for(i = 0; i < productList.length; i++){
			console.log(productList[i].item_id + " " + productList[i].product_name + "    Price: " + productList[i].price + "        Quantity: " + productList[i].stock_quantity);
		}
		console.log("\n");
		inquirer.prompt([
			{
				type: 'confirm',
				message: 'Do you want to do something else?',
				name: 'doSomethingElse'
			}
		]).then(function(choice){
			if(choice.doSomethingElse === true){
				managerChoice();
			}
			else{
				conn.end();
			}
		})
	})
}

function viewLowInventory(){
	conn.query('SELECT * FROM `products` WHERE `stock_quantity` < ?',[5], function(error, productList){
		if(error){
			throw error;
		}
		console.log("Here are the products which have an inventory less than 5: \n");
		for(i = 0; i < productList.length; i++){
			console.log(productList[i].item_id + " " + productList[i].product_name + "    Price: " + productList[i].price + "        Quantity: " + productList[i].stock_quantity);
		}
		console.log("\n");
		inquirer.prompt([
			{
				type: 'confirm',
				message: 'Do you want to do something else?',
				name: 'doSomethingElse'
			}
		]).then(function(choice){
			if(choice.doSomethingElse === true){
				managerChoice();
			}
			else{
				conn.end();
			}
		})
	})
}

function addToInventory(itemArray){
	var currentItemQuant = 0;
	inquirer.prompt([
		{
			type: 'list',
			message: 'Ok, which item do you want to add inventory to?',
			choices: itemArray,
			name: 'addInventory'
		}
		]).then(function(data){
			conn.query('SELECT `stock_quantity` FROM `products` WHERE ?', [{product_name: data.addInventory}],
				function(error, itemQuant){
					if(error){
						throw error;
					}
					currentItemQuant = itemQuant[0].stock_quantity;
					console.log("\n");
					inquirer.prompt([
						{
							type: 'input',
							message: "Ok, how many more " + data.addInventory + " do you want to add to your inventory?",
							name: 'addInventoryQuant'
						}
					]).then(function(quantData){
						conn.query('UPDATE `products` SET ? WHERE ?', 
							[	{
									stock_quantity : (currentItemQuant + parseInt(quantData.addInventoryQuant))
								},
								{
									product_name : data.addInventory
								}
							], function(error, updateResult){
								if(error){
									throw error;
								}
								console.log("\nSuccessfully added " + quantData.addInventoryQuant + " " + data.addInventory + " to your inventory\n");
								inquirer.prompt([
									{
										type: 'confirm',
										message: 'Do you want to do something else?',
										name: 'doSomethingElse'
									}
								]).then(function(choice){
									if(choice.doSomethingElse === true){
										managerChoice();
									}
									else{
										conn.end();
									}
								})
							})
					})
				})
		})
};

function addNewProduct(itemArray){
	var item = "";
	var dapartment = "";
	var price = 0;
	var quant = 0;

	inquirer.prompt([
		{
			type: 'input',
			message: 'What is the name of the product you wish to add to the inventory?',
			name: 'addItem'
		}
		]).then(function(addData){
			console.log("\n");
			for(i = 0; i < itemArray.length; i++){
				if(addData.addItem ===itemArray[i]){
					console.log("You already have that item listed in your inventory; please try again\n");
					return addNewProduct(itemArray);
				}
			}
			item = addData.addItem;
			// console.log(item);
			inquirer.prompt([
				{
					type: 'input',
					message: 'What department do you want to put this in?',
					name: 'department'
				},
				{
					type: 'input',
					message: 'What price do you want to charge per unit?',
					name: 'price'
				},
				{
					type: 'input',
					message: 'How many of these items do you want to add to your inventory?',
					name: 'quant'
				}
				]).then(function(newItemData){
					department = newItemData.department;
					price = newItemData.price;
					quant = newItemData.quant;

					conn.query('INSERT INTO `products` SET ?', 
						{
							product_name : item,
							department_name : department,
							price : price,
							stock_quantity : quant
						}
						, function(error, updateResult){
							if(error){
								throw error;
							}
							console.log("\nSuccessfully added " + item + " to your inventory\n");
							inquirer.prompt([
								{
									type: 'confirm',
									message: 'Do you want to do something else?',
									name: 'doSomethingElse'
								}
							]).then(function(choice){
								if(choice.doSomethingElse === true){
									managerChoice();
								}
								else{
									conn.end();
								}
							})
					})
				})
		})
};