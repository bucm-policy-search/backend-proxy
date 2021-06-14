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
    let { q, page } = req.query || ''

    console.log("search item:" + q)

    async function run() {
      const { body } = await client.search({
        index: 'test',
        body: {
          query: {
            "multi_match": {
              "query": q,
              "type": "best_fields",
              "fields": ["title^5", "plaintext"],
              "operator": "or"
            }
          },
          from: (page - 1) * 10,
          highlight: {
            "pre_tags": ["<span style='color:red'>"],
            "post_tags": ["</span>"],
            fields: {
              plaintext: {}
            }
          }
        }
      })
      return body
    }
    run()
      .then(body => {
        res.set({
          "Access-Control-Allow-Origin": "http://localhost:3000",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type, x-requested-with"
        })
        res.send(body)
      }).catch(e => {
        console.log("Error:" + e)
      })
  } catch (e) {
    console.log(e)
  }
})

app.get('/api/article', async (req, res) => {
  try {
    let { q } = req.query || ''
    console.log(`query data = ${q}`)
    async function run() {
      const { body } = await client.search({
        index: 'test',
        body: {
          query: {
            bool: {
              must: {
                // must use "match_phrase" instead of "match" or it will cause 
                // "Uncaught TypeError: First argument must be a string" in some pages.
                match_phrase: {
                  title: q
                }
              }
            }
          }
        }
      })
      return body
    }

    run()
      .then(body => {
        res.set({
          "Access-Control-Allow-Origin": "http://localhost:3000",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type, x-requested-with"
        })
        res.send(body)
      }).catch(e => {
        console.log("CORS error:" + e)
      })
  } catch (e) {
    console.log(e)
  }
})

app.listen(port)