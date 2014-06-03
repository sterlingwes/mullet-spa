/** @jsx React.DOM */

var React = require('react/addons')
  , cx = React.addons.classSet
  , net = typeof window === 'object' ? require('imports?win=>window!libs/ajax') : {ajax:function(){}}
  , Form = require('libs/forms')
  , Alert = require('libs/alert/index.jsx')
  , Post = require('./post.jsx')
;

require('./css/manager.less');

module.exports = React.createClass({
    
    mixins: [Form],
    
    displayName:    'Manager',
    
    getInitialState: function() {
        return {
            pages:      [],
            message:    {},
            tab:        'tab_pages'
        };
    },
    
    alert: function(msg) {
        this.setState({
            message: {
                text:   msg
            }
        });
    },
    
    changeTab: function(event) {
        this.setState({ tab: event.target.id });
    },
    
    componentDidMount: function() {
        this.alert('Loading...')
        net.ajax({
            url:    '/api/wesquire/pages',
            type:   'GET',
            complete: function(res) {
                this.alert(false);
                console.log(res);
            }.bind(this)
        });
    },
    
    formDone: function(name, data) {
        console.log('form: '+name, data);
        this.props.login(data);
    },
    
    render: function() {
                     
        var pages = this.state.pages.map(function(p,pi) {
            return <li key={pi}>{ p.title }</li>;
        });
                             
        return this.transferPropsTo(
            <div className="spamanager">
                <h1>Manage Pages</h1>
                <div className="closeBtn" onClick={this.props.close}>&times;</div>
                <Alert message={this.state.message.text} type={this.state.message.type} />
                <ul className="tabMenu">
                    <li>
                        <div className="fakeLink" id="tab_pages" onClick={this.changeTab}>Pages</div>
                    </li>
                    <li>
                        <div className="fakeLink" id="tab_add" onClick={this.changeTab}>Add Page</div>
                    </li>
                </ul>
                <ul className="tabPanes">
                    <li className={this.state.tab=='tab_pages' ? 'active' : ''}>
                        <p>Pages!!</p>
                        { pages }
                    </li>
                    <li className={this.state.tab=='tab_add' ? 'active' : ''}>
                        <Post data={{title:'Untitled Post', _id:'new', body:[]}} user={this.props.user} />
                    </li>
                </ul>
            </div>
        );
    }
    
});