# Mock IPFS Pinning Service

Implementation of in-memory [IPFS Pinning Service API](https://ipfs.github.io/pinning-services-api-spec/) for testing purposes.

## Install

```
npm i mock-ipfs-pinning-service
```

## Usage

```js
const http = require("http")
const { setup } = require("mock-ipfs-pinning-service")
const port = 3000

const main = async () => {
  const service = await setup({ token: "secret" })
  const server = http.createServer(http)
  server.listen(port)
}
```

State of the pins is exposed via `service.locals.state` which you can monkeypatch or replace. Each new request will be served based on that value. All requests perform that perform state updates do them in immutable style and swap the whole value, in other words references are guaranteed to not mutate.

### CLI Usage

You can start the mock server from the command line:

```sh
npx mock-ipfs-pinning-service --port 3000 --token secret
```

If token is not passed it will not preform authentification.

### Log levels

Pass:

- `--loglevel error` to only print errors
- `--loglevel info` to print each JSON request and response (default on CLI)
- `--loglevel debug` to see low level OpenAPI validation details

### Mocking specific `PinStatus` response

By default the mock service will respond with `PinStatus.status="queued"`.
This means `ipfs pin remote add` will hang forever, unless `--background` is passed, because it will wait for status to change to `pinned` or `failed`.

It is possible to overide this behavior per pin request by prefixing `Pin.name` with `${status}-`, for example:

- `queued-test0` → `PinStatus.status="queued"` → `pin remote add` hangs (needs `--background`)
- `pinning-test1` → `PinStatus.status="pinning"` → `pin remote add` hangs (needs `--background`)
- `pinned-test2` → `PinStatus.status="pinned"` → `pin remote add` responds instantly
- `failed-test3` → `PinStatus.status="failed"`→ `pin remote add` responds instantly

### Debugging client in go-ipfs (`ipfs pin remote`)

One can use this mock service with client included in go-ipfs to debug its behavior:

```console
// start mock service
$ npx mock-ipfs-pinning-service --port 5000 --token secret --loglevel info

// then in other console
$ ipfs pin remote service add mock "http://127.0.0.1:5000" secret
$ ipfs pin remote service ls --stat
mock http://127.0.0.1:5000 0/0/0/1
```

The first console will show what happened on the wire:

```
Request: GET /pins?limit=1&status=queued headers[host=127.0.0.1:5000;user-agent=go-pinning-service-http-client;accept=application/json;authorization=Bearer secret;accept-encoding=gzip] at Fri Apr 23 2021 19:58:49 GMT+0200, IP: ::ffff:127.0.0.1, User Agent: go-pinning-service-http-client
Response Body:
{
	"count": 0,
	"results": []
}
Response: 200 3.183 ms  headers[x-powered-by=Express;access-control-allow-origin=*;content-type=application/json; charset=utf-8;content-length=24;etag=W/"18-sS5FLbfK694W6H4gsKxYsIoy1Pk"]
```
