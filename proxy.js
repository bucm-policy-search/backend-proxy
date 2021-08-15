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

    // TODO-1 解决ik_smart无法识别单字问题。如“北京”无法获得“北”搜索结果
    // TODO-2 解决ik_max_words未按单字分解的搜索问题。如“美国利特”无法获得“美”和“国”两个字搜索结果
    // TODO-3 解决数字和字母混合时不在ik_max_words中的情况。如“7号电池”无法获得“7号”搜索结果

    async function run() {
      const { body } = await client.search({
        index: 'policy',
        body: {
          query: {
            "multi_match": {
              "query": q,
              "type": "most_fields",
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
  try {
    let { q, page, include, exclude, publishingDate1, publishingDate2, scrapyDate1, scrapyDate2, infoSource, containAttachment } = req.query || ''

    if (include || publishingDate1 || publishingDate2 || scrapyDate1 || scrapyDate2 || infoSource || (containAttachment === "yes")) {

      queryContent.bool.must = []
      const must = queryContent.bool.must
      if (include) {
        must.append({
          "multi_match": {
            "query": include,
            "type": "cross_fields",
            "fields": [
              "title",
              "plaintext"
            ]
          }
        })
      }
      if (publishingDate1 || publishingDate2) {
        must.append({
          "range": {
            "publishingDate": {
              "gte": publishingDate1 || "1788-01-01",
              "lt": publishingDate2 || "now"
            }
          }
        })
      }
      if (scrapyDate1 || scrapyDate2) {
        must.append({
          "range": {
            "scrapyDate": {
              "gte": scrapyDate1 || "1788-01-01",
              "lt": scrapyDate2 || "now"
            }
          }
        })
      }
      if (infoSource) {
        must.append({
          "match_bool_prefix": {
            "source": infoSource
          }
        })
      }
      if (containAttachment === "yes") {
        must.append({
          "filter": {
            "script": {
              "script": "doc['attachment.link.keyword'].length > 0",
              "lang": "painless"
            }
          }
        })
      }
    }

    const queryContent = {
      "bool": {
        "must_not": {
          "multi_match": {
            "query": exclude,
            "type": "most_fields",
            "fields": [
              "title",
              "plaintext"
            ]
          }
        },
        "should": [
          {
            "multi_match": {
              "query": q,
              "type": "best_fields",
              "fields": [
                "title^5",
                "plaintext"
              ],
              "operator": "or"
            }
          }
        ]
      }
    }

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