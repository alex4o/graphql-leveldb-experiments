// /et Schema = require('graph.ql')
let {makeExecutableSchema} = require("graphql-tools")

let db = require("./db.js")
let {graph} = db 
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
			return ctx.articleGraph.load(writer._id)
		}
	},
	Article: {
		writer(article, args, ctx) {
			//let res = await graphGet({ object: ["article", article._id ], predicate: "write" })
			

			//console.log("article: ", article)

			//let out = await db.user.find({ _id: { $in: res.map(t => t.subject[1]) } })
			let out = ctx.userGraph.load(article._id)
			// console.log("writer: ", out)	
			
			return out
		}
	},
	Event: {

	},
	Query: {
		article(query, args, ctx) {
			// console.log("query: ", arguments)
			return db.article.findOne({ _id: args.id })
			// return await ctx.article.load(args.id)
		},

		articles(query, args, ctx) {
			return db.article.find({})
		},
		writer(query, args) {
			return db.user.findOne({ _id: args.id })
		},
		featured() {
			return db.article.cfind({ featured: true }).limit(5).exec()
		},
		latest() {
			return db.article.cfind({}).limit(5).exec()

		},
		event(query, args) {
			return db.event.find({ _id : args.id })
		},
		events(query, args) {
			let date
			if(args.from === null){
				date = new Date()
			}else{
				date = new Date(args.from)
			}

			return db.event.cfind({ when: { $gt: date } }).sort({when: 1}).exec()

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
