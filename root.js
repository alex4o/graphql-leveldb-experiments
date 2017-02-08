let db = require("./db.js")
let {graph} = db 

class Article {

}

class Writer {

}

class Event {

}



module.exports = {
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
	writer: {
		async articles(args) {
			let res = await graphGet({ subject: ["writer", writer._id ], predicate: "write" })
			// console.log("article", res.map(t => t.object[1]))

			out =  await db.article.find({ _id: { $in: res.map(t => t.object[1]) } })
			// console.log("articsle: ", out)
			return out
		}
	},

		async Article_writer(args) {
			let res = await graphGet({ object: ["article", article._id ], predicate: "write" })
			// console.log("writer", res)

			out = await db.user.find({ _id: { $in: res.map(t => t.subject[1]) } })
			// console.log("writer: ", out)
			return out
		},
	
	Event: {

	},
	async article(args, context) {
		// console.log("query: ", query, context)
		return await db.article.findOne({ _id: args.id })
		
	},

	async articles(args) {
		return await db.article.find({})

	},
	async writer(args) {
		return await db.user.findOne({ _id: args.id })
	},
	async featured(args) {
		return await db.article.cfind({ featured: true }).limit(5).exec()
	},
	async latest(args) {
		return await db.article.cfind({}).limit(5).exec()

	},
	async event(args) {
		return await db.event.find({ _id : args.id })
	},
	async events(args) {
		console.log()
		let date
		if(args.from === "now"){
			date = new Date()
		}else{
			date = new Date(args.from)
		}
		console.log(args, date)

		return await db.event.find({ when: { $gt: date } })

	}
	
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
