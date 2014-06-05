var net = typeof window === 'object' ? require('imports?win=>window!libs/ajax') : {ajax:function(){}};

module.exports = {
    
    saveNew: function(data, done) {
        net.ajax({
            url:    '/api/wesquire/pages',
            type:   'POST',
            dataType: 'json',
            data:   data,
            complete: done
        });
    },
    
    saveEdit: function(data, done) {
        net.ajax({
            url:    '/api/wesquire/pages',
            type:   'PUT',
            dataType: 'json',
            data:   data,
            complete: done
        });
    },
    
    deletePage: function(id, done) {
      net.ajax({
        url:    '/api/wesquire/pages/' + id,
        type:   'DELETE',
        complete: done
      });
    }
};