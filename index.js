"use strict"

const fs = require("fs").promises
const path = require("path")
const bodyParser = require("body-parser")
const express = require("express")
const oasTools = require("oas-tools")
const jsyaml = require("js-yaml")
const pins = require("./service/pins")

const setup = async ({
  validator = true,
  strict = false,
  loglevel = "error",
  delegates = null,
  token = null,
  state = pins.init({
    accessToken: token,
    delegates: delegates != null ? delegates.split(",") : undefined,
  }),
} = {}) => {
  const spec = await fs.readFile(
    path.join(__dirname, "/api/oas-doc.yaml"),
    "utf8"
  )
  const oasDoc = jsyaml.safeLoad(spec)

  const app = express()
  app.use(bodyParser.json({ strict: false }))
  app.locals = { state }

  oasTools.configure({
    controllers: path.join(__dirname, "./controllers"),
    loglevel,
    strict,
    router: true,
    validator,
  })

  await new Promise((resolve) => oasTools.initialize(oasDoc, app, resolve))

  return app
}

module.exports = { setup }

/**
 * @typedef {import('./model/pins').State} State
 */
