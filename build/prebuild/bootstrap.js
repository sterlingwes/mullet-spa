require('script!pace/pace.js');
require('style!css!./css/base.css');
require('style!css!./css/grids.css');
require('style!css!pace/themes/pace-theme-flash.css');
require('script!imports?win=>window!jquery/dist/jquery');
require('script!imports?win=>window!libs/jquerypubsub');

var Router = require('./router.js');

if(typeof window === 'object') {
    window.AppComponents = window.AppComponents || {};
    window.AppComponents.container = Router;
    window.AppData = window.AppData || {};
    
    if(!window.React)
        window.React = require('react');
}