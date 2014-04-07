/*
 * Spa Router
 * 
 * Reusable client side router implementation using React Router Component
 * 
 * @exports a React component representing the root router of the App
 */

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
          , locations = this.props.routes.map(function(loc) {
              
            if(!loc.handler || typeof loc.handler === 'string')
                loc.handler = this.appCs.get(loc.handlerName);
              
            if(loc.notfound || loc.notFound)
                return NotFound(loc);
            
            loc.router = selfi.routerInstance;
            
            return Location(loc);
              
        }.bind(this));
        
        var path = typeof window === 'object' ? window.location.pathname : this.props.path;
        
        return React.DOM.div({}, [
            Flash({key:'router-flash'}),
            Locations({ key:'router-locations', path: path, ref: "router" }, locations)
        ] );
    }
    
});