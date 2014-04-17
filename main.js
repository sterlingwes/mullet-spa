/*
 * # SPA - Single Page App
 * 
 * Streamlines tying together the server and client side app components (routing, etc.)
 * 
 * @exports {Object} instance of Spa instantiated by Mullet runtime
 */

var _ = require('underscore')
  , path = require('path')
  , Promise = require('es6-promise').Promise;

module.exports = function(jade, react, tasker, uri) {
    
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
     * Example:
     *      spa.routes({
     *          'post': {
     *              path:       '/[YYYY!created]:year/[MM!created]:month/:title',
     *              handler:    './src/index.jsx',
     *              data: [{
     *                  created:    new Date("2014/01/02"),
     *                  title:      'My Post'
     *              },{
     *                  created:    new Date("2014/03/02"),
     *                  title:      'Follow-up Post'
     *              }]
     *          }
     *      })
     * 
     * Renders:
     *      /public/sites/vhost.domain/2014/01/my-post.html
     *      /public/sites/vhost.domain/2014/03/follow-up-post.html
     *
     * @param {Object} routes hash, each route's own properties are transferred to the handler propert
     * @param {String} route.path for location path to match, may include variables (/:pagename)
     * @param {String} route.handler for the React component to handle the route (file should export component)
     * @param {Array} route.data for the data to iterate and render separate pages (will try to match path parts with item keys)
     * @return {Object} itself
     */
    Spa.prototype.routes = function(routes) {
        _.extend(this.locations, routes);
        
        // determine which routes we need to render
        this.renderable = [];
        _.each(this.locations, function(loc,name) {
            if(loc.path =='/' || (_.isArray(loc.data) && loc.data.length))
                this.renderable.push(name);
        }.bind(this));
        
        return this;
    };
    
    /*
     * ## Spa.renderRoute
     *
     * @param {Object} loc
     * @param {Array} routes
     * @return {String} html
     */
    Spa.prototype.renderRoute = function(loc,routes, rec) {
        
        var routeData
          , routerPath = loc.path.replace(/\[[a-z!]+\]/ig,'');
        
        if(!rec) {
            _.find(routes, function(r) {
                routeData = {
                    data:   r.data,
                    path:   r.path
                };
                
                if(r.path == loc.path)
                    return true;
            });
        }
        else
            routeData = {
                data:   rec,
                path:   routerPath
            };
        
        // this needs to match the initial data in the rendered browser source or react complains
        //
        var ssbootData = {
             path:       routerPath,
             initData:   routeData,
             routes: _.map(routes, function(route) {
                 return _.omit(route,'data');
             })
         };
         
        this.router = new react.Renderer('container', this.tasker.absoluteSrc('./build/prebuild/router.js')[0], ssbootData);
        
        var renderer = new jade.Renderer({
            templateFile:   path.resolve(__dirname, loc.template || './templates/index.jade'),
            options: { pretty: true },
            data: {
                title:  this.app.info ? this.app.info.name || this.name : this.name,
                isLive: typeof this.buildOpts === 'object' && this.buildOpts.live
            }
        });
        
        var html = renderer.addReact(this.router).render();
        return html;
    };
    
    /*
     * ## Spa.renderRoutes
     *
     * Render the routes server side
     *
     * @return {Object} Promise
     */
    Spa.prototype.renderRoutes = function() {
        
        var passedRoutes = _.map(this.locations, function(route, name) {
           return _.extend({}, route, {
                path:           route.path.replace(/\[[a-z!]+\]/ig,''),
                handlerName:    name
           });
        })
          , promise;
        
        _.each(this.renderable, function(locname) {
            
            var loc = this.locations[locname];
              
            if(loc.path=='/')
                promise = this.tasker.writeFile('index.html', this.renderRoute(loc, passedRoutes));
            else
                promise = Promise.all(loc.data.map(function(rec) {
                    var url = uri.get(loc.path, rec);
                    return this.tasker.writeFile( url, this.renderRoute(loc, passedRoutes, rec));
                }.bind(this)));
            
        }.bind(this));
        
        return promise;
    };
    
    /*
     * ## Spa.build
     * 
     * Renders app, hands off to Jade for writing
     * 
     * @param {Object} opts for build options
     * @param {Boolean} opts.live for live reloading webpack diffs
     * @return {Object} a Promise
     */
    Spa.prototype.build = function(opts) {
        
        this.buildOpts = opts;
        
        // copy the client side src files to the build dir
        return this.tasker.copyFile( path.resolve(__dirname, './src') + '/*' , this.tasker.absoluteSrc('./build/prebuild/')[0], '-r' )
        
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
            return this.renderRoutes();
            
        }.bind(this))
        
        .then(function() {
            return this.tasker.compileLocal(opts);
        }.bind(this))
        
        .catch(function(err) {
            console.error(err.stack);
        });

    };
    
    return Spa;
};