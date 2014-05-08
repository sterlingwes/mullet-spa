# SPA - Single Page App

Streamlines tying together the server and client side app components (routing, etc.)


****

## Spa.constructor

****

## Spa.routes

Define routes and their handlers. Can be called multiple times before final Spa.build().

Example:
     spa.routes({
         'post': {
             path:       '/[YYYY!created]:year/[MM!created]:month/:title',
             handler:    './src/index.jsx',
             data: [{
                 created:    new Date("2014/01/02"),
                 title:      'My Post'
             },{
                 created:    new Date("2014/03/02"),
                 title:      'Follow-up Post'
             }]
         }
     })

Renders:
     /public/sites/vhost.domain/2014/01/my-post.html
     /public/sites/vhost.domain/2014/03/follow-up-post.html

*	*routes* `Object` hash, each route's own properties are transferred to the handler propert
*	*route.path* `String` for location path to match, may include variables (/:pagename)
*	*route.handler* `String` for the React component to handle the route (file should export component)
*	*route.data* `Array` for the data to iterate and render separate pages (will try to match path parts with item keys)
*	*returns* `Object` itself

****

## Spa.renderRoute

*	*url* `String` (actual rendered path, not pattern as possibly in loc.path)
*	*loc* `Object` undefined
*	*routes* `Array` undefined
*	*returns* `String` html

****

## Spa.renderRoutes

Render the routes server side

*	*upRec* `Object` (optional), only renders documents affected by record with this _id
*	*returns* `Object` Promise

****

## Spa.publish

Called after a model change to rewrite files.

*	*type* `String` HTTP method name (GET/PUT/POST/DELETE) referring to op type
*	*rec* `Object` updated record to lookup and re-render page for

****

## Spa.build

Renders app, hands off to Jade for writing

*	*opts* `Object` for build options
*	*opts.live* `Boolean` for live reloading webpack diffs
*	*returns* `Object` a Promise