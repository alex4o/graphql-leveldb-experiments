var DataLoader = require('dataloader')
// var { generate } = require("./db.js")
// let r = require("rethinkdb")
let db = require("./db.js")


let _ = require("lodash")

const util = require('util')

module.exports = function() {

	let loaders =  {
		user: new DataLoader(async (ids) => {
			let docs = await db.getAllDocuments("artists", {include_docs:true, keys: ids.map(id => id.toString())})
			// console.log("DataLoader(user): ", docs.data.rows, ids)

			return docs.data.rows.map(row => row.doc)
		}),
		userGraph: new DataLoader(async (ids) => {
			// console.log("DataLoader(userGraph): ", ids.length)

			//let writers = await _.flatMap(ids, id => graphGet({ object: ["article", id ], predicate: "write"}))
			let writers = await loaders.graphWrite.loadMany(ids.map(id => { return { object: ["article", id ] }}))
			
			// console.log("DataLoader(userGraph): ", ids.length, _.flatten(writers))


			res = await loaders.user.loadMany(_.flatten(writers).map(w => w.subject[1]))

			console.log("DataLoader(userGraph): ", ids.length, writers.length, res.length)
			
			return res;
		}),
		articleGraph: new DataLoader(async (ids) => {

			let articles = await loaders.graphWrite.loadMany(ids.map(id => { return { subject: ["writer", id ] }}))

			let res = articles.map(a => loaders.article.loadMany(a.map(b => b.object[1])) );

			console.log("DataLoader(articleGraph): ", ids.length, articles.length, res.length)
			
			return res
		}),
		article: new DataLoader(async (ids) => {
			let docs = await db.getAllDocuments("articles", {include_docs:true, keys: ids.map(id => id.toString())})
			// console.log("DataLoader(user): ", docs.data.rows, ids)

			return docs.data.rows.map(row => row.doc)
		}),
		graphWrite: new DataLoader(async (ids) => {
			return ids.map(id => Object.assign(id, { predicate: "write" })).map(graphGet)
		})
	}

	return loaders
}

function graphGet(obj){
	return new Promise(function (fulfill, reject){
		// console.log("graph get: ", obj)
		db.graph.get(obj, (err,res) => {

			if(err != null){
				reject(err)
			}else{
				fulfill(res)
			}
		})
	})
}
