'use strict'

const express = require('express')
const app = express()
require('dotenv').config()
const { Client } = require('@elastic/elasticsearch')
const { query } = require('express')

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

    async function run() {
      const { body } = await client.search({
        index: 'policy',
        body: {
          query: {
            "multi_match": {
              "query": q,
              "type": "bool_prefix",
              "fields": ["title^2", "plaintext"]
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

app.get('/api/advanced_search', async (req, res) => {
  console.log("req.query")
  console.log(req.query)

  try {
    let { q, page, include, exclude, publishingDate1, publishingDate2, scrapyDate1, scrapyDate2, infoSource, containAttachment } = req.query || ''


    const queryContent = {
      "bool": {}
    }


    let must, must_not, should = []

    if (include || publishingDate1 || publishingDate2 || scrapyDate1 || scrapyDate2 || infoSource || (containAttachment === "yes")) {
      queryContent.bool.must = []
      must = queryContent.bool.must

      if (include) {
        must.push({
          "multi_match": {
            "query": include,
            "type": "bool_prefix",
            "fields": [
              "title",
              "plaintext"
            ]
          }
        })
      }
      if (publishingDate1 || publishingDate2) {
        console.log('publishingDate Trigger!')
        console.log(`publishingDate: ${publishingDate1} - ${publishingDate2}`)
        must.push({
          "range": {
            "publishingDate": {
              "gte": publishingDate1 || "1788-01-01",
              "lte": publishingDate2 || "now"
            }
          }
        })
      }
      if (scrapyDate1 || scrapyDate2) {
        must.push({
          "range": {
            "scrapyDate": {
              "gte": scrapyDate1 || "1788-01-01",
              "lte": scrapyDate2 || "now"
            }
          }
        })
      }
      if (infoSource) {
        must.push({
          "match_bool_prefix": {
            "source": infoSource
          }
        })
      }
    }

    if (exclude) {
      queryContent.bool.must_not = []
      must_not = queryContent.bool.must_not
      must_not.push({
        "multi_match": {
          "query": exclude,
          "type": "most_fields",
          "fields": [
            "title",
            "plaintext"
          ]
        }
      })
    }

    if (containAttachment === "yes") {
      queryContent.bool.filter = {
        "script": {
          "script": {
            "source": "doc['attachment.link.keyword'].length > 0",
            "lang": "painless"
          }
        }

      }
    } else if (containAttachment === "no") {
      queryContent.bool.filter = {
        "script": {
          "script": {
            "source": "doc['attachment.link.keyword'].length == 0",
            "lang": "painless"
          }
        }
      }
    }

    if (q) {
      queryContent.bool.should = []
      should = queryContent.bool.should
      should.push({
        "multi_match": {
          "query": q,
          "type": "bool_prefix",
          "fields": [
            "title^2",
            "plaintext"
          ],
          "operator": "or"
        }
      })
    }


    console.log("queryContent:")
    console.log(queryContent)

    console.log("must:" + "\n")
    console.log(must)

    async function run() {
      const { body } = await client.search({
        index: 'policy',
        body: {
          query: queryContent,
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
        index: 'policy',
        body: {
          query: {
            term: {
              "title.keyword": {
                value: q
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