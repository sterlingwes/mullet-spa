# SPA - Single Page App

Streamlines tying together the server and client side app components (routing, etc.)


****

## Spa.constructor

****

## Spa.routes

Define routes and their handlers. Can be called multiple times before final Spa.build().

*	*routes* `Object` hash, each route's own properties are transferred to the handler propert
*	*returns* `Object` itself

****

## Spa.build

Renders app, hands off to Jade for writing

*	*returns* `Object` a Promise