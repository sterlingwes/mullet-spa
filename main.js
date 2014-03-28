/*
 * # SPA - Single Page App
 * 
 * Streamlines tying together the server and client side app components (routing, etc.)
 * 
 * @exports {Object} instance of Spa instantiated by Mullet runtime
 */

var _ = require('underscore')
  , path = require('path')
  , Promise = require('es6-promise');

module.exports = function(jade, react, tasker) {
    
    /*
     * ## Spa.constructor
     */
    function Spa(app) {
        this.app = app;
        this.locations = {};
        this.tasker = tasker(app);
    }
    
    /*
     * ## Spa.routes
     * 
     * Define routes and their handlers. Can be called multiple times before final Spa.build().
     * 
     * @param {Object} routes hash, each route's own properties are transferred to the handler propert
     * @return {Object} itself
     */
    Spa.prototype.routes = function(routes) {
        _.extend(this.locations, routes);
        return this;
    };
    
    /*
     * ## Spa.build
     * 
     * Renders app, hands off to Jade for writing
     * 
     * @return {Object} a Promise
     */
    Spa.prototype.build = function() {
        
        // copy the client side src files to the build dir
        
        this.tasker.copyFile( path.resolve(__dirname, './src') + '/*' , this.tasker.absoluteSrc('./build/prebuild/')[0] )
        
        // add handler requirements to router
        
        .then(function() {
            var d = [ "\n\nfunction Components() {" ];
            Object.keys(this.locations).forEach(function(name) {
                var loc = this.locations[name];
                d.push("\tthis['" + name + "'] = require('" + this.tasker.absoluteSrc( loc.handler ) + "');");
            }.bind(this));
            d.push("}");
            d.push("Components.prototype.get = function(name) { return this[name]; };\n");
            return this.tasker.appendFile( 'router.js', d.join("\n"), this.tasker.absoluteSrc('./build/prebuild')[0] );
        }.bind(this))
        
        // build router with React
        // and...
        // render main page with Jade
        
        .then(function() {
            
            this.router = new react.Renderer('container', this.tasker.absoluteSrc('./build/prebuild/router.js')[0], {
                path:   '/',
                routes: _.map(this.locations, function(route, name) {
                    route.handlerName = name;
                    return route;
                })
            });
            
            var renderer = new jade.Renderer({
                templateFile:   path.resolve(__dirname, './templates/index.jade'),
                options: { pretty: true },
                data: {
                    title:  this.app.info ? this.app.info.name || this.name : this.name
                }
            });

            renderer.addReact(this.router);

            return this.tasker.writeFile('index.html', renderer.render());
            
        }.bind(this))
        
        .then(function() {
            return this.tasker.compileLocal();
        }.bind(this))
        
        .catch(function(err) {
            console.error(err.stack);
        });

    };
    
    return Spa;
};