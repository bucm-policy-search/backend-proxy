import { Client } from "@elastic/elasticsearch";
import fs from "fs";
import "dotenv/config";

const ES_PORT = process.env.ES_PORT || 9200;
const { ES_USERNAME, ES_PASSWORD, CA_CERT } = process.env;

if (!(ES_USERNAME && ES_PASSWORD && CA_CERT)) {
  throw new Error("Please set the environment variables in .env file according to tutorial in README.md");
}

const client = new Client({
  node: `https://localhost:${ES_PORT}`,
  auth: {
    username: ES_USERNAME,
    password: ES_PASSWORD,
  },
  tls: {
    ca: fs.readFileSync(CA_CERT),
    rejectUnauthorized: false,
  },
});

export const commonSearch = async function (q, page) {
  const result = await client.search({
    index: "policy",
    body: {
      query: {
        multi_match: {
          query: q,
          type: "bool_prefix",
          fields: ["title^2", "plaintext"],
        },
      },
      from: (parseInt(page, 10) - 1) * 10,
      highlight: {
        pre_tags: ["<span style='color:red'>"],
        post_tags: ["</span>"],
        fields: {
          plaintext: {},
        },
      },
    },
  });
  return result;
};
8;
export const advancedSearch = async function (q, page) {
  const result = await client.search({
    index: "policy",
    body: {
      query: q,
      from: (page - 1) * 10,
      highlight: {
        pre_tags: ["<span style='color:red'>"],
        post_tags: ["</span>"],
        fields: {
          plaintext: {},
        },
      },
    },
  });
  return result;
};

export const articleSearch = async function (q) {
  const result = await client.search({
    index: "policy",
    body: {
      query: {
        term: {
          "title.keyword": {
            value: q,
          },
        },
      },
    },
  });
  return result;
};
