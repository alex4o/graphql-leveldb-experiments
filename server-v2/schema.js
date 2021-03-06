// /et Schema = require('graph.ql')
let {makeExecutableSchema} = require("graphql-tools")

// let db = require("./db.js")
// let {graph} = db 
let db = require("./db.js")

let r = require("rethinkdb")

// console.log(db)

let { GraphQLScalarType } = require('graphql');
let { Kind } = require('graphql/language');

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
let shcema = `
	scalar Date


	interface User {
		_id: ID!
		name: String
	}

	type Event {
		who: [User]
		when: Date
		created: Date
		title: String
	}

	type Writer implements User {
		_id: ID!
		name: String
		articles: [Article]
	}

	type Article {
		_id: ID!
		writer: Writer
		image: [Image]
		title: String
		body: String
		created: Date
		featured: Boolean
	}

	type Image {
		width: Int
		height: Int
		url: String
		type: String
	}

	type Query {
		article(id: ID): Article
		articles: [Article]
		writer(id: ID): Writer
		featured: [Article]
		latest: [Article]
		events(from: Date = "now"): [Event]
		event(id: ID): Event
		allevents: [Event]
	}

`
let resolvers = {
	Date: new GraphQLScalarType({
		name: 'Date',
		description: 'Date custom scalar type',
		parseValue(value) {
			return new Date(value); // value from the client
		},
		serialize(value) {
			return value; // value sent to the client
		},
		parseLiteral(ast) {
			// console.log("ast: ", ast, Kind)

			if (ast.kind === Kind.STRING) {
				//return parseInt(ast.value, 10); // ast value is always in string format
				return ast.value
			}
			return null;
		},
	}),
	User: {
	},
	Writer: {
		articles(writer, args, ctx) {
			// let res = await graphGet({ subject: ["writer", writer._id ], predicate: "write" })
			// console.log("article", res.map(t => t.object[1]))

			// let out =  await db.article.find({ _id: { $in: res.map(t => t.object[1]) } })
			// console.log("articsle: ", out)
			return ctx.article.loadMany(writer.articles.map(id => id.toString()))
		}
	},
	Article: {
		async writer(article, args, ctx) {
			//let res = await graphGet({ object: ["article", article._id ], predicate: "write" })
			

			//console.log("article: ", article)

			//let out = await db.user.find({ _id: { $in: res.map(t => t.subject[1]) } })
			let out = ctx.user.load(article.writer)
			// console.log("writer: ", out)	
			
			return out
		}
	},
	Event: {

	},
	Query: {
		async article(query, args, ctx) {
			// console.log("query: ", arguments)
			// console.log("args: ", args)

			let doc = await db.getDocument("articles", args.id)
			// console.log(doc)
			return doc.data

		},

		async articles(query, args, ctx) {
			//let stream = await db.article.readStream()
			let view = await db.getView("articles","js", "created", { include_docs: true })
			return view.data.rows.map(r => r.doc)

		},
		async writer(query, args) {
			let doc = await db.getDocument("artists", args.id)
			return doc.data
		
		},
		async featured() {
			// return db.article.cfind({ featured: true }).limit(5).exec()
			let view = await db.getView("articles","js", "featured", { include_docs: true, limit: 5})

			// let stream = await db.article.readStream()
			return view.data.rows.map(r => r.doc)


		},
		async latest() {
			// return db.article.cfind({}).limit(5).exec()
			let view = await db.getView("articles","js", "created", { include_docs: true, limit: 5})

			// let stream = await db.article.readStream({limit: 5})
			return view.data.rows.map(r => r.doc)


		},
		event(query, args) {
			return db.event.get(parseInt(args.id))
		},
		async events(query, args) {
			let date
			if(args.from === null){
				date = new Date()


			}else{
				date = new Date(args.from)
			}

			let view = await db.getView("events","js", "when", { include_docs: true, startkey: date })
			

			
			return view.data.rows.map(r => r.doc)
			// return db.event.cfind({ when: { $gt: date } }).sort({when: 1}).exec()

		},
		async allevents(){
			let stream = await db.events.readStream()

			
			return ReadStream(stream)
		}
	},
}

let exec
try {
	exec = makeExecutableSchema({ 
		typeDefs: shcema ,
		resolvers: resolvers
	})
}catch(err){
	console.log(err)
}

module.exports = exec
function ReadStream(stream) {
	return new Promise(function (fulfill, reject){
		let array = []
		stream.on("data", data => {
			array.push(data.value)
			// console.log("key: ", data.key)
		}).on("end", end => {
			fulfill(array)
		})
	})
}


function ReadFeatured(stream, count = 5) {
	return new Promise(function (fulfill, reject){
		let array = []
		// let count = 0
		stream.on("data", data => {
			if(data.value.featured){
				array.push(data.value)

				if(array.length == count){
					//console.log("destroy")
					stream.destroy()
				}
			}
		}).on("end", end => {
			fulfill(array)
		}).on("close", end => {
			fulfill(array)
		})
	})
}

function graphGet(obj){
	return new Promise(function (fulfill, reject){
		// console.log("graph get: ", obj)
		graph.get(obj, (err,res) => {
			if(err != null){
				reject(err)
			}else{
				fulfill(res)
			}
		})
	})
}
