---
title: <name> — client handoff
version: 1.0.0
updated: <YYYY-MM-DD>
inputs:
  - <design.md@x.y.z | path/to/NNN_dfa_<feature>.md@sha256:<12 chars>>
  - feature/<name>@<short-sha>
---

# <Name> — client handoff

For whoever consumes this change (frontend, another service, library user).

<One paragraph: what the consumer can now do and what it must build.>

## Auth

<Which operations need a bearer token / role; how to send it (header, socket handshake).>

## Operations

### <operationName>

<What it does, when the UI calls it.>

```graphql
mutation CreateItem($input: CreateItemInput!) {
  createItem(input: $input) {
    id
    status
  }
}
```

Variables:

```json
{ "input": { "name": "…" } }
```

Response:

```json
{ "data": { "createItem": { "id": "…", "status": "ACTIVE" } } }
```

Errors:

| Condition | Error (code / message) | UI should |
|---|---|---|
| | | |

<!-- Repeat per operation. For REST: method, path, headers, body, response. For sockets: event name, emit payload, server events to listen for. -->

## Enums & statuses

| Enum | Value | Meaning for the UI |
|---|---|---|

## Pages / URLs the consumer must host

| URL | Reached when | Query params |
|---|---|---|

## Async behaviour

<Anything the UI must not assume happens synchronously — e.g. "status stays PENDING until the server confirms; re-fetch when the user returns".>

## Changed / removed fields

none | <field — before → after — migration hint>
