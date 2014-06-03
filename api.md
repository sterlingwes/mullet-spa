# SPA - Single Page App

Streamlines tying together the server and client side app components (routing, etc.)


****

## Spa.constructor

****

## Spa.addModel

Registers a schema object for use in populating locations / routes (primary paging)

*	*name* `String` of model
*	*schema* `Object` instance of model
*	*returns* `Object` this

****

## Spa.addData

Shorthand for adding data to the default pages collection during testing

*	*data* `Array,Object` undefined
*	*returns* `Object` Promise

****

## Spa.resetData

Resets data added to the default page collection (only those items in the 'testing' domain are removed)

*	*returns* `Object` Promise

****

## Spa.addApi

Uses an added model to generate common REST API endpoints

*	*name* `String` of model (also name of resource uri)
*	*server* `Object` instance tied to owner app
*	*returns* `Object` this

****

## Spa._fetchData

Used internally to fetch data to populate routes during the Spa.routes() call.

*	*selector* `Object` undefined
*	*model* `String` that defaults to this.primary (pages=>spa_pages)
*	*returns* `Object` Promise

****

## Spa.routes

Define routes and their handlers. Can be called multiple times before final Spa.build().
Prebuilds the router file with references to the route handlers provided.

Example (TODO: needs to be updated):
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
*	*opts* `Object` for build options
*	*opts.live* `Boolean` for live reloading webpack diffs
*	*returns* `Object` Promise

****

, this.tasker.absoluteSrc('./build/prebuild/')[0], '-r' )
        
        // add handler requirements to router
        
        .then(function() {
            var d = [ "\n\nfunction Components() {" ];
            Object.keys(this.locations).forEach(function(name) {
                var loc = this.locations[name]
                  , reqPath = this.tasker.absoluteSrc( loc.handler )[0].replace(/\\+/g,'/');
                d.push("\tthis['" + name + "'] = require('" + reqPath + "');");
            }.bind(this));
            d.push("}");
            d.push("Components.prototype.get = function(name) { return this[name]; };\n");
            return this.tasker.appendFile( 'router.js', d.join("\n"), this.tasker.absoluteSrc('./build/prebuild')[0] );
        }.bind(this))
        
        // build router with React
        // and...
        // render main page with Jade
        
        .then(function() {
            return this.renderRoutes();
            
        }.bind(this))
        
        .then(function() {
            return this.tasker.compileLocal(opts);
        }.bind(this))
        
        .catch(function(err) {
            console.error(err.stack);
        });
        
    };
    
    /*
## Spa.renderRoute

*	*url* `String` (actual rendered path, not pattern as possibly in loc.path)
*	*loc* `Object` undefined
*	*routes* `Array` undefined
*	*returns* `String` html

****

if(routerPath!='/')
            console.log(JSON.stringify(ssbootData,null,'  '));

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