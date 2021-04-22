"use strict"

const fs = require("fs").promises
const path = require("path")
const bodyParser = require("body-parser")
const express = require("express")
const cors = require("cors")
// @ts-ignore
const oasTools = require("oas-tools")
const jsyaml = require("js-yaml")
const pins = require("./service/pins")

/**
 * @typedef {import('./service/pins').State} State
 * 
 * @param {object} [options]
 * @param {string|null} [options.token] - Access token to validate against.
 * @param {State} [options.state] - initial state to start with.
 * @param {boolean} [options.validator]
 * @param {boolean} [options.strict]
 * @param {"error"|"info"} [options.loglevel]
 * @param {string|null} [options.delegates]
 */
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
  const oasDoc = jsyaml.load(spec)

  const app = express()
  app.use(cors())
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
