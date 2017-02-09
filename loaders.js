var DataLoader = require('dataloader')
var db = require("./db.js")
let _ = require("lodash")

const util = require('util')

module.exports = function() {
	let loaders =  {
		user: new DataLoader(async (ids) => await db.user.find({ _id: { $in: ids }}) ),
		userGraph: new DataLoader(async (ids) => {

			//let writers = await _.flatMap(ids, id => graphGet({ object: ["article", id ], predicate: "write"}))
			let writers = await loaders.graphWrite.loadMany(ids.map(id => { return { object: ["article", id ] }}))
			

			res = await loaders.user.loadMany(_.flatten(writers).map(w => w.subject[1]))

			console.log("DataLoader(userGraph): ", ids.length, writers.length, res.length)
			
			return res;
		}),
		articleGraph: new DataLoader(async (ids) => {

			let articles = await loaders.graphWrite.loadMany(ids.map(id => { return { subject: ["writer", id ] }}))


			console.log("DataLoader(articleGraph): ", ids.length, articles.length, res.length)
			
			return articles.map(a => loaders.article.loadMany(a.map(b => b.object[1])) );
		}),
		article: new DataLoader((ids) => 
			db.article.find({ _id: { $in: ids }})
		),
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
