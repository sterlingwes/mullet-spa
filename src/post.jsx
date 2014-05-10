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
    
    noTextContent: '<span class="mltplaceholder">Add your text to this block by clicking EDIT.</span>',
    
    displayName:    'Post',
    
    getInitialState: function() {
        return {
            post: false,
            editTitle: false
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
    
    editTitle: function(event) {
        
        if(this.props.user) {
            event.stopPropagation();
        }
        
        if(!this.state.editTitle) {
            this.setState({ editTitle: true });
            $(document).on('click', this.editTitleDone);
        }
    },
    
    editTitleDone: function(event) {
        if(this.state.editTitle) {
            this.setState({ editTitle: false });
            if(!$(event.target).closest('#post-title').length)
                $(document).off('click', this.handleEdit);
        }
    },
    
    addBlock: function(event) {
        var currentPost = this.state.post || this.props.data,
            type = event.target.id.replace(/^addBlock_/,'');
            
        currentPost.body.push({ type: type, content: this.noTextContent });
            
        this.setState({
            adding: false,
            post:   currentPost
        }, function() {
            console.log('added block', this.state);
        });
    },
    
    saveBlock: function(data) {
        var currentPost = this.state.post || this.props.data
          , field = Utils.dotGet(currentPost, data.field);
          
        field.content = data.content;
        if(!data.content)
            field.content = this.noTextContent;
            
        this.setState({
            post:   currentPost
        });
    },
    
    publish: function() {
        var post = this.state.post;
        if(post && post._id)
            this.saveEdit(post, function(res) {
                console.log('got back', res);
            });
        else
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
            
            if(this.state.editTitle)    
                title = <input type="text" className="postTitleInput" name="title" id="post-title" ref="postTitle" onChange={this.updateTitle} value={p.title} />;
            else
                title = <h2 id={'postTitle_'+p._id} onClick={this.editTitle}>{p.title}</h2>;
            
            if(this.state.post && (this.state.post.body||[]).length) {
                buttons.push(<div className="postBtn publish" onClick={this.publish} key="postOptPublish">Publish</div>);
            }
        }
        else
            title = <h2 id={'postTitle_'+p._id} onClick={this.editTitle}><Link href={ link } dangerouslySetInnerHTML={{__html:p.title}} /></h2>;
          
        var blocks = (p.body||[]).map(function(part,partNo) {
            switch(part.type) {
                case 'md':
                    if(!this.props.user && part.content.indexOf('<span class="mltplaceholder">')===0) {
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
                { title }
                <div className="postOptions">
                    { buttons }
                </div>
                { blocks }
                { addBlock }
            </div>
        );
    }
    
});