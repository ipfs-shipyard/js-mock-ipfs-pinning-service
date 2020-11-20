"use strict"

const fs = require("fs").promises
const http = require("http")
const path = require("path")
const bodyParser = require("body-parser")
const express = require("express")
const oasTools = require("oas-tools")
const jsyaml = require("js-yaml")

const start = async ({
  port = 8080,
  validator = true,
  strict = false,
} = {}) => {
  const spec = await fs.readFile(
    path.join(__dirname, "/api/oas-doc.yaml"),
    "utf8"
  )
  const oasDoc = jsyaml.safeLoad(spec)

  const app = express()
  app.use(bodyParser.json({ strict: false }))

  oasTools.configure({
    controllers: path.join(__dirname, "./controllers"),
    loglevel: "info",
    strict: false,
    router: true,
    validator: true,
  })

  await new Promise((resolve) => oasTools.initialize(oasDoc, app, resolve))

  const server = http.createServer(app)
  server.listen(port)

  return server
}

const stop = (server) => new Promise((resolve) => server.close(resolve))

module.exports = { start, stop }
