"use strict"

const service = require("../service/pins")
const { createHandler } = require("../service/util")

module.exports.funcpinsGET = createHandler(service.listPins)
module.exports.funcpinsPOST = createHandler(service.addPin)
