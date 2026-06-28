const axios = require("axios");

const GITHUB_API_BASE = "https://api.github.com";

const DEFAULT_HEADERS = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "dynamic-readme-script",
};

const get = (path) =>
  axios.get(`${GITHUB_API_BASE}${path}`, { headers: DEFAULT_HEADERS });

module.exports = { get };
