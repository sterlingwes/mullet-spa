/** @jsx React.DOM */

var React = require('react/addons')
  , cx = React.addons.classSet
  , Link = require('react-router-component').Link
  , Markdown = require('libs/markdown/index.jsx')
  , Editable = require('libs/editable/index.jsx')
  , Uri = new (require('apps/uri/pattern.js'))('/[YYYY!created]:year/[MM!created]:month/:title')
  , Utils = require('apps/wesquire/src/utils')
  , decodePost = Utils.decodePost
  , ClientCrud = require('./crudmix')
;

require('./css/post.less');

module.exports = React.createClass({
    
    mixins: [
        ClientCrud
    ],
    
    displayName:    'Post',
    
    getInitialState: function() {
        return {
            post: false
        };
    },
    
    getDefaultProps: function() {
        return {
            data:   {},
            user:   false
        };
    },
    
    toggleAddMode: function() {
        this.setState({ adding: true });
    },
    
    addBlock: function(event) {
        var currentPost = this.state.post || this.props.data,
            type = event.target.id.replace(/^addBlock_/,'');
            
        currentPost.body.push({ type: type, content: '<span class="mltplaceholder">Add your text to this block by clicking EDIT.</span>' });
            
        this.setState({
            adding: false,
            post:   currentPost
        });
    },
    
    saveBlock: function(data, cb) {
        var currentPost = this.state.post || this.props.data;
        if(data.id!=='new') {
            // actually save changes to existing post
        }
        else cb(false);
        
        var field = Utils.dotGet(currentPost, data.field);
        field.content = data.content;
        this.setState({
            post:   currentPost
        });
    },
    
    publish: function() {
        this.saveNew(this.state.post, function(res) {
            console.log('got back', res);
        });
    },
    
    updateTitle: function() {
        var currentPost = this.state.post || this.props.data
          , title = this.refs.postTitle.getDOMNode().value;
          
         currentPost.title = title;
          
        this.setState({
            post:   currentPost
        });
    },
    
    render: function() {
        
        var p = this.state.post || this.props.data;
        
        var link = '/' + Uri.getPath(p).replace(/\.html$/,'')
          , addBlock
          , title
          , buttons = []
          , postId = 'post-'+p._id
          , classes = cx({
              'postbox':        true
          });
          
        if(this.props.user) {
            if(this.state.adding === true)
                addBlock = (
                    <div id={'addBlock-'+p._id} className="addBlockOptions" onClick={this.addBlock}>
                        <div className="addBlockOption" id="addBlock_md">
                            Text
                        </div>
                        <div className="addBlockOption" id="addBlock_div">
                            "Read More" Mark / Divider
                        </div>
                        <div className="addBlockOption" id="addBlock_img">
                            Image
                        </div>
                        <div className="addBlockOption" id="addBlock_imgs">
                            Image Gallery
                        </div>
                        <div className="addBlockOption" id="addBlock_vid">
                            Video
                        </div>
                        <div className="addBlockOption" id="addBlock_file">
                            File Attachment
                        </div>
                        <div className="addBlockOption" id="addBlock_files">
                            File List
                        </div>
                        <div className="addBlockOption" id="addBlock_form">
                            Form
                        </div>
                    </div>
                );
            else
                addBlock = <div className="addBlock" onClick={this.toggleAddMode}>Add Content Block</div>;
                
            title = <input type="text" name="title" id="post-title" ref="postTitle" onChange={this.updateTitle} value={p.title} />;
            
            if(this.state.post && (this.state.post.body||[]).length) {
                buttons.push(<div className="postBtn publish" onClick={this.publish} key="postOptPublish">Publish</div>);
            }
        }
        else
            title = <Link href={ link } dangerouslySetInnerHTML={{__html:p.title}} />;
          
        var blocks = p.body.map(function(part,partNo) {
            switch(part.type) {
                case 'md':
                    if(part.content.indexOf('<span class="mltplaceholder">')===0) {
                        return;
                    }
                    return (
                     <Editable key={ partNo } editable={!!this.props.user} options={{ id: p._id, fieldName: 'body.'+partNo, block: part, save: this.saveBlock }}>
                         <Markdown md={decodePost(part.content)} />
                     </Editable>
                    );
            }
        }.bind(this));
                             
        return this.transferPropsTo(
            <div className={classes} id={postId}>
                <h2>{ title }</h2>
                <div className="postOptions">
                    { buttons }
                </div>
                { blocks }
                { addBlock }
            </div>
        );
    }
    
});