// @ts-check

/**
 * @template T
 * @param {T} body
 * @returns {Response<T, 200>}
 */
const ok = (body) => response(body, { status: 200 })
exports.ok = ok

/**
 * @template T
 * @param {T} body
 * @returns {Response<T, 202>}
 */
const ok202 = (body) => response(body, { status: 202 })
exports.ok202 = ok202

/**
 * @param {Object} [failure]
 * @param {string} [failure.reason]
 * @param {string} [failure.details]
 * @returns {Response<Failure, 404>}
 */
const notFound = ({ reason = "NotFound", details = new Error().stack } = {}) =>
  response(
    {
      error: {
        reason,
        details,
      },
    },
    { status: 404 }
  )
exports.notFound = notFound

/**
 * @template {number} Status
 * @template T
 * @param {T} body
 * @param {Object} etc
 * @param {Status} etc.status
 * @returns {Response<T, Status>}
 */
const response = (body, { status }) => ({ body, status })
exports.response = response
/**
 * @template {{accessToken: null|string }} State
 * @template Query
 * @template {Response<any, any>} Result
 *
 * @param {(state: State, query:Query) => [State, Result] } handler
 * @returns {(request:OASRequest<State, Query, Result>, response:OASResponse<State, Result>) => void}
 */
const createHandler = (handler) => (request, response) => {
  const { state } = request.app.locals
  const { accessToken } = state

  try {
    if (accessToken) {
      const authorization = request.header("authorization")
      if (!authorization) {
        throw new HTTPError(401, "access token is missing")
      } else if (authorization !== `Bearer ${accessToken}`) {
        throw new HTTPError(401, "access token is invalid")
      }
    }

    const [nextState, { status, body }] = handler(
      state,
      readQuery(request.swagger.params)
    )

    response.app.locals.state = nextState

    response.status(status).send(body)
  } catch (error) {
    response.status(error.status || 500).send({
      error: {
        reason: error.message,
        details: error.details == null ? error.stack : error.details,
      },
    })
  }
}
exports.createHandler = createHandler

/**
 * @template T
 * @param {{[Key in keyof T]: { value: T[Key] } }} params
 * @returns {T}
 */

const readQuery = (params) => {
  const query = /** @type {T} */ ({})
  for (const [key, { value }] of Object.entries(params)) {
    query[/** @type {keyof T} */(key)] = value
  }

  return query
}

exports.readQuery = readQuery

class HTTPError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {string} [details=""]
   */
  constructor(status, message, details = "") {
    super(message)
    this.status = status
    this.details = details
  }
}

/**
 * @template Params, Out, Inn, Query
 * @typedef {import('express').Request<Params, Out, Inn, Query>} ExpressRequest
 */

/**
 * @template State, Inn, Out
 * @typedef {ExpressRequest<any, Out, any, any> & {
 *  swagger: {
 *    params: {
 *      [Key in keyof Inn]: { value: Inn[Key] }
 *    }
 *  },
 *  app: {
 *    locals: {
 *      state: State
 *    }
 *  }
 * }} OASRequest
 */

/**
 * @template Out
 * @typedef {import('express').Response<Out>} ExpressResponse
 */

/**
 * @template State, Ok
 * @typedef {ExpressResponse<Ok|Failure> & {
 *   app: {
 *     locals: {
 *       state: State
 *     }
 *   }
 * }} OASResponse
 */
/**
 * @template Body
 * @template {number} Status
 * @typedef {import('../protocol').Response<Body, Status>} Response
 */
/**
 * @typedef {import('../protocol').Failure} Failure
 */
