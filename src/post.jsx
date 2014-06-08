/** @jsx React.DOM */

var React = require('react/addons')
  , cx = React.addons.classSet
  , Link = require('react-router-component').Link
  , Markdown = require('libs/markdown/index.jsx')
  , Editable = require('libs/editable/index.jsx')
  , Uri = new (require('apps/uri/pattern.js'))('/[YYYY!created]:year/[MM!created]:month/:title')
  , Utils = require('apps/wesquire/src/utils')
  , TagInput = require('react-taginput')
  , decodePost = Utils.decodePost
  , ClientCrud = require('./crudmix')
;

require('./css/post.less');

function moveTo(array,from,to) {
  array.splice(to, 0, array.splice(from, 1)[0]);
}

module.exports = React.createClass({
    
    mixins: [
        ClientCrud
    ],
    
    noTextContent: '<span class="mltplaceholder">Add your text to this block by clicking EDIT.</span>',
    
    displayName:    'Post',
    
    getInitialState: function() {
        return {
            post: false,
            editTitle: false,
            isEditing:  this.props.isEditing || false
        };
    },
    
    getDefaultProps: function() {
        return {
            data:   {},
            user:   false
        };
    },
    
    startEdit: function() {
      if(this.state.deleting)
        return this.setState({ deleting: false });
        
      this.setState({ isEditing: !this.state.isEditing });
    },
    
    toggleAddMode: function() {
        this.setState({ adding: true });
    },
    
    editTitle: function(event) {
        
        if(this.state.isEditing) {
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
    
    changeTags: function(tags) {
      var post = this.state.post || this.props.data;
      post.tags = tags;
      this.setState({
        post: post
      });
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
        if(post && post._id !== 'new')
            this.saveEdit(post, this.publishDone);
        else
            this.saveNew(this.state.post, this.publishDone);
    },
    
    publishDone: function(res) {
      console.log('done publishing', res);
      this.setState({ isEditing: false });
    },
    
    order: function() {
      this.setState({ ordering: ! this.state.ordering });
    },
    
    delete: function() {
      if(this.state.deleting) {
        this.deletePage((this.state.post||this.props.data)._id, function(res) {
          console.log('done deleting');
        });
      }
      
      this.setState({ deleting: ! this.state.deleting });
    },
    
    updateTitle: function() {
        var currentPost = this.state.post || this.props.data
          , title = this.refs.postTitle.getDOMNode().value;
          
         currentPost.title = title;
          
        this.setState({
            post:   currentPost
        });
    },
    
    moveBlock: function(index, direction) {
      var currentPost = this.state.post || this.props.data
        , to = index + direction
        , len = currentPost.body.length;
        
      if(to<0)    to = len-1;
      if(to>=len) to = 0;
      
      moveTo(currentPost.body, index, to);
      this.setState({
        post: currentPost
      });

    },
    
    reOrderBlock: function(index) {
      var ctx = this;
      return {
        up: function() {
          ctx.moveBlock.call(ctx, index, -1);
        },
        down: function() {
          ctx.moveBlock.call(ctx, index, 1);
        }
      };
    },
    
    deleteBlock: function(index) {
      var currentPost = this.state.post || this.props.data
        , body = currentPost.body
        , ctx = this;
      
      return function() {
        if(body[index]) {
          body.splice(index,1);
          ctx.setState({ post: currentPost });
        }
      };
    },
    
    render: function() {
        
        var p = this.state.post || this.props.data;
        
        var link = '/' + Uri.getPath(p).replace(/\.html$/,'')
          , addBlock
          , title
          , buttons = []
          , postId = 'post-'+p._id
          , tags
          , classes = cx({
              'postbox':        true
          });
          
        if(this.state.isEditing) {
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
                buttons.push(<div className="postBtn publish" onClick={this.publish} key="postOptPublish">Save &amp; Publish</div>);
            }
            
            buttons.push(<div className="postBtn reorder" onClick={this.order} key="postOptReorder">{this.state.ordering ? 'Done Ordering' : 'Reorder'}</div>);
            buttons.push(<div className="postBtn delete" onClick={this.delete} key="postOptDelete">{this.state.deleting ? 'Delete All' : 'Delete'}</div>);
            buttons.push(<div className="postBtn editStatus" onClick={this.startEdit} key="postOptEditStatus">{ this.state.deleting ? 'Done Deleting' : 'Cancel Editing' }</div>);
            
            tags = <TagInput tags={p.tags} onChange={this.changeTags} />;
        }
        else {
            buttons.push(<div className="postBtn editStatus" onClick={this.startEdit} key="postOptEditStatus">Edit</div>);
            title = <h2 id={'postTitle_'+p._id} onClick={this.editTitle}><Link href={ link } dangerouslySetInnerHTML={{__html:p.title}} /></h2>;
        }
          
        var ordering = this.state.ordering ? this.reOrderBlock : function() { return false; }
          , deleting = this.state.deleting ? this.deleteBlock : function() { return false; };
          
        var blocks = (p.body||[]).map(function(part,partNo) {
            switch(part.type) {
                case 'md':
                    if(!this.state.isEditing && part.content.indexOf('<span class="mltplaceholder">')===0) {
                        return;
                    }
                    return (
                     <Editable key={ partNo } editable={!!this.state.isEditing} ordering={ordering(partNo)} deleting={deleting(partNo)} options={{ id: p._id, fieldName: 'body.'+partNo, block: part, save: this.saveBlock }}>
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
                { tags }
            </div>
        );
    }
    
});