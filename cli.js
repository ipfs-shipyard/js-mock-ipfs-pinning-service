#! /usr/bin/env node

const yargs = require("yargs")
const { hideBin } = require("yargs/helpers")
const http = require("http")
const { setup } = require(".")

const main = async ({
  token = null,
  delegates = null,
  port = 3000,
  loglevel = "error",
  strict = false,
}) => {
  const service = await setup({ strict, loglevel, token, delegates })

  const server = http.createServer(service)
  service.listen(port)
}

main(yargs(hideBin(process.argv)).argv)
