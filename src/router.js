/*
 * Spa Router
 * 
 * Reusable client side router implementation using React Router Component
 * 
 * @exports a React component representing the root router of the App
 */

if(typeof __webpack_public_path__ !== 'string') {
    __webpack_public_path__ = '/js/';
}

var React = require('react/addons')
  , Router = require('react-router-component')
  , Location = Router.Location
  , Locations = Router.Locations
  , NotFound = Router.NotFound
  , Link = Router.Link
  , Flash = require('libs/flash')
;

module.exports = React.createClass({
    
    displayName: 'AppRouter',
    
    routerInstance: function() {
        return this.refs.router;
    },
    
    getInitialState: function() {
        return {};
    },
    
    componentWillMount: function() {
        this.appCs = new Components();
    },
    
    render: function() {
        
        var selfi = this
          , path = this.props.path
          //, path = typeof window === 'object' ? window.location.pathname : this.props.path
          , locations = this.props.routes.map(function(loc) {
            
            var routeParams = {
                handler:    loc.handler,
                path:       loc.path
            };
              
            if(!routeParams.handler || typeof routeParams.handler === 'string')
                routeParams.handler = this.appCs.get(loc.handlerName);
              
            if(loc.notfound || loc.notFound)
                return NotFound(loc);
            
            routeParams.router = selfi.routerInstance;
            
            if(this.props.initData && loc.path == this.props.initData.path) {
                routeParams.initData = this.props.initData;
            }
            
            return Location(routeParams);
              
        }.bind(this));
        
        return React.DOM.div({}, [
            Flash({key:'router-flash'}),
            Locations({ key:'router-locations', path: path, ref: "router" }, locations)
        ] );
    }
    
});