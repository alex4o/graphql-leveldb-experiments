


let express = require("express")
let app = express()

let schema = require("./schema.js")
let { graphql } = require("graphql")
// writers.forEach(writer => {
// 	db.user.insert(writer)
// })

let createLoaders = require("./loaders.js")

async function f(){

// let a = await db.article.find({ id: 12 })
		// console.log(schema)

let a = await graphql(schema, `
{
	article(id: "wwsK8EHN4fnhRJfk") {
		_id
		title
		writer {
			_id
			name
			articles {
				_id
				title
			}
		}
	}
}
`, {}, createLoaders())

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
		let out = await graphql(schema, body, {shit: 12}, createLoaders())
		res.json(out)
	})

})

app.listen(4000)


// graph.get({subject: ["writer", 2],  predicate: "write" }, (err,res) => {
// 	res.forEach(t => {
// 		db.article.find({id: t.object[1]}, (err, res) => {
// 			console.log(res)
// 		})
// 		//console.log(t)		
// 		//db.get(t.subject, ())
// 	})
// })