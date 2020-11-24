import { components, paths } from "./schema"

// GET /pins
export type ListPinsQuery = ListPins["parameters"]["query"]
export type ListPinsResult = Result<
  ListPins["responses"]["200"]["application/json"]
>

type ListPins = paths["/pins"]["get"]

// POST /pins
export type AddPinQuery = { undefined: AddPinOptions }
export type AddPinOptions = AddPinRoute["requestBody"]["application/json"]
export type AddPinResult = Result<
  AddPinRoute["responses"]["202"]["application/json"],
  202
>

type AddPinRoute = paths["/pins"]["post"]
// GET /pins/{requestid}
export type GetPinQuery = paths["/pins/{requestid}"]["parameters"]["path"]
export type GetPinResult = Result<
  GetPinRoute["responses"]["200"]["application/json"],
  200
>

type GetPinRoute = paths["/pins/{requestid}"]["get"]

// POST /pins/{requestid}
export type ReplacePinQuery = paths["/pins/{requestid}"]["parameters"]["path"] & {
  undefined: ReplacePinOptions
}
export type ReplacePinOptions = ReplacePinRoute["requestBody"]["application/json"]
export type ReplacePinResult = Result<
  ReplacePinRoute["responses"]["202"]["application/json"],
  202
>

type ReplacePinRoute = paths["/pins/{requestid}"]["post"]

// DELETE /pins/{requestid}
export type RemovePinQuery = GetPinQuery
export type RemovePinResult = Result<
  paths["/pins/{requestid}"]["delete"]["responses"]["202"],
  202
>

export type PinStatus = components["schemas"]["PinStatus"]
export type Pin = components["schemas"]["Pin"]
export type Status = components["schemas"]["Status"]
export type PinMeta = components["schemas"]["PinMeta"]
export type Origins = components["schemas"]["Origins"]
export type StatusInfo = components["schemas"]["StatusInfo"]
export type TextMatchingStrategy = components["schemas"]["TextMatchingStrategy"]
export type Failure = components["schemas"]["Failure"]

export type Ok<Status extends 200 | 202, Body> = Response<Body, Status>

export type Result<Ok, Status extends 200 | 202 = 200> =
  | Response<Ok, Status>
  | Response<Failure, 400 | 401 | 404 | 409 | 500>
export type Response<Body, Status extends number> = {
  body: Body
  status: Status
}
