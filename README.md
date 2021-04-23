# Mock IPFS Pinning Service

Implementation of in-memory [IPFS Pinning Service API](https://ipfs.github.io/pinning-services-api-spec/) for testing purposes.

## Install

```
npm install git://github.com/ipfs-shipyard/js-mock-ipfs-pinning-service.git
```

## Usage

```js
const http = require("http")
const { setup } = require("mock-ipfs-pinning-service")

const main = async () => {
  const service = await setup({ token: "secret" })
  const server = http.createServer(http)
  server.listen(8080)
}
```

State of the pins is exposed via `service.locals.state` which you can monkeypatch or replace. Each new request will be served based on that value. All requests perform that perform state updates do them in immutable style and swap the whole value, in other words references are guaranteed to not mutate.

### CLI Usage

You can also start the mock server from the cli:

```sh
mock-ipfs-pinning-service --port 8080 --token secret
```

If token is not passed it will not preform authentification.

### Debugging

Append `--loglevel debug` to see raw JSON sent on the wire (both received request and produced response). 

### Mocking specific `PinStatus` response

By default the mock service will respond with `PinStatus.status="queued"`.
This means `ipfs pin remote add` will hang forever, unless `--background` is passed, because it will wait for status to change to `pinned` or `failed`.

It is possible to overide this behavior per pin request by prefixing `Pin.name` with `${status}-`, for example:

- `queued-test0` → `PinStatus.status="queued"` → `pin remote add` hangs (needs `--background`)
- `pinning-test1` → `PinStatus.status="pinning"` → `pin remote add` hangs (needs `--background`)
- `pinned-test2` → `PinStatus.status="pinned"` → `pin remote add` responds instantly
- `failed-test3` → `PinStatus.status="failed"`→ `pin remote add` responds instantly
