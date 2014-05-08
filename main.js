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

module.exports = function(jade, react, tasker, uri, rest) {
    
    /*
     * ## Spa.constructor
     */
    function Spa(app) {
        this.app = app;
        this.locations = {};
        this.tasker = tasker(app);
        this.models = {};
        this.primary = '';
        this.data = [];
    }
    
    /*
     * ## Spa.addModel
     *
     * Registers a schema object for use in populating locations / routes (primary paging)
     *
     * @param {String} name of model
     * @param {Object} schema instance of model
     * @return {Object} this
     */
     Spa.prototype.addModel = function(name, schema) {
         this.models[name] = schema;
         this.primary = name;
         
         return this;
     };
     
     /*
     * ## Spa.addApi
     *
     * Uses an added model to generate common REST API endpoints
     *
     * @param {String} name of model (also name of resource uri)
     * @param {Object} server instance tied to owner app
     * @return {Object} this
     */
     Spa.prototype.addApi = function(name, server) {
         rest.listen(server, {
             name:       name,
             schema:     this.models[name],
             done:       this.publish
         });
         
         return this;
     };
     
     /*
      * ## Spa._fetchData
      *
      * Used internally to fetch data to populate routes during the Spa.routes() call.
      *
      * TODO: support fetching data for all models (not just primary), also specifying selector
      *
      * @return {Object} Promise
      */
     Spa.prototype._fetchData = function() {
         return new Promise(function(res,rej) {
             this.models[this.primary].find({}, function(err,recs) {
                 if(err)    rej(err);
                 else       res(recs);
             });
         }.bind(this));
     };
    
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
     * @param {Object} opts for build options
     * @param {Boolean} opts.live for live reloading webpack diffs
     * @return {Object} Promise
     */
    Spa.prototype.routes = function(routes, opts) {
        _.extend(this.locations, routes);
        this.buildOpts = opts;
        
        // fetch the data we need
        
        return this._fetchData().then(function(recs) {
            this.data = recs;
        }.bind(this))
        
        // copy the client side src files to the build dir
        
        .then(function() {
            return this.tasker.copyFile( path.resolve(__dirname, './src') + '/*' , this.tasker.absoluteSrc('./build/prebuild/')[0], '-r' );
        }.bind(this))
        
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
    
    /*
     * ## Spa.renderRoute
     *
     * @param {String} url (actual rendered path, not pattern as possibly in loc.path)
     * @param {Object} loc
     * @param {Array} routes
     * @return {String} html
     */
    Spa.prototype.renderRoute = function(url, loc, routes, rec) {
        
        var routeData
          , routerPath = loc.path.replace(/\[[a-z!]+\]/ig,'');
        
        if(!rec) {
            _.find(routes, function(r) {
                routeData = {
                    data:       this.data,
                    path:       r.path,
                    realPath:   url
                };
                
                if(r.path == loc.path)
                    return true;
            }.bind(this));
        }
        else
            routeData = {
                data:       {_single:rec},
                path:       routerPath,
                realPath:   '/'+url
            };
        
        // this needs to match the initial data in the rendered browser source or react complains
        // if that fails, something is different in the client code when rendered on the server/client
        //
        var ssbootData = {
             path:       routerPath,
             initData:   routeData,
             routes: _.map(routes, function(route) {
                 return _.omit(route,'data');
             })
         };
         
         /*
         if(routerPath!='/')
            console.log(JSON.stringify(ssbootData,null,'  ')); */
         
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
     * @param {Object} upRec (optional), only renders documents affected by record with this _id
     * @return {Object} Promise
     */
    Spa.prototype.renderRoutes = function(upRec) {
        
        // update location data with new rec
        if(upRec) {
            var foundId,
                found = _.find(this.data, function(d,i) {
                    if(d._id == upRec._id) {
                        foundId = i;
                        return true;
                    }
                });
                
            if(found)
                this.data[foundId] = upRec;
        }
        
        var passedRoutes = _.map(this.locations, function(route, name) {
           return _.extend({}, route, {
                path:           route.path.replace(/\[[a-z!]+\]/ig,''),
                handlerName:    name
           });
        })
          , promise;
        
        _.each(this.locations, function(loc) {
              
            if(loc.path=='/') // TODO: probably shouldn't make root page the "blog index", need to handle possibly multiple user-defined index / cateogory  pages
                promise = this.tasker.writeFile('index.html', this.renderRoute('/', loc, passedRoutes));
            else {
                promise = Promise.all(_.without(this.data.map(function(rec) {
                    if(upRec && (!rec || rec._id !== upRec._id))
                        return;
                        
                    var url = uri.get(loc.path, rec);
                    return this.tasker.writeFile( url, this.renderRoute(url, loc, passedRoutes, rec));
                }.bind(this)), undefined));
            }
            
        }.bind(this));
        
        return promise;
    };
    
    /*
     * ## Spa.publish
     *
     * Called after a model change to rewrite files.
     *
     * @param {String} type HTTP method name (GET/PUT/POST/DELETE) referring to op type
     * @param {Object} rec updated record to lookup and re-render page for
     */
    Spa.prototype.publish = function(type, rec) {
        if(type=='put')
            this.renderRoutes(rec);
    };
    
    return Spa;
};