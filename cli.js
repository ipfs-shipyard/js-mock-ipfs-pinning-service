#! /usr/bin/env node

const yargs = require("yargs/yargs")
/** @type {(args:string[]) => string[]} */
// @ts-ignore
const hideBin = require("yargs/helpers").hideBin
const http = require("http")
const { setup } = require(".")

/**
 * @typedef Options options
 * @property {string|null} [token]
 * @property {string|null} [delegates]
 * @property {number} [port]
 * @property {"error"|"info"|"debug"} [loglevel]
 * @property {boolean} [strict]
 * 
 * @param {Options} options
 */
const main = async ({
  token = null,
  delegates = null,
  port = 3000,
  loglevel = "info",
  strict = false,
}) => {
  const service = await setup({ strict, loglevel, token, delegates })
  const server = http.createServer(service)
  server.listen(port)
}


/** @type {import('yargs').Argv<>} */
const cli = yargs(hideBin(process.argv)).options({
  port: {
    type: 'number',
    default: 3000,
    description: 'Set port for HTTP endpoint'
  },
  token: {
    type: 'string',
    description: 'Set optional access token'
  },
  loglevel: {
    type: 'string',
    choices: ['error', 'info', 'debug'],
    default: 'info',
    description: 'Adjust logging'
  }
})

main(cli.argv)
