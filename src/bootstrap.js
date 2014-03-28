require('script!pace/pace.js'); // loading indicator first
require('style!css!pace/themes/pace-theme-flash.css');

require('script!imports?win=>window!jquery/dist/jquery');
require('script!imports?window=>window!libs/jquerypubsub');

var Router = require('./router.js');

if(typeof window === 'object') {
    window.AppComponents = window.AppComponents || {};
    window.AppComponents['container'] = Router;
    
    if(!window.React)
        window.React = require('react');
}