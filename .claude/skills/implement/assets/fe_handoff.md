---
title: <name> — frontend handoff
version: 1.0.0
updated: <YYYY-MM-DD>
inputs:
  - design.md@<x.y.z>
  - feature/<name>@<short-sha>
---

# <Name> — frontend handoff

<One paragraph: what the UI can now do and what it must build.>

## Auth

<Which operations need a bearer token / role; how to send it (header, socket handshake).>

## Operations

### <operationName>

<What it does, when the UI calls it.>

```graphql
mutation PublishPost($postId: ID!) {
  publishPost(postId: $postId) {
    checkoutUrl
  }
}
```

Variables:

```json
{ "postId": "…" }
```

Response:

```json
{ "data": { "publishPost": { "checkoutUrl": "https://…" } } }
```

Errors:

| Condition | Error (code / message) | UI should |
|---|---|---|
| | | |

<!-- Repeat per operation. For REST: method, path, headers, body, response. For sockets: event name, emit payload, server events to listen for. -->

## Enums & statuses

| Enum | Value | Meaning for the UI |
|---|---|---|

## Pages / URLs the FE must host

| URL | Reached when | Query params |
|---|---|---|

## Async behaviour

<Anything the UI must not assume happens synchronously — e.g. "status stays PENDING until the server confirms; re-fetch on the success page".>

## Changed / removed fields

none | <field — before → after — migration hint>
