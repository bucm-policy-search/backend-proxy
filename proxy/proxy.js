'use strict'

const express = require('express')
require('dotenv').config()
const { Client } = require('@elastic/elasticsearch')

const app = express()
const port = Number(process.env.PROXY_PORT || 3200)


const client = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  }

})

app.get('/api/search/', async (req, res) => {
  console.log(req)
  // let req = req
  let searchContent = req.query.q || ''
  let result = ''
  async function run() {
    const { body } = await client.search({
      index: 'test',
      body: {
        query: {
          match: {
            title: searchContent
          }
        }
      }
    })
    result = body.hits.hits
    return result
  }
  run()
    .then(e=>{
      console.log(e)
    })
    .catch(console.log)
  res.send(result)
})

app.listen(port)