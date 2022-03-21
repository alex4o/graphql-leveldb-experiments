let level = require("level")
let levelPromise = require("level-promise")
let levelgraph = require("levelgraph")


let graph = levelgraph(level("db-graph"))
//let db = level("db", {valueEncoding: "json"})

let faker = require("faker")

//let nedb = require("nedb")
let nedb = require("nedb-promise")
// let db = { 
// 	user: new nedb({filename: "./user.db", autoload: true}),
// 	article: new nedb({filename: "./article.db", autoload: true}),
// 	event: new nedb({filename: "./events.db", autoload: true}),
// 	art: new nedb({filename: "./art.db", autoload: true}),
// 	file: new nedb({filename: "./file.db", autoload: true}),
// 	graph: graph,
// }

let db = require('couchdb-promises')({
  baseUrl: 'http://localhost:5984', // required
  requestTimeout: 10000
})

let dbName = 'testdb'



// db.user.ensureIndex({fieldName: "id", unique: true})
// db.article.ensureIndex({fieldName: "id", unique: true})
// db.event.ensureIndex({fieldName: "id", unique: true})
// db.art.ensureIndex({fieldName: "id", unique: true})



function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low)
}



async function generate({ count }){
	

	// let wtf = {
	// 	user: levelPromise(level("user.db", { valueEncoding: "json" })),
	// 	article: levelPromise(level("article.db", { valueEncoding: "json" })),
	// 	events: levelPromise(level("events.db", { valueEncoding: "json" })),
	// 	graph: graph
	// }	


	// console.log("gen ", db)
	if(count == 0) {
		return 
	}
	//let count = 40
	let verts = []

	let writers = []
	for(let i = 1; i < count; i ++){
		let user = {
			id: i,
			name: faker.internet.userName(),
			articles: []
		}
		db.createDocument("artists", user, user.id)

		//db.user.put(user.id, user)
		writers.push(user)
	}


	let articles = []
	for(let i = 1; i < count; i ++){
		let article = {
			id: i,
			title: faker.lorem.sentence(),
			body: faker.lorem.paragraph(),
			featured: randomInt(0,100) < 5 ? true : false,
			created: faker.date.past()	
		}

		//db.article.put(article.id, article)

		let writer = writers[randomInt(0, count / 2)]

		writer.articles.push(article.id)
		article.writer = writer.id

		articles.push(article)

		//verts.push({subject: ["writer", writer.id ], predicate: "write", object: ["article", article.id]})
	}

	let events = []
	for(let i = 1; i < count; i ++){

		let event = {
			id: i,
			title: faker.lorem.sentence(),
			when: faker.date.future(),
			created: faker.date.past()	
		}
		// console.log(event.when + "")


		//db.events.put(event.when.getTime() , event)
		events.push(event)

		let writer = writers[randomInt(0, count / 2)]

		verts.push({subject: ["writer", writer.id ], predicate: "event", object: ["event", event.id]})

		// verts.push([writers[randomInt(0, 50 + count / 2)]._id, event._id, "event"])
	}

	articles.forEach(article => {
		db.createDocument("articles", article, article.id)		
	})

	events.forEach(event => {
		db.createDocument("events", event, event.id)
	})



	// graph.put({ subject: ["Artist", 0], predicate: "created", object: ["art", 1]})
	// graph.put({ subject: ["Writer", 1], predicate: "created", object: ["article", 0]})
	// graph.put({ subject: ["Writer", 2], predicate: "created", object: ["article", 0]})
	// graph.put({ subject: ["writer", 1], predicate: "created", object: ["article", 1]})

	// graph.put({ subject: ["writer", 1], predicate: "likes", object: ["movie", 1], data: {}})
	// graph.put({ subject: ["writer", 1], predicate: "likes", object: ["movie", 1], data: {}})
	// graph.put({ subject: ["writer", 1], predicate: "likes", object: ["movie", 1], data: {}})


	verts.forEach(vert => {
	//	graph.put(vert)
		// delete writer.articles
	})

}



generate({ count: 0 })

module.exports = db
