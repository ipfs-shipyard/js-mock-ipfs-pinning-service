"use strict"

const service = require("../service/pins")
const { createHandler } = require("../service/util")

module.exports.funcpinsrequestidGET = createHandler(service.getPin)
module.exports.funcpinsrequestidPOST = createHandler(service.replacePin)
module.exports.funcpinsrequestidDELETE = createHandler(service.removePin)
