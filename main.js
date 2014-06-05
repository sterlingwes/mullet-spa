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

module.exports = function(jade, react, tasker, uri, rest, server, db) {
    
    var PageFields = {
            uri: {
                type:   String
            },
            title: {
                type:   String
            },
            body: {
                type:   [Object]
            },
            created: {
                type:       Date,
                onCreate:   function() { return new Date(); }
            },
            updated: {
                type:       Date,
                onUpdate:   function() { return new Date(); }
            },
            records: {
                type:   [String]
            },
            tags: {
                type:   [String]
            },
            options: {
                type:   Object
            },
            domain: {
                type:   String
            }
        }
        
      , Pages = db.schema('spa_pages', {
            fields: PageFields
        });
    
    /*
     * ## Spa.constructor
     */
    function Spa(app) {
        this.app = app;
        this.locations = {};
        this.tasker = typeof tasker !== 'function' ? tasker : tasker(app);
        this.models = {};
        this.primary = '';
        this.apis = [];
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
      * ## Spa.addData
      *
      * Shorthand for adding data to the default pages collection during testing
      *
      * @param {Array|Object} data
      * @return {Object} Promise
      */
     Spa.prototype.addData = function(data) {
         var items = _.isArray(data) ? data : [data]
           , promises = [];
           
         items.forEach(function(i) {
             promises.push(new Promise(function(res,rej) {
                 var np = new Pages(i);
                 np.save(function(err,r) {
                     if(err)    return rej(err);
                     else       res(r);
                 });
             }));
         });
         
         return Promise.all(promises);
     };
     
     Spa.prototype.updateData = function(data) {
       var items = _.isArray(data) ? data : [data]
         , promises = [];
         
       items.forEach(function(i) {
           promises.push(new Promise(function(res,rej) {
              var chg = { $set: _.omit(i,'_id', 'created') };
              Pages.update({_id:i._id}, chg, function(err) {
                if(err) return rej(err);
                Pages.find({_id:i._id}, function(err, r) {
                  if(err) return rej(err);
                  res(r && r.length ? r[0] : r);
                });
              });
           }));
       });
       
       return Promise.all(promises);
     };
     
    /*
     * ## Spa.resetData
     *
     * Resets data added to the default page collection (only those items in the 'testing' domain are removed)
     *
     * @return {Object} Promise
     */
     Spa.prototype.resetData = function() {
         return new Promise(function(res,rej) {
             Pages.remove({domain:'testing'}, function(err) {
                 if(err)    return rej(err);
                 res();
             });
         });
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
         var resourceName = typeof name === 'object' ? 'pages' : name;
         
         if(server && !this.server)
            this.server = server;
            
         rest.listen(this.server || (typeof name === 'object' ? name : server), {
             name:       resourceName,
             schema:     this.models[name],
             whitelist:  Object.keys(PageFields),
             done:       this.publish.bind(this)
         });
         this.apis.push(resourceName);
         return this;
     };
     
     /*
      * ## Spa._fetchData
      *
      * Used internally to fetch data to populate routes during the Spa.routes() call.
      *
      * @param {Object} selector
      * @param {String} model that defaults to this.primary (pages=>spa_pages)
      * @return {Object} Promise
      */
     Spa.prototype._fetchData = function(selector,model) {
         
         return new Promise(function(res,rej) {
             this.models[model||this.primary].find(selector||{}, function(err,recs) {
                 if(err)    rej(err);
                 else       res(recs);
             });
         }.bind(this));
     };
    
    /*
     * ## Spa.routes
     * 
     * Define routes and their handlers. Can be called multiple times before final Spa.build().
     * Prebuilds the router file with references to the route handlers provided.
     * 
     * Example (TODO: needs to be updated):
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
        
        // make sure we have data & an API and use defaults if not
        if(!this.primary)
           this.addModel('pages', Pages);
        
        if(!this.apis.length) {
           if(!this.server) {
               this.server = server.getInstance(this.app.name);
           }
           this.addApi('pages');
        }
        
        // copy the client side src files to the build dir
        
        return this.tasker.copyFile( path.resolve(__dirname, './src') + '/*' , this.tasker.absoluteSrc('./build/prebuild/')[0], '-r' )
        
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
        
        // we're doing an index page
        if(_.isArray(rec)) {
            _.find(routes, function(r) {
                routeData = {
                    data:       rec,
                    path:       r.path,
                    realPath:   url
                };
                
                if(r.path == loc.path)
                    return true;
            }.bind(this));
        }
        // we're doing a page for a single rec
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
         
        var router = new react.Renderer('container', this.tasker.absoluteSrc('./build/prebuild/router.js')[0], ssbootData);

        var renderer = new jade.Renderer({
            templateFile:   path.resolve(__dirname, loc.template || './templates/index.jade'),
            options: { pretty: true },
            data: {
                title:  this.app.info ? this.app.info.name || this.name : this.name,
                isLive: typeof this.buildOpts === 'object' && this.buildOpts.live
            }
        });
        
        var html = renderer.addReact(router).render();
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
        
        var passedRoutes = _.map(this.locations, function(route, name) {
           return _.extend({}, route, {
                path:           route.path.replace(/\[[a-z!]+\]/ig,''),
                handlerName:    name
           });
        })
          , promises = [];
        
        _.each(this.locations, function(loc) {
            
            if(loc.path.indexOf(':')==-1) // if there's vars in the path we're likely not an index / list of items
                promises.push( this._fetchData(loc.find, loc.model).then(function(data) {
                  return this.tasker.writeFile(loc.path=='/' ? 'index.html' : loc.path, this.renderRoute(loc.path, loc, passedRoutes, data));
                }.bind(this)));
            else {
                promises.push(this._fetchData(loc.find, loc.model).then(function(data) {
                  Promise.all(_.without(data.map(function(rec) {
                    if(upRec && (!rec || rec._id !== upRec._id)) // if we're publishing an update, only write the affected record files
                        return;
                        
                    var url = uri.get(loc.path, rec);
                    return this.tasker.writeFile( url, this.renderRoute(url, loc, passedRoutes, rec));
                  }.bind(this)), undefined));
                }.bind(this)));
            }
          
        }.bind(this));
        
        return Promise.all(promises);
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
        if(['put','post','delete'].indexOf(type)>=0)
            return this.renderRoutes(rec || {});
    };
    
    return Spa;
};