let Schema = require('graph.ql')
let db = require("./db.js")
let {graph} = db 
// console.log(db)

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

module.exports = Schema(`
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
		writer: [Writer]
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
		articles(): [Article]
		writer(id: ID): Writer
		featured(): [Article]
		latest(): [Article]
		events(from: Date = "now"): [Event]
		event(id: ID): Event
	}

`, {
	Date: {
		serialize(date) {
			return new Date(date)
		},
		parseValue(date) {
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
			let res = await graphGet({ subject: ["writer", writer._id ], predicate: "write" })
			// console.log("article", res.map(t => t.object[1]))

			out =  await db.article.find({ _id: { $in: res.map(t => t.object[1]) } })
			// console.log("articsle: ", out)
			return out
		}
	},
	Article: {
		async writer(article, args) {
			let res = await graphGet({ object: ["article", article._id ], predicate: "write" })
			// console.log("writer", res)

			out = await db.user.find({ _id: { $in: res.map(t => t.subject[1]) } })
			// console.log("writer: ", out)
			return out
		}
	},
	Event: {

	},
	Query: {
		async article(query, args, context) {
			// console.log("query: ", query, context)
			return await db.article.findOne({ _id: args.id })
			
		},

		async articles(query, args) {
			return await db.article.find({})

		},
		async writer(query, args) {
			return await db.user.findOne({ _id: args.id })
		},
		async featured(query, args) {
			return await db.article.cfind({ featured: true }).limit(5).exec()
		},
		async latest(query, args) {
			return await db.article.cfind({}).limit(5).exec()

		},
		async event(query, args) {
			return await db.event.find({ _id : args.id })
		},
		async events(query, args) {
			let date
			if(args.from === "now"){
				date = new Date()
			}else{
				date = args.from
			}
			console.log(args, date)

			return await db.event.find({ when: { $gt: date } })

		}
	},
})


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
