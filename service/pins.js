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
    "/ip4/203.0.113.42/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
    "/ip6/2001:db8::42/tcp/8080/p2p/QmYVEDcquBLjoMEz6qxTSm5AfQ3uUcvHdxC8VUJs6sB1oh",
    "/dns4/node0.example.net/tcp/443/wss/p2p/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic",
    "/dnsaddr/node1.example.org/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
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
  // Workarounds https://github.com/oas-tools/oas-tools/issues/248
  const statuses = parseStringArr(query.status)
  const cids = parseStringArr(query.cid)

  const matched =
    (query.cid == null || cids.includes(pin.cid)) &&
    (query.name == null || query.name == pin.name) &&
    (query.status == null || statuses.includes(status)) &&
    (query.before == null || parseDate(created) < parseDate(query.before)) &&
    (query.after == null || parseDate(created) > parseDate(query.after)) &&
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
 * Parse the input using Date.parse, with special casing if the input is already a Date.
 *
 * @param {Date|string} d - a Date object or ISO-formatted date string.
 * @returns {number|Date} - the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC, or a Date instance
 */
const parseDate = (d) => {
  if (d instanceof Date) {
    return d
  }
  return Date.parse(d)
}

/**
 * @param {string | string[]} [s]
 * @returns {string[]}
 */
const parseStringArr = (s) => {
  if (s == null) {
    return []
  }

  if (typeof s === 'string') {
    return s.split(',')
  }

  return s
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
