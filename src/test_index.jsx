/** @jsx React.DOM */

var React = require('react/addons')
  , API = require('libs/apiwiz')
  , _ = require('underscore')
;

module.exports = React.createClass({

    mixins: [
        API({
            posts: {
                call: '/'
            }
        })
    ],
    
    getInitialState: function() {
        return {
            posts:  {}
        };
    },
    
    render: function() {
        
        var posts = _.map(this.state.posts,function(p,i) {
            
            var body = p.body.map(function(b,bi) {
                return <p key={bi}>{ b.content }</p>;
            });
            
            return (
                <li key={i}>
                    <h2>{ p.title }</h2>
                    { body }
                </li>
            );
        }.bind(this));
        
        if(!posts.length)
            posts = <li>No posts found.</li>;
        
        return (
            <div>
                <ul className="postlist">
                    { posts }
                </ul>
            </div>
        );
        
    }
    
});