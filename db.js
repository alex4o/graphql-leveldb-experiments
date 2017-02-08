let level = require("level")

let levelgraph = require("levelgraph")


let graph = levelgraph(level("db-graph"))
//let db = level("db", {valueEncoding: "json"})

let faker = require("faker")

//let nedb = require("nedb")
let nedb = require("nedb-promise")

let db = { 
	user: new nedb({filename: "./user.db", autoload: true}),
	article: new nedb({filename: "./article.db", autoload: true}),
	event: new nedb({filename: "./events.db", autoload: true}),
	art: new nedb({filename: "./art.db", autoload: true}),
	file: new nedb({filename: "./file.db", autoload: true}),
	graph: graph,
}


// db.user.ensureIndex({fieldName: "id", unique: true})
// db.article.ensureIndex({fieldName: "id", unique: true})
// db.event.ensureIndex({fieldName: "id", unique: true})
// db.art.ensureIndex({fieldName: "id", unique: true})



function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

async function generate({ count }){
	if(count == 0) {
		return
	}
	//let count = 40
	let verts = []

	let writers = []
	for(let i = 0; i < count; i ++){
		writers.push(await db.user.insert({
			name: faker.internet.userName()
			// articles: []
		}))
	}


	let articles = []
	for(let i = 0; i < count; i ++){
		let article = await db.article.insert({
			title: faker.lorem.sentence(),
			body: faker.lorem.paragraph(),
			featured: randomInt(0,100) < 5 ? true : false,
			created: faker.date.past()	
		})
		articles.push(article)

		verts.push({subject: ["writer", writers[randomInt(0, count / 2)]._id ], predicate: "write", object: ["article", article._id]})
	}

	let events = []
	for(let i = 0; i < count; i ++){

		let event = await db.event.insert({
			title: faker.lorem.sentence(),
			when: faker.date.future(),
			created: faker.date.past()	
		})

		events.push(event)
		verts.push({subject: ["writer", writers[randomInt(0, count / 2)]._id ], predicate: "event", object: ["event", event._id]})

		// verts.push([writers[randomInt(0, 50 + count / 2)]._id, event._id, "event"])
	}

	// graph.put({ subject: ["Artist", 0], predicate: "created", object: ["art", 1]})
	// graph.put({ subject: ["Writer", 1], predicate: "created", object: ["article", 0]})
	// graph.put({ subject: ["Writer", 2], predicate: "created", object: ["article", 0]})
	// graph.put({ subject: ["writer", 1], predicate: "created", object: ["article", 1]})

	// graph.put({ subject: ["writer", 1], predicate: "likes", object: ["movie", 1], data: {}})
	// graph.put({ subject: ["writer", 1], predicate: "likes", object: ["movie", 1], data: {}})
	// graph.put({ subject: ["writer", 1], predicate: "likes", object: ["movie", 1], data: {}})


	verts.forEach(vert => {
		graph.put(vert)
		// delete writer.articles
	})
}



generate({count: 00 })

module.exports = db