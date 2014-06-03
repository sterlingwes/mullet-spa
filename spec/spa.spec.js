var mullet = require('mullet')
  , path = require('path')
  , fs = require('fs')
  , _ = require('underscore')
  , appPath = path.join( __dirname, './testapp' )
  , apps
  , spa
  
  , testposts = [
                {
                    title:      'First post',
                    created:    new Date(),
                    body: [{
                        type:   'md',
                        content:'Hi World'
                    }],
                    domain:     'testing'
                },
                {
                    title:      'Second post',
                    created:    new Date(),
                    body: [{
                        type:   'md',
                        content:'Hello World'
                    }],
                    domain:     'testing'
                }
            ];
  
describe('Single Page App Rendering (SPA) suite test', function() {

    it('should setup a route', function(done) {

        mullet.loadOne({
            
            spa: {
                name:   'spa',
                base:   path.join( __dirname, '..' ),
                info: {
                    mullet: {
                        vhost: 'testing'
                    }
                }
            }
            
        }, {
            
            dbdriver:   'db_mongo',
            dbName:     'mltest',
            path:       path.join( __dirname, '../../..' )
            
        }, function(err, cs) {
            
            apps = cs;
            
            if(err)
                return console.error(err);
            
            spa = new apps.spa.api({
                  name:   'testapp',
                  base:   appPath,
                  path:   appPath
              });
            
            var routes = {
                'index': {
                    path:       '/',
                    handler:    './src/test_index.jsx'
                }
             };
             
            spa.addData(testposts).then(function(p) {
              
              testposts = p;
              
               spa.routes(routes)
               .then(function() {
                  expect(spa.locations).toEqual(routes);
                  done();
               }).catch(function(err) { console.error(err); });
                
            }).catch(function(err) { console.error(err); });
            
        });
    
    }, 15000);
    
    function postRegex(post) {
      var tagInner = '[\\s\\=\\.\\"\\-\\#\\$\\&\\;\\:a-z0-9]+'
        , str = '';
        
      str += '<li' + tagInner + '>';
      str += '<h2' + tagInner + '>' + post.title + '</h2>';
      post.body.forEach(function(b) {
        str += '<p' + tagInner + '>' + b.content + '</p>';
      });
      str += '</li>';
      
      return new RegExp(str, 'g');
    }
    
    function checkFile(fn,cb) {
      fs.readFile('../../public/sites/testing/'+fn, function(err,d) {
        var html = d.toString();
        testposts.forEach(function(p) {
          var regx = postRegex(p)
            , matches = html.match(regx) || [];
            
          expect(matches.length).toEqual(1, 'checking '+p.title);
        });
        cb();
      });
    }
    
    it('should render the right index page', function(done) {
      checkFile('index.html',done);
    });
    
    it('should render post updates properly', function(done) {
      if(!spa)  return done();
      
      testposts[0].body.push({type:'md', content:'Some new p'});
      spa.updateData(testposts).then(function(updated) {
        testposts.forEach(function(p) {
          var up = _.find(updated, function(u) { return u._id == p._id; });
          expect(up.title).toEqual(p.title);
          p.body.forEach(function(pb, pbi) {
            expect(up.body[pbi]).toEqual(pb);
          });
        });
        
        spa.publish('put', testposts[0]).then(function() {
          checkFile('index.html',done)
        });
        
      }).catch(function(err) { console.error(err); });
    });
    
    it('should close DB', function(done) {
        if(!spa) return done();
        
        spa.resetData().then(function() {
            apps.db_mongo.api.close(function(err) {
                expect(err).toBeNull();
                done();
            });
        }).catch(function(err) { console.error(err); });
        
    });

});