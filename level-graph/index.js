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
	art: new nedb({filename: "./art.db", autoload: true})
	file: new nedb({filename: "./file.db", autoload: true})
}

db.user.ensureIndex({fieldName: "id", unique: true})
db.article.ensureIndex({fieldName: "id", unique: true})
db.event.ensureIndex({fieldName: "id", unique: true})
db.art.ensureIndex({fieldName: "id", unique: true})

let express = require("express")
let app = express()


var Schema = require('graph.ql')

var old = `

	interface User {
		id: ID!
		name: String
	}

	type Artist implements User {
		arts: [Art]
	}

	type Writer implements User {
		articles: [Article]
	}

	type Article {
		id: ID!
		writer: Writer
		title: String
		body: String
		createdAt: Date
	}

	type Event {
		who: [User]
		when: Date
		title: String
	}

	type Art {
		id: ID!
		artist: Artist
	}

	type Query {
		article(id: ID): Article
		art(id: ID): Art
		listArticles: [Article]
		listArt: [Art]
		user(id: ID!): User
	}
`

var schema = Schema(`
	scalar Date


	interface User {
		id: ID!
		name: String
	}

	type Event {
		who: [User]
		when: Date
		title: String
	}

	type Writer implements User {
		id: ID!
		name: String
		articles: [Article]
	}

	type Article {
		id: ID!
		writer: [Writer]
		image: [Image]
		title: String
		body: String
		created: Date
	}

	type Image {
		width: Int
		height: Int
		url: String
		type: String
	}

	type Query {
		article(id: ID): Article
		articles(): [Article]
		writer(id: ID): Writer
	}

`, {
	Date: {
		serialize(date) {
			return new Date(date)
		}
	},
	User: {
		resolveType(user, args) {
			return null
		}
	},
	Writer: {
		async articles(writer, args) {
			let res = await graphGet({ subject: ["writer", writer.id], predicate: "write" })
			//console.log("res", res.map(t => t.object[1]))

			out =  await db.article.find({ id: { $in: res.map(t => t.object[1]) } })
			// console.log("articsle: ", out)
			return out
		}
	},
	Article: {
		async writer(article, args) {
			let res = await graphGet({ object: ["article", article.id], predicate: "write" })
			// console.log("res", res)

			out = await db.user.find({ id: { $in: res.map(t => t.subject[1]) } })
			// console.log("writer: ", out)
			return out
		}
	},
	Event: {

	},
	Query: {
		async article(query, args, context) {
			console.log("query: ", query, context)
			return await db.article.findOne({ id: parseInt(args.id) })
			
		},

		async articles(query, args) {
			return await db.article.find({})

		},
		async writer(query, args) {
			return await db.user.findOne({ id: parseInt(args.id) })
		}
	},
})

function graphGet(obj){
	return new Promise(function (fulfill, reject){
		graph.get(obj, (err,res) => {

			if(err != null){
				reject(err)
			}else{
				fulfill(res)
			}
		})
	})
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

(async function(){

let count = 40
let verts = []

let writers = []
for(let i = 0; i < count; i ++){
	writers.push(await db.user.insert({
		id: i,
		name: faker.internet.userName()
		// articles: []
	}))


}


let articles = []
for(let i = 0; i < count; i ++){
	let a = {
		id: i,
		title: faker.lorem.sentence(),
		body: faker.lorem.paragraph(),
		created: faker.date.past()	
	}
	articles.push(a)
	verts.push([writers[randomInt(0,19)].id, a.id])
	
}

// graph.put({ subject: ["Artist", 0], predicate: "created", object: ["art", 1]})
// graph.put({ subject: ["Writer", 1], predicate: "created", object: ["article", 0]})
// graph.put({ subject: ["Writer", 2], predicate: "created", object: ["article", 0]})
// graph.put({ subject: ["writer", 1], predicate: "created", object: ["article", 1]})

// graph.put({ subject: ["writer", 1], predicate: "likes", object: ["movie", 1], data: {}})
// graph.put({ subject: ["writer", 1], predicate: "likes", object: ["movie", 1], data: {}})
// graph.put({ subject: ["writer", 1], predicate: "likes", object: ["movie", 1], data: {}})






verts.forEach(vert => {
	graph.put({subject: ["writer", vert[0]], predicate: "write", object: ["article", vert[1]]})
	// delete writer.articles
})

articles.forEach(article => {
	db.article.insert(article)
})

})()
// writers.forEach(writer => {
// 	db.user.insert(writer)
// })

async function f(){

// let a = await db.article.find({ id: 12 })

let a = await schema(`
{
	writer(id: 12){
		name
		articles {
			title
			body
		}
	}
}
`, {})

console.log(JSON.stringify(a, null, 4))

}

f()

app.post("/graphql", (req,res) => {
	
	let body = ""
	req.on("data", data => {
		body += data
	})

	req.on("end" ,async () => {
		// console.log(body)
		let out = await schema(body, {shit: 12})
		res.json(out)
	})

})

app.listen(3000)


// graph.get({subject: ["writer", 2],  predicate: "write" }, (err,res) => {
// 	res.forEach(t => {
// 		db.article.find({id: t.object[1]}, (err, res) => {
// 			console.log(res)
// 		})
// 		//console.log(t)		
// 		//db.get(t.subject, ())
// 	})
// })
