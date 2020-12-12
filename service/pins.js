// @ts-check

const { ok, ok202, notFound } = require("./util")

/**
 * @param {Object} [options]
 * @param {string|null} [options.accessToken]
 * @param {string[]} [options.delegates]
 * @returns {State}
 */
const init = ({
  accessToken = null,
  delegates = [
    "/ip6/::1/tcp/8080/p2p/QmYVEDcquBLjoMEz6qxTSm5AfQ3uUcvHdxC8VUJs6sB1oh",
  ],
} = {}) => ({
  accessToken,
  delegates,
  requestid: 0,
  pins: new Map(),
})

exports.init = init

const STATUS = {
  queued: /** @type {Status} */ ("queued"),
  pinning: /** @type {Status} */ ("pinning"),
  pinned: /** @type {Status} */ ("pinned"),
  failed: /** @type {Status} */ ("failed"),
}

/**
 *
 * @param {State} state
 * @param {AddPinQuery} query
 * @returns {[State, AddPinResult]}
 */
const addPin = (state, query) => {
  const options = query.undefined
  const pinStatus = state.pins.get(options.cid)
  const [newState, body] = pinStatus
    ? updatePin(options, pinStatus, state)
    : createPin(options, state)

  return [newState, ok202(body)]
}
exports.addPin = addPin

/**
 * @param {AddPinOptions} options
 * @param {PinStatus} existing
 * @param {State} state
 * @returns {[State, PinStatus]}
 */
const updatePin = (options, existing, state) => {
  const status = deriveStatus(options)
  if (status !== existing.status) {
    const replacement = { ...existing, status }

    return [
      {
        ...state,
        pins: new Map([...state.pins, [options.cid, replacement]]),
      },
      replacement,
    ]
  }

  return [state, existing]
}

/**
 * @param {AddPinOptions} options
 * @param {State} state
 * @returns {[State, PinStatus]}
 */
const createPin = (options, state) => {
  const requestid = state.requestid + 1
  const pinStatus = {
    requestid: `req-${requestid}`,
    status: deriveStatus(options),
    created: new Date().toISOString(),
    pin: options,
    delegates: state.delegates,
  }

  return [
    {
      ...state,
      requestid,
      pins: new Map([...state.pins, [options.cid, pinStatus]]),
    },
    pinStatus,
  ]
}

/**
 *
 * @param {ListPinsQuery} query
 * @param {State} state
 * @returns {[State, ListPinsResult]}
 */
const listPins = (state, query) => {
  const limit = query.limit == null ? Infinity : query.limit
  const results = []
  for (const entry of state.pins.values()) {
    if (match(query, entry)) {
      results.push(entry)

      if (results.length === limit) {
        break
      }
    }
  }

  return [
    state,
    ok({
      count: results.length,
      results,
    }),
  ]
}
exports.listPins = listPins

/**
 * @param {State} state
 * @param {GetPinQuery} query
 * @returns {[State, GetPinResult]}
 */
const getPin = (state, query) => {
  for (const pinStatus of state.pins.values()) {
    if (pinStatus.requestid === query.requestid) {
      return [state, ok(pinStatus)]
    }
  }

  return [state, notFound()]
}
exports.getPin = getPin

/**
 * @param {State} state
 * @param {ReplacePinQuery} query
 * @returns {[State, ReplacePinResult]}
 */
const replacePin = (state, query) => {
  const [newState, response] = removePin(state, query)
  // If
  if (response.status == 202) {
    return addPin(newState, query)
  } else {
    return [newState, response]
  }
}
exports.replacePin = replacePin

/**
 * @param {State} state
 * @param {RemovePinQuery} query
 * @returns {[State, RemovePinResult]}
 */
const removePin = (state, query) => {
  for (const [cid, pinStatus] of state.pins.entries()) {
    if (pinStatus.requestid === query.requestid) {
      const pins = new Map(state.pins)
      pins.delete(cid)
      return [{ ...state, pins }, ok202(undefined)]
    }
  }

  return [state, notFound()]
}
exports.removePin = removePin

/**
 * Returns `true` if list query matches the given pin entry.
 *
 * @param {ListPinsQuery} query
 * @param {PinStatus} entry
 * @returns {boolean}
 */
const match = (query, { pin, status, created }) => {
  // Workarounds https://github.com/ipfs/go-ipfs/issues/7827
  const queryStatus = [].concat(
    ...query.status.map((status) => status.split(","))
  )
  const matched =
    (query.cid == null || query.cid.includes(pin.cid)) &&
    (query.name == null || query.name == pin.name) &&
    (query.status == null || queryStatus.includes(status)) &&
    (query.before == null || Date.parse(created) < Date.parse(query.before)) &&
    (query.after == null || Date.parse(created) > Date.parse(query.after)) &&
    (query.meta == null || matchMetadata(query.meta, pin.meta || {}))

  return matched
}

/**
 * Returns `true` if attributes in the query match the pin metadata.
 *
 * @param {Record<string, any>} query
 * @param {Record<string, any>} meta
 * @returns {boolean}
 */
const matchMetadata = (query, meta) => {
  for (const [key, value] of Object.entries(query)) {
    if (meta[key] != value) {
      return false
    }
  }

  return true
}

/**
 * Derives status from the request params.
 *
 * @param {Object} options
 * @param {string} [options.name]
 */
const deriveStatus = ({ name = "" }) => {
  for (const status of Object.values(STATUS)) {
    if (name.startsWith(`${status}-`)) {
      return status
    }
  }

  return STATUS.queued
}

/**
 * @typedef {Object} State
 * @property {string|null} accessToken
 * @property {number} requestid
 * @property {string[]} delegates
 * @property {Map<string, PinStatus>} pins
 *
 * @typedef {import('../protocol').PinStatus} PinStatus
 * @typedef {import('../protocol').Status} Status
 * @typedef {import('../protocol').Pin} Pin
 * @typedef {import('../protocol').ListPinsQuery} ListPinsQuery
 * @typedef {import('../protocol').ListPinsResult} ListPinsResult
 *
 * @typedef {import('../protocol').AddPinQuery} AddPinQuery
 * @typedef {import('../protocol').AddPinOptions} AddPinOptions
 * @typedef {import('../protocol').AddPinResult} AddPinResult
 *
 * @typedef {import('../protocol').GetPinQuery} GetPinQuery
 * @typedef {import('../protocol').GetPinResult} GetPinResult
 *
 * @typedef {import('../protocol').ReplacePinQuery} ReplacePinQuery
 * @typedef {import('../protocol').ReplacePinResult} ReplacePinResult
 *
 * @typedef {import('../protocol').RemovePinQuery} RemovePinQuery
 * @typedef {import('../protocol').RemovePinResult} RemovePinResult
 *
 * @typedef {import('../protocol').Failure} Failure
 */
