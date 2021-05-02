'use strict'

const express = require('express')
const app = express()
require('dotenv').config()
const { Client } = require('@elastic/elasticsearch')

const port = Number(process.env.PROXY_PORT || 3200)

const client = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  }

})

app.get('/api/search', async (req, res) => {
  try {
    let body = {}
    let searchContent = req.query.q || ''
    async function run() {
      const {body} = await client.search({
        index: 'test',
        body: {
          query: {
            match: {
              title: searchContent
            }
          }
        }
      })
      console.log(body.hits.hits)
      return body
    }
    run()
    .then(body=>{
      res.set({
          "Access-Control-Allow-Origin": "http://localhost:3000",
          "Access-Control-Allow-Methods": "GET, PUT, PATCH, POST, DELETE",
          "Access-Control-Allow-Headers": "Content-Type, x-requested-with"
        })
      res.send(body.hits.hits)
    })
    
    
  } catch (e) {
    // res.sendStatus(500)
    console.log(e)
  }
})

app.listen(port)