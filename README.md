# Mock IPFS Pinning Service

Implementation of in-memory [IPFS Pinning Service API][] for testing purposes.

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
