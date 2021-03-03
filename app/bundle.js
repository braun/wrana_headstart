(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var hejl = require('../hejlfram/hejl');

const { HejlHamApp } = require('../hejlfram/hamapp');


const CLCARD = require('./components/clcard')

// create main content pane
var hejlContent = DIV().class("container").collection(data=>data,
    (checklist)=> CLCARD("std",checklist.title,checklist=>checklist)
)

// create general application layout
var hejlRoot = (new HejlHamApp()).content(hejlContent);

// take pointer to side navigation panel (main menu)
var sideNav = hejlRoot.sidenav;

// setup logo overlay of layout
var logoOverlay = DIV("logoOverlay").class("botright").stack([
    SPAN().textBinder(()=>user().displayName).class("overlogo")
]);
logoOverlay.bind(user());
sideNav.logoCont.build().appendChild(logoOverlay.build());

// setup main menu items
var menuItems = [
    sideMenuItem("miTemplates",["ri-folders-fill"],"Checklist Templates"),
    sideMenuItem("mitNew",["ri-add-fill"],"New Checklist",()=>
    {
        guimodel.list = [{ items: [] }]
    }),
    sideMenuItem("mitLogout",["ri-logout-box-line"],"Logout",()=>
    {
        window.location.href = "user/logout"
    }),
    sideMenuItem("mitLogout",["ri-user-line"],"Profile",()=>
    {
        window.location.href = "user/profile"
    })

]
sideNav.menuCont.stack(menuItems);

hejl.setTitle(manifest.title);
hejl.setHejlRoot(hejlRoot);
    

// initialize application background services
const {DataStore,files} = require("../wrana/webcommons/model/datastore");


var guimodel = {}

// business logic
const templatesBag = files.templates;

templatesBag.list().then(data=>
{
    guimodel.list = data;
    hejlRoot.bind(data);
})

    

},{"../hejlfram/hamapp":7,"../hejlfram/hejl":8,"../wrana/webcommons/model/datastore":32,"./components/clcard":2}],2:[function(require,module,exports){

const { CARD } = require('../../hejlfram/card');
const { editableText} = require('../../hejlfram/components/editableText');

function CLCARD(color,title,binder)
{
    var curdata;
    var mydata;
    var editMode = false;
    function inEditMode()
    {
        return editMode;
    }
    function displayCompletion(checklist)
    {
        var items = checklist.items;;
        if(items == null)
            return "";
        var filled = 0;
        items.forEach(it=>{
            if(it.done)
                filled++;
        });

        return  " ("+filled+"/"+curdata.items.length+")";
    }
    var rv = CARD(title);
    rv.class(color+"Card").binder((data)=>{
         curdata=data;
        mydata =  binder(data);
        return mydata; 
    })
    .headerInternals([
       HORIZONTAL().stack([
            editableText(H2(),(val,el,upd)=>{
                if(val != null && upd) 
                    mydata.title = val;
                return mydata.title;
            },inEditMode),
            H2().class("padleft").textBinder(()=>displayCompletion(curdata))
        ]),
        rv._buttonArea])
    .buttons([
        SWITCHBUTTON(["ri-toggle-fill"],["ri-toggle-line"]).class(["ri-2x"]).check((event,button)=>{
            rv.showBody = !rv.showBody;
            rv.bind(curdata);
        }).bindChecked(()=>rv.showBody),
        CLBUTTON(["ri-more-2-fill","ri-2x"],()=>
        {
            rv.toggleContextMenu();
        })])
    .contextMenuItems([
      contextMenuItem("CLONE",["ri-file-copy-fill"],"Clone",async (event,button)=>{
            var newdata = JSON.parse(JSON.stringify(mydata));
            delete newdata._id;
            await files.instances.save(newdata)
            guimodel.list.push(newdata);
            hejlRoot.rebind();
             rv.bind(curdata);
         }),
      
         contextMenuItem("EDIT",["ri-pencil-fill"],"Edit",async (event,button)=>{
             editMode = !editMode;
             rv.bind(curdata);
         })
    ])           
    .bodyCollection(
        data=>data.items,
        (item)=>{
            var rvi = HPANEL().class(["spaceBetween","checklistitem"]).stack([
                editableText(STRONG(),(val,el,upd)=>{
                    if(val != null && upd) 
                        item.title = val;
                    return item.title;
                },inEditMode),
                SWITCHBUTTON(
                    ["ri-check-fill","green"],
                    ["ri-check-fill","gray"]).class(["ri-2x"]).check((checked)=>{
                        item.done = checked;
                        rv.rebind();                   
                }).bindChecked(()=>item.done)
            ])
            return rvi;
        }).stackUp();
       
    rv._body.visible(()=>rv.showBody)
    return rv;
}
module.exports = CLCARD;
},{"../../hejlfram/card":4,"../../hejlfram/components/editableText":6}],3:[function(require,module,exports){

var dataFiles = {
    rest:
    {
        type: 'rest',
        options: {},
        files: {
            templates: { type: 'document', userspec: true },
            instances: { type: 'document', userspec: true }
        }
    }
}

module.exports.dataFiles = dataFiles;
    

},{}],4:[function(require,module,exports){
const { contextMenuItem } = require('./components/contextMenuItem')
const { HejlElement } = require('./hejlElement');

class hejlCard extends HejlElement
{
    constructor(title,id,options)
    {
        super(id,"DIV",options);
        this._buttonArea =     HORIZONTAL('buttonArea').class('buttonArea');
        this._headerInternals = [  H2(title), this._buttonArea ];
        this._header =  HEADER().class(["relative","horizontal","spaceBetween"]);
        this._bodyInternals = [];
        this._body = DIV("cardbody").class(["cardbody","tabLeft"]);
        this._contextMenu = DIV().class(['contextMenu'])
         .visible(()=>this.showContextMenu);
        this.showBody = true;
        this.showContextMenu = false;
    }
    title(hejltitle)
    {
        this._headerInternals = [  hejltitle, this._buttonArea ];
        return this;
    }
    header(h)
    {
        this._header = h;
        return this;
    }
    headerInternals(hi)
    {
        this._headerInternals = hi;
        return this;
    }
   
    buttons(b)
    {
        this._buttonArea.stack(b);
        return this;
    }
    body(b)
    {
        this._body = b;
        return this;
    }
    bodyStack(b)
    {
        this._bodyInternals = b;
        return this;
    }
    bodyCollection(itemCallback,itemViewCallback)
    {
        this._body.collection(itemCallback,itemViewCallback);
        return this;
    }
    contextMenuItems(its)
    {
        its.forEach(it => {
            it.card = this;
        });
        this._contextMenu.stack(its);
        return this;
    }
    toggleContextMenu()
    {
        this.showContextMenu = !this.showContextMenu;
        this._contextMenu.handleVisibility();
    }
    stackUp()
    {

        this._header.stack(this._headerInternals);
        this._body.stack(this._bodyInternals);
        this.stack([
            this._header,
            DIV().class('relative').stack([this._contextMenu]),
            this._body]);
   
        return this;
    }
    
}
 function CARD(title,id,options)
{
    return new hejlCard(title,id,options);
}

module.exports.CARD = CARD;
module.exports.hejlCard = hejlCard;
},{"./components/contextMenuItem":5,"./hejlElement":9}],5:[function(require,module,exports){
function contextMenuItem(id,iconClasses,label,callback)
{

    var rv = DIV(id).class("contextMenuItem").stack([
        SPAN(null,id+"_icon").class(iconClasses),
        SPAN(label,id+"_text").class('label')])
    .click((event,hejl)=>
    {
        if(hejl.card && hejl.card.toggleContextMenu)
            hejl.card.toggleContextMenu();
        callback(event,hejl);
    });
    return rv;
}
if(!window.noHejlGlobals)
{
    window.contextMenuItem = contextMenuItem;
}
module.exports.contextMenuItem = contextMenuItem;
},{}],6:[function(require,module,exports){
function editableText(textElement,binder,editBinder,id,options)
{
    var rv = DIV().stack(
            [ textElement.textBinder(binder).visible(()=>!editBinder()),
                INPUT().textBinder(binder).visible(editBinder)
    ]);
    return rv;
}

if(!window.noHejlGlobals)
{
    window.editableText = editableText;
}
module.exports.editableText = editableText;
},{}],7:[function(require,module,exports){
var hejl = require('./hejl');
var {HejlElement } = require('./hejlElement');

var { HejlApp } = require('./plainapp'); 

class HejlHamApp extends HejlApp
{
    constructor(id,options)
    {
        super(id,options);
        this.class(["hamLayout"]);

        this.sidenav = SIDENAV();
        this.hamButton = new hejlHamButton();
        this.sideNavVisible = false;
        this.hamButton.click(()=>{
            this.sideNavVisible = !this.sideNavVisible
            this.sidenav.handleVisibility();
            this.hamButton.rebind();
        });
        this.hamButton.binder((data,bt)=>
        {
            if(this.sideNavVisible)
                bt.build().classList.add("opened");
            else
                bt.build().classList.remove("opened");

        })
        this.sidenav.visible(()=>this.sideNavVisible);
    }

  
    content(content)
    {
        content.class("hamContent");
        return super.content(content)
    }
    stackUp()
    {
        
        this.stack([this.progres,this.dialogPane,this.hamButton,this.sidenav,this.contentEl])
    }
    menuitems(its)
    {
        this.sidenav.menuCont.stack(its);
    }
}



class hejlHamButton extends HejlElement
{
    constructor(id,options)
    {
        if(typeof id == "object")
        {
            options = id
            id = null;
        }
        if(id == null)
            id="HamButton"

        super(id,"DIV",options);
        this.class(["hamButton","ri-menu-fill","ri-2x"]);

       // this.sidenav = SIDENAV();
    }

}

class hejlSideNav extends HejlElement
{
    constructor(id,options)
    {
        super(id,"DIV",options);
        this.class("sidenav");
       // this.class(["horizontal","relative"]);
       this.logoCont = DIV("logoCont").class("relative");
       this.logo = IMG("logo").src("images/logo.svg");
       this.logoCont.stack([this.logo])
       this.menuCont = DIV("menuCont").class("vertical");
        this.stackUp();
       // this.sidenav = SIDENAV();
    }
    stackUp()
    {
        this.stack([this.logoCont,this.menuCont]);
    }
}
window.SIDENAV = function(id,options)
{
    return new hejlSideNav(id,options);
}

function sideMenuItem(id,iconClasses,label,callback)
{

    var rv = DIV(id).class("navBarMenuItem").stack([
        SPAN(null,id+"_icon").class(iconClasses),
        SPAN(label,id+"_text")]).click(callback);
    return rv;
}

if(!window.noHejlGlobals)
{
    window.HAMLAYOUT = function(id,options)
    {
        return new hejlHamLayout(id,options);
    }
    window.sideMenuItem = sideMenuItem;
}



module.exports.HejlHamApp = HejlHamApp;

},{"./hejl":8,"./hejlElement":9,"./plainapp":28}],8:[function(require,module,exports){

window.addEventListener('load',function()
{
  hejlBoot();
});

function hejlBoot()
{
    var domNode = root.build();
    document.body.appendChild(domNode)
}
var root;
function setHejlRoot(hejlNode)
{
    root = hejlNode;
    module.exports.root = root;
}

function setTitle(title)
{
  document.title = title;
}

function destructure(modvar,mod)
{
  var rv = "";
 
    for(let k in mod)
      rv += (rv.length > 0 ? ",": "") + k;
    rv = "const { "+rv+"} = "+modvar+";\n";
    console.log("destructuring: "+ modvar,rv)
  return rv;
}
window.destructure = destructure;
module.exports.setHejlRoot = setHejlRoot;
module.exports.setTitle = setTitle;

require('./hejlElement');
require("./hejli18n");
require('./radio')
},{"./hejlElement":9,"./hejli18n":10,"./radio":29}],9:[function(require,module,exports){

const { HejlValidationProtocol, HejlValidationMessage,HejlValidationWarning,HejlValidationNote} =  require('./validationProtocol')



  /**
    * callback for th abductor functionality
    * @callback HejlElement~kidnapperCallback 
    * @param {HejlElement} child to be 
    * @param {HejlElement} nestor keeper of the nest of child
    * @returns {HejlElement|undefined} potencional cuckoo egg
    */

class HejlElement
{
    constructor(id,domElementName,options)
    {
        this.dirty = false;
        this.options = options;
        if(typeof id == "object")
        {
            this.options = id;
            id = options.id;
        }           

        if(typeof domElementName == "object")
        {
            this.options = domElementName;
            domElementName = options.domElementName;
        }
        if(this.options == null)
            this.options = { id: id};

        this.children =[];
        this.options.domElementName = domElementName;
      
        
        this.validators = [];
        this.myValidationResult = null;
        this.vlidationResult = null;
        this.kidnappers = [];
        this.myId = this.generateId(id);

        this.binders = [];
    }
    processor(procesFunc)
    {
        this.procesFunc = procesFunc;
        return this;
    }
    binder(bindFunc)
    {
        if(Array.isArray(bindFunc))
        {
            this.bindFunc = bindFunc[0]
            this.updater(bindFunc[1]);
        }
        else
            this.bindFunc = bindFunc;
        this.tryIdHint();
        return this;
    }
    tryIdHint()
    {
        if(this.bindFunc.hintId)
        this.id(this.bindFunc.hintId());
    }
    updater(updateFunc)
    {
        this.updateFunc = updateFunc;
        return this;
    }
    update(val)
    {
        if(this.updateFunc)
            this.updateFunc(val,this.model,this);
        else if(this.parent)
            this.parent.update(val);
        else
            console.warn("HEJL: no updater found for value",val);
    }
    textBinder(bindFunc)
    {
        if(Array.isArray(bindFunc))
        {
            var getter = bindFunc[0];
            var setter = bindFunc[1];

            this.textBindFunc = function(val,el,setting)
           {
                if(setting)
                   setter(val)
                return getter(el);

           }    
        }
        else
          this.textBindFunc = bindFunc;
        return this;
    }
    rebind()
    {
        if(this._rebindScheduled)
        {
            this._rebindScheduled.clear();
            delete this._rebindScheduled;
        }
        this.bind(this.model)
    }
    scheduleRebind(tmo)
    {
        if(tmo == null)
            tmo = 100;
         if(this._rebindScheduled)
           return;
       this._rebindScheduled =  TIMEOUT(this.rebind.bind(this));
    }
    tryProcessor()
    {
        if(this.procesFunc && !this.processDone)
        {
            this.processDone = TRYC(()=>this.procesFunc(this))
            if(this.procesDone == undefined)
                this.processDone = true;
        }
    }
    default(defaultModel)
    {
        this.defaultModel =defaultModel;
        return this;
    }
    
    bind(data)
    {
        this.model = data;
     
        
       this._tryNesting();
       this.tryProcessor();
        if(this.bindFunc != null)
            data = TRYC(()=>this.bindFunc(data,this));
        this.extractedModel = data;

        if(!this.handleVisibility())
            return;
        this.checkErrorHiglight();
        if(this.extractedModel == null && this.defaultModel != null)
            this.extractedModel = this.defaultModel;
        if(this.extractedModel == null)
            return this;
        // bind children with submodel
        TRYC(()=>this.handleTextBind());
       
       let iscol = this.handleCollectionBind();
        
        this.children.forEach(child=>{
            child.bind(iscol ? child.model:data);
            })
        return this;
    }
    handleTextBind()
    {
        
        if(this.textBindFunc != null)
        {
            var txt = "";
            var txt = TRYC(()=>this.textBindFunc(this.extractedModel,this));
            if(txt == null)
                txt = "";
            this.text(txt);
        }
        
    }
    handleVisibility()
    {
        
        if(this.visibleCallback)
        {
            if(this.originalDisplay == undefined)
            {
                this.originalDisplay = this.build().style.display;
                if(!this.originalDisplay)
                    this.originalDisplay = false;
            }
            var visible = this.extractedModel && TRYC(()=>this.visibleCallback(this.extractedModel,this));
            if(!visible)
                this.build().style.display = 'none';
            else if(this.originalDisplay == false)
                this.build().style.display = null;
            else    
                this.build().style.display = this.originalDisplay;

          return visible === true;
        }
        return true;
    }
    handleCollectionBind()
    {
        if(this.itemCallback == null)
            return false;
        
        var col = TRYC(()=>this.itemCallback(this.extractedModel,this),[]);
        var its = [];
        if(col == null)
        {
            console.warn("HEJL: Collection binder return null, it is intended ?",this.itemCallback);
            col = [];
        }
        if(col.forEach == null)
        {
            console.error("HEJL: Collection binder did not return collection with forEach method",this.itemCallback);
            return;
        }
        col.forEach(item=>
            {
                var view = TRYC(()=>this.itemViewCallback(item,this.extractedModel,this.model));
                its.push(view);
                if(this.nest)
                    view._tryAddToNest(this.nest);
                view.model = item;
            });
        this.build().textContent="";
        this.stack(its);
        return true;
      
    }
   build()
   {
       if(this.domElement == null)
       {
        var oid = this.options.id;
        this.domElement = document.createElement(this.options.domElementName);
      
       this._setupId();
        this.domElement._jsElement = this;
        if(this.options != null && this.options.attrs != null)
        {
            for(let attr in this.options.attrs)
            {
                let val  = this.options.attrs[attr];
                this.domElement[attr] = val;
            }
        }
        this.tryProcessor();
       }
       return this.domElement;
   }
   id(id)
   {
     this.myId = this.generateId(id);
     this.options.id = id;
     this.build();
     this._setupId();
     return this;
   }
    _setupId()
    {
        
        var oid = this.options.id;
        if(this.myId)
            this.domElement.id = this.myId;
        if(oid)
        {
            this.domElement.classList.remove(oid);
            this.domElement.classList.add(oid);
        }
    }
   attach(domElementRoot)
   {
       if(domElementRoot == null)
        domElementRoot = document.body;
      var myel = domElementRoot.getElementById(this.myId);
      if(myel != null)
      {
        this.domElement = myel;
        this.domElement._jsElement = this;
      }
      return this;
   }
    
   generateId(id)
   {
       if(id != null)
        {
            id = id+"_"+HejlElement.idSequence++;
        }
       return id;
   }

   class(spec)
   {
       if(typeof spec == "string")
            spec = [spec];
        spec.forEach(cl=>
            {
                this.build().classList.add(cl)
            })
        return this;
   }

   get classList()
   {
       return this.build().classList;
   }
   html(text)
   {
       if(text == null)
        text = "";
       this.build().innerHTML = text;
       return this;
   }
   text(text)
   {
       if(text == null)
        text = "";
       this.build().innerText = text;
       return this;
   }

   removeChildren()
   {
       this.children = [];
       this.build().innerText = "";
   }

   /**
    * create nest for chidlren requesting nesting
    * this marks the nesting.
    * nest is simple object and the children are here as properties
    */
   nestor()
   {
       this.nest = {}
       return this;
   }
   /**
    *reuest nesting in nesting context of its parent
    * element has to have specified id to be nested
    * @param {boolean|undefined} donest 
    */
   nestMe(donest)
   {
     this._nestMe = donest == undefined ? true : donest
     return this;
   }

   /**
    * called as part of bind.
    * tries populate own nest with nesting requesting children
    */
   _tryNesting()
   {
       if(!this.nest || this._nestingDone)
            return;
        this._nestingDone = true;
        this._tryNestChildren(this.nest)
        this.kidnappers.forEach(krecord=>
            {
                for(var kid in this.nest)
                {
                    var child = this.nest[kid];
                     if(krecord.childId == null || kid == krecord.childId)
                     {
                         var cuckooEgg = TRYC(()=>krecord.kidnapper(child,this));
                         if(cuckooEgg && cuckooEgg !== child)
                         {
                             //install cuckoo egg
                             this.nest[kid] = cuckooEgg;
                             child.parent._installCuckooEgg(cuckooEgg,child);
                         }
                     }
                }
            })
   }
   _tryAddToNest(nest)
   {
       
        if(this._nestMe && this.options.id)
            nest[this.options.id] = this; // nest 
        
        if(this.nest)
            return; // border of nesting context
        this._tryNestChildren(nest);
        
   }
   isDirty()
   {
       var rv;
       if(this.dirty)
        return true;

       if(this.nest)
           for(var k in this.nest)
                if(this.nest[k].isDirty())
                    return true;
       return false;

   }
   _tryNestChildren(nest)
   {
        this.children.forEach((c)=>
        {
            c._tryAddToNest(nest);
        })
   }
 
   /**
    * kidnaper can intercept all childred in the nest.
    * Abuse them  and can replace them with its own HejlElement (cuckoo egg)
    * the child with id you are interested to can be specified by childId
    * @param {HejlElement~kidnapperCallback} kidnapper
    * @param {string|undefined} childId 
    */
   abductor(kidnapper,childId)
   {
        this.kidnappers.push({ kidnapper: kidnapper, childId:childId });
        return this;
   }
   /**
    * replaces the given actual child with the new one
    * @param {HejlElement} cuckooEgg new element to be installed
    * @param {HejlElement} child element to be replaced
    */
   _installCuckooEgg(cuckooEgg,child)
   {
       var idx = this.children.indexOf(child);
       if(idx == -1)
        return;
        this.cuckooEgg.id(child.myId);
        this.cuckooEgg.options.id = child.options.id;
        this.children.splice(idx,1,[cuckooEgg])
      this.build().replaceChild(cuckooEgg.build(), child.build());
   }

   _installChild(child)
   {
        let installChild = (child)=>
        {
      
            this.children.push(child);
             child.parent = this;
            this.build().appendChild(child.build());
        }
        if(child.next != null)
        {
            do
            {
                let gchild = child.next().value;
                if(gchild == null)
                    break;
                installChild(gchild);
            }
            while(true )
        } else
        installChild(child);
   }
   stack(children)
   {
       this.removeChildren();
       this.children = [];

   
       children.forEach(this._installChild.bind(this))
      
        return this;
   }
  
   stackAdd(children)
   {
      if(!Array.isArray(children))
            children = [ children ];
     // this.children = this.children.concat(children);
       children.forEach(this._installChild.bind(this))

        return this;
   }

   click(clickCallback)
   {
       if(clickCallback == null)
        return this;
       this.clickCallback = clickCallback;
       this.build().addEventListener('click',
       (event)=>{
          TRYC(()=>{
                 event.stopPropagation();
              event.preventDefault();
                this.clickCallback(event,this);
          });
       });
       return this;
   }
   
   visible(callback)
   {
       this.visibleCallback = callback;
       return this;
   }

   collection(itemCallback,itemViewCallback)
   {
       this.itemCallback = itemCallback;
       this.itemViewCallback = itemViewCallback;
       return this;
   }


 
   validator(validatorCb)
   {
       this.validators.push(validatorCb);
       return this;
   }

   validate(protocol)
   {
       
        this.validationResult = new HejlValidationProtocol();
        this.myValidationResult = new HejlValidationProtocol();
        this.validators.forEach(v=>
            TRYC(()=>v(this, this.myValidationResult))
        );

        this.validationResult.merge(this.myValidationResult);
        this.children.forEach(child=>
            {
                this.validationResult.merge(child.validate());
            })

        if(protocol != null)
            protocol.merge(this.validationResult);
        else
            protocol = this.validationResult;

        this.highlightError();
        return protocol;
   }
   checkErrorHiglight()
   {
        if(this.myValidationResult) //validated once
        {
            this.validate();
            this.highlightError();
        }
   }
   highlightError()
   {
       this.build().classList.remove("error")
       if(this.build().parentElement == null)
        return;

       if(this.errorEl)
          this.build().parentElement.removeChild(this.errorEl);
       delete this.errorEl;
       this.build().parentElement.classList.remove('input');
       if(this.isInError())
       {
           var err = this.myValidationResult.displayErrors();
           this.errorEl = createElementFromHTML("<span class='tooltip error' id='"+this.myId+"_error' >"+err+"</span>");
        //  var target = document.getElementById('target');
           this.build().parentElement.classList.add('input');
           this.build().parentElement.appendChild(this.errorEl);
           this.build().classList.add('error');
       } 
        
   }
   isInError()
   {
       if(!this.myValidationResult)
        return false;
       var rv =  this.myValidationResult.hasErrors();
       return rv;
   }

   /**
    * Name of field to be used in validation messages
    * @param {String} fieldLabel displayable name of field
    */
   label(fieldLabel)
   {
       this.fieldLabel = fieldLabel;
       return this;
   }
   lookupFieldLabel()
   {
    if(this.fieldLabel != null)
        return this.fieldLabel;
    if(this.parent != null)
        return this.parent.lookupFieldLabel();
    return this.myId;
   }
   required(cb)
   {
       this.validator((el,protocol)=>
       {
           if(!this.checkFilled)
            return this;
          if(cb && cb()==false)
            return this;
          var filled = this.checkFilled();
          if(!filled)
               protocol.addError(this.lookupFieldLabel(),"Pole musí být vyplněno");
       })
       return this;
   }
}
HejlElement.idSequence = 0;

class hejlDIV extends HejlElement
{
    constructor(id,options)
    {
        super(id,"DIV",options)
    }
}
window.DIV = function(id,options)
{
    return new hejlDIV(id,options);
}
class hejlSPAN extends HejlElement
{
    constructor(id,options)
    {
        super(id,"SPAN",options)
    }
}
window.SPAN = function(text,id,options)
{
    return new hejlSPAN(id,options).text(text);
}

class hejlLABEL extends HejlElement
{
    constructor(id,options)
    {
        super(id,"LABEL",options)
    }
    for(fortext)
    {
        this.fortext = fortext;
     
        return this;
    }
    bind(m)
    {
        if(this.fortext != null)
        {
            var txt = this.fortext;
            if(typeof this.fortext !== "string")
                txt = this.fortext.myId;
            this.build().setAttribute("for",txt);
        }
        return super.bind(m);
    }
}

window.LABEL = function(text,id,options)
{
    return new hejlLABEL(id,options).text(text);
}

class hejlSTRONG extends HejlElement
{
    constructor(id,options)
    {
        super(id,"STRONG",options)
    }
}
window.STRONG = function(text,id,options)
{
    return new hejlSTRONG(id,options).text(text);
}


class hejlSmall extends HejlElement
{
    constructor(id,options)
    {
        super(id,"SMALL",options)
    }
}
window.SMALL = function(text,id,options)
{
    return new hejlSmall(id,options).text(text);
}

window.DIV = function(id,options)
{
    return new hejlDIV(id,options);
}
class hejlH1 extends HejlElement
{
    constructor(id,options)
    {
        super(id,"H1",options)
    }
}
window.H1 = function (text,id,options)
{
    return new hejlH1(id,options).text(text);
}

class hejlH2 extends HejlElement
{
    constructor(id,options)
    {
        super(id,"H2",options)
    }
}
window.H2 = function (text,id,options)
{
    return new hejlH2(id,options).text(text);
}

class hejlH3 extends HejlElement
{
    constructor(id,options)
    {
        super(id,"H3",options)
    }
}
window.H3 = function (text,id,options)
{
    return new hejlH3(id,options).text(text);
}
class hejlH4 extends HejlElement
{
    constructor(id,options)
    {
        super(id,"H4",options)
    }
}
window.H4 = function (text,id,options)
{
    return new hejlH4(id,options).text(text);
}
class hejlIFRAME extends HejlElement
{
    constructor(id,options)
    {
        super(id,"IFRAME",options);
        this.build().onload = this.onIframeLoaded.bind(this);
    }
    src(src)
    {
        if(src==null)
            src = "";
        this.build().src = src;
        return this;
    }
   
    srcbinder(binder)
    {
        this._srcbinder = binder;
        return this;
    }
    bind(data)
    {
        super.bind(data);
        if(this._srcbinder)
         TRYC(()=>this.src(this._srcbinder(this.extractedModel)));
         return this;
    }
    onIframeLoaded()
    {
        
    }
}

window.IFRAME = function(src,id,options)
{
    return (new hejlIFRAME(id,options)).src(src);
}
class hejlBUTTON extends HejlElement
{
    constructor(id,options)
    {
        super(id,"BUTTON",options)
    }
    build()
    {
        var rv = super.build();
        rv.setAttribute("type","button")
        return rv;
    }
}
window.BUTTON = function(text,clickCallback,id,options)
{
    return new hejlBUTTON(id,options).text(text).click(clickCallback);
}
window.CLBUTTON = function(classes,clickCallback,id,options)
{
    return new hejlBUTTON(id,options).class(classes).click(clickCallback);
}

class hejlSelect extends HejlElement
{
    constructor(id,options)
    {
        super(id,"SELECT",options)
    }
    opts(optsCb,optBinder)
    {

        this.optsCb = optsCb;
        this.optBinder = optBinder == null ?
        {
            show: (it)=>it.name,
            key: (it)=>it.value
        }:optBinder;
        this.collection(this.optsCb,this.createOption.bind(this));
        return this;
    }
    createOption(opt)
    {
        var rv = new HejlElement(undefined,"OPTION")
        rv.text(this.optBinder.show(opt));
        rv.build().value = this.optBinder.key(opt);
        return rv;
    }
   selectOption(idx)
   {
     this.build().options.selectedIndex = idx;
   }
   get selectedOption()
   {
       return this.build().options.selectedIndex;
   }
}
window.SELECT = function(id,options)
{
  return  new hejlSelect(id,options);
}
class hejlSwitch extends hejlBUTTON
{
    constructor(id,options)
    {
        super(id,options);
        this.checked = false;
        this.click(this.clicked);
        this._checkedClasses = [];
        this._notCheckedClasses = [];
    }
    bindChecked(cb)
    {
        this.bindCheckedCallback = cb;
        return this;
    }
    clicked()
    {
        this.dirty = true;
        this.checked = !this.checked;
       this.handleChecked();
       if(this.checkedCallback)
        this.checkedCallback(this.checked,this);
    }
    handleChecked()
    {
        var toremove = this.checked ?
             this._notCheckedClasses : this._checkedClasses;
        
        toremove.forEach(cl=>
            {
                this.build().classList.remove(cl);
            })
        var toadd = this.checked ?
             this._checkedClasses : this._notCheckedClasses;
        toadd.forEach(cl=>
            {
                this.build().classList.add(cl);   
            })
      
    
    }
    check(callback)
    {
        this.checkedCallback = callback;
        return this;
    }
    checkedClasses(classes)
    {
        this._checkedClasses = classes;
        return this;
    }
    notCheckedClasses(classes)
    {
        this._notCheckedClasses = classes;
        return this;
    }
    bind(data)
    {
        super.bind(data)
        if(this.bindCheckedCallback)
        {
            this.checked = this.bindCheckedCallback(this.extractedModel);
            this.handleChecked();
        }
    }
}

window.SWITCHFA = function(id,options)
{
    return SWITCHBUTTON(["fa","fa-toggle-on"],["fa","fa-toggle-off"],id,options);
}

window.CHECKFA = function(id,options)
{
    return SWITCHBUTTON(["fa","fa-check-square"],["fa","fa-square"],id,options);
}

window.SWITCHBUTTON = function(checkedClasses,notCheckedClasses,id,options)
{
    var rv = new hejlSwitch(id,options);
    rv.checkedClasses(checkedClasses);
    rv.notCheckedClasses(notCheckedClasses);
    rv.class("button");
    return rv;

}
class hejlIMG extends HejlElement
{
    constructor(id,options)
    {
        super(id,"IMG",options)
    }
    
    src(src)
    {
        if(src==null)
           src = "";
        this.build().src = src;
        return this;
    }
    srcbinder(binder)
    {
        this._srcbinder = binder;
        return this;
    }
    bind(data)
    {
        super.bind(data);
        if(this._srcbinder)
         TRYC(()=>this.src(this._srcbinder(this.extractedModel)));
         return this;
    }
}
window.IMG = function(id,options)
{
    return new hejlIMG(id,options);
}

class hejlHEADER extends HejlElement
{
    constructor(id,options)
    {
        super(id,"HEADER",options)
    }
    
}
window.HEADER = function(id,options)
{
    return new hejlHEADER(id,options);
}
class hejlSVG extends HejlElement
{
    constructor(id,options)
    {
        super(id,"SVG",options)

    } 
}
class hejlINPUT extends HejlElement
{
    constructor(id,options)
    {
        super(id,"INPUT",options)
        this.inputType = "TEXT";
    }
    placeholder(placeholder)
    {
        this.build().placeholder = placeholder;
        return this;
    }
    type(tp)
    {
        this.inputType =tp;
        return this;
    }
    build()
    {
        var rv = super.build();
        if(!this.setupDone)
            this.setupInput(rv);
        this.setupDone = true;
        return rv;
    }
    setupInput(rv)
    {
        rv.setAttribute("type",this.inputType);
        rv.addEventListener('input',()=>
        {
            var val = this.build().value;
            this.resizeInput();
            if(this.textBindFunc)
              this.textBindFunc(val,this,true);
            this.dirty = true;
           this.checkErrorHiglight();
        });
      //  this.resizeInput(); // immediately call the function

       
    }
 
    autoResize()
    {
        this.doAutoResize = true;
    }
    resizeInput() {
        if(!this.doAutoResize)
            return;
        var val = this.build().value;
        if(val == null || val == null)
            this.build().style.width = 10+ "ch";
        else
            this.build().style.width = val.length+1 + "ch";
    }
    text(txt)
    {
        this.build().value = txt;
        this.resizeInput();
        return this;
    }
    checkFilled()
    {
        var text = this.build().value;
        return text != null && text != "";
    }
}
window.INPUT = function (id,options)
{
    return new hejlINPUT(id,options);
}

class hejlTextArea extends HejlElement
{
    constructor(id,options)
    {
        super(id,"TEXTAREA",options)
    }
   
    build()
    {
        var rv = super.build();
        if(!this.setupDone)
            rv.addEventListener('input',()=>
            {
                var val = this.build().value;
                if(this.textBindFunc)
                    this.textBindFunc(val,this,true);
                this.dirty = true;
                this.checkErrorHiglight();
            });
        this.setupDone = true;
        return rv;
    }
    text(txt)
    {
        this.build().value = txt;
    }
    checkFilled()
    {
        var txt =  this.build().value;
        return txt != null && txt != "";
    }
    placeholder(placeholder)
    {
        this.build().placeholder = placeholder;
        return this;
    }
}
window.TEXTAREA = function (id,options)
{
    return new hejlTextArea(id,options);
}

class hejlVideo extends HejlElement
{
    constructor(id,options)
    {
        super(id,"VIDEO",options)
    }
   
    build()
    {
        var rv = super.build();
    
        this.source = new HejlElement(null,"SOURCE");
        this.source.build().type="video/mp4";
       rv.appendChild(source);
        return rv;
    }
   src(s)
   {
    if(s==null)
        s = "";
       this.source.src = s;
   }
}
window.VIDEO = function(id,options)
{
    return new hejlVideo(id,options)
}
window.HORIZONTAL = function(id,options)
{
    return DIV(id,options).class(["horizontal"]);
}
window.HPANEL = function(id,options)
{
    return HORIZONTAL(id,options).class('container');
}
window.HORIZONTALSB = function(id,options)
{
    return HORIZONTAL(id,options).class("spaceBetween");
}
window.HPANELSB = function(id,options)
{
    return HORIZONTALSB(id,options).class('container');
}
window.VERTICAL = function(id,options)
{
    return DIV(id,options).class("vertical");
}
window.VPANEL = function(id,options)
{
    return VERTICAL(id,options).class('container');
}
window.NBSP = function()
{
    return SPAN("").html("&nbsp;");
}

function hejlInterval(callback,interval,clearIntervalOnError)
{
    var n = window.setInterval(
        ()=>
        {
            var stop = TRYC(callback,clearIntervalOnError);
            if(stop == true)
                clear();
        },interval);
    function clear()
    {
        window.clearInterval(n);
    }
    return {
        clear: clear
    }
}
function hejlTimeout(callback,interval)
{
    var n = window.setTimeout(FTRYC(callback),interval);
    function clear()
    {
        window.clearTimeout(n);
    }
    return {
        clear: clear
    }
}
function hejlEventListener(eventId,callback)
{
    var root = require("./hejl").root;
    function handle(e)
    {
        callback(e.detail,e);
    }
    root.build().addEventListener(eventId,handle);
    return {
        remove()
        {
            root.build().removeEventListener(eventId,callback);
        }
    }
}
function sendEvent(eventId,data)
{
    var root = require("./hejl").root;
    var e = new CustomEvent(eventId,{ detail: data});
    root.build().dispatchEvent(e);
}

function cascadeCalls(calls,defval)
{
    if(!Array.isArray(calls))
        calls = [calls];
    var res = null;
   calls.find(call=>
    {
        res = TRYC(()=>call(res));
        return res == null;
    })
    return res;
}
window.CASCADE = cascadeCalls;

function tryC(call,defVal)
{
    try
    {
       return call();
    }
    catch(e)
    {
        console.error("Call failed!",e);
    }
    return defVal;
}
window.EVENTLISTENER = hejlEventListener;
window.SENDEVENT = sendEvent;
window.INTERVAL = hejlInterval;
window.TRYC = tryC;
window.TIMEOUT = hejlTimeout;
window.FTRYC = function(call,defval)
{
    return function()
    {
        TRYC(call,defval);
    }
}

class hejlInputFiles extends hejlINPUT
{
    constructor(id,options)
    {
        super(id,options);
        this.type="file";        
    }
    multiple(m)
    {
        this.multiple = m == null ? true : m;
        return this;
    }
    setupInput(rv)
    {
        //super.setupInput(el);
        rv.setAttribute("type",this.type);
        if(this.multiple)
            rv.setAttribute("multiple","multiple")
        rv.addEventListener('change',this.fireOnChange.bind(this));
    }
    fireOnChange(args)
    {
        if(this.fileCb != null)
            this.fileCb(this.build().files,args,this);
        this.build().value = null;
    }   
    onFiles(fileCb)
    {
        this.fileCb = fileCb;
        return this;
    }
}
window.hejlInputFiles = hejlInputFiles;
function INPUTFILES(text,id,options)
{
    var inpHejl = new hejlInputFiles("uploadInput",options);
    var rv =
        LABEL("",id,options).stack([
            SPAN().class(["fa","fa-cloud-upload"]),
            SPAN(" "+text,"label"),
            inpHejl
        ]);
        
        rv.processor((e)=>
        {
            e.build().setAttribute('for','uploadInput');
        }).class("custom-upload");
    rv.multiple = function(arg)
    {
        inpHejl.multiple(arg);
        return this;
    }
    rv.onFiles = function(cb)
    {
        inpHejl.onFiles(cb)
        return this;
    }
    rv.inputHejl = inpHejl;
    rv.processInputHejl = function(cb)
    {
        cb(this.inputHejl)
        return this;
    }
    return rv;
}


window.INPUTFILES = INPUTFILES;

module.exports.hejlDIV = hejlDIV;
module.exports.HejlElement = HejlElement;
module.exports.hejlIFRAME = hejlIFRAME;
},{"./hejl":8,"./validationProtocol":30}],10:[function(require,module,exports){
const i18next = require('i18next');
const i18nextHttpBackend = require('i18next-http-backend');


i18next
    .use(i18nextHttpBackend)
    .init({
        lng: 'cs',

        // allow keys to be phrases having `:`, `.`
        nsSeparator: false,
        keySeparator: false,
      
        // do not load a fallback
        fallbackLng: false,
        ns:['app'],
        defaultNS: 'app',
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json'
        }
    })

window.T = (key,data)=>
{
    return i18next.t(key,data);
}

window.TB = (key)=>
{
    return (data)=>
    {
        return i18next.t(key,data);
    }
}
},{"i18next":26,"i18next-http-backend":23}],11:[function(require,module,exports){
const { HejlElement } = require('./hejlElement');

class HejlLovBase
{
    constructor()
    {
        this.selection = [];
        this.manager = new OptionsManager();
        this.optBinder = {
            show: (it)=>it,
            key: (it)=>it
        }
        this.slaves = []
    }
    /**
     * marks the lov as multiselect
     * @param {boolean} isMultiselect true if this is mutiselect lov 
     */
    multiselect(isMultiselect)
    {
        this.isMultiselect = isMultiselect;
        return this;
    }
    
    attach(hejlElement)
    {
        hejlElement.lov = this;
        this.hejlElement =hejlElement;
        hejlElement.opts = this.options.bind(this);
        hejlElement.optionBinder = this.optionBinder.bind(this);
        hejlElement.optionsManager = this.optionsManager.bind(this);
        hejlElement.checkFilled = this.checkFilled.bind(this);
        this.elbinder = hejlElement.binder;
        hejlElement.binder = this.binder.bind(this);
    }
    binder(cb)
    {
        this.elbinder.bind(this.hejlElement)(cb);
        var obinder = this.hejlElement.bindFunc;
        this.hejlElement.bindFunc = (model,el)=>
        {
            var v  = obinder.bind(this)(model,el);
            if(!Array.isArray(v))
                v = [v];

            this.selection = [];
            this.selMap = {};
            v.forEach(vi=>
                {
                    var s = this.manager.optionForKey(vi);
                    if(s != null)
                    {
                        this.selection.push(s);
                        this.selMap[vi] = s;
                    }
                })
                return v;
        }
        return this.hejlElement;
    }
    checkFilled()
    {
        return this.selection.length > 0;
    }
    options(optionsCb)
    {
        this.optionsCb = optionsCb;
        this.manager.optionsCallback(optionsCb);
        return this.hejlElement;
    }
    optionBinder(optionsBinder)
    {
        this.optBinder = optionsBinder;
        this.manager.optionBinder(optionsBinder);
        return this.hejlElement;
    }
    optionsManager(manager)
    {
        this.manager = manager;
    }

    show(it)
    {
        return this.optBinder.show(it);
    }
    listOptions()
    {
        return this.manager.listOptions();
    }
    isSelected(it)
    {
        var key = this.optBinder.key(it);
        var rv = this.selMap[key] != null;
    
        return rv;
    }
    addSlave(otherLov)
    {
        this.slaves.push(otherLov);
    }
    masterChanged(masterLov)
    {
        this.manager.reset(masterLov.selection);
        this.hejlElement.rebind();
    }
    select(it,state)
    {
        if(state === undefined)
            state = true;
     
        
        var key = this.optBinder.key(it);
        if(!this.isMultiselect)
        {
            this.selection = [it]; // single value select
            this.selMap = {};
            this.selMap[key] = it;
            this.hejlElement.update(key );
        }
        else
        {
            if(state && this.selMap[key] != null)
                return;
            if(!state && this.selMap[key] == null)
                return;

            if(!state)
            {
                delete this.selMap[key];
                var idx = this.selection.indexOf(it);
                this.selection = this.selection.splice(idx,1);
            }
            else
            {
                this.selMap[key] = it;
                this.selection.push(it);
            }
           var rv = []
            for(var k in this.selMap)
            {
                rv.push(k);
            }    
            this.hejlElement.update(rv);
        }
       
        this.slaves.forEach(dep=>dep.masterChanged(this))
        this.hejlElement.rebind();
        this.hejlElement.checkErrorHiglight();
    }
   
    forSelectedValue(cb)
    {
        this.selection.forEach(cb);
    }

}

class OptionsManager
{

    optionBinder(binder)
    {
        this.optionBinder = binder;
    }
    optionsCallback(optionsCb)
    {
        this.optionsCb = optionsCb;
    }
    optionForKey(key)
    {
        if(!this.optionsMap)
        {
            this.optionsMap = {}
            var list = this.listOptions();
            list.forEach(opt=>
                {
                    this.optionsMap[this.optionBinder.key(opt)] = opt;
                })
        }
        var rv = this.optionsMap[key];
        return rv;
    }

    listOptions()
    {
        if(!this.optionsList)
            this.optionsList = this.optionsCb(this);
           
        return this.optionsList;
    }

    reset(masterSelection)
    {
        this.masterSelection = masterSelection;
        this.optionsMap = null;
        this.optionsList = null;
    }
}

module.exports.HejlLovBase = HejlLovBase;
module.exports.OptionsManager = OptionsManager;
},{"./hejlElement":9}],12:[function(require,module,exports){
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

module.exports = _assertThisInitialized;
},{}],13:[function(require,module,exports){
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;
},{}],14:[function(require,module,exports){
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

module.exports = _createClass;
},{}],15:[function(require,module,exports){
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

module.exports = _defineProperty;
},{}],16:[function(require,module,exports){
function _getPrototypeOf(o) {
  module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

module.exports = _getPrototypeOf;
},{}],17:[function(require,module,exports){
var setPrototypeOf = require("./setPrototypeOf");

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) setPrototypeOf(subClass, superClass);
}

module.exports = _inherits;
},{"./setPrototypeOf":20}],18:[function(require,module,exports){
var defineProperty = require("./defineProperty");

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? Object(arguments[i]) : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      defineProperty(target, key, source[key]);
    });
  }

  return target;
}

module.exports = _objectSpread;
},{"./defineProperty":15}],19:[function(require,module,exports){
var _typeof = require("@babel/runtime/helpers/typeof");

var assertThisInitialized = require("./assertThisInitialized");

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return assertThisInitialized(self);
}

module.exports = _possibleConstructorReturn;
},{"./assertThisInitialized":12,"@babel/runtime/helpers/typeof":21}],20:[function(require,module,exports){
function _setPrototypeOf(o, p) {
  module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

module.exports = _setPrototypeOf;
},{}],21:[function(require,module,exports){
function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;
},{}],22:[function(require,module,exports){
(function (global){
var fetchApi
if (typeof fetch === 'function') {
  if (typeof global !== 'undefined' && global.fetch) {
    fetchApi = global.fetch
  } else if (typeof window !== 'undefined' && window.fetch) {
    fetchApi = window.fetch
  }
}

if (typeof require !== 'undefined' && (typeof window === 'undefined' || typeof window.document === 'undefined')) {
  var f = fetchApi || require('node-fetch')
  if (f.default) f = f.default
  exports.default = f
  module.exports = exports.default
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"node-fetch":27}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _utils = require("./utils.js");

var _request = _interopRequireDefault(require("./request.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var getDefaults = function getDefaults() {
  return {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/add/{{lng}}/{{ns}}',
    allowMultiLoading: false,
    parse: function parse(data) {
      return JSON.parse(data);
    },
    stringify: JSON.stringify,
    parsePayload: function parsePayload(namespace, key, fallbackValue) {
      return _defineProperty({}, key, fallbackValue || '');
    },
    request: _request.default,
    reloadInterval: typeof window !== 'undefined' ? false : 60 * 60 * 1000,
    customHeaders: {},
    queryStringParams: {},
    crossDomain: false,
    withCredentials: false,
    overrideMimeType: false,
    requestOptions: {
      mode: 'cors',
      credentials: 'same-origin',
      cache: 'default'
    }
  };
};

var Backend = function () {
  function Backend(services) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var allOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, Backend);

    this.services = services;
    this.options = options;
    this.allOptions = allOptions;
    this.type = 'backend';
    this.init(services, options, allOptions);
  }

  _createClass(Backend, [{
    key: "init",
    value: function init(services) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var allOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      this.services = services;
      this.options = (0, _utils.defaults)(options, this.options || {}, getDefaults());
      this.allOptions = allOptions;

      if (this.options.reloadInterval) {
        setInterval(function () {
          return _this.reload();
        }, this.options.reloadInterval);
      }
    }
  }, {
    key: "readMulti",
    value: function readMulti(languages, namespaces, callback) {
      var loadPath = this.options.loadPath;

      if (typeof this.options.loadPath === 'function') {
        loadPath = this.options.loadPath(languages, namespaces);
      }

      var url = this.services.interpolator.interpolate(loadPath, {
        lng: languages.join('+'),
        ns: namespaces.join('+')
      });
      this.loadUrl(url, callback, languages, namespaces);
    }
  }, {
    key: "read",
    value: function read(language, namespace, callback) {
      var loadPath = this.options.loadPath;

      if (typeof this.options.loadPath === 'function') {
        loadPath = this.options.loadPath([language], [namespace]);
      }

      var url = this.services.interpolator.interpolate(loadPath, {
        lng: language,
        ns: namespace
      });
      this.loadUrl(url, callback, language, namespace);
    }
  }, {
    key: "loadUrl",
    value: function loadUrl(url, callback, languages, namespaces) {
      var _this2 = this;

      this.options.request(this.options, url, undefined, function (err, res) {
        if (res && (res.status >= 500 && res.status < 600 || !res.status)) return callback('failed loading ' + url, true);
        if (res && res.status >= 400 && res.status < 500) return callback('failed loading ' + url, false);
        if (!res && err && err.message && err.message.indexOf('Failed to fetch') > -1) return callback('failed loading ' + url, true);
        if (err) return callback(err, false);
        var ret, parseErr;

        try {
          if (typeof res.data === 'string') {
            ret = _this2.options.parse(res.data, languages, namespaces);
          } else {
            ret = res.data;
          }
        } catch (e) {
          parseErr = 'failed parsing ' + url + ' to json';
        }

        if (parseErr) return callback(parseErr, false);
        callback(null, ret);
      });
    }
  }, {
    key: "create",
    value: function create(languages, namespace, key, fallbackValue) {
      var _this3 = this;

      if (!this.options.addPath) return;
      if (typeof languages === 'string') languages = [languages];
      var payload = this.options.parsePayload(namespace, key, fallbackValue);
      languages.forEach(function (lng) {
        var url = _this3.services.interpolator.interpolate(_this3.options.addPath, {
          lng: lng,
          ns: namespace
        });

        _this3.options.request(_this3.options, url, payload, function (data, res) {});
      });
    }
  }, {
    key: "reload",
    value: function reload() {
      var _this4 = this;

      var _this$services = this.services,
          backendConnector = _this$services.backendConnector,
          languageUtils = _this$services.languageUtils,
          logger = _this$services.logger;
      var currentLanguage = backendConnector.language;
      if (currentLanguage && currentLanguage.toLowerCase() === 'cimode') return;
      var toLoad = [];

      var append = function append(lng) {
        var lngs = languageUtils.toResolveHierarchy(lng);
        lngs.forEach(function (l) {
          if (toLoad.indexOf(l) < 0) toLoad.push(l);
        });
      };

      append(currentLanguage);
      if (this.allOptions.preload) this.allOptions.preload.forEach(function (l) {
        return append(l);
      });
      toLoad.forEach(function (lng) {
        _this4.allOptions.ns.forEach(function (ns) {
          backendConnector.read(lng, ns, 'read', null, null, function (err, data) {
            if (err) logger.warn("loading namespace ".concat(ns, " for language ").concat(lng, " failed"), err);
            if (!err && data) logger.log("loaded namespace ".concat(ns, " for language ").concat(lng), data);
            backendConnector.loaded("".concat(lng, "|").concat(ns), err, data);
          });
        });
      });
    }
  }]);

  return Backend;
}();

Backend.type = 'backend';
var _default = Backend;
exports.default = _default;
module.exports = exports.default;
},{"./request.js":24,"./utils.js":25}],24:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _utils = require("./utils.js");

var fetchNode = _interopRequireWildcard(require("./getFetch.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var fetchApi;

if (typeof fetch === 'function') {
  if (typeof global !== 'undefined' && global.fetch) {
    fetchApi = global.fetch;
  } else if (typeof window !== 'undefined' && window.fetch) {
    fetchApi = window.fetch;
  }
}

var XmlHttpRequestApi;

if (typeof XMLHttpRequest === 'function') {
  if (typeof global !== 'undefined' && global.XMLHttpRequest) {
    XmlHttpRequestApi = global.XMLHttpRequest;
  } else if (typeof window !== 'undefined' && window.XMLHttpRequest) {
    XmlHttpRequestApi = window.XMLHttpRequest;
  }
}

var ActiveXObjectApi;

if (typeof ActiveXObject === 'function') {
  if (typeof global !== 'undefined' && global.ActiveXObject) {
    ActiveXObjectApi = global.ActiveXObject;
  } else if (typeof window !== 'undefined' && window.ActiveXObject) {
    ActiveXObjectApi = window.ActiveXObject;
  }
}

if (!fetchApi && fetchNode && !XmlHttpRequestApi && !ActiveXObjectApi) fetchApi = fetchNode.default || fetchNode;
if (typeof fetchApi !== 'function') fetchApi = undefined;

var addQueryString = function addQueryString(url, params) {
  if (params && _typeof(params) === 'object') {
    var queryString = '';

    for (var paramName in params) {
      queryString += '&' + encodeURIComponent(paramName) + '=' + encodeURIComponent(params[paramName]);
    }

    if (!queryString) return url;
    url = url + (url.indexOf('?') !== -1 ? '&' : '?') + queryString.slice(1);
  }

  return url;
};

var requestWithFetch = function requestWithFetch(options, url, payload, callback) {
  if (options.queryStringParams) {
    url = addQueryString(url, options.queryStringParams);
  }

  var headers = (0, _utils.defaults)({}, typeof options.customHeaders === 'function' ? options.customHeaders() : options.customHeaders);
  if (payload) headers['Content-Type'] = 'application/json';
  fetchApi(url, (0, _utils.defaults)({
    method: payload ? 'POST' : 'GET',
    body: payload ? options.stringify(payload) : undefined,
    headers: headers
  }, typeof options.requestOptions === 'function' ? options.requestOptions(payload) : options.requestOptions)).then(function (response) {
    if (!response.ok) return callback(response.statusText || 'Error', {
      status: response.status
    });
    response.text().then(function (data) {
      callback(null, {
        status: response.status,
        data: data
      });
    }).catch(callback);
  }).catch(callback);
};

var requestWithXmlHttpRequest = function requestWithXmlHttpRequest(options, url, payload, callback) {
  if (payload && _typeof(payload) === 'object') {
    payload = addQueryString('', payload).slice(1);
  }

  if (options.queryStringParams) {
    url = addQueryString(url, options.queryStringParams);
  }

  try {
    var x;

    if (XmlHttpRequestApi) {
      x = new XmlHttpRequestApi();
    } else {
      x = new ActiveXObjectApi('MSXML2.XMLHTTP.3.0');
    }

    x.open(payload ? 'POST' : 'GET', url, 1);

    if (!options.crossDomain) {
      x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }

    x.withCredentials = !!options.withCredentials;

    if (payload) {
      x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }

    if (x.overrideMimeType) {
      x.overrideMimeType('application/json');
    }

    var h = options.customHeaders;
    h = typeof h === 'function' ? h() : h;

    if (h) {
      for (var i in h) {
        x.setRequestHeader(i, h[i]);
      }
    }

    x.onreadystatechange = function () {
      x.readyState > 3 && callback(x.status >= 400 ? x.statusText : null, {
        status: x.status,
        data: x.responseText
      });
    };

    x.send(payload);
  } catch (e) {
    console && console.log(e);
  }
};

var request = function request(options, url, payload, callback) {
  if (typeof payload === 'function') {
    callback = payload;
    payload = undefined;
  }

  callback = callback || function () {};

  if (fetchApi) {
    return requestWithFetch(options, url, payload, callback);
  }

  if (typeof XMLHttpRequest === 'function' || typeof ActiveXObject === 'function') {
    return requestWithXmlHttpRequest(options, url, payload, callback);
  }
};

var _default = request;
exports.default = _default;
module.exports = exports.default;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./getFetch.js":22,"./utils.js":25}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaults = defaults;
var arr = [];
var each = arr.forEach;
var slice = arr.slice;

function defaults(obj) {
  each.call(slice.call(arguments, 1), function (source) {
    if (source) {
      for (var prop in source) {
        if (obj[prop] === undefined) obj[prop] = source[prop];
      }
    }
  });
  return obj;
}
},{}],26:[function(require,module,exports){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _typeof = _interopDefault(require('@babel/runtime/helpers/typeof'));
var _objectSpread = _interopDefault(require('@babel/runtime/helpers/objectSpread'));
var _classCallCheck = _interopDefault(require('@babel/runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('@babel/runtime/helpers/createClass'));
var _possibleConstructorReturn = _interopDefault(require('@babel/runtime/helpers/possibleConstructorReturn'));
var _getPrototypeOf = _interopDefault(require('@babel/runtime/helpers/getPrototypeOf'));
var _assertThisInitialized = _interopDefault(require('@babel/runtime/helpers/assertThisInitialized'));
var _inherits = _interopDefault(require('@babel/runtime/helpers/inherits'));

var consoleLogger = {
  type: 'logger',
  log: function log(args) {
    this.output('log', args);
  },
  warn: function warn(args) {
    this.output('warn', args);
  },
  error: function error(args) {
    this.output('error', args);
  },
  output: function output(type, args) {
    if (console && console[type]) console[type].apply(console, args);
  }
};

var Logger = function () {
  function Logger(concreteLogger) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Logger);

    this.init(concreteLogger, options);
  }

  _createClass(Logger, [{
    key: "init",
    value: function init(concreteLogger) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      this.prefix = options.prefix || 'i18next:';
      this.logger = concreteLogger || consoleLogger;
      this.options = options;
      this.debug = options.debug;
    }
  }, {
    key: "setDebug",
    value: function setDebug(bool) {
      this.debug = bool;
    }
  }, {
    key: "log",
    value: function log() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return this.forward(args, 'log', '', true);
    }
  }, {
    key: "warn",
    value: function warn() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return this.forward(args, 'warn', '', true);
    }
  }, {
    key: "error",
    value: function error() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return this.forward(args, 'error', '');
    }
  }, {
    key: "deprecate",
    value: function deprecate() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return this.forward(args, 'warn', 'WARNING DEPRECATED: ', true);
    }
  }, {
    key: "forward",
    value: function forward(args, lvl, prefix, debugOnly) {
      if (debugOnly && !this.debug) return null;
      if (typeof args[0] === 'string') args[0] = "".concat(prefix).concat(this.prefix, " ").concat(args[0]);
      return this.logger[lvl](args);
    }
  }, {
    key: "create",
    value: function create(moduleName) {
      return new Logger(this.logger, _objectSpread({}, {
        prefix: "".concat(this.prefix, ":").concat(moduleName, ":")
      }, this.options));
    }
  }]);

  return Logger;
}();

var baseLogger = new Logger();

var EventEmitter = function () {
  function EventEmitter() {
    _classCallCheck(this, EventEmitter);

    this.observers = {};
  }

  _createClass(EventEmitter, [{
    key: "on",
    value: function on(events, listener) {
      var _this = this;

      events.split(' ').forEach(function (event) {
        _this.observers[event] = _this.observers[event] || [];

        _this.observers[event].push(listener);
      });
      return this;
    }
  }, {
    key: "off",
    value: function off(event, listener) {
      if (!this.observers[event]) return;

      if (!listener) {
        delete this.observers[event];
        return;
      }

      this.observers[event] = this.observers[event].filter(function (l) {
        return l !== listener;
      });
    }
  }, {
    key: "emit",
    value: function emit(event) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (this.observers[event]) {
        var cloned = [].concat(this.observers[event]);
        cloned.forEach(function (observer) {
          observer.apply(void 0, args);
        });
      }

      if (this.observers['*']) {
        var _cloned = [].concat(this.observers['*']);

        _cloned.forEach(function (observer) {
          observer.apply(observer, [event].concat(args));
        });
      }
    }
  }]);

  return EventEmitter;
}();

function defer() {
  var res;
  var rej;
  var promise = new Promise(function (resolve, reject) {
    res = resolve;
    rej = reject;
  });
  promise.resolve = res;
  promise.reject = rej;
  return promise;
}
function makeString(object) {
  if (object == null) return '';
  return '' + object;
}
function copy(a, s, t) {
  a.forEach(function (m) {
    if (s[m]) t[m] = s[m];
  });
}

function getLastOfPath(object, path, Empty) {
  function cleanKey(key) {
    return key && key.indexOf('###') > -1 ? key.replace(/###/g, '.') : key;
  }

  function canNotTraverseDeeper() {
    return !object || typeof object === 'string';
  }

  var stack = typeof path !== 'string' ? [].concat(path) : path.split('.');

  while (stack.length > 1) {
    if (canNotTraverseDeeper()) return {};
    var key = cleanKey(stack.shift());
    if (!object[key] && Empty) object[key] = new Empty();
    object = object[key];
  }

  if (canNotTraverseDeeper()) return {};
  return {
    obj: object,
    k: cleanKey(stack.shift())
  };
}

function setPath(object, path, newValue) {
  var _getLastOfPath = getLastOfPath(object, path, Object),
      obj = _getLastOfPath.obj,
      k = _getLastOfPath.k;

  obj[k] = newValue;
}
function pushPath(object, path, newValue, concat) {
  var _getLastOfPath2 = getLastOfPath(object, path, Object),
      obj = _getLastOfPath2.obj,
      k = _getLastOfPath2.k;

  obj[k] = obj[k] || [];
  if (concat) obj[k] = obj[k].concat(newValue);
  if (!concat) obj[k].push(newValue);
}
function getPath(object, path) {
  var _getLastOfPath3 = getLastOfPath(object, path),
      obj = _getLastOfPath3.obj,
      k = _getLastOfPath3.k;

  if (!obj) return undefined;
  return obj[k];
}
function getPathWithDefaults(data, defaultData, key) {
  var value = getPath(data, key);

  if (value !== undefined) {
    return value;
  }

  return getPath(defaultData, key);
}
function deepExtend(target, source, overwrite) {
  for (var prop in source) {
    if (prop !== '__proto__' && prop !== 'constructor') {
      if (prop in target) {
        if (typeof target[prop] === 'string' || target[prop] instanceof String || typeof source[prop] === 'string' || source[prop] instanceof String) {
          if (overwrite) target[prop] = source[prop];
        } else {
          deepExtend(target[prop], source[prop], overwrite);
        }
      } else {
        target[prop] = source[prop];
      }
    }
  }

  return target;
}
function regexEscape(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
var _entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;'
};
function escape(data) {
  if (typeof data === 'string') {
    return data.replace(/[&<>"'\/]/g, function (s) {
      return _entityMap[s];
    });
  }

  return data;
}
var isIE10 = typeof window !== 'undefined' && window.navigator && window.navigator.userAgent && window.navigator.userAgent.indexOf('MSIE') > -1;

var ResourceStore = function (_EventEmitter) {
  _inherits(ResourceStore, _EventEmitter);

  function ResourceStore(data) {
    var _this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      ns: ['translation'],
      defaultNS: 'translation'
    };

    _classCallCheck(this, ResourceStore);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ResourceStore).call(this));

    if (isIE10) {
      EventEmitter.call(_assertThisInitialized(_this));
    }

    _this.data = data || {};
    _this.options = options;

    if (_this.options.keySeparator === undefined) {
      _this.options.keySeparator = '.';
    }

    return _this;
  }

  _createClass(ResourceStore, [{
    key: "addNamespaces",
    value: function addNamespaces(ns) {
      if (this.options.ns.indexOf(ns) < 0) {
        this.options.ns.push(ns);
      }
    }
  }, {
    key: "removeNamespaces",
    value: function removeNamespaces(ns) {
      var index = this.options.ns.indexOf(ns);

      if (index > -1) {
        this.options.ns.splice(index, 1);
      }
    }
  }, {
    key: "getResource",
    value: function getResource(lng, ns, key) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator;
      var path = [lng, ns];
      if (key && typeof key !== 'string') path = path.concat(key);
      if (key && typeof key === 'string') path = path.concat(keySeparator ? key.split(keySeparator) : key);

      if (lng.indexOf('.') > -1) {
        path = lng.split('.');
      }

      return getPath(this.data, path);
    }
  }, {
    key: "addResource",
    value: function addResource(lng, ns, key, value) {
      var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {
        silent: false
      };
      var keySeparator = this.options.keySeparator;
      if (keySeparator === undefined) keySeparator = '.';
      var path = [lng, ns];
      if (key) path = path.concat(keySeparator ? key.split(keySeparator) : key);

      if (lng.indexOf('.') > -1) {
        path = lng.split('.');
        value = ns;
        ns = path[1];
      }

      this.addNamespaces(ns);
      setPath(this.data, path, value);
      if (!options.silent) this.emit('added', lng, ns, key, value);
    }
  }, {
    key: "addResources",
    value: function addResources(lng, ns, resources) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
        silent: false
      };

      for (var m in resources) {
        if (typeof resources[m] === 'string' || Object.prototype.toString.apply(resources[m]) === '[object Array]') this.addResource(lng, ns, m, resources[m], {
          silent: true
        });
      }

      if (!options.silent) this.emit('added', lng, ns, resources);
    }
  }, {
    key: "addResourceBundle",
    value: function addResourceBundle(lng, ns, resources, deep, overwrite) {
      var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {
        silent: false
      };
      var path = [lng, ns];

      if (lng.indexOf('.') > -1) {
        path = lng.split('.');
        deep = resources;
        resources = ns;
        ns = path[1];
      }

      this.addNamespaces(ns);
      var pack = getPath(this.data, path) || {};

      if (deep) {
        deepExtend(pack, resources, overwrite);
      } else {
        pack = _objectSpread({}, pack, resources);
      }

      setPath(this.data, path, pack);
      if (!options.silent) this.emit('added', lng, ns, resources);
    }
  }, {
    key: "removeResourceBundle",
    value: function removeResourceBundle(lng, ns) {
      if (this.hasResourceBundle(lng, ns)) {
        delete this.data[lng][ns];
      }

      this.removeNamespaces(ns);
      this.emit('removed', lng, ns);
    }
  }, {
    key: "hasResourceBundle",
    value: function hasResourceBundle(lng, ns) {
      return this.getResource(lng, ns) !== undefined;
    }
  }, {
    key: "getResourceBundle",
    value: function getResourceBundle(lng, ns) {
      if (!ns) ns = this.options.defaultNS;
      if (this.options.compatibilityAPI === 'v1') return _objectSpread({}, {}, this.getResource(lng, ns));
      return this.getResource(lng, ns);
    }
  }, {
    key: "getDataByLanguage",
    value: function getDataByLanguage(lng) {
      return this.data[lng];
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.data;
    }
  }]);

  return ResourceStore;
}(EventEmitter);

var postProcessor = {
  processors: {},
  addPostProcessor: function addPostProcessor(module) {
    this.processors[module.name] = module;
  },
  handle: function handle(processors, value, key, options, translator) {
    var _this = this;

    processors.forEach(function (processor) {
      if (_this.processors[processor]) value = _this.processors[processor].process(value, key, options, translator);
    });
    return value;
  }
};

var checkedLoadedFor = {};

var Translator = function (_EventEmitter) {
  _inherits(Translator, _EventEmitter);

  function Translator(services) {
    var _this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Translator);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Translator).call(this));

    if (isIE10) {
      EventEmitter.call(_assertThisInitialized(_this));
    }

    copy(['resourceStore', 'languageUtils', 'pluralResolver', 'interpolator', 'backendConnector', 'i18nFormat', 'utils'], services, _assertThisInitialized(_this));
    _this.options = options;

    if (_this.options.keySeparator === undefined) {
      _this.options.keySeparator = '.';
    }

    _this.logger = baseLogger.create('translator');
    return _this;
  }

  _createClass(Translator, [{
    key: "changeLanguage",
    value: function changeLanguage(lng) {
      if (lng) this.language = lng;
    }
  }, {
    key: "exists",
    value: function exists(key) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        interpolation: {}
      };
      var resolved = this.resolve(key, options);
      return resolved && resolved.res !== undefined;
    }
  }, {
    key: "extractFromKey",
    value: function extractFromKey(key, options) {
      var nsSeparator = options.nsSeparator !== undefined ? options.nsSeparator : this.options.nsSeparator;
      if (nsSeparator === undefined) nsSeparator = ':';
      var keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator;
      var namespaces = options.ns || this.options.defaultNS;

      if (nsSeparator && key.indexOf(nsSeparator) > -1) {
        var m = key.match(this.interpolator.nestingRegexp);

        if (m && m.length > 0) {
          return {
            key: key,
            namespaces: namespaces
          };
        }

        var parts = key.split(nsSeparator);
        if (nsSeparator !== keySeparator || nsSeparator === keySeparator && this.options.ns.indexOf(parts[0]) > -1) namespaces = parts.shift();
        key = parts.join(keySeparator);
      }

      if (typeof namespaces === 'string') namespaces = [namespaces];
      return {
        key: key,
        namespaces: namespaces
      };
    }
  }, {
    key: "translate",
    value: function translate(keys, options, lastKey) {
      var _this2 = this;

      if (_typeof(options) !== 'object' && this.options.overloadTranslationOptionHandler) {
        options = this.options.overloadTranslationOptionHandler(arguments);
      }

      if (!options) options = {};
      if (keys === undefined || keys === null) return '';
      if (!Array.isArray(keys)) keys = [String(keys)];
      var keySeparator = options.keySeparator !== undefined ? options.keySeparator : this.options.keySeparator;

      var _this$extractFromKey = this.extractFromKey(keys[keys.length - 1], options),
          key = _this$extractFromKey.key,
          namespaces = _this$extractFromKey.namespaces;

      var namespace = namespaces[namespaces.length - 1];
      var lng = options.lng || this.language;
      var appendNamespaceToCIMode = options.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;

      if (lng && lng.toLowerCase() === 'cimode') {
        if (appendNamespaceToCIMode) {
          var nsSeparator = options.nsSeparator || this.options.nsSeparator;
          return namespace + nsSeparator + key;
        }

        return key;
      }

      var resolved = this.resolve(keys, options);
      var res = resolved && resolved.res;
      var resUsedKey = resolved && resolved.usedKey || key;
      var resExactUsedKey = resolved && resolved.exactUsedKey || key;
      var resType = Object.prototype.toString.apply(res);
      var noObject = ['[object Number]', '[object Function]', '[object RegExp]'];
      var joinArrays = options.joinArrays !== undefined ? options.joinArrays : this.options.joinArrays;
      var handleAsObjectInI18nFormat = !this.i18nFormat || this.i18nFormat.handleAsObject;
      var handleAsObject = typeof res !== 'string' && typeof res !== 'boolean' && typeof res !== 'number';

      if (handleAsObjectInI18nFormat && res && handleAsObject && noObject.indexOf(resType) < 0 && !(typeof joinArrays === 'string' && resType === '[object Array]')) {
        if (!options.returnObjects && !this.options.returnObjects) {
          this.logger.warn('accessing an object - but returnObjects options is not enabled!');
          return this.options.returnedObjectHandler ? this.options.returnedObjectHandler(resUsedKey, res, options) : "key '".concat(key, " (").concat(this.language, ")' returned an object instead of string.");
        }

        if (keySeparator) {
          var resTypeIsArray = resType === '[object Array]';
          var copy$$1 = resTypeIsArray ? [] : {};
          var newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey;

          for (var m in res) {
            if (Object.prototype.hasOwnProperty.call(res, m)) {
              var deepKey = "".concat(newKeyToUse).concat(keySeparator).concat(m);
              copy$$1[m] = this.translate(deepKey, _objectSpread({}, options, {
                joinArrays: false,
                ns: namespaces
              }));
              if (copy$$1[m] === deepKey) copy$$1[m] = res[m];
            }
          }

          res = copy$$1;
        }
      } else if (handleAsObjectInI18nFormat && typeof joinArrays === 'string' && resType === '[object Array]') {
        res = res.join(joinArrays);
        if (res) res = this.extendTranslation(res, keys, options, lastKey);
      } else {
        var usedDefault = false;
        var usedKey = false;

        if (!this.isValidLookup(res) && options.defaultValue !== undefined) {
          usedDefault = true;

          if (options.count !== undefined) {
            var suffix = this.pluralResolver.getSuffix(lng, options.count);
            res = options["defaultValue".concat(suffix)];
          }

          if (!res) res = options.defaultValue;
        }

        if (!this.isValidLookup(res)) {
          usedKey = true;
          res = key;
        }

        var updateMissing = options.defaultValue && options.defaultValue !== res && this.options.updateMissing;

        if (usedKey || usedDefault || updateMissing) {
          this.logger.log(updateMissing ? 'updateKey' : 'missingKey', lng, namespace, key, updateMissing ? options.defaultValue : res);

          if (keySeparator) {
            var fk = this.resolve(key, _objectSpread({}, options, {
              keySeparator: false
            }));
            if (fk && fk.res) this.logger.warn('Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.');
          }

          var lngs = [];
          var fallbackLngs = this.languageUtils.getFallbackCodes(this.options.fallbackLng, options.lng || this.language);

          if (this.options.saveMissingTo === 'fallback' && fallbackLngs && fallbackLngs[0]) {
            for (var i = 0; i < fallbackLngs.length; i++) {
              lngs.push(fallbackLngs[i]);
            }
          } else if (this.options.saveMissingTo === 'all') {
            lngs = this.languageUtils.toResolveHierarchy(options.lng || this.language);
          } else {
            lngs.push(options.lng || this.language);
          }

          var send = function send(l, k) {
            if (_this2.options.missingKeyHandler) {
              _this2.options.missingKeyHandler(l, namespace, k, updateMissing ? options.defaultValue : res, updateMissing, options);
            } else if (_this2.backendConnector && _this2.backendConnector.saveMissing) {
              _this2.backendConnector.saveMissing(l, namespace, k, updateMissing ? options.defaultValue : res, updateMissing, options);
            }

            _this2.emit('missingKey', l, namespace, k, res);
          };

          if (this.options.saveMissing) {
            var needsPluralHandling = options.count !== undefined && typeof options.count !== 'string';

            if (this.options.saveMissingPlurals && needsPluralHandling) {
              lngs.forEach(function (l) {
                var plurals = _this2.pluralResolver.getPluralFormsOfKey(l, key);

                plurals.forEach(function (p) {
                  return send([l], p);
                });
              });
            } else {
              send(lngs, key);
            }
          }
        }

        res = this.extendTranslation(res, keys, options, resolved, lastKey);
        if (usedKey && res === key && this.options.appendNamespaceToMissingKey) res = "".concat(namespace, ":").concat(key);
        if (usedKey && this.options.parseMissingKeyHandler) res = this.options.parseMissingKeyHandler(res);
      }

      return res;
    }
  }, {
    key: "extendTranslation",
    value: function extendTranslation(res, key, options, resolved, lastKey) {
      var _this3 = this;

      if (this.i18nFormat && this.i18nFormat.parse) {
        res = this.i18nFormat.parse(res, options, resolved.usedLng, resolved.usedNS, resolved.usedKey, {
          resolved: resolved
        });
      } else if (!options.skipInterpolation) {
        if (options.interpolation) this.interpolator.init(_objectSpread({}, options, {
          interpolation: _objectSpread({}, this.options.interpolation, options.interpolation)
        }));
        var skipOnVariables = options.interpolation && options.interpolation.skipOnVariables || this.options.interpolation.skipOnVariables;
        var nestBef;

        if (skipOnVariables) {
          var nb = res.match(this.interpolator.nestingRegexp);
          nestBef = nb && nb.length;
        }

        var data = options.replace && typeof options.replace !== 'string' ? options.replace : options;
        if (this.options.interpolation.defaultVariables) data = _objectSpread({}, this.options.interpolation.defaultVariables, data);
        res = this.interpolator.interpolate(res, data, options.lng || this.language, options);

        if (skipOnVariables) {
          var na = res.match(this.interpolator.nestingRegexp);
          var nestAft = na && na.length;
          if (nestBef < nestAft) options.nest = false;
        }

        if (options.nest !== false) res = this.interpolator.nest(res, function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          if (lastKey && lastKey[0] === args[0] && !options.context) {
            _this3.logger.warn("It seems you are nesting recursively key: ".concat(args[0], " in key: ").concat(key[0]));

            return null;
          }

          return _this3.translate.apply(_this3, args.concat([key]));
        }, options);
        if (options.interpolation) this.interpolator.reset();
      }

      var postProcess = options.postProcess || this.options.postProcess;
      var postProcessorNames = typeof postProcess === 'string' ? [postProcess] : postProcess;

      if (res !== undefined && res !== null && postProcessorNames && postProcessorNames.length && options.applyPostProcessor !== false) {
        res = postProcessor.handle(postProcessorNames, res, key, this.options && this.options.postProcessPassResolved ? _objectSpread({
          i18nResolved: resolved
        }, options) : options, this);
      }

      return res;
    }
  }, {
    key: "resolve",
    value: function resolve(keys) {
      var _this4 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var found;
      var usedKey;
      var exactUsedKey;
      var usedLng;
      var usedNS;
      if (typeof keys === 'string') keys = [keys];
      keys.forEach(function (k) {
        if (_this4.isValidLookup(found)) return;

        var extracted = _this4.extractFromKey(k, options);

        var key = extracted.key;
        usedKey = key;
        var namespaces = extracted.namespaces;
        if (_this4.options.fallbackNS) namespaces = namespaces.concat(_this4.options.fallbackNS);
        var needsPluralHandling = options.count !== undefined && typeof options.count !== 'string';
        var needsContextHandling = options.context !== undefined && typeof options.context === 'string' && options.context !== '';
        var codes = options.lngs ? options.lngs : _this4.languageUtils.toResolveHierarchy(options.lng || _this4.language, options.fallbackLng);
        namespaces.forEach(function (ns) {
          if (_this4.isValidLookup(found)) return;
          usedNS = ns;

          if (!checkedLoadedFor["".concat(codes[0], "-").concat(ns)] && _this4.utils && _this4.utils.hasLoadedNamespace && !_this4.utils.hasLoadedNamespace(usedNS)) {
            checkedLoadedFor["".concat(codes[0], "-").concat(ns)] = true;

            _this4.logger.warn("key \"".concat(usedKey, "\" for languages \"").concat(codes.join(', '), "\" won't get resolved as namespace \"").concat(usedNS, "\" was not yet loaded"), 'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!');
          }

          codes.forEach(function (code) {
            if (_this4.isValidLookup(found)) return;
            usedLng = code;
            var finalKey = key;
            var finalKeys = [finalKey];

            if (_this4.i18nFormat && _this4.i18nFormat.addLookupKeys) {
              _this4.i18nFormat.addLookupKeys(finalKeys, key, code, ns, options);
            } else {
              var pluralSuffix;
              if (needsPluralHandling) pluralSuffix = _this4.pluralResolver.getSuffix(code, options.count);
              if (needsPluralHandling && needsContextHandling) finalKeys.push(finalKey + pluralSuffix);
              if (needsContextHandling) finalKeys.push(finalKey += "".concat(_this4.options.contextSeparator).concat(options.context));
              if (needsPluralHandling) finalKeys.push(finalKey += pluralSuffix);
            }

            var possibleKey;

            while (possibleKey = finalKeys.pop()) {
              if (!_this4.isValidLookup(found)) {
                exactUsedKey = possibleKey;
                found = _this4.getResource(code, ns, possibleKey, options);
              }
            }
          });
        });
      });
      return {
        res: found,
        usedKey: usedKey,
        exactUsedKey: exactUsedKey,
        usedLng: usedLng,
        usedNS: usedNS
      };
    }
  }, {
    key: "isValidLookup",
    value: function isValidLookup(res) {
      return res !== undefined && !(!this.options.returnNull && res === null) && !(!this.options.returnEmptyString && res === '');
    }
  }, {
    key: "getResource",
    value: function getResource(code, ns, key) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      if (this.i18nFormat && this.i18nFormat.getResource) return this.i18nFormat.getResource(code, ns, key, options);
      return this.resourceStore.getResource(code, ns, key, options);
    }
  }]);

  return Translator;
}(EventEmitter);

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

var LanguageUtil = function () {
  function LanguageUtil(options) {
    _classCallCheck(this, LanguageUtil);

    this.options = options;
    this.whitelist = this.options.supportedLngs || false;
    this.supportedLngs = this.options.supportedLngs || false;
    this.logger = baseLogger.create('languageUtils');
  }

  _createClass(LanguageUtil, [{
    key: "getScriptPartFromCode",
    value: function getScriptPartFromCode(code) {
      if (!code || code.indexOf('-') < 0) return null;
      var p = code.split('-');
      if (p.length === 2) return null;
      p.pop();
      if (p[p.length - 1].toLowerCase() === 'x') return null;
      return this.formatLanguageCode(p.join('-'));
    }
  }, {
    key: "getLanguagePartFromCode",
    value: function getLanguagePartFromCode(code) {
      if (!code || code.indexOf('-') < 0) return code;
      var p = code.split('-');
      return this.formatLanguageCode(p[0]);
    }
  }, {
    key: "formatLanguageCode",
    value: function formatLanguageCode(code) {
      if (typeof code === 'string' && code.indexOf('-') > -1) {
        var specialCases = ['hans', 'hant', 'latn', 'cyrl', 'cans', 'mong', 'arab'];
        var p = code.split('-');

        if (this.options.lowerCaseLng) {
          p = p.map(function (part) {
            return part.toLowerCase();
          });
        } else if (p.length === 2) {
          p[0] = p[0].toLowerCase();
          p[1] = p[1].toUpperCase();
          if (specialCases.indexOf(p[1].toLowerCase()) > -1) p[1] = capitalize(p[1].toLowerCase());
        } else if (p.length === 3) {
          p[0] = p[0].toLowerCase();
          if (p[1].length === 2) p[1] = p[1].toUpperCase();
          if (p[0] !== 'sgn' && p[2].length === 2) p[2] = p[2].toUpperCase();
          if (specialCases.indexOf(p[1].toLowerCase()) > -1) p[1] = capitalize(p[1].toLowerCase());
          if (specialCases.indexOf(p[2].toLowerCase()) > -1) p[2] = capitalize(p[2].toLowerCase());
        }

        return p.join('-');
      }

      return this.options.cleanCode || this.options.lowerCaseLng ? code.toLowerCase() : code;
    }
  }, {
    key: "isWhitelisted",
    value: function isWhitelisted(code) {
      this.logger.deprecate('languageUtils.isWhitelisted', 'function "isWhitelisted" will be renamed to "isSupportedCode" in the next major - please make sure to rename it\'s usage asap.');
      return this.isSupportedCode(code);
    }
  }, {
    key: "isSupportedCode",
    value: function isSupportedCode(code) {
      if (this.options.load === 'languageOnly' || this.options.nonExplicitSupportedLngs) {
        code = this.getLanguagePartFromCode(code);
      }

      return !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(code) > -1;
    }
  }, {
    key: "getBestMatchFromCodes",
    value: function getBestMatchFromCodes(codes) {
      var _this = this;

      if (!codes) return null;
      var found;
      codes.forEach(function (code) {
        if (found) return;

        var cleanedLng = _this.formatLanguageCode(code);

        if (!_this.options.supportedLngs || _this.isSupportedCode(cleanedLng)) found = cleanedLng;
      });

      if (!found && this.options.supportedLngs) {
        codes.forEach(function (code) {
          if (found) return;

          var lngOnly = _this.getLanguagePartFromCode(code);

          if (_this.isSupportedCode(lngOnly)) return found = lngOnly;
          found = _this.options.supportedLngs.find(function (supportedLng) {
            if (supportedLng.indexOf(lngOnly) === 0) return supportedLng;
          });
        });
      }

      if (!found) found = this.getFallbackCodes(this.options.fallbackLng)[0];
      return found;
    }
  }, {
    key: "getFallbackCodes",
    value: function getFallbackCodes(fallbacks, code) {
      if (!fallbacks) return [];
      if (typeof fallbacks === 'function') fallbacks = fallbacks(code);
      if (typeof fallbacks === 'string') fallbacks = [fallbacks];
      if (Object.prototype.toString.apply(fallbacks) === '[object Array]') return fallbacks;
      if (!code) return fallbacks["default"] || [];
      var found = fallbacks[code];
      if (!found) found = fallbacks[this.getScriptPartFromCode(code)];
      if (!found) found = fallbacks[this.formatLanguageCode(code)];
      if (!found) found = fallbacks[this.getLanguagePartFromCode(code)];
      if (!found) found = fallbacks["default"];
      return found || [];
    }
  }, {
    key: "toResolveHierarchy",
    value: function toResolveHierarchy(code, fallbackCode) {
      var _this2 = this;

      var fallbackCodes = this.getFallbackCodes(fallbackCode || this.options.fallbackLng || [], code);
      var codes = [];

      var addCode = function addCode(c) {
        if (!c) return;

        if (_this2.isSupportedCode(c)) {
          codes.push(c);
        } else {
          _this2.logger.warn("rejecting language code not found in supportedLngs: ".concat(c));
        }
      };

      if (typeof code === 'string' && code.indexOf('-') > -1) {
        if (this.options.load !== 'languageOnly') addCode(this.formatLanguageCode(code));
        if (this.options.load !== 'languageOnly' && this.options.load !== 'currentOnly') addCode(this.getScriptPartFromCode(code));
        if (this.options.load !== 'currentOnly') addCode(this.getLanguagePartFromCode(code));
      } else if (typeof code === 'string') {
        addCode(this.formatLanguageCode(code));
      }

      fallbackCodes.forEach(function (fc) {
        if (codes.indexOf(fc) < 0) addCode(_this2.formatLanguageCode(fc));
      });
      return codes;
    }
  }]);

  return LanguageUtil;
}();

var sets = [{
  lngs: ['ach', 'ak', 'am', 'arn', 'br', 'fil', 'gun', 'ln', 'mfe', 'mg', 'mi', 'oc', 'pt', 'pt-BR', 'tg', 'ti', 'tr', 'uz', 'wa'],
  nr: [1, 2],
  fc: 1
}, {
  lngs: ['af', 'an', 'ast', 'az', 'bg', 'bn', 'ca', 'da', 'de', 'dev', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fi', 'fo', 'fur', 'fy', 'gl', 'gu', 'ha', 'hi', 'hu', 'hy', 'ia', 'it', 'kn', 'ku', 'lb', 'mai', 'ml', 'mn', 'mr', 'nah', 'nap', 'nb', 'ne', 'nl', 'nn', 'no', 'nso', 'pa', 'pap', 'pms', 'ps', 'pt-PT', 'rm', 'sco', 'se', 'si', 'so', 'son', 'sq', 'sv', 'sw', 'ta', 'te', 'tk', 'ur', 'yo'],
  nr: [1, 2],
  fc: 2
}, {
  lngs: ['ay', 'bo', 'cgg', 'fa', 'ht', 'id', 'ja', 'jbo', 'ka', 'kk', 'km', 'ko', 'ky', 'lo', 'ms', 'sah', 'su', 'th', 'tt', 'ug', 'vi', 'wo', 'zh'],
  nr: [1],
  fc: 3
}, {
  lngs: ['be', 'bs', 'cnr', 'dz', 'hr', 'ru', 'sr', 'uk'],
  nr: [1, 2, 5],
  fc: 4
}, {
  lngs: ['ar'],
  nr: [0, 1, 2, 3, 11, 100],
  fc: 5
}, {
  lngs: ['cs', 'sk'],
  nr: [1, 2, 5],
  fc: 6
}, {
  lngs: ['csb', 'pl'],
  nr: [1, 2, 5],
  fc: 7
}, {
  lngs: ['cy'],
  nr: [1, 2, 3, 8],
  fc: 8
}, {
  lngs: ['fr'],
  nr: [1, 2],
  fc: 9
}, {
  lngs: ['ga'],
  nr: [1, 2, 3, 7, 11],
  fc: 10
}, {
  lngs: ['gd'],
  nr: [1, 2, 3, 20],
  fc: 11
}, {
  lngs: ['is'],
  nr: [1, 2],
  fc: 12
}, {
  lngs: ['jv'],
  nr: [0, 1],
  fc: 13
}, {
  lngs: ['kw'],
  nr: [1, 2, 3, 4],
  fc: 14
}, {
  lngs: ['lt'],
  nr: [1, 2, 10],
  fc: 15
}, {
  lngs: ['lv'],
  nr: [1, 2, 0],
  fc: 16
}, {
  lngs: ['mk'],
  nr: [1, 2],
  fc: 17
}, {
  lngs: ['mnk'],
  nr: [0, 1, 2],
  fc: 18
}, {
  lngs: ['mt'],
  nr: [1, 2, 11, 20],
  fc: 19
}, {
  lngs: ['or'],
  nr: [2, 1],
  fc: 2
}, {
  lngs: ['ro'],
  nr: [1, 2, 20],
  fc: 20
}, {
  lngs: ['sl'],
  nr: [5, 1, 2, 3],
  fc: 21
}, {
  lngs: ['he', 'iw'],
  nr: [1, 2, 20, 21],
  fc: 22
}];
var _rulesPluralsTypes = {
  1: function _(n) {
    return Number(n > 1);
  },
  2: function _(n) {
    return Number(n != 1);
  },
  3: function _(n) {
    return 0;
  },
  4: function _(n) {
    return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
  },
  5: function _(n) {
    return Number(n == 0 ? 0 : n == 1 ? 1 : n == 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5);
  },
  6: function _(n) {
    return Number(n == 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2);
  },
  7: function _(n) {
    return Number(n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
  },
  8: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : n != 8 && n != 11 ? 2 : 3);
  },
  9: function _(n) {
    return Number(n >= 2);
  },
  10: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : n < 7 ? 2 : n < 11 ? 3 : 4);
  },
  11: function _(n) {
    return Number(n == 1 || n == 11 ? 0 : n == 2 || n == 12 ? 1 : n > 2 && n < 20 ? 2 : 3);
  },
  12: function _(n) {
    return Number(n % 10 != 1 || n % 100 == 11);
  },
  13: function _(n) {
    return Number(n !== 0);
  },
  14: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : n == 3 ? 2 : 3);
  },
  15: function _(n) {
    return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2);
  },
  16: function _(n) {
    return Number(n % 10 == 1 && n % 100 != 11 ? 0 : n !== 0 ? 1 : 2);
  },
  17: function _(n) {
    return Number(n == 1 || n % 10 == 1 && n % 100 != 11 ? 0 : 1);
  },
  18: function _(n) {
    return Number(n == 0 ? 0 : n == 1 ? 1 : 2);
  },
  19: function _(n) {
    return Number(n == 1 ? 0 : n == 0 || n % 100 > 1 && n % 100 < 11 ? 1 : n % 100 > 10 && n % 100 < 20 ? 2 : 3);
  },
  20: function _(n) {
    return Number(n == 1 ? 0 : n == 0 || n % 100 > 0 && n % 100 < 20 ? 1 : 2);
  },
  21: function _(n) {
    return Number(n % 100 == 1 ? 1 : n % 100 == 2 ? 2 : n % 100 == 3 || n % 100 == 4 ? 3 : 0);
  },
  22: function _(n) {
    return Number(n == 1 ? 0 : n == 2 ? 1 : (n < 0 || n > 10) && n % 10 == 0 ? 2 : 3);
  }
};

function createRules() {
  var rules = {};
  sets.forEach(function (set) {
    set.lngs.forEach(function (l) {
      rules[l] = {
        numbers: set.nr,
        plurals: _rulesPluralsTypes[set.fc]
      };
    });
  });
  return rules;
}

var PluralResolver = function () {
  function PluralResolver(languageUtils) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, PluralResolver);

    this.languageUtils = languageUtils;
    this.options = options;
    this.logger = baseLogger.create('pluralResolver');
    this.rules = createRules();
  }

  _createClass(PluralResolver, [{
    key: "addRule",
    value: function addRule(lng, obj) {
      this.rules[lng] = obj;
    }
  }, {
    key: "getRule",
    value: function getRule(code) {
      return this.rules[code] || this.rules[this.languageUtils.getLanguagePartFromCode(code)];
    }
  }, {
    key: "needsPlural",
    value: function needsPlural(code) {
      var rule = this.getRule(code);
      return rule && rule.numbers.length > 1;
    }
  }, {
    key: "getPluralFormsOfKey",
    value: function getPluralFormsOfKey(code, key) {
      var _this = this;

      var ret = [];
      var rule = this.getRule(code);
      if (!rule) return ret;
      rule.numbers.forEach(function (n) {
        var suffix = _this.getSuffix(code, n);

        ret.push("".concat(key).concat(suffix));
      });
      return ret;
    }
  }, {
    key: "getSuffix",
    value: function getSuffix(code, count) {
      var _this2 = this;

      var rule = this.getRule(code);

      if (rule) {
        var idx = rule.noAbs ? rule.plurals(count) : rule.plurals(Math.abs(count));
        var suffix = rule.numbers[idx];

        if (this.options.simplifyPluralSuffix && rule.numbers.length === 2 && rule.numbers[0] === 1) {
          if (suffix === 2) {
            suffix = 'plural';
          } else if (suffix === 1) {
            suffix = '';
          }
        }

        var returnSuffix = function returnSuffix() {
          return _this2.options.prepend && suffix.toString() ? _this2.options.prepend + suffix.toString() : suffix.toString();
        };

        if (this.options.compatibilityJSON === 'v1') {
          if (suffix === 1) return '';
          if (typeof suffix === 'number') return "_plural_".concat(suffix.toString());
          return returnSuffix();
        } else if (this.options.compatibilityJSON === 'v2') {
          return returnSuffix();
        } else if (this.options.simplifyPluralSuffix && rule.numbers.length === 2 && rule.numbers[0] === 1) {
          return returnSuffix();
        }

        return this.options.prepend && idx.toString() ? this.options.prepend + idx.toString() : idx.toString();
      }

      this.logger.warn("no plural rule found for: ".concat(code));
      return '';
    }
  }]);

  return PluralResolver;
}();

var Interpolator = function () {
  function Interpolator() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Interpolator);

    this.logger = baseLogger.create('interpolator');
    this.options = options;

    this.format = options.interpolation && options.interpolation.format || function (value) {
      return value;
    };

    this.init(options);
  }

  _createClass(Interpolator, [{
    key: "init",
    value: function init() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (!options.interpolation) options.interpolation = {
        escapeValue: true
      };
      var iOpts = options.interpolation;
      this.escape = iOpts.escape !== undefined ? iOpts.escape : escape;
      this.escapeValue = iOpts.escapeValue !== undefined ? iOpts.escapeValue : true;
      this.useRawValueToEscape = iOpts.useRawValueToEscape !== undefined ? iOpts.useRawValueToEscape : false;
      this.prefix = iOpts.prefix ? regexEscape(iOpts.prefix) : iOpts.prefixEscaped || '{{';
      this.suffix = iOpts.suffix ? regexEscape(iOpts.suffix) : iOpts.suffixEscaped || '}}';
      this.formatSeparator = iOpts.formatSeparator ? iOpts.formatSeparator : iOpts.formatSeparator || ',';
      this.unescapePrefix = iOpts.unescapeSuffix ? '' : iOpts.unescapePrefix || '-';
      this.unescapeSuffix = this.unescapePrefix ? '' : iOpts.unescapeSuffix || '';
      this.nestingPrefix = iOpts.nestingPrefix ? regexEscape(iOpts.nestingPrefix) : iOpts.nestingPrefixEscaped || regexEscape('$t(');
      this.nestingSuffix = iOpts.nestingSuffix ? regexEscape(iOpts.nestingSuffix) : iOpts.nestingSuffixEscaped || regexEscape(')');
      this.nestingOptionsSeparator = iOpts.nestingOptionsSeparator ? iOpts.nestingOptionsSeparator : iOpts.nestingOptionsSeparator || ',';
      this.maxReplaces = iOpts.maxReplaces ? iOpts.maxReplaces : 1000;
      this.alwaysFormat = iOpts.alwaysFormat !== undefined ? iOpts.alwaysFormat : false;
      this.resetRegExp();
    }
  }, {
    key: "reset",
    value: function reset() {
      if (this.options) this.init(this.options);
    }
  }, {
    key: "resetRegExp",
    value: function resetRegExp() {
      var regexpStr = "".concat(this.prefix, "(.+?)").concat(this.suffix);
      this.regexp = new RegExp(regexpStr, 'g');
      var regexpUnescapeStr = "".concat(this.prefix).concat(this.unescapePrefix, "(.+?)").concat(this.unescapeSuffix).concat(this.suffix);
      this.regexpUnescape = new RegExp(regexpUnescapeStr, 'g');
      var nestingRegexpStr = "".concat(this.nestingPrefix, "(.+?)").concat(this.nestingSuffix);
      this.nestingRegexp = new RegExp(nestingRegexpStr, 'g');
    }
  }, {
    key: "interpolate",
    value: function interpolate(str, data, lng, options) {
      var _this = this;

      var match;
      var value;
      var replaces;
      var defaultData = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {};

      function regexSafe(val) {
        return val.replace(/\$/g, '$$$$');
      }

      var handleFormat = function handleFormat(key) {
        if (key.indexOf(_this.formatSeparator) < 0) {
          var path = getPathWithDefaults(data, defaultData, key);
          return _this.alwaysFormat ? _this.format(path, undefined, lng) : path;
        }

        var p = key.split(_this.formatSeparator);
        var k = p.shift().trim();
        var f = p.join(_this.formatSeparator).trim();
        return _this.format(getPathWithDefaults(data, defaultData, k), f, lng, options);
      };

      this.resetRegExp();
      var missingInterpolationHandler = options && options.missingInterpolationHandler || this.options.missingInterpolationHandler;
      var skipOnVariables = options && options.interpolation && options.interpolation.skipOnVariables || this.options.interpolation.skipOnVariables;
      var todos = [{
        regex: this.regexpUnescape,
        safeValue: function safeValue(val) {
          return regexSafe(val);
        }
      }, {
        regex: this.regexp,
        safeValue: function safeValue(val) {
          return _this.escapeValue ? regexSafe(_this.escape(val)) : regexSafe(val);
        }
      }];
      todos.forEach(function (todo) {
        replaces = 0;

        while (match = todo.regex.exec(str)) {
          value = handleFormat(match[1].trim());

          if (value === undefined) {
            if (typeof missingInterpolationHandler === 'function') {
              var temp = missingInterpolationHandler(str, match, options);
              value = typeof temp === 'string' ? temp : '';
            } else if (skipOnVariables) {
              value = match[0];
              continue;
            } else {
              _this.logger.warn("missed to pass in variable ".concat(match[1], " for interpolating ").concat(str));

              value = '';
            }
          } else if (typeof value !== 'string' && !_this.useRawValueToEscape) {
            value = makeString(value);
          }

          str = str.replace(match[0], todo.safeValue(value));
          todo.regex.lastIndex = 0;
          replaces++;

          if (replaces >= _this.maxReplaces) {
            break;
          }
        }
      });
      return str;
    }
  }, {
    key: "nest",
    value: function nest(str, fc) {
      var _this2 = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var match;
      var value;

      var clonedOptions = _objectSpread({}, options);

      clonedOptions.applyPostProcessor = false;
      delete clonedOptions.defaultValue;

      function handleHasOptions(key, inheritedOptions) {
        var sep = this.nestingOptionsSeparator;
        if (key.indexOf(sep) < 0) return key;
        var c = key.split(new RegExp("".concat(sep, "[ ]*{")));
        var optionsString = "{".concat(c[1]);
        key = c[0];
        optionsString = this.interpolate(optionsString, clonedOptions);
        optionsString = optionsString.replace(/'/g, '"');

        try {
          clonedOptions = JSON.parse(optionsString);
          if (inheritedOptions) clonedOptions = _objectSpread({}, inheritedOptions, clonedOptions);
        } catch (e) {
          this.logger.warn("failed parsing options string in nesting for key ".concat(key), e);
          return "".concat(key).concat(sep).concat(optionsString);
        }

        delete clonedOptions.defaultValue;
        return key;
      }

      while (match = this.nestingRegexp.exec(str)) {
        var formatters = [];
        var doReduce = false;

        if (match[0].includes(this.formatSeparator) && !/{.*}/.test(match[1])) {
          var r = match[1].split(this.formatSeparator).map(function (elem) {
            return elem.trim();
          });
          match[1] = r.shift();
          formatters = r;
          doReduce = true;
        }

        value = fc(handleHasOptions.call(this, match[1].trim(), clonedOptions), clonedOptions);
        if (value && match[0] === str && typeof value !== 'string') return value;
        if (typeof value !== 'string') value = makeString(value);

        if (!value) {
          this.logger.warn("missed to resolve ".concat(match[1], " for nesting ").concat(str));
          value = '';
        }

        if (doReduce) {
          value = formatters.reduce(function (v, f) {
            return _this2.format(v, f, options.lng, options);
          }, value.trim());
        }

        str = str.replace(match[0], value);
        this.regexp.lastIndex = 0;
      }

      return str;
    }
  }]);

  return Interpolator;
}();

function remove(arr, what) {
  var found = arr.indexOf(what);

  while (found !== -1) {
    arr.splice(found, 1);
    found = arr.indexOf(what);
  }
}

var Connector = function (_EventEmitter) {
  _inherits(Connector, _EventEmitter);

  function Connector(backend, store, services) {
    var _this;

    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    _classCallCheck(this, Connector);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Connector).call(this));

    if (isIE10) {
      EventEmitter.call(_assertThisInitialized(_this));
    }

    _this.backend = backend;
    _this.store = store;
    _this.services = services;
    _this.languageUtils = services.languageUtils;
    _this.options = options;
    _this.logger = baseLogger.create('backendConnector');
    _this.state = {};
    _this.queue = [];

    if (_this.backend && _this.backend.init) {
      _this.backend.init(services, options.backend, options);
    }

    return _this;
  }

  _createClass(Connector, [{
    key: "queueLoad",
    value: function queueLoad(languages, namespaces, options, callback) {
      var _this2 = this;

      var toLoad = [];
      var pending = [];
      var toLoadLanguages = [];
      var toLoadNamespaces = [];
      languages.forEach(function (lng) {
        var hasAllNamespaces = true;
        namespaces.forEach(function (ns) {
          var name = "".concat(lng, "|").concat(ns);

          if (!options.reload && _this2.store.hasResourceBundle(lng, ns)) {
            _this2.state[name] = 2;
          } else if (_this2.state[name] < 0) ; else if (_this2.state[name] === 1) {
            if (pending.indexOf(name) < 0) pending.push(name);
          } else {
            _this2.state[name] = 1;
            hasAllNamespaces = false;
            if (pending.indexOf(name) < 0) pending.push(name);
            if (toLoad.indexOf(name) < 0) toLoad.push(name);
            if (toLoadNamespaces.indexOf(ns) < 0) toLoadNamespaces.push(ns);
          }
        });
        if (!hasAllNamespaces) toLoadLanguages.push(lng);
      });

      if (toLoad.length || pending.length) {
        this.queue.push({
          pending: pending,
          loaded: {},
          errors: [],
          callback: callback
        });
      }

      return {
        toLoad: toLoad,
        pending: pending,
        toLoadLanguages: toLoadLanguages,
        toLoadNamespaces: toLoadNamespaces
      };
    }
  }, {
    key: "loaded",
    value: function loaded(name, err, data) {
      var s = name.split('|');
      var lng = s[0];
      var ns = s[1];
      if (err) this.emit('failedLoading', lng, ns, err);

      if (data) {
        this.store.addResourceBundle(lng, ns, data);
      }

      this.state[name] = err ? -1 : 2;
      var loaded = {};
      this.queue.forEach(function (q) {
        pushPath(q.loaded, [lng], ns);
        remove(q.pending, name);
        if (err) q.errors.push(err);

        if (q.pending.length === 0 && !q.done) {
          Object.keys(q.loaded).forEach(function (l) {
            if (!loaded[l]) loaded[l] = [];

            if (q.loaded[l].length) {
              q.loaded[l].forEach(function (ns) {
                if (loaded[l].indexOf(ns) < 0) loaded[l].push(ns);
              });
            }
          });
          q.done = true;

          if (q.errors.length) {
            q.callback(q.errors);
          } else {
            q.callback();
          }
        }
      });
      this.emit('loaded', loaded);
      this.queue = this.queue.filter(function (q) {
        return !q.done;
      });
    }
  }, {
    key: "read",
    value: function read(lng, ns, fcName) {
      var _this3 = this;

      var tried = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var wait = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 350;
      var callback = arguments.length > 5 ? arguments[5] : undefined;
      if (!lng.length) return callback(null, {});
      return this.backend[fcName](lng, ns, function (err, data) {
        if (err && data && tried < 5) {
          setTimeout(function () {
            _this3.read.call(_this3, lng, ns, fcName, tried + 1, wait * 2, callback);
          }, wait);
          return;
        }

        callback(err, data);
      });
    }
  }, {
    key: "prepareLoading",
    value: function prepareLoading(languages, namespaces) {
      var _this4 = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var callback = arguments.length > 3 ? arguments[3] : undefined;

      if (!this.backend) {
        this.logger.warn('No backend was added via i18next.use. Will not load resources.');
        return callback && callback();
      }

      if (typeof languages === 'string') languages = this.languageUtils.toResolveHierarchy(languages);
      if (typeof namespaces === 'string') namespaces = [namespaces];
      var toLoad = this.queueLoad(languages, namespaces, options, callback);

      if (!toLoad.toLoad.length) {
        if (!toLoad.pending.length) callback();
        return null;
      }

      toLoad.toLoad.forEach(function (name) {
        _this4.loadOne(name);
      });
    }
  }, {
    key: "load",
    value: function load(languages, namespaces, callback) {
      this.prepareLoading(languages, namespaces, {}, callback);
    }
  }, {
    key: "reload",
    value: function reload(languages, namespaces, callback) {
      this.prepareLoading(languages, namespaces, {
        reload: true
      }, callback);
    }
  }, {
    key: "loadOne",
    value: function loadOne(name) {
      var _this5 = this;

      var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var s = name.split('|');
      var lng = s[0];
      var ns = s[1];
      this.read(lng, ns, 'read', undefined, undefined, function (err, data) {
        if (err) _this5.logger.warn("".concat(prefix, "loading namespace ").concat(ns, " for language ").concat(lng, " failed"), err);
        if (!err && data) _this5.logger.log("".concat(prefix, "loaded namespace ").concat(ns, " for language ").concat(lng), data);

        _this5.loaded(name, err, data);
      });
    }
  }, {
    key: "saveMissing",
    value: function saveMissing(languages, namespace, key, fallbackValue, isUpdate) {
      var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};

      if (this.services.utils && this.services.utils.hasLoadedNamespace && !this.services.utils.hasLoadedNamespace(namespace)) {
        this.logger.warn("did not save key \"".concat(key, "\" as the namespace \"").concat(namespace, "\" was not yet loaded"), 'This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!');
        return;
      }

      if (key === undefined || key === null || key === '') return;

      if (this.backend && this.backend.create) {
        this.backend.create(languages, namespace, key, fallbackValue, null, _objectSpread({}, options, {
          isUpdate: isUpdate
        }));
      }

      if (!languages || !languages[0]) return;
      this.store.addResource(languages[0], namespace, key, fallbackValue);
    }
  }]);

  return Connector;
}(EventEmitter);

function get() {
  return {
    debug: false,
    initImmediate: true,
    ns: ['translation'],
    defaultNS: ['translation'],
    fallbackLng: ['dev'],
    fallbackNS: false,
    whitelist: false,
    nonExplicitWhitelist: false,
    supportedLngs: false,
    nonExplicitSupportedLngs: false,
    load: 'all',
    preload: false,
    simplifyPluralSuffix: true,
    keySeparator: '.',
    nsSeparator: ':',
    pluralSeparator: '_',
    contextSeparator: '_',
    partialBundledLanguages: false,
    saveMissing: false,
    updateMissing: false,
    saveMissingTo: 'fallback',
    saveMissingPlurals: true,
    missingKeyHandler: false,
    missingInterpolationHandler: false,
    postProcess: false,
    postProcessPassResolved: false,
    returnNull: true,
    returnEmptyString: true,
    returnObjects: false,
    joinArrays: false,
    returnedObjectHandler: false,
    parseMissingKeyHandler: false,
    appendNamespaceToMissingKey: false,
    appendNamespaceToCIMode: false,
    overloadTranslationOptionHandler: function handle(args) {
      var ret = {};
      if (_typeof(args[1]) === 'object') ret = args[1];
      if (typeof args[1] === 'string') ret.defaultValue = args[1];
      if (typeof args[2] === 'string') ret.tDescription = args[2];

      if (_typeof(args[2]) === 'object' || _typeof(args[3]) === 'object') {
        var options = args[3] || args[2];
        Object.keys(options).forEach(function (key) {
          ret[key] = options[key];
        });
      }

      return ret;
    },
    interpolation: {
      escapeValue: true,
      format: function format(value, _format, lng, options) {
        return value;
      },
      prefix: '{{',
      suffix: '}}',
      formatSeparator: ',',
      unescapePrefix: '-',
      nestingPrefix: '$t(',
      nestingSuffix: ')',
      nestingOptionsSeparator: ',',
      maxReplaces: 1000,
      skipOnVariables: false
    }
  };
}
function transformOptions(options) {
  if (typeof options.ns === 'string') options.ns = [options.ns];
  if (typeof options.fallbackLng === 'string') options.fallbackLng = [options.fallbackLng];
  if (typeof options.fallbackNS === 'string') options.fallbackNS = [options.fallbackNS];

  if (options.whitelist) {
    if (options.whitelist && options.whitelist.indexOf('cimode') < 0) {
      options.whitelist = options.whitelist.concat(['cimode']);
    }

    options.supportedLngs = options.whitelist;
  }

  if (options.nonExplicitWhitelist) {
    options.nonExplicitSupportedLngs = options.nonExplicitWhitelist;
  }

  if (options.supportedLngs && options.supportedLngs.indexOf('cimode') < 0) {
    options.supportedLngs = options.supportedLngs.concat(['cimode']);
  }

  return options;
}

function noop() {}

var I18n = function (_EventEmitter) {
  _inherits(I18n, _EventEmitter);

  function I18n() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var callback = arguments.length > 1 ? arguments[1] : undefined;

    _classCallCheck(this, I18n);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(I18n).call(this));

    if (isIE10) {
      EventEmitter.call(_assertThisInitialized(_this));
    }

    _this.options = transformOptions(options);
    _this.services = {};
    _this.logger = baseLogger;
    _this.modules = {
      external: []
    };

    if (callback && !_this.isInitialized && !options.isClone) {
      if (!_this.options.initImmediate) {
        _this.init(options, callback);

        return _possibleConstructorReturn(_this, _assertThisInitialized(_this));
      }

      setTimeout(function () {
        _this.init(options, callback);
      }, 0);
    }

    return _this;
  }

  _createClass(I18n, [{
    key: "init",
    value: function init() {
      var _this2 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var callback = arguments.length > 1 ? arguments[1] : undefined;

      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      if (options.whitelist && !options.supportedLngs) {
        this.logger.deprecate('whitelist', 'option "whitelist" will be renamed to "supportedLngs" in the next major - please make sure to rename this option asap.');
      }

      if (options.nonExplicitWhitelist && !options.nonExplicitSupportedLngs) {
        this.logger.deprecate('whitelist', 'options "nonExplicitWhitelist" will be renamed to "nonExplicitSupportedLngs" in the next major - please make sure to rename this option asap.');
      }

      this.options = _objectSpread({}, get(), this.options, transformOptions(options));
      this.format = this.options.interpolation.format;
      if (!callback) callback = noop;

      function createClassOnDemand(ClassOrObject) {
        if (!ClassOrObject) return null;
        if (typeof ClassOrObject === 'function') return new ClassOrObject();
        return ClassOrObject;
      }

      if (!this.options.isClone) {
        if (this.modules.logger) {
          baseLogger.init(createClassOnDemand(this.modules.logger), this.options);
        } else {
          baseLogger.init(null, this.options);
        }

        var lu = new LanguageUtil(this.options);
        this.store = new ResourceStore(this.options.resources, this.options);
        var s = this.services;
        s.logger = baseLogger;
        s.resourceStore = this.store;
        s.languageUtils = lu;
        s.pluralResolver = new PluralResolver(lu, {
          prepend: this.options.pluralSeparator,
          compatibilityJSON: this.options.compatibilityJSON,
          simplifyPluralSuffix: this.options.simplifyPluralSuffix
        });
        s.interpolator = new Interpolator(this.options);
        s.utils = {
          hasLoadedNamespace: this.hasLoadedNamespace.bind(this)
        };
        s.backendConnector = new Connector(createClassOnDemand(this.modules.backend), s.resourceStore, s, this.options);
        s.backendConnector.on('*', function (event) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          _this2.emit.apply(_this2, [event].concat(args));
        });

        if (this.modules.languageDetector) {
          s.languageDetector = createClassOnDemand(this.modules.languageDetector);
          s.languageDetector.init(s, this.options.detection, this.options);
        }

        if (this.modules.i18nFormat) {
          s.i18nFormat = createClassOnDemand(this.modules.i18nFormat);
          if (s.i18nFormat.init) s.i18nFormat.init(this);
        }

        this.translator = new Translator(this.services, this.options);
        this.translator.on('*', function (event) {
          for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }

          _this2.emit.apply(_this2, [event].concat(args));
        });
        this.modules.external.forEach(function (m) {
          if (m.init) m.init(_this2);
        });
      }

      if (!this.services.languageDetector && !this.options.lng) {
        this.logger.warn('init: no languageDetector is used and no lng is defined');
      }

      var storeApi = ['getResource', 'hasResourceBundle', 'getResourceBundle', 'getDataByLanguage'];
      storeApi.forEach(function (fcName) {
        _this2[fcName] = function () {
          var _this2$store;

          return (_this2$store = _this2.store)[fcName].apply(_this2$store, arguments);
        };
      });
      var storeApiChained = ['addResource', 'addResources', 'addResourceBundle', 'removeResourceBundle'];
      storeApiChained.forEach(function (fcName) {
        _this2[fcName] = function () {
          var _this2$store2;

          (_this2$store2 = _this2.store)[fcName].apply(_this2$store2, arguments);

          return _this2;
        };
      });
      var deferred = defer();

      var load = function load() {
        _this2.changeLanguage(_this2.options.lng, function (err, t) {
          _this2.isInitialized = true;
          if (!_this2.options.isClone) _this2.logger.log('initialized', _this2.options);

          _this2.emit('initialized', _this2.options);

          deferred.resolve(t);
          callback(err, t);
        });
      };

      if (this.options.resources || !this.options.initImmediate) {
        load();
      } else {
        setTimeout(load, 0);
      }

      return deferred;
    }
  }, {
    key: "loadResources",
    value: function loadResources(language) {
      var _this3 = this;

      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
      var usedCallback = callback;
      var usedLng = typeof language === 'string' ? language : this.language;
      if (typeof language === 'function') usedCallback = language;

      if (!this.options.resources || this.options.partialBundledLanguages) {
        if (usedLng && usedLng.toLowerCase() === 'cimode') return usedCallback();
        var toLoad = [];

        var append = function append(lng) {
          if (!lng) return;

          var lngs = _this3.services.languageUtils.toResolveHierarchy(lng);

          lngs.forEach(function (l) {
            if (toLoad.indexOf(l) < 0) toLoad.push(l);
          });
        };

        if (!usedLng) {
          var fallbacks = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
          fallbacks.forEach(function (l) {
            return append(l);
          });
        } else {
          append(usedLng);
        }

        if (this.options.preload) {
          this.options.preload.forEach(function (l) {
            return append(l);
          });
        }

        this.services.backendConnector.load(toLoad, this.options.ns, usedCallback);
      } else {
        usedCallback(null);
      }
    }
  }, {
    key: "reloadResources",
    value: function reloadResources(lngs, ns, callback) {
      var deferred = defer();
      if (!lngs) lngs = this.languages;
      if (!ns) ns = this.options.ns;
      if (!callback) callback = noop;
      this.services.backendConnector.reload(lngs, ns, function (err) {
        deferred.resolve();
        callback(err);
      });
      return deferred;
    }
  }, {
    key: "use",
    value: function use(module) {
      if (!module) throw new Error('You are passing an undefined module! Please check the object you are passing to i18next.use()');
      if (!module.type) throw new Error('You are passing a wrong module! Please check the object you are passing to i18next.use()');

      if (module.type === 'backend') {
        this.modules.backend = module;
      }

      if (module.type === 'logger' || module.log && module.warn && module.error) {
        this.modules.logger = module;
      }

      if (module.type === 'languageDetector') {
        this.modules.languageDetector = module;
      }

      if (module.type === 'i18nFormat') {
        this.modules.i18nFormat = module;
      }

      if (module.type === 'postProcessor') {
        postProcessor.addPostProcessor(module);
      }

      if (module.type === '3rdParty') {
        this.modules.external.push(module);
      }

      return this;
    }
  }, {
    key: "changeLanguage",
    value: function changeLanguage(lng, callback) {
      var _this4 = this;

      this.isLanguageChangingTo = lng;
      var deferred = defer();
      this.emit('languageChanging', lng);

      var done = function done(err, l) {
        if (l) {
          _this4.language = l;
          _this4.languages = _this4.services.languageUtils.toResolveHierarchy(l);

          _this4.translator.changeLanguage(l);

          _this4.isLanguageChangingTo = undefined;

          _this4.emit('languageChanged', l);

          _this4.logger.log('languageChanged', l);
        } else {
          _this4.isLanguageChangingTo = undefined;
        }

        deferred.resolve(function () {
          return _this4.t.apply(_this4, arguments);
        });
        if (callback) callback(err, function () {
          return _this4.t.apply(_this4, arguments);
        });
      };

      var setLng = function setLng(lngs) {
        var l = typeof lngs === 'string' ? lngs : _this4.services.languageUtils.getBestMatchFromCodes(lngs);

        if (l) {
          if (!_this4.language) {
            _this4.language = l;
            _this4.languages = _this4.services.languageUtils.toResolveHierarchy(l);
          }

          if (!_this4.translator.language) _this4.translator.changeLanguage(l);
          if (_this4.services.languageDetector) _this4.services.languageDetector.cacheUserLanguage(l);
        }

        _this4.loadResources(l, function (err) {
          done(err, l);
        });
      };

      if (!lng && this.services.languageDetector && !this.services.languageDetector.async) {
        setLng(this.services.languageDetector.detect());
      } else if (!lng && this.services.languageDetector && this.services.languageDetector.async) {
        this.services.languageDetector.detect(setLng);
      } else {
        setLng(lng);
      }

      return deferred;
    }
  }, {
    key: "getFixedT",
    value: function getFixedT(lng, ns) {
      var _this5 = this;

      var fixedT = function fixedT(key, opts) {
        var options;

        if (_typeof(opts) !== 'object') {
          for (var _len3 = arguments.length, rest = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
            rest[_key3 - 2] = arguments[_key3];
          }

          options = _this5.options.overloadTranslationOptionHandler([key, opts].concat(rest));
        } else {
          options = _objectSpread({}, opts);
        }

        options.lng = options.lng || fixedT.lng;
        options.lngs = options.lngs || fixedT.lngs;
        options.ns = options.ns || fixedT.ns;
        return _this5.t(key, options);
      };

      if (typeof lng === 'string') {
        fixedT.lng = lng;
      } else {
        fixedT.lngs = lng;
      }

      fixedT.ns = ns;
      return fixedT;
    }
  }, {
    key: "t",
    value: function t() {
      var _this$translator;

      return this.translator && (_this$translator = this.translator).translate.apply(_this$translator, arguments);
    }
  }, {
    key: "exists",
    value: function exists() {
      var _this$translator2;

      return this.translator && (_this$translator2 = this.translator).exists.apply(_this$translator2, arguments);
    }
  }, {
    key: "setDefaultNamespace",
    value: function setDefaultNamespace(ns) {
      this.options.defaultNS = ns;
    }
  }, {
    key: "hasLoadedNamespace",
    value: function hasLoadedNamespace(ns) {
      var _this6 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!this.isInitialized) {
        this.logger.warn('hasLoadedNamespace: i18next was not initialized', this.languages);
        return false;
      }

      if (!this.languages || !this.languages.length) {
        this.logger.warn('hasLoadedNamespace: i18n.languages were undefined or empty', this.languages);
        return false;
      }

      var lng = this.languages[0];
      var fallbackLng = this.options ? this.options.fallbackLng : false;
      var lastLng = this.languages[this.languages.length - 1];
      if (lng.toLowerCase() === 'cimode') return true;

      var loadNotPending = function loadNotPending(l, n) {
        var loadState = _this6.services.backendConnector.state["".concat(l, "|").concat(n)];

        return loadState === -1 || loadState === 2;
      };

      if (options.precheck) {
        var preResult = options.precheck(this, loadNotPending);
        if (preResult !== undefined) return preResult;
      }

      if (this.hasResourceBundle(lng, ns)) return true;
      if (!this.services.backendConnector.backend) return true;
      if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns))) return true;
      return false;
    }
  }, {
    key: "loadNamespaces",
    value: function loadNamespaces(ns, callback) {
      var _this7 = this;

      var deferred = defer();

      if (!this.options.ns) {
        callback && callback();
        return Promise.resolve();
      }

      if (typeof ns === 'string') ns = [ns];
      ns.forEach(function (n) {
        if (_this7.options.ns.indexOf(n) < 0) _this7.options.ns.push(n);
      });
      this.loadResources(function (err) {
        deferred.resolve();
        if (callback) callback(err);
      });
      return deferred;
    }
  }, {
    key: "loadLanguages",
    value: function loadLanguages(lngs, callback) {
      var deferred = defer();
      if (typeof lngs === 'string') lngs = [lngs];
      var preloaded = this.options.preload || [];
      var newLngs = lngs.filter(function (lng) {
        return preloaded.indexOf(lng) < 0;
      });

      if (!newLngs.length) {
        if (callback) callback();
        return Promise.resolve();
      }

      this.options.preload = preloaded.concat(newLngs);
      this.loadResources(function (err) {
        deferred.resolve();
        if (callback) callback(err);
      });
      return deferred;
    }
  }, {
    key: "dir",
    value: function dir(lng) {
      if (!lng) lng = this.languages && this.languages.length > 0 ? this.languages[0] : this.language;
      if (!lng) return 'rtl';
      var rtlLngs = ['ar', 'shu', 'sqr', 'ssh', 'xaa', 'yhd', 'yud', 'aao', 'abh', 'abv', 'acm', 'acq', 'acw', 'acx', 'acy', 'adf', 'ads', 'aeb', 'aec', 'afb', 'ajp', 'apc', 'apd', 'arb', 'arq', 'ars', 'ary', 'arz', 'auz', 'avl', 'ayh', 'ayl', 'ayn', 'ayp', 'bbz', 'pga', 'he', 'iw', 'ps', 'pbt', 'pbu', 'pst', 'prp', 'prd', 'ug', 'ur', 'ydd', 'yds', 'yih', 'ji', 'yi', 'hbo', 'men', 'xmn', 'fa', 'jpr', 'peo', 'pes', 'prs', 'dv', 'sam'];
      return rtlLngs.indexOf(this.services.languageUtils.getLanguagePartFromCode(lng)) >= 0 ? 'rtl' : 'ltr';
    }
  }, {
    key: "createInstance",
    value: function createInstance() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var callback = arguments.length > 1 ? arguments[1] : undefined;
      return new I18n(options, callback);
    }
  }, {
    key: "cloneInstance",
    value: function cloneInstance() {
      var _this8 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;

      var mergedOptions = _objectSpread({}, this.options, options, {
        isClone: true
      });

      var clone = new I18n(mergedOptions);
      var membersToCopy = ['store', 'services', 'language'];
      membersToCopy.forEach(function (m) {
        clone[m] = _this8[m];
      });
      clone.services = _objectSpread({}, this.services);
      clone.services.utils = {
        hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
      };
      clone.translator = new Translator(clone.services, clone.options);
      clone.translator.on('*', function (event) {
        for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
          args[_key4 - 1] = arguments[_key4];
        }

        clone.emit.apply(clone, [event].concat(args));
      });
      clone.init(mergedOptions, callback);
      clone.translator.options = clone.options;
      clone.translator.backendConnector.services.utils = {
        hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
      };
      return clone;
    }
  }]);

  return I18n;
}(EventEmitter);

var i18next = new I18n();

module.exports = i18next;

},{"@babel/runtime/helpers/assertThisInitialized":12,"@babel/runtime/helpers/classCallCheck":13,"@babel/runtime/helpers/createClass":14,"@babel/runtime/helpers/getPrototypeOf":16,"@babel/runtime/helpers/inherits":17,"@babel/runtime/helpers/objectSpread":18,"@babel/runtime/helpers/possibleConstructorReturn":19,"@babel/runtime/helpers/typeof":21}],27:[function(require,module,exports){
(function (global){
"use strict";

// ref: https://github.com/tc39/proposal-global
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof global !== 'undefined') { return global; }
	throw new Error('unable to locate global object');
}

var global = getGlobal();

module.exports = exports = global.fetch;

// Needed for TypeScript and Webpack.
if (global.fetch) {
	exports.default = global.fetch.bind(global);
}

exports.Headers = global.Headers;
exports.Request = global.Request;
exports.Response = global.Response;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],28:[function(require,module,exports){
var {HejlElement } = require('./hejlElement');


class HejlApp extends HejlElement
{
    constructor(id,options)
    {
        super(id,"DIV",options);
        this.winStack = [];
        this.dialogPane = DIV("dialogPane").visible((m,el)=>el.children.length > 0);
        this.progres = DIV("progres").stack(
            [
                SPAN().class(["fa","fa-3x","fa-spin","fa-spinner"]),
                H1().textBinder(()=>this.progressText)
            ]).visible(()=>this.progressText != null); 
        this.class('plainApp').stack([this.progres,]);
        this.hideProgress();
        this.closeDialog();
    }
    showProgress(text)
    {
        this.progressText = text;
        this.progres.rebind();

    }
    hideProgress()
    {
        this.showProgress(null);
    }
    content(cnt)
    {
        this.contentEl = cnt;
        this.removeChildren();
        this.stackUp();
        return this;
    }
    stackUp()
    {
        this.stack([this.progres,this.dialogPane,this.contentEl])
    }
    showDialog(hel)
    {
        this._dialogEl = hel;
        this._dialogEl.close = this.closeDialog.bind(this);
        this.dialogPane.stack([hel]);
        this.dialogPane.bind({});
        if(this.contentEl != null && this.contentEl.onClose)
              this.contentEl.onClose(this);
  
  
        if(this._dialogEl.onShow)
             TRYC(this._dialogEl.onShow);

    }
    closeDialog(resumeContent)
    {
        if(!resumeContent)
            resumeContent = true;
        if(this._dialogEl == null)
            return;
            
        if(this._dialogEl.onClose)
            TRYC(this._dialogEl.onClose);
        this._dialogEl = null;
        this.dialogPane.removeChildren();
        this.dialogPane.bind({});
        if(resumeContent && this.contentEl != null && this.contentEl.onResume)
           TRYC(()=>this.contentEl.onResume(this));
    }
    peek()
    {
        if(this.winStack.length == 0)
            return null;
        return this.winStack[this.winStack.length-1];
    }
    /**
     * Closes  views on stack, only <upTo> lowest views are kept
     * @param {int} upTo 
     */
    unwind(upTo)
    {
        var toclose = []
        if(this.winStack.length <=  upTo-1)
            return;
        var len = this.winStack.length;
        for(var i = len+1; i > upTo; i-- )
            this.close();
      
    }
    show(el,noOnShow,t)
    {
        if(!el)
            console.error("HEJL: Cannot show null/undefined element");
        if(this.contentEl)
            this.winStack.push({content: this.contentEl});
        this.content(el);
        if(!noOnShow && this.contentEl.onShow)
            TRYC(()=>this.contentEl.onShow(this));
        el.close = this.close.bind(this);
    }
 
    close()
    {
        if(this.winStack.length == 0)
            return;
        var rec = this.winStack.pop();
        this.closeDialog(false);
        this.doOnClose();
        this.contentEl = null;
        this.show(rec.content,true /*no onShow*/);
        if(rec.content.onResume)
          TRYC(()=>rec.content.onResume(this));
    }

    doOnClose() {
        if (this.contentEl != null && this.contentEl.onClose)
            this.contentEl.onClose(this);
    }
}


function APP(id,options)
{
    return new HejlApp(id,options);
}

if(!window.noHejlGlobals)
{
    window.APP = APP
}

module.exports.HejlApp = HejlApp;
module.exports.APP = APP;

},{"./hejlElement":9}],29:[function(require,module,exports){
const {HejlLovBase} = require("./lovbase");
function createRadio(id,options)
{
    var lovbase = new HejlLovBase(radio);

    var radio = DIV(id).default("").class(['buttonArea','radio']).stack([
        DIV().collection(()=>lovbase.listOptions(),createItemView)]);
    lovbase.attach(radio);

    function createItemView(it)
    {
        var rv = BUTTON(lovbase.show(it),()=>
        {
          lovbase.select(it);
         
        }).binder((s)=>
        {
            rv.build().classList.remove("selected");
            if(lovbase.isSelected(it))
                 rv.build().classList.add("selected");
            return s;
        })
         return rv;
    }
    
   
    return radio;
}
window.RADIO = createRadio;
module.exports = createRadio;
},{"./lovbase":11}],30:[function(require,module,exports){
/**
 * result of Form/User input validation
 */
class HejlValidationProtocol
{
    constructor()
    {
        /**
         * @type {HejlValidationMessage}
         */
        this.messages = []
        this.errors = [];
    }

    /**
     * Adds new validation message to result
     * @param {HejlValidationMessage} hejlValidationMessage 
     */
    addMessage(message)
    {
        this.messages.push(message);
        if(message.isError)
            this.errors.push(message);
    }
    /**
     * @returns {boolean}  true when protocol contains error messages
     */
    hasErrors()
    {
        return this.errors.length > 0;
    }

    /**
     * adds new error into the protocol
     * @param {String} message 
     */
    addError(fieldLabel,message)
    {
        this.addMessage(new HejlValidationError(fieldLabel,message));
    }

    /**
     * convert protocol to string
     * @returns {string}
     */
    displayProtocol()
    {
        var rv = "";
        this.messages.forEach(m=>
            rv += m.displayMessage()+"\n");
        return rv;
    }

    /**
     * convert protocol errors to string, no field names, levels
     * @returns {string}
     */
    displayErrors()
    {
        var rv = "";
        this.errors.forEach(m=>
            rv += m.message+"\n");
        return rv;
    }
    /**
     * merges messages of given protocol to this one 
     * This is support for hiearchical subvalidations
     * @param {HejlValidationProtocol} protocol 
     */
    merge(protocol)
    {
        protocol.messages.forEach(m=>
            this.addMessage(m));
    }

    check(premise,message)
    {
        if(!premise)
        {
            if(typeof message == "string")
                message = new HejlValidationError(null,message);
            this.addMessage(message);
        }
    }
}

class HejlValidationMessage
{
    constructor(level,levelDesc,fieldName,message)
    {
        this.level = level;
        this.levelDesc = levelDesc;
        this.message = message;
        this.isError = false;
        this.isWarning = false;
        this.isNote = false;
        this.fieldName = fieldName;
    }
    displayMessage()
    {
        return T(this.levelDesc)+": "+(this.fieldName ? (T(this.fieldName)+" - "):"")+T(this.message);
    }
}

class HejlValidationError extends HejlValidationMessage
{
    constructor(fieldName,message)
    {
        super("E","Chyba",fieldName,message);
        this.isError = true;   
    }
}

class HejlValidationWarning extends HejlValidationMessage
{
    constructor(fieldName,message)
    {
        super("W","Varování",fieldName,message);
        this.isWarning = true;
    }
}

class HejlValidationNote extends HejlValidationMessage
{
    constructor(fieldName,message)
    {
        super("N","Poznámka",fieldName,message);
        this.isNote = true;
    }
}

module.exports = { HejlValidationProtocol, HejlValidationMessage,HejlValidationWarning,HejlValidationNote}
},{}],31:[function(require,module,exports){



var httpGetCache = {}

/**
 * @callback loadCallback
 * @param {String} loadedText loaded data as text
 */
/**
 * 
 * @param {String} url url of http resource  file to be loaded
 * @param {loadCallback} callback 
 */
var httpGet = function(url,callback,tryCache,options)
{
  try
{
  if(tryCache)
  {
    if(httpGetCache.hasOwnProperty(url))
      {
        var rv = httpGetCache[url];
        callback(rv);
        return ;
      }
  }

      var xhr = createCORSRequest((options != null && options.method) ? options.method : "GET",url);
      if(options && options.headers)
      {
        for(var header in options.headers)
          xhr.setRequestHeader(header,options.headers[header]);
      }
    xhr.onreadystatechange = function() {
          if (xhr.readyState == 4)
          {
              if(xhr.status == 200)
              {
                if(tryCache)
                    httpGetCache[url] = xhr.responseText;
                      callback(xhr.responseText,xhr);
              }
              else
                callback(null,xhr);
          }
     };

    
      xhr.timeout = 30000;
      xhr.send((options != null && options.data) ? options.data :null);
    }
    catch(error)
    {

      console.log(error.stack);
      callback(null,null,error);
    }
   
 }
function doHttpRequest(url,options)
{
  var promise = new Promise((resolve,reject)=>
  {
    httpGet(url,function(data,xhr,exception)
    {
      if(data != null)
        resolve(data);
      else
      {
        if(exception)
          console.error("doHttpRequest for "+url+"failed with exception",exception);
        else
          console.error("doHttpRequest for "+url+" failed, status=",xhr.status);
        reject({ xhr:xhr,exception:exception});  
      }
    },false,options);
  })
  return promise;
}
  function renderUrlTemplate(url,model)
  {
    var promise = new Promise(function(resolve,reject)
    {  httpGet(url,function(data,rq)
      {
        if(data == null)
        {
          reject(rq);
          return;
        }
        var rv = data.renderTemplate(model);
        resolve(rv);
      });
    });
    return promise;
 }

 function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
  
      // Check if the XMLHttpRequest object has a "withCredentials" property.
      // "withCredentials" only exists on XMLHTTPRequest2 objects.
      xhr.open(method, url, true);
  
    } else if (typeof XDomainRequest != "undefined") {
  
      // Otherwise, check if XDomainRequest.
      // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
      xhr = new XDomainRequest();
      xhr.open(method, url);
  
    } else {
  
      // Otherwise, CORS is not supported by the browser.
      xhr = null;
  
    }
    return xhr;
  }

  window.httpGet = httpGet;
  window.doHttpRequest = doHttpRequest;
  module.exports.httpGet = httpGet;
  module.exports.doHttpRequest = doHttpRequest;

},{}],32:[function(require,module,exports){

class DataStore
{
    constructor(options)
    {
        if(options == null)
            options  = { }
        this.options = options;


        this.files = {};
    }
    addDataFile(fileName)
    {
        if(this.files[fileName] == null)
            this.files[fileName] = this.newDataFile(fileName);

        var rv = this.files[fileName];
        return rv;
    }
    addDocumentFile(filename)
    {
        var rv = this.addDataFile(filename);
        rv.setDocumentMode();
        return rv;
    }

    getDocumentTransformer()
    {
        return emptyTransformer;
    }
}

DataStore._storeTypes = {}
DataStore.create = function(storeType,options)
{
    var constructor = DataStore._storeTypes[storeType];
    if(constructor == null)
        return null;
    var rv = constructor(options);
    return rv;
}

class DataFile
{
    constructor(dataStore,fileName)
    {
        this.dataStore = dataStore;
        this.fileName = fileName;
        this.transformer = emptyTransformer;
    }

    setDocumentMode()
    {
        this.transformer = this.dataStore.getDocumentTransformer();
    }

    async list(options)
    {
       
        var data = await this.listInternal(options)
        var rv = await this.transformer.transformResult(data);
        return rv;
    }
    async findById(id)
    {
     
        var data = await this.findByIdInternal(id)
        var rv = await this.transformer.transformResult(data);
        return rv;
    }

    async save(data,id)
    {
        var payload = this.transformer.transformInput(data);
      
         
        if(id == null)
            id = this.transformer.extractId(data);
       
        var resdata = await this.saveInternal(payload,id);
         var rv = this.transformer.transformResult(resdata);
         if(this.transformer.updateAfterSave)
            this.transformer.updateAfterSave(data,rv);
        return rv;
    }

}


const emptyTransformer = 
{
    extractId: (data)=>
    {
        return null;
    },
    transformResult: (data)=>
    {
        return data;
    },
    transformInput: (data)=>
    {
        return data;
    }

};

module.exports.DataStore = DataStore;
module.exports.DataFile = DataFile;
module.exports.files = {};
module.exports.stores = {};

require("./datastoreRest");

const { dataFiles } = require('../../../app/datafiles');
for(var skey in dataFiles)
{
    var store  = dataFiles[skey];
    var inst = DataStore.create(store.type,store.options);
    module.exports.stores[skey] = inst;

    for(var key in store.files)
    {
         var file = store.files[key];
         var finst = file.type === 'document'
            ? inst.addDocumentFile(key,file)
            : inst.addDataFile(key,file)
        module.exports.files[key] = finst;
    }
}



},{"../../../app/datafiles":3,"./datastoreRest":33}],33:[function(require,module,exports){
const { DataStore,DataFile } = require('./datastore')
const { doHttpRequest } = require('../httphelper')

class DataStoreRest extends DataStore
{
    constructor(options)
    {
        if(options == null)
            options  = {
                urlBase:"api"
            }
      super(options)
    }
  
    getDocumentTransformer()
    {
        return jsonDocumentRestTransformer;
    }
    getUrlBase()
    {
        if(this.options.urlBase == null)
            this.options.urlBase = "api"
        return this.options.urlBase;
    }

    newDataFile(fileName)
    {
        return new DataFileRest(this,fileName);
    }

}

class DataFileRest extends DataFile
{
    constructor(dataStore,fileName)
    {
       super(dataStore,fileName)
    }
    
   getDocumentTranformer()
   {
       return jsonDocumentRestTransformer;
   }
    getUrlBase(id)
    {
        var url = this.dataStore.getUrlBase()+"/"+this.fileName;  
        if(id != null)
            url += "/"+id;
        return url;
    }
    
    async listInternal(options)
    {
        var url = this.getUrlBase();
        return await doHttpRequest(url);
    }
    async findByIdInternal(id)
    {
        var url = this.getUrlBase(id);
        return await doHttpRequest(url);
    }

    async saveInternal(data,id)
    {
       
        var url = this.getUrlBase(id);
        var resdata = await doHttpRequest(url,
            {
                method:id == null ? "POST":"PUT",
                data: data,
                headers: {'Content-Type':this.transformer.contentType(data)}
            });
       return resdata;
    }

}

const jsonDocumentRestTransformer = 
{
    extractId: (doc)=>
    {
        return doc._id;
    },
    transformResult: (data)=>
    {
        var rv = JSON.parse(data);
        return rv;
    },
    transformInput: (data)=>
    {
        if(typeof data == "object")
           return JSON.stringify(data,null,2);
        return data;
    },
    contentType:(data)=>
    {
        return "application/json"
    },
    updateAfterSave(data,rv)
    {
        if(data._id == null)
            data._id = rv.id;
    }
}


DataStore.restApi = function(options)
{
    return new DataStoreRest(options);
}
DataStore._storeTypes["rest"] = DataStore.restApi;

module.exports.DataStoreRest = DataStoreRest;
module.exports.DataFileRest = DataFileRest;
},{"../httphelper":31,"./datastore":32}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL1VzZXJzL3N0YW5pL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImFwcC9hcHAuanMiLCJhcHAvY29tcG9uZW50cy9jbGNhcmQuanMiLCJhcHAvZGF0YWZpbGVzLmpzIiwiaGVqbGZyYW0vY2FyZC5qcyIsImhlamxmcmFtL2NvbXBvbmVudHMvY29udGV4dE1lbnVJdGVtLmpzIiwiaGVqbGZyYW0vY29tcG9uZW50cy9lZGl0YWJsZVRleHQuanMiLCJoZWpsZnJhbS9oYW1hcHAuanMiLCJoZWpsZnJhbS9oZWpsLmpzIiwiaGVqbGZyYW0vaGVqbEVsZW1lbnQuanMiLCJoZWpsZnJhbS9oZWpsaTE4bi5qcyIsImhlamxmcmFtL2xvdmJhc2UuanMiLCJoZWpsZnJhbS9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQuanMiLCJoZWpsZnJhbS9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9jbGFzc0NhbGxDaGVjay5qcyIsImhlamxmcmFtL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2NyZWF0ZUNsYXNzLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZGVmaW5lUHJvcGVydHkuanMiLCJoZWpsZnJhbS9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9nZXRQcm90b3R5cGVPZi5qcyIsImhlamxmcmFtL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2luaGVyaXRzLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvb2JqZWN0U3ByZWFkLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvcG9zc2libGVDb25zdHJ1Y3RvclJldHVybi5qcyIsImhlamxmcmFtL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL3NldFByb3RvdHlwZU9mLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvdHlwZW9mLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL2kxOG5leHQtaHR0cC1iYWNrZW5kL2Nqcy9nZXRGZXRjaC5qcyIsImhlamxmcmFtL25vZGVfbW9kdWxlcy9pMThuZXh0LWh0dHAtYmFja2VuZC9janMvaW5kZXguanMiLCJoZWpsZnJhbS9ub2RlX21vZHVsZXMvaTE4bmV4dC1odHRwLWJhY2tlbmQvY2pzL3JlcXVlc3QuanMiLCJoZWpsZnJhbS9ub2RlX21vZHVsZXMvaTE4bmV4dC1odHRwLWJhY2tlbmQvY2pzL3V0aWxzLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL2kxOG5leHQvZGlzdC9janMvaTE4bmV4dC5qcyIsImhlamxmcmFtL25vZGVfbW9kdWxlcy9ub2RlLWZldGNoL2Jyb3dzZXIuanMiLCJoZWpsZnJhbS9wbGFpbmFwcC5qcyIsImhlamxmcmFtL3JhZGlvLmpzIiwiaGVqbGZyYW0vdmFsaWRhdGlvblByb3RvY29sLmpzIiwid3JhbmEvd2ViY29tbW9ucy9odHRwaGVscGVyLmpzIiwid3JhbmEvd2ViY29tbW9ucy9tb2RlbC9kYXRhc3RvcmUuanMiLCJ3cmFuYS93ZWJjb21tb25zL21vZGVsL2RhdGFzdG9yZVJlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0dUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ2YXIgaGVqbCA9IHJlcXVpcmUoJy4uL2hlamxmcmFtL2hlamwnKTtcclxuXHJcbmNvbnN0IHsgSGVqbEhhbUFwcCB9ID0gcmVxdWlyZSgnLi4vaGVqbGZyYW0vaGFtYXBwJyk7XHJcblxyXG5cclxuY29uc3QgQ0xDQVJEID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL2NsY2FyZCcpXHJcblxyXG4vLyBjcmVhdGUgbWFpbiBjb250ZW50IHBhbmVcclxudmFyIGhlamxDb250ZW50ID0gRElWKCkuY2xhc3MoXCJjb250YWluZXJcIikuY29sbGVjdGlvbihkYXRhPT5kYXRhLFxyXG4gICAgKGNoZWNrbGlzdCk9PiBDTENBUkQoXCJzdGRcIixjaGVja2xpc3QudGl0bGUsY2hlY2tsaXN0PT5jaGVja2xpc3QpXHJcbilcclxuXHJcbi8vIGNyZWF0ZSBnZW5lcmFsIGFwcGxpY2F0aW9uIGxheW91dFxyXG52YXIgaGVqbFJvb3QgPSAobmV3IEhlamxIYW1BcHAoKSkuY29udGVudChoZWpsQ29udGVudCk7XHJcblxyXG4vLyB0YWtlIHBvaW50ZXIgdG8gc2lkZSBuYXZpZ2F0aW9uIHBhbmVsIChtYWluIG1lbnUpXHJcbnZhciBzaWRlTmF2ID0gaGVqbFJvb3Quc2lkZW5hdjtcclxuXHJcbi8vIHNldHVwIGxvZ28gb3ZlcmxheSBvZiBsYXlvdXRcclxudmFyIGxvZ29PdmVybGF5ID0gRElWKFwibG9nb092ZXJsYXlcIikuY2xhc3MoXCJib3RyaWdodFwiKS5zdGFjayhbXHJcbiAgICBTUEFOKCkudGV4dEJpbmRlcigoKT0+dXNlcigpLmRpc3BsYXlOYW1lKS5jbGFzcyhcIm92ZXJsb2dvXCIpXHJcbl0pO1xyXG5sb2dvT3ZlcmxheS5iaW5kKHVzZXIoKSk7XHJcbnNpZGVOYXYubG9nb0NvbnQuYnVpbGQoKS5hcHBlbmRDaGlsZChsb2dvT3ZlcmxheS5idWlsZCgpKTtcclxuXHJcbi8vIHNldHVwIG1haW4gbWVudSBpdGVtc1xyXG52YXIgbWVudUl0ZW1zID0gW1xyXG4gICAgc2lkZU1lbnVJdGVtKFwibWlUZW1wbGF0ZXNcIixbXCJyaS1mb2xkZXJzLWZpbGxcIl0sXCJDaGVja2xpc3QgVGVtcGxhdGVzXCIpLFxyXG4gICAgc2lkZU1lbnVJdGVtKFwibWl0TmV3XCIsW1wicmktYWRkLWZpbGxcIl0sXCJOZXcgQ2hlY2tsaXN0XCIsKCk9PlxyXG4gICAge1xyXG4gICAgICAgIGd1aW1vZGVsLmxpc3QgPSBbeyBpdGVtczogW10gfV1cclxuICAgIH0pLFxyXG4gICAgc2lkZU1lbnVJdGVtKFwibWl0TG9nb3V0XCIsW1wicmktbG9nb3V0LWJveC1saW5lXCJdLFwiTG9nb3V0XCIsKCk9PlxyXG4gICAge1xyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCJ1c2VyL2xvZ291dFwiXHJcbiAgICB9KSxcclxuICAgIHNpZGVNZW51SXRlbShcIm1pdExvZ291dFwiLFtcInJpLXVzZXItbGluZVwiXSxcIlByb2ZpbGVcIiwoKT0+XHJcbiAgICB7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBcInVzZXIvcHJvZmlsZVwiXHJcbiAgICB9KVxyXG5cclxuXVxyXG5zaWRlTmF2Lm1lbnVDb250LnN0YWNrKG1lbnVJdGVtcyk7XHJcblxyXG5oZWpsLnNldFRpdGxlKG1hbmlmZXN0LnRpdGxlKTtcclxuaGVqbC5zZXRIZWpsUm9vdChoZWpsUm9vdCk7XHJcbiAgICBcclxuXHJcbi8vIGluaXRpYWxpemUgYXBwbGljYXRpb24gYmFja2dyb3VuZCBzZXJ2aWNlc1xyXG5jb25zdCB7RGF0YVN0b3JlLGZpbGVzfSA9IHJlcXVpcmUoXCIuLi93cmFuYS93ZWJjb21tb25zL21vZGVsL2RhdGFzdG9yZVwiKTtcclxuXHJcblxyXG52YXIgZ3VpbW9kZWwgPSB7fVxyXG5cclxuLy8gYnVzaW5lc3MgbG9naWNcclxuY29uc3QgdGVtcGxhdGVzQmFnID0gZmlsZXMudGVtcGxhdGVzO1xyXG5cclxudGVtcGxhdGVzQmFnLmxpc3QoKS50aGVuKGRhdGE9PlxyXG57XHJcbiAgICBndWltb2RlbC5saXN0ID0gZGF0YTtcclxuICAgIGhlamxSb290LmJpbmQoZGF0YSk7XHJcbn0pXHJcblxyXG4gICAgXHJcbiIsIlxyXG5jb25zdCB7IENBUkQgfSA9IHJlcXVpcmUoJy4uLy4uL2hlamxmcmFtL2NhcmQnKTtcclxuY29uc3QgeyBlZGl0YWJsZVRleHR9ID0gcmVxdWlyZSgnLi4vLi4vaGVqbGZyYW0vY29tcG9uZW50cy9lZGl0YWJsZVRleHQnKTtcclxuXHJcbmZ1bmN0aW9uIENMQ0FSRChjb2xvcix0aXRsZSxiaW5kZXIpXHJcbntcclxuICAgIHZhciBjdXJkYXRhO1xyXG4gICAgdmFyIG15ZGF0YTtcclxuICAgIHZhciBlZGl0TW9kZSA9IGZhbHNlO1xyXG4gICAgZnVuY3Rpb24gaW5FZGl0TW9kZSgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGVkaXRNb2RlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZGlzcGxheUNvbXBsZXRpb24oY2hlY2tsaXN0KVxyXG4gICAge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IGNoZWNrbGlzdC5pdGVtczs7XHJcbiAgICAgICAgaWYoaXRlbXMgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgdmFyIGZpbGxlZCA9IDA7XHJcbiAgICAgICAgaXRlbXMuZm9yRWFjaChpdD0+e1xyXG4gICAgICAgICAgICBpZihpdC5kb25lKVxyXG4gICAgICAgICAgICAgICAgZmlsbGVkKys7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiAgXCIgKFwiK2ZpbGxlZCtcIi9cIitjdXJkYXRhLml0ZW1zLmxlbmd0aCtcIilcIjtcclxuICAgIH1cclxuICAgIHZhciBydiA9IENBUkQodGl0bGUpO1xyXG4gICAgcnYuY2xhc3MoY29sb3IrXCJDYXJkXCIpLmJpbmRlcigoZGF0YSk9PntcclxuICAgICAgICAgY3VyZGF0YT1kYXRhO1xyXG4gICAgICAgIG15ZGF0YSA9ICBiaW5kZXIoZGF0YSk7XHJcbiAgICAgICAgcmV0dXJuIG15ZGF0YTsgXHJcbiAgICB9KVxyXG4gICAgLmhlYWRlckludGVybmFscyhbXHJcbiAgICAgICBIT1JJWk9OVEFMKCkuc3RhY2soW1xyXG4gICAgICAgICAgICBlZGl0YWJsZVRleHQoSDIoKSwodmFsLGVsLHVwZCk9PntcclxuICAgICAgICAgICAgICAgIGlmKHZhbCAhPSBudWxsICYmIHVwZCkgXHJcbiAgICAgICAgICAgICAgICAgICAgbXlkYXRhLnRpdGxlID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG15ZGF0YS50aXRsZTtcclxuICAgICAgICAgICAgfSxpbkVkaXRNb2RlKSxcclxuICAgICAgICAgICAgSDIoKS5jbGFzcyhcInBhZGxlZnRcIikudGV4dEJpbmRlcigoKT0+ZGlzcGxheUNvbXBsZXRpb24oY3VyZGF0YSkpXHJcbiAgICAgICAgXSksXHJcbiAgICAgICAgcnYuX2J1dHRvbkFyZWFdKVxyXG4gICAgLmJ1dHRvbnMoW1xyXG4gICAgICAgIFNXSVRDSEJVVFRPTihbXCJyaS10b2dnbGUtZmlsbFwiXSxbXCJyaS10b2dnbGUtbGluZVwiXSkuY2xhc3MoW1wicmktMnhcIl0pLmNoZWNrKChldmVudCxidXR0b24pPT57XHJcbiAgICAgICAgICAgIHJ2LnNob3dCb2R5ID0gIXJ2LnNob3dCb2R5O1xyXG4gICAgICAgICAgICBydi5iaW5kKGN1cmRhdGEpO1xyXG4gICAgICAgIH0pLmJpbmRDaGVja2VkKCgpPT5ydi5zaG93Qm9keSksXHJcbiAgICAgICAgQ0xCVVRUT04oW1wicmktbW9yZS0yLWZpbGxcIixcInJpLTJ4XCJdLCgpPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJ2LnRvZ2dsZUNvbnRleHRNZW51KCk7XHJcbiAgICAgICAgfSldKVxyXG4gICAgLmNvbnRleHRNZW51SXRlbXMoW1xyXG4gICAgICBjb250ZXh0TWVudUl0ZW0oXCJDTE9ORVwiLFtcInJpLWZpbGUtY29weS1maWxsXCJdLFwiQ2xvbmVcIixhc3luYyAoZXZlbnQsYnV0dG9uKT0+e1xyXG4gICAgICAgICAgICB2YXIgbmV3ZGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobXlkYXRhKSk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBuZXdkYXRhLl9pZDtcclxuICAgICAgICAgICAgYXdhaXQgZmlsZXMuaW5zdGFuY2VzLnNhdmUobmV3ZGF0YSlcclxuICAgICAgICAgICAgZ3VpbW9kZWwubGlzdC5wdXNoKG5ld2RhdGEpO1xyXG4gICAgICAgICAgICBoZWpsUm9vdC5yZWJpbmQoKTtcclxuICAgICAgICAgICAgIHJ2LmJpbmQoY3VyZGF0YSk7XHJcbiAgICAgICAgIH0pLFxyXG4gICAgICBcclxuICAgICAgICAgY29udGV4dE1lbnVJdGVtKFwiRURJVFwiLFtcInJpLXBlbmNpbC1maWxsXCJdLFwiRWRpdFwiLGFzeW5jIChldmVudCxidXR0b24pPT57XHJcbiAgICAgICAgICAgICBlZGl0TW9kZSA9ICFlZGl0TW9kZTtcclxuICAgICAgICAgICAgIHJ2LmJpbmQoY3VyZGF0YSk7XHJcbiAgICAgICAgIH0pXHJcbiAgICBdKSAgICAgICAgICAgXHJcbiAgICAuYm9keUNvbGxlY3Rpb24oXHJcbiAgICAgICAgZGF0YT0+ZGF0YS5pdGVtcyxcclxuICAgICAgICAoaXRlbSk9PntcclxuICAgICAgICAgICAgdmFyIHJ2aSA9IEhQQU5FTCgpLmNsYXNzKFtcInNwYWNlQmV0d2VlblwiLFwiY2hlY2tsaXN0aXRlbVwiXSkuc3RhY2soW1xyXG4gICAgICAgICAgICAgICAgZWRpdGFibGVUZXh0KFNUUk9ORygpLCh2YWwsZWwsdXBkKT0+e1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHZhbCAhPSBudWxsICYmIHVwZCkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udGl0bGUgPSB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0udGl0bGU7XHJcbiAgICAgICAgICAgICAgICB9LGluRWRpdE1vZGUpLFxyXG4gICAgICAgICAgICAgICAgU1dJVENIQlVUVE9OKFxyXG4gICAgICAgICAgICAgICAgICAgIFtcInJpLWNoZWNrLWZpbGxcIixcImdyZWVuXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIFtcInJpLWNoZWNrLWZpbGxcIixcImdyYXlcIl0pLmNsYXNzKFtcInJpLTJ4XCJdKS5jaGVjaygoY2hlY2tlZCk9PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gY2hlY2tlZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcnYucmViaW5kKCk7ICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfSkuYmluZENoZWNrZWQoKCk9Pml0ZW0uZG9uZSlcclxuICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgcmV0dXJuIHJ2aTtcclxuICAgICAgICB9KS5zdGFja1VwKCk7XHJcbiAgICAgICBcclxuICAgIHJ2Ll9ib2R5LnZpc2libGUoKCk9PnJ2LnNob3dCb2R5KVxyXG4gICAgcmV0dXJuIHJ2O1xyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gQ0xDQVJEOyIsIlxyXG52YXIgZGF0YUZpbGVzID0ge1xyXG4gICAgcmVzdDpcclxuICAgIHtcclxuICAgICAgICB0eXBlOiAncmVzdCcsXHJcbiAgICAgICAgb3B0aW9uczoge30sXHJcbiAgICAgICAgZmlsZXM6IHtcclxuICAgICAgICAgICAgdGVtcGxhdGVzOiB7IHR5cGU6ICdkb2N1bWVudCcsIHVzZXJzcGVjOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIGluc3RhbmNlczogeyB0eXBlOiAnZG9jdW1lbnQnLCB1c2Vyc3BlYzogdHJ1ZSB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5kYXRhRmlsZXMgPSBkYXRhRmlsZXM7XHJcbiAgICBcclxuIiwiY29uc3QgeyBjb250ZXh0TWVudUl0ZW0gfSA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9jb250ZXh0TWVudUl0ZW0nKVxyXG5jb25zdCB7IEhlamxFbGVtZW50IH0gPSByZXF1aXJlKCcuL2hlamxFbGVtZW50Jyk7XHJcblxyXG5jbGFzcyBoZWpsQ2FyZCBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKHRpdGxlLGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJESVZcIixvcHRpb25zKTtcclxuICAgICAgICB0aGlzLl9idXR0b25BcmVhID0gICAgIEhPUklaT05UQUwoJ2J1dHRvbkFyZWEnKS5jbGFzcygnYnV0dG9uQXJlYScpO1xyXG4gICAgICAgIHRoaXMuX2hlYWRlckludGVybmFscyA9IFsgIEgyKHRpdGxlKSwgdGhpcy5fYnV0dG9uQXJlYSBdO1xyXG4gICAgICAgIHRoaXMuX2hlYWRlciA9ICBIRUFERVIoKS5jbGFzcyhbXCJyZWxhdGl2ZVwiLFwiaG9yaXpvbnRhbFwiLFwic3BhY2VCZXR3ZWVuXCJdKTtcclxuICAgICAgICB0aGlzLl9ib2R5SW50ZXJuYWxzID0gW107XHJcbiAgICAgICAgdGhpcy5fYm9keSA9IERJVihcImNhcmRib2R5XCIpLmNsYXNzKFtcImNhcmRib2R5XCIsXCJ0YWJMZWZ0XCJdKTtcclxuICAgICAgICB0aGlzLl9jb250ZXh0TWVudSA9IERJVigpLmNsYXNzKFsnY29udGV4dE1lbnUnXSlcclxuICAgICAgICAgLnZpc2libGUoKCk9PnRoaXMuc2hvd0NvbnRleHRNZW51KTtcclxuICAgICAgICB0aGlzLnNob3dCb2R5ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnNob3dDb250ZXh0TWVudSA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgdGl0bGUoaGVqbHRpdGxlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2hlYWRlckludGVybmFscyA9IFsgIGhlamx0aXRsZSwgdGhpcy5fYnV0dG9uQXJlYSBdO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgaGVhZGVyKGgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5faGVhZGVyID0gaDtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGhlYWRlckludGVybmFscyhoaSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9oZWFkZXJJbnRlcm5hbHMgPSBoaTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgXHJcbiAgICBidXR0b25zKGIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYnV0dG9uQXJlYS5zdGFjayhiKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGJvZHkoYilcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9ib2R5ID0gYjtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGJvZHlTdGFjayhiKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2JvZHlJbnRlcm5hbHMgPSBiO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgYm9keUNvbGxlY3Rpb24oaXRlbUNhbGxiYWNrLGl0ZW1WaWV3Q2FsbGJhY2spXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYm9keS5jb2xsZWN0aW9uKGl0ZW1DYWxsYmFjayxpdGVtVmlld0NhbGxiYWNrKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGNvbnRleHRNZW51SXRlbXMoaXRzKVxyXG4gICAge1xyXG4gICAgICAgIGl0cy5mb3JFYWNoKGl0ID0+IHtcclxuICAgICAgICAgICAgaXQuY2FyZCA9IHRoaXM7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dE1lbnUuc3RhY2soaXRzKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIHRvZ2dsZUNvbnRleHRNZW51KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNob3dDb250ZXh0TWVudSA9ICF0aGlzLnNob3dDb250ZXh0TWVudTtcclxuICAgICAgICB0aGlzLl9jb250ZXh0TWVudS5oYW5kbGVWaXNpYmlsaXR5KCk7XHJcbiAgICB9XHJcbiAgICBzdGFja1VwKClcclxuICAgIHtcclxuXHJcbiAgICAgICAgdGhpcy5faGVhZGVyLnN0YWNrKHRoaXMuX2hlYWRlckludGVybmFscyk7XHJcbiAgICAgICAgdGhpcy5fYm9keS5zdGFjayh0aGlzLl9ib2R5SW50ZXJuYWxzKTtcclxuICAgICAgICB0aGlzLnN0YWNrKFtcclxuICAgICAgICAgICAgdGhpcy5faGVhZGVyLFxyXG4gICAgICAgICAgICBESVYoKS5jbGFzcygncmVsYXRpdmUnKS5zdGFjayhbdGhpcy5fY29udGV4dE1lbnVdKSxcclxuICAgICAgICAgICAgdGhpcy5fYm9keV0pO1xyXG4gICBcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIFxyXG59XHJcbiBmdW5jdGlvbiBDQVJEKHRpdGxlLGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbENhcmQodGl0bGUsaWQsb3B0aW9ucyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLkNBUkQgPSBDQVJEO1xyXG5tb2R1bGUuZXhwb3J0cy5oZWpsQ2FyZCA9IGhlamxDYXJkOyIsImZ1bmN0aW9uIGNvbnRleHRNZW51SXRlbShpZCxpY29uQ2xhc3NlcyxsYWJlbCxjYWxsYmFjaylcclxue1xyXG5cclxuICAgIHZhciBydiA9IERJVihpZCkuY2xhc3MoXCJjb250ZXh0TWVudUl0ZW1cIikuc3RhY2soW1xyXG4gICAgICAgIFNQQU4obnVsbCxpZCtcIl9pY29uXCIpLmNsYXNzKGljb25DbGFzc2VzKSxcclxuICAgICAgICBTUEFOKGxhYmVsLGlkK1wiX3RleHRcIikuY2xhc3MoJ2xhYmVsJyldKVxyXG4gICAgLmNsaWNrKChldmVudCxoZWpsKT0+XHJcbiAgICB7XHJcbiAgICAgICAgaWYoaGVqbC5jYXJkICYmIGhlamwuY2FyZC50b2dnbGVDb250ZXh0TWVudSlcclxuICAgICAgICAgICAgaGVqbC5jYXJkLnRvZ2dsZUNvbnRleHRNZW51KCk7XHJcbiAgICAgICAgY2FsbGJhY2soZXZlbnQsaGVqbCk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBydjtcclxufVxyXG5pZighd2luZG93Lm5vSGVqbEdsb2JhbHMpXHJcbntcclxuICAgIHdpbmRvdy5jb250ZXh0TWVudUl0ZW0gPSBjb250ZXh0TWVudUl0ZW07XHJcbn1cclxubW9kdWxlLmV4cG9ydHMuY29udGV4dE1lbnVJdGVtID0gY29udGV4dE1lbnVJdGVtOyIsImZ1bmN0aW9uIGVkaXRhYmxlVGV4dCh0ZXh0RWxlbWVudCxiaW5kZXIsZWRpdEJpbmRlcixpZCxvcHRpb25zKVxyXG57XHJcbiAgICB2YXIgcnYgPSBESVYoKS5zdGFjayhcclxuICAgICAgICAgICAgWyB0ZXh0RWxlbWVudC50ZXh0QmluZGVyKGJpbmRlcikudmlzaWJsZSgoKT0+IWVkaXRCaW5kZXIoKSksXHJcbiAgICAgICAgICAgICAgICBJTlBVVCgpLnRleHRCaW5kZXIoYmluZGVyKS52aXNpYmxlKGVkaXRCaW5kZXIpXHJcbiAgICBdKTtcclxuICAgIHJldHVybiBydjtcclxufVxyXG5cclxuaWYoIXdpbmRvdy5ub0hlamxHbG9iYWxzKVxyXG57XHJcbiAgICB3aW5kb3cuZWRpdGFibGVUZXh0ID0gZWRpdGFibGVUZXh0O1xyXG59XHJcbm1vZHVsZS5leHBvcnRzLmVkaXRhYmxlVGV4dCA9IGVkaXRhYmxlVGV4dDsiLCJ2YXIgaGVqbCA9IHJlcXVpcmUoJy4vaGVqbCcpO1xyXG52YXIge0hlamxFbGVtZW50IH0gPSByZXF1aXJlKCcuL2hlamxFbGVtZW50Jyk7XHJcblxyXG52YXIgeyBIZWpsQXBwIH0gPSByZXF1aXJlKCcuL3BsYWluYXBwJyk7IFxyXG5cclxuY2xhc3MgSGVqbEhhbUFwcCBleHRlbmRzIEhlamxBcHBcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxvcHRpb25zKTtcclxuICAgICAgICB0aGlzLmNsYXNzKFtcImhhbUxheW91dFwiXSk7XHJcblxyXG4gICAgICAgIHRoaXMuc2lkZW5hdiA9IFNJREVOQVYoKTtcclxuICAgICAgICB0aGlzLmhhbUJ1dHRvbiA9IG5ldyBoZWpsSGFtQnV0dG9uKCk7XHJcbiAgICAgICAgdGhpcy5zaWRlTmF2VmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaGFtQnV0dG9uLmNsaWNrKCgpPT57XHJcbiAgICAgICAgICAgIHRoaXMuc2lkZU5hdlZpc2libGUgPSAhdGhpcy5zaWRlTmF2VmlzaWJsZVxyXG4gICAgICAgICAgICB0aGlzLnNpZGVuYXYuaGFuZGxlVmlzaWJpbGl0eSgpO1xyXG4gICAgICAgICAgICB0aGlzLmhhbUJ1dHRvbi5yZWJpbmQoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmhhbUJ1dHRvbi5iaW5kZXIoKGRhdGEsYnQpPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuc2lkZU5hdlZpc2libGUpXHJcbiAgICAgICAgICAgICAgICBidC5idWlsZCgpLmNsYXNzTGlzdC5hZGQoXCJvcGVuZWRcIik7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGJ0LmJ1aWxkKCkuY2xhc3NMaXN0LnJlbW92ZShcIm9wZW5lZFwiKTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLnNpZGVuYXYudmlzaWJsZSgoKT0+dGhpcy5zaWRlTmF2VmlzaWJsZSk7XHJcbiAgICB9XHJcblxyXG4gIFxyXG4gICAgY29udGVudChjb250ZW50KVxyXG4gICAge1xyXG4gICAgICAgIGNvbnRlbnQuY2xhc3MoXCJoYW1Db250ZW50XCIpO1xyXG4gICAgICAgIHJldHVybiBzdXBlci5jb250ZW50KGNvbnRlbnQpXHJcbiAgICB9XHJcbiAgICBzdGFja1VwKClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnN0YWNrKFt0aGlzLnByb2dyZXMsdGhpcy5kaWFsb2dQYW5lLHRoaXMuaGFtQnV0dG9uLHRoaXMuc2lkZW5hdix0aGlzLmNvbnRlbnRFbF0pXHJcbiAgICB9XHJcbiAgICBtZW51aXRlbXMoaXRzKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc2lkZW5hdi5tZW51Q29udC5zdGFjayhpdHMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcbmNsYXNzIGhlamxIYW1CdXR0b24gZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHR5cGVvZiBpZCA9PSBcIm9iamVjdFwiKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb3B0aW9ucyA9IGlkXHJcbiAgICAgICAgICAgIGlkID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoaWQgPT0gbnVsbClcclxuICAgICAgICAgICAgaWQ9XCJIYW1CdXR0b25cIlxyXG5cclxuICAgICAgICBzdXBlcihpZCxcIkRJVlwiLG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMuY2xhc3MoW1wiaGFtQnV0dG9uXCIsXCJyaS1tZW51LWZpbGxcIixcInJpLTJ4XCJdKTtcclxuXHJcbiAgICAgICAvLyB0aGlzLnNpZGVuYXYgPSBTSURFTkFWKCk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5jbGFzcyBoZWpsU2lkZU5hdiBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJESVZcIixvcHRpb25zKTtcclxuICAgICAgICB0aGlzLmNsYXNzKFwic2lkZW5hdlwiKTtcclxuICAgICAgIC8vIHRoaXMuY2xhc3MoW1wiaG9yaXpvbnRhbFwiLFwicmVsYXRpdmVcIl0pO1xyXG4gICAgICAgdGhpcy5sb2dvQ29udCA9IERJVihcImxvZ29Db250XCIpLmNsYXNzKFwicmVsYXRpdmVcIik7XHJcbiAgICAgICB0aGlzLmxvZ28gPSBJTUcoXCJsb2dvXCIpLnNyYyhcImltYWdlcy9sb2dvLnN2Z1wiKTtcclxuICAgICAgIHRoaXMubG9nb0NvbnQuc3RhY2soW3RoaXMubG9nb10pXHJcbiAgICAgICB0aGlzLm1lbnVDb250ID0gRElWKFwibWVudUNvbnRcIikuY2xhc3MoXCJ2ZXJ0aWNhbFwiKTtcclxuICAgICAgICB0aGlzLnN0YWNrVXAoKTtcclxuICAgICAgIC8vIHRoaXMuc2lkZW5hdiA9IFNJREVOQVYoKTtcclxuICAgIH1cclxuICAgIHN0YWNrVXAoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc3RhY2soW3RoaXMubG9nb0NvbnQsdGhpcy5tZW51Q29udF0pO1xyXG4gICAgfVxyXG59XHJcbndpbmRvdy5TSURFTkFWID0gZnVuY3Rpb24oaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBoZWpsU2lkZU5hdihpZCxvcHRpb25zKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2lkZU1lbnVJdGVtKGlkLGljb25DbGFzc2VzLGxhYmVsLGNhbGxiYWNrKVxyXG57XHJcblxyXG4gICAgdmFyIHJ2ID0gRElWKGlkKS5jbGFzcyhcIm5hdkJhck1lbnVJdGVtXCIpLnN0YWNrKFtcclxuICAgICAgICBTUEFOKG51bGwsaWQrXCJfaWNvblwiKS5jbGFzcyhpY29uQ2xhc3NlcyksXHJcbiAgICAgICAgU1BBTihsYWJlbCxpZCtcIl90ZXh0XCIpXSkuY2xpY2soY2FsbGJhY2spO1xyXG4gICAgcmV0dXJuIHJ2O1xyXG59XHJcblxyXG5pZighd2luZG93Lm5vSGVqbEdsb2JhbHMpXHJcbntcclxuICAgIHdpbmRvdy5IQU1MQVlPVVQgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgaGVqbEhhbUxheW91dChpZCxvcHRpb25zKTtcclxuICAgIH1cclxuICAgIHdpbmRvdy5zaWRlTWVudUl0ZW0gPSBzaWRlTWVudUl0ZW07XHJcbn1cclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMuSGVqbEhhbUFwcCA9IEhlamxIYW1BcHA7XHJcbiIsIlxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsZnVuY3Rpb24oKVxyXG57XHJcbiAgaGVqbEJvb3QoKTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBoZWpsQm9vdCgpXHJcbntcclxuICAgIHZhciBkb21Ob2RlID0gcm9vdC5idWlsZCgpO1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb21Ob2RlKVxyXG59XHJcbnZhciByb290O1xyXG5mdW5jdGlvbiBzZXRIZWpsUm9vdChoZWpsTm9kZSlcclxue1xyXG4gICAgcm9vdCA9IGhlamxOb2RlO1xyXG4gICAgbW9kdWxlLmV4cG9ydHMucm9vdCA9IHJvb3Q7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFRpdGxlKHRpdGxlKVxyXG57XHJcbiAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGVzdHJ1Y3R1cmUobW9kdmFyLG1vZClcclxue1xyXG4gIHZhciBydiA9IFwiXCI7XHJcbiBcclxuICAgIGZvcihsZXQgayBpbiBtb2QpXHJcbiAgICAgIHJ2ICs9IChydi5sZW5ndGggPiAwID8gXCIsXCI6IFwiXCIpICsgaztcclxuICAgIHJ2ID0gXCJjb25zdCB7IFwiK3J2K1wifSA9IFwiK21vZHZhcitcIjtcXG5cIjtcclxuICAgIGNvbnNvbGUubG9nKFwiZGVzdHJ1Y3R1cmluZzogXCIrIG1vZHZhcixydilcclxuICByZXR1cm4gcnY7XHJcbn1cclxud2luZG93LmRlc3RydWN0dXJlID0gZGVzdHJ1Y3R1cmU7XHJcbm1vZHVsZS5leHBvcnRzLnNldEhlamxSb290ID0gc2V0SGVqbFJvb3Q7XHJcbm1vZHVsZS5leHBvcnRzLnNldFRpdGxlID0gc2V0VGl0bGU7XHJcblxyXG5yZXF1aXJlKCcuL2hlamxFbGVtZW50Jyk7XHJcbnJlcXVpcmUoXCIuL2hlamxpMThuXCIpO1xyXG5yZXF1aXJlKCcuL3JhZGlvJykiLCJcclxuY29uc3QgeyBIZWpsVmFsaWRhdGlvblByb3RvY29sLCBIZWpsVmFsaWRhdGlvbk1lc3NhZ2UsSGVqbFZhbGlkYXRpb25XYXJuaW5nLEhlamxWYWxpZGF0aW9uTm90ZX0gPSAgcmVxdWlyZSgnLi92YWxpZGF0aW9uUHJvdG9jb2wnKVxyXG5cclxuXHJcblxyXG4gIC8qKlxyXG4gICAgKiBjYWxsYmFjayBmb3IgdGggYWJkdWN0b3IgZnVuY3Rpb25hbGl0eVxyXG4gICAgKiBAY2FsbGJhY2sgSGVqbEVsZW1lbnR+a2lkbmFwcGVyQ2FsbGJhY2sgXHJcbiAgICAqIEBwYXJhbSB7SGVqbEVsZW1lbnR9IGNoaWxkIHRvIGJlIFxyXG4gICAgKiBAcGFyYW0ge0hlamxFbGVtZW50fSBuZXN0b3Iga2VlcGVyIG9mIHRoZSBuZXN0IG9mIGNoaWxkXHJcbiAgICAqIEByZXR1cm5zIHtIZWpsRWxlbWVudHx1bmRlZmluZWR9IHBvdGVuY2lvbmFsIGN1Y2tvbyBlZ2dcclxuICAgICovXHJcblxyXG5jbGFzcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxkb21FbGVtZW50TmFtZSxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgICAgIGlmKHR5cGVvZiBpZCA9PSBcIm9iamVjdFwiKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gaWQ7XHJcbiAgICAgICAgICAgIGlkID0gb3B0aW9ucy5pZDtcclxuICAgICAgICB9ICAgICAgICAgICBcclxuXHJcbiAgICAgICAgaWYodHlwZW9mIGRvbUVsZW1lbnROYW1lID09IFwib2JqZWN0XCIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBkb21FbGVtZW50TmFtZTtcclxuICAgICAgICAgICAgZG9tRWxlbWVudE5hbWUgPSBvcHRpb25zLmRvbUVsZW1lbnROYW1lO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGlzLm9wdGlvbnMgPT0gbnVsbClcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0geyBpZDogaWR9O1xyXG5cclxuICAgICAgICB0aGlzLmNoaWxkcmVuID1bXTtcclxuICAgICAgICB0aGlzLm9wdGlvbnMuZG9tRWxlbWVudE5hbWUgPSBkb21FbGVtZW50TmFtZTtcclxuICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy52YWxpZGF0b3JzID0gW107XHJcbiAgICAgICAgdGhpcy5teVZhbGlkYXRpb25SZXN1bHQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMudmxpZGF0aW9uUmVzdWx0ID0gbnVsbDtcclxuICAgICAgICB0aGlzLmtpZG5hcHBlcnMgPSBbXTtcclxuICAgICAgICB0aGlzLm15SWQgPSB0aGlzLmdlbmVyYXRlSWQoaWQpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmRlcnMgPSBbXTtcclxuICAgIH1cclxuICAgIHByb2Nlc3Nvcihwcm9jZXNGdW5jKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucHJvY2VzRnVuYyA9IHByb2Nlc0Z1bmM7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBiaW5kZXIoYmluZEZ1bmMpXHJcbiAgICB7XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShiaW5kRnVuYykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmRGdW5jID0gYmluZEZ1bmNbMF1cclxuICAgICAgICAgICAgdGhpcy51cGRhdGVyKGJpbmRGdW5jWzFdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aGlzLmJpbmRGdW5jID0gYmluZEZ1bmM7XHJcbiAgICAgICAgdGhpcy50cnlJZEhpbnQoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIHRyeUlkSGludCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5iaW5kRnVuYy5oaW50SWQpXHJcbiAgICAgICAgdGhpcy5pZCh0aGlzLmJpbmRGdW5jLmhpbnRJZCgpKTtcclxuICAgIH1cclxuICAgIHVwZGF0ZXIodXBkYXRlRnVuYylcclxuICAgIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZUZ1bmMgPSB1cGRhdGVGdW5jO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgdXBkYXRlKHZhbClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLnVwZGF0ZUZ1bmMpXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRnVuYyh2YWwsdGhpcy5tb2RlbCx0aGlzKTtcclxuICAgICAgICBlbHNlIGlmKHRoaXMucGFyZW50KVxyXG4gICAgICAgICAgICB0aGlzLnBhcmVudC51cGRhdGUodmFsKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkhFSkw6IG5vIHVwZGF0ZXIgZm91bmQgZm9yIHZhbHVlXCIsdmFsKTtcclxuICAgIH1cclxuICAgIHRleHRCaW5kZXIoYmluZEZ1bmMpXHJcbiAgICB7XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShiaW5kRnVuYykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZ2V0dGVyID0gYmluZEZ1bmNbMF07XHJcbiAgICAgICAgICAgIHZhciBzZXR0ZXIgPSBiaW5kRnVuY1sxXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudGV4dEJpbmRGdW5jID0gZnVuY3Rpb24odmFsLGVsLHNldHRpbmcpXHJcbiAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYoc2V0dGluZylcclxuICAgICAgICAgICAgICAgICAgIHNldHRlcih2YWwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0dGVyKGVsKTtcclxuXHJcbiAgICAgICAgICAgfSAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgdGhpcy50ZXh0QmluZEZ1bmMgPSBiaW5kRnVuYztcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIHJlYmluZCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5fcmViaW5kU2NoZWR1bGVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fcmViaW5kU2NoZWR1bGVkLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9yZWJpbmRTY2hlZHVsZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYmluZCh0aGlzLm1vZGVsKVxyXG4gICAgfVxyXG4gICAgc2NoZWR1bGVSZWJpbmQodG1vKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRtbyA9PSBudWxsKVxyXG4gICAgICAgICAgICB0bW8gPSAxMDA7XHJcbiAgICAgICAgIGlmKHRoaXMuX3JlYmluZFNjaGVkdWxlZClcclxuICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICB0aGlzLl9yZWJpbmRTY2hlZHVsZWQgPSAgVElNRU9VVCh0aGlzLnJlYmluZC5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuICAgIHRyeVByb2Nlc3NvcigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5wcm9jZXNGdW5jICYmICF0aGlzLnByb2Nlc3NEb25lKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzRG9uZSA9IFRSWUMoKCk9PnRoaXMucHJvY2VzRnVuYyh0aGlzKSlcclxuICAgICAgICAgICAgaWYodGhpcy5wcm9jZXNEb25lID09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0RvbmUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGRlZmF1bHQoZGVmYXVsdE1vZGVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdE1vZGVsID1kZWZhdWx0TW9kZWw7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGJpbmQoZGF0YSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm1vZGVsID0gZGF0YTtcclxuICAgICBcclxuICAgICAgICBcclxuICAgICAgIHRoaXMuX3RyeU5lc3RpbmcoKTtcclxuICAgICAgIHRoaXMudHJ5UHJvY2Vzc29yKCk7XHJcbiAgICAgICAgaWYodGhpcy5iaW5kRnVuYyAhPSBudWxsKVxyXG4gICAgICAgICAgICBkYXRhID0gVFJZQygoKT0+dGhpcy5iaW5kRnVuYyhkYXRhLHRoaXMpKTtcclxuICAgICAgICB0aGlzLmV4dHJhY3RlZE1vZGVsID0gZGF0YTtcclxuXHJcbiAgICAgICAgaWYoIXRoaXMuaGFuZGxlVmlzaWJpbGl0eSgpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdGhpcy5jaGVja0Vycm9ySGlnbGlnaHQoKTtcclxuICAgICAgICBpZih0aGlzLmV4dHJhY3RlZE1vZGVsID09IG51bGwgJiYgdGhpcy5kZWZhdWx0TW9kZWwgIT0gbnVsbClcclxuICAgICAgICAgICAgdGhpcy5leHRyYWN0ZWRNb2RlbCA9IHRoaXMuZGVmYXVsdE1vZGVsO1xyXG4gICAgICAgIGlmKHRoaXMuZXh0cmFjdGVkTW9kZWwgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgLy8gYmluZCBjaGlsZHJlbiB3aXRoIHN1Ym1vZGVsXHJcbiAgICAgICAgVFJZQygoKT0+dGhpcy5oYW5kbGVUZXh0QmluZCgpKTtcclxuICAgICAgIFxyXG4gICAgICAgbGV0IGlzY29sID0gdGhpcy5oYW5kbGVDb2xsZWN0aW9uQmluZCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChjaGlsZD0+e1xyXG4gICAgICAgICAgICBjaGlsZC5iaW5kKGlzY29sID8gY2hpbGQubW9kZWw6ZGF0YSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBoYW5kbGVUZXh0QmluZCgpXHJcbiAgICB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYodGhpcy50ZXh0QmluZEZ1bmMgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0eHQgPSBcIlwiO1xyXG4gICAgICAgICAgICB2YXIgdHh0ID0gVFJZQygoKT0+dGhpcy50ZXh0QmluZEZ1bmModGhpcy5leHRyYWN0ZWRNb2RlbCx0aGlzKSk7XHJcbiAgICAgICAgICAgIGlmKHR4dCA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgdHh0ID0gXCJcIjtcclxuICAgICAgICAgICAgdGhpcy50ZXh0KHR4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgfVxyXG4gICAgaGFuZGxlVmlzaWJpbGl0eSgpXHJcbiAgICB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYodGhpcy52aXNpYmxlQ2FsbGJhY2spXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0aGlzLm9yaWdpbmFsRGlzcGxheSA9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luYWxEaXNwbGF5ID0gdGhpcy5idWlsZCgpLnN0eWxlLmRpc3BsYXk7XHJcbiAgICAgICAgICAgICAgICBpZighdGhpcy5vcmlnaW5hbERpc3BsYXkpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5hbERpc3BsYXkgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgdmlzaWJsZSA9IHRoaXMuZXh0cmFjdGVkTW9kZWwgJiYgVFJZQygoKT0+dGhpcy52aXNpYmxlQ2FsbGJhY2sodGhpcy5leHRyYWN0ZWRNb2RlbCx0aGlzKSk7XHJcbiAgICAgICAgICAgIGlmKCF2aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idWlsZCgpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgIGVsc2UgaWYodGhpcy5vcmlnaW5hbERpc3BsYXkgPT0gZmFsc2UpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkKCkuc3R5bGUuZGlzcGxheSA9IG51bGw7XHJcbiAgICAgICAgICAgIGVsc2UgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkKCkuc3R5bGUuZGlzcGxheSA9IHRoaXMub3JpZ2luYWxEaXNwbGF5O1xyXG5cclxuICAgICAgICAgIHJldHVybiB2aXNpYmxlID09PSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGhhbmRsZUNvbGxlY3Rpb25CaW5kKClcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLml0ZW1DYWxsYmFjayA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGNvbCA9IFRSWUMoKCk9PnRoaXMuaXRlbUNhbGxiYWNrKHRoaXMuZXh0cmFjdGVkTW9kZWwsdGhpcyksW10pO1xyXG4gICAgICAgIHZhciBpdHMgPSBbXTtcclxuICAgICAgICBpZihjb2wgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkhFSkw6IENvbGxlY3Rpb24gYmluZGVyIHJldHVybiBudWxsLCBpdCBpcyBpbnRlbmRlZCA/XCIsdGhpcy5pdGVtQ2FsbGJhY2spO1xyXG4gICAgICAgICAgICBjb2wgPSBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoY29sLmZvckVhY2ggPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJIRUpMOiBDb2xsZWN0aW9uIGJpbmRlciBkaWQgbm90IHJldHVybiBjb2xsZWN0aW9uIHdpdGggZm9yRWFjaCBtZXRob2RcIix0aGlzLml0ZW1DYWxsYmFjayk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29sLmZvckVhY2goaXRlbT0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciB2aWV3ID0gVFJZQygoKT0+dGhpcy5pdGVtVmlld0NhbGxiYWNrKGl0ZW0sdGhpcy5leHRyYWN0ZWRNb2RlbCx0aGlzLm1vZGVsKSk7XHJcbiAgICAgICAgICAgICAgICBpdHMucHVzaCh2aWV3KTtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMubmVzdClcclxuICAgICAgICAgICAgICAgICAgICB2aWV3Ll90cnlBZGRUb05lc3QodGhpcy5uZXN0KTtcclxuICAgICAgICAgICAgICAgIHZpZXcubW9kZWwgPSBpdGVtO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmJ1aWxkKCkudGV4dENvbnRlbnQ9XCJcIjtcclxuICAgICAgICB0aGlzLnN0YWNrKGl0cyk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIFxyXG4gICAgfVxyXG4gICBidWlsZCgpXHJcbiAgIHtcclxuICAgICAgIGlmKHRoaXMuZG9tRWxlbWVudCA9PSBudWxsKVxyXG4gICAgICAge1xyXG4gICAgICAgIHZhciBvaWQgPSB0aGlzLm9wdGlvbnMuaWQ7XHJcbiAgICAgICAgdGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0aGlzLm9wdGlvbnMuZG9tRWxlbWVudE5hbWUpO1xyXG4gICAgICBcclxuICAgICAgIHRoaXMuX3NldHVwSWQoKTtcclxuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuX2pzRWxlbWVudCA9IHRoaXM7XHJcbiAgICAgICAgaWYodGhpcy5vcHRpb25zICE9IG51bGwgJiYgdGhpcy5vcHRpb25zLmF0dHJzICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IobGV0IGF0dHIgaW4gdGhpcy5vcHRpb25zLmF0dHJzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsICA9IHRoaXMub3B0aW9ucy5hdHRyc1thdHRyXTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZG9tRWxlbWVudFthdHRyXSA9IHZhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRyeVByb2Nlc3NvcigpO1xyXG4gICAgICAgfVxyXG4gICAgICAgcmV0dXJuIHRoaXMuZG9tRWxlbWVudDtcclxuICAgfVxyXG4gICBpZChpZClcclxuICAge1xyXG4gICAgIHRoaXMubXlJZCA9IHRoaXMuZ2VuZXJhdGVJZChpZCk7XHJcbiAgICAgdGhpcy5vcHRpb25zLmlkID0gaWQ7XHJcbiAgICAgdGhpcy5idWlsZCgpO1xyXG4gICAgIHRoaXMuX3NldHVwSWQoKTtcclxuICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG4gICAgX3NldHVwSWQoKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBvaWQgPSB0aGlzLm9wdGlvbnMuaWQ7XHJcbiAgICAgICAgaWYodGhpcy5teUlkKVxyXG4gICAgICAgICAgICB0aGlzLmRvbUVsZW1lbnQuaWQgPSB0aGlzLm15SWQ7XHJcbiAgICAgICAgaWYob2lkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kb21FbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUob2lkKTtcclxuICAgICAgICAgICAgdGhpcy5kb21FbGVtZW50LmNsYXNzTGlzdC5hZGQob2lkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgIGF0dGFjaChkb21FbGVtZW50Um9vdClcclxuICAge1xyXG4gICAgICAgaWYoZG9tRWxlbWVudFJvb3QgPT0gbnVsbClcclxuICAgICAgICBkb21FbGVtZW50Um9vdCA9IGRvY3VtZW50LmJvZHk7XHJcbiAgICAgIHZhciBteWVsID0gZG9tRWxlbWVudFJvb3QuZ2V0RWxlbWVudEJ5SWQodGhpcy5teUlkKTtcclxuICAgICAgaWYobXllbCAhPSBudWxsKVxyXG4gICAgICB7XHJcbiAgICAgICAgdGhpcy5kb21FbGVtZW50ID0gbXllbDtcclxuICAgICAgICB0aGlzLmRvbUVsZW1lbnQuX2pzRWxlbWVudCA9IHRoaXM7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgIH1cclxuICAgIFxyXG4gICBnZW5lcmF0ZUlkKGlkKVxyXG4gICB7XHJcbiAgICAgICBpZihpZCAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQgPSBpZCtcIl9cIitIZWpsRWxlbWVudC5pZFNlcXVlbmNlKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgcmV0dXJuIGlkO1xyXG4gICB9XHJcblxyXG4gICBjbGFzcyhzcGVjKVxyXG4gICB7XHJcbiAgICAgICBpZih0eXBlb2Ygc3BlYyA9PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAgICBzcGVjID0gW3NwZWNdO1xyXG4gICAgICAgIHNwZWMuZm9yRWFjaChjbD0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVpbGQoKS5jbGFzc0xpc3QuYWRkKGNsKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcblxyXG4gICBnZXQgY2xhc3NMaXN0KClcclxuICAge1xyXG4gICAgICAgcmV0dXJuIHRoaXMuYnVpbGQoKS5jbGFzc0xpc3Q7XHJcbiAgIH1cclxuICAgaHRtbCh0ZXh0KVxyXG4gICB7XHJcbiAgICAgICBpZih0ZXh0ID09IG51bGwpXHJcbiAgICAgICAgdGV4dCA9IFwiXCI7XHJcbiAgICAgICB0aGlzLmJ1aWxkKCkuaW5uZXJIVE1MID0gdGV4dDtcclxuICAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcbiAgIHRleHQodGV4dClcclxuICAge1xyXG4gICAgICAgaWYodGV4dCA9PSBudWxsKVxyXG4gICAgICAgIHRleHQgPSBcIlwiO1xyXG4gICAgICAgdGhpcy5idWlsZCgpLmlubmVyVGV4dCA9IHRleHQ7XHJcbiAgICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG5cclxuICAgcmVtb3ZlQ2hpbGRyZW4oKVxyXG4gICB7XHJcbiAgICAgICB0aGlzLmNoaWxkcmVuID0gW107XHJcbiAgICAgICB0aGlzLmJ1aWxkKCkuaW5uZXJUZXh0ID0gXCJcIjtcclxuICAgfVxyXG5cclxuICAgLyoqXHJcbiAgICAqIGNyZWF0ZSBuZXN0IGZvciBjaGlkbHJlbiByZXF1ZXN0aW5nIG5lc3RpbmdcclxuICAgICogdGhpcyBtYXJrcyB0aGUgbmVzdGluZy5cclxuICAgICogbmVzdCBpcyBzaW1wbGUgb2JqZWN0IGFuZCB0aGUgY2hpbGRyZW4gYXJlIGhlcmUgYXMgcHJvcGVydGllc1xyXG4gICAgKi9cclxuICAgbmVzdG9yKClcclxuICAge1xyXG4gICAgICAgdGhpcy5uZXN0ID0ge31cclxuICAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcbiAgIC8qKlxyXG4gICAgKnJldWVzdCBuZXN0aW5nIGluIG5lc3RpbmcgY29udGV4dCBvZiBpdHMgcGFyZW50XHJcbiAgICAqIGVsZW1lbnQgaGFzIHRvIGhhdmUgc3BlY2lmaWVkIGlkIHRvIGJlIG5lc3RlZFxyXG4gICAgKiBAcGFyYW0ge2Jvb2xlYW58dW5kZWZpbmVkfSBkb25lc3QgXHJcbiAgICAqL1xyXG4gICBuZXN0TWUoZG9uZXN0KVxyXG4gICB7XHJcbiAgICAgdGhpcy5fbmVzdE1lID0gZG9uZXN0ID09IHVuZGVmaW5lZCA/IHRydWUgOiBkb25lc3RcclxuICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG5cclxuICAgLyoqXHJcbiAgICAqIGNhbGxlZCBhcyBwYXJ0IG9mIGJpbmQuXHJcbiAgICAqIHRyaWVzIHBvcHVsYXRlIG93biBuZXN0IHdpdGggbmVzdGluZyByZXF1ZXN0aW5nIGNoaWxkcmVuXHJcbiAgICAqL1xyXG4gICBfdHJ5TmVzdGluZygpXHJcbiAgIHtcclxuICAgICAgIGlmKCF0aGlzLm5lc3QgfHwgdGhpcy5fbmVzdGluZ0RvbmUpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB0aGlzLl9uZXN0aW5nRG9uZSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fdHJ5TmVzdENoaWxkcmVuKHRoaXMubmVzdClcclxuICAgICAgICB0aGlzLmtpZG5hcHBlcnMuZm9yRWFjaChrcmVjb3JkPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBraWQgaW4gdGhpcy5uZXN0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHRoaXMubmVzdFtraWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICBpZihrcmVjb3JkLmNoaWxkSWQgPT0gbnVsbCB8fCBraWQgPT0ga3JlY29yZC5jaGlsZElkKVxyXG4gICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3Vja29vRWdnID0gVFJZQygoKT0+a3JlY29yZC5raWRuYXBwZXIoY2hpbGQsdGhpcykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgaWYoY3Vja29vRWdnICYmIGN1Y2tvb0VnZyAhPT0gY2hpbGQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9pbnN0YWxsIGN1Y2tvbyBlZ2dcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5lc3Rba2lkXSA9IGN1Y2tvb0VnZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5wYXJlbnQuX2luc3RhbGxDdWNrb29FZ2coY3Vja29vRWdnLGNoaWxkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICB9XHJcbiAgIF90cnlBZGRUb05lc3QobmVzdClcclxuICAge1xyXG4gICAgICAgXHJcbiAgICAgICAgaWYodGhpcy5fbmVzdE1lICYmIHRoaXMub3B0aW9ucy5pZClcclxuICAgICAgICAgICAgbmVzdFt0aGlzLm9wdGlvbnMuaWRdID0gdGhpczsgLy8gbmVzdCBcclxuICAgICAgICBcclxuICAgICAgICBpZih0aGlzLm5lc3QpXHJcbiAgICAgICAgICAgIHJldHVybjsgLy8gYm9yZGVyIG9mIG5lc3RpbmcgY29udGV4dFxyXG4gICAgICAgIHRoaXMuX3RyeU5lc3RDaGlsZHJlbihuZXN0KTtcclxuICAgICAgICBcclxuICAgfVxyXG4gICBpc0RpcnR5KClcclxuICAge1xyXG4gICAgICAgdmFyIHJ2O1xyXG4gICAgICAgaWYodGhpcy5kaXJ0eSlcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICBpZih0aGlzLm5lc3QpXHJcbiAgICAgICAgICAgZm9yKHZhciBrIGluIHRoaXMubmVzdClcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMubmVzdFtrXS5pc0RpcnR5KCkpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICB9XHJcbiAgIF90cnlOZXN0Q2hpbGRyZW4obmVzdClcclxuICAge1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaCgoYyk9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYy5fdHJ5QWRkVG9OZXN0KG5lc3QpO1xyXG4gICAgICAgIH0pXHJcbiAgIH1cclxuIFxyXG4gICAvKipcclxuICAgICoga2lkbmFwZXIgY2FuIGludGVyY2VwdCBhbGwgY2hpbGRyZWQgaW4gdGhlIG5lc3QuXHJcbiAgICAqIEFidXNlIHRoZW0gIGFuZCBjYW4gcmVwbGFjZSB0aGVtIHdpdGggaXRzIG93biBIZWpsRWxlbWVudCAoY3Vja29vIGVnZylcclxuICAgICogdGhlIGNoaWxkIHdpdGggaWQgeW91IGFyZSBpbnRlcmVzdGVkIHRvIGNhbiBiZSBzcGVjaWZpZWQgYnkgY2hpbGRJZFxyXG4gICAgKiBAcGFyYW0ge0hlamxFbGVtZW50fmtpZG5hcHBlckNhbGxiYWNrfSBraWRuYXBwZXJcclxuICAgICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBjaGlsZElkIFxyXG4gICAgKi9cclxuICAgYWJkdWN0b3Ioa2lkbmFwcGVyLGNoaWxkSWQpXHJcbiAgIHtcclxuICAgICAgICB0aGlzLmtpZG5hcHBlcnMucHVzaCh7IGtpZG5hcHBlcjoga2lkbmFwcGVyLCBjaGlsZElkOmNoaWxkSWQgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgIH1cclxuICAgLyoqXHJcbiAgICAqIHJlcGxhY2VzIHRoZSBnaXZlbiBhY3R1YWwgY2hpbGQgd2l0aCB0aGUgbmV3IG9uZVxyXG4gICAgKiBAcGFyYW0ge0hlamxFbGVtZW50fSBjdWNrb29FZ2cgbmV3IGVsZW1lbnQgdG8gYmUgaW5zdGFsbGVkXHJcbiAgICAqIEBwYXJhbSB7SGVqbEVsZW1lbnR9IGNoaWxkIGVsZW1lbnQgdG8gYmUgcmVwbGFjZWRcclxuICAgICovXHJcbiAgIF9pbnN0YWxsQ3Vja29vRWdnKGN1Y2tvb0VnZyxjaGlsZClcclxuICAge1xyXG4gICAgICAgdmFyIGlkeCA9IHRoaXMuY2hpbGRyZW4uaW5kZXhPZihjaGlsZCk7XHJcbiAgICAgICBpZihpZHggPT0gLTEpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuY3Vja29vRWdnLmlkKGNoaWxkLm15SWQpO1xyXG4gICAgICAgIHRoaXMuY3Vja29vRWdnLm9wdGlvbnMuaWQgPSBjaGlsZC5vcHRpb25zLmlkO1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKGlkeCwxLFtjdWNrb29FZ2ddKVxyXG4gICAgICB0aGlzLmJ1aWxkKCkucmVwbGFjZUNoaWxkKGN1Y2tvb0VnZy5idWlsZCgpLCBjaGlsZC5idWlsZCgpKTtcclxuICAgfVxyXG5cclxuICAgX2luc3RhbGxDaGlsZChjaGlsZClcclxuICAge1xyXG4gICAgICAgIGxldCBpbnN0YWxsQ2hpbGQgPSAoY2hpbGQpPT5cclxuICAgICAgICB7XHJcbiAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICAgY2hpbGQucGFyZW50ID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5idWlsZCgpLmFwcGVuZENoaWxkKGNoaWxkLmJ1aWxkKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihjaGlsZC5uZXh0ICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkb1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZ2NoaWxkID0gY2hpbGQubmV4dCgpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYoZ2NoaWxkID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBpbnN0YWxsQ2hpbGQoZ2NoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aGlsZSh0cnVlIClcclxuICAgICAgICB9IGVsc2VcclxuICAgICAgICBpbnN0YWxsQ2hpbGQoY2hpbGQpO1xyXG4gICB9XHJcbiAgIHN0YWNrKGNoaWxkcmVuKVxyXG4gICB7XHJcbiAgICAgICB0aGlzLnJlbW92ZUNoaWxkcmVuKCk7XHJcbiAgICAgICB0aGlzLmNoaWxkcmVuID0gW107XHJcblxyXG4gICBcclxuICAgICAgIGNoaWxkcmVuLmZvckVhY2godGhpcy5faW5zdGFsbENoaWxkLmJpbmQodGhpcykpXHJcbiAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcbiAgXHJcbiAgIHN0YWNrQWRkKGNoaWxkcmVuKVxyXG4gICB7XHJcbiAgICAgIGlmKCFBcnJheS5pc0FycmF5KGNoaWxkcmVuKSlcclxuICAgICAgICAgICAgY2hpbGRyZW4gPSBbIGNoaWxkcmVuIF07XHJcbiAgICAgLy8gdGhpcy5jaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW4uY29uY2F0KGNoaWxkcmVuKTtcclxuICAgICAgIGNoaWxkcmVuLmZvckVhY2godGhpcy5faW5zdGFsbENoaWxkLmJpbmQodGhpcykpXHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcblxyXG4gICBjbGljayhjbGlja0NhbGxiYWNrKVxyXG4gICB7XHJcbiAgICAgICBpZihjbGlja0NhbGxiYWNrID09IG51bGwpXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICB0aGlzLmNsaWNrQ2FsbGJhY2sgPSBjbGlja0NhbGxiYWNrO1xyXG4gICAgICAgdGhpcy5idWlsZCgpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyxcclxuICAgICAgIChldmVudCk9PntcclxuICAgICAgICAgIFRSWUMoKCk9PntcclxuICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja0NhbGxiYWNrKGV2ZW50LHRoaXMpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICB9KTtcclxuICAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcbiAgIFxyXG4gICB2aXNpYmxlKGNhbGxiYWNrKVxyXG4gICB7XHJcbiAgICAgICB0aGlzLnZpc2libGVDYWxsYmFjayA9IGNhbGxiYWNrO1xyXG4gICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgIH1cclxuXHJcbiAgIGNvbGxlY3Rpb24oaXRlbUNhbGxiYWNrLGl0ZW1WaWV3Q2FsbGJhY2spXHJcbiAgIHtcclxuICAgICAgIHRoaXMuaXRlbUNhbGxiYWNrID0gaXRlbUNhbGxiYWNrO1xyXG4gICAgICAgdGhpcy5pdGVtVmlld0NhbGxiYWNrID0gaXRlbVZpZXdDYWxsYmFjaztcclxuICAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcblxyXG5cclxuIFxyXG4gICB2YWxpZGF0b3IodmFsaWRhdG9yQ2IpXHJcbiAgIHtcclxuICAgICAgIHRoaXMudmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvckNiKTtcclxuICAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcblxyXG4gICB2YWxpZGF0ZShwcm90b2NvbClcclxuICAge1xyXG4gICAgICAgXHJcbiAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0ID0gbmV3IEhlamxWYWxpZGF0aW9uUHJvdG9jb2woKTtcclxuICAgICAgICB0aGlzLm15VmFsaWRhdGlvblJlc3VsdCA9IG5ldyBIZWpsVmFsaWRhdGlvblByb3RvY29sKCk7XHJcbiAgICAgICAgdGhpcy52YWxpZGF0b3JzLmZvckVhY2godj0+XHJcbiAgICAgICAgICAgIFRSWUMoKCk9PnYodGhpcywgdGhpcy5teVZhbGlkYXRpb25SZXN1bHQpKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdC5tZXJnZSh0aGlzLm15VmFsaWRhdGlvblJlc3VsdCk7XHJcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0Lm1lcmdlKGNoaWxkLnZhbGlkYXRlKCkpO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZihwcm90b2NvbCAhPSBudWxsKVxyXG4gICAgICAgICAgICBwcm90b2NvbC5tZXJnZSh0aGlzLnZhbGlkYXRpb25SZXN1bHQpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcHJvdG9jb2wgPSB0aGlzLnZhbGlkYXRpb25SZXN1bHQ7XHJcblxyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0RXJyb3IoKTtcclxuICAgICAgICByZXR1cm4gcHJvdG9jb2w7XHJcbiAgIH1cclxuICAgY2hlY2tFcnJvckhpZ2xpZ2h0KClcclxuICAge1xyXG4gICAgICAgIGlmKHRoaXMubXlWYWxpZGF0aW9uUmVzdWx0KSAvL3ZhbGlkYXRlZCBvbmNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0RXJyb3IoKTtcclxuICAgICAgICB9XHJcbiAgIH1cclxuICAgaGlnaGxpZ2h0RXJyb3IoKVxyXG4gICB7XHJcbiAgICAgICB0aGlzLmJ1aWxkKCkuY2xhc3NMaXN0LnJlbW92ZShcImVycm9yXCIpXHJcbiAgICAgICBpZih0aGlzLmJ1aWxkKCkucGFyZW50RWxlbWVudCA9PSBudWxsKVxyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICBpZih0aGlzLmVycm9yRWwpXHJcbiAgICAgICAgICB0aGlzLmJ1aWxkKCkucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmVycm9yRWwpO1xyXG4gICAgICAgZGVsZXRlIHRoaXMuZXJyb3JFbDtcclxuICAgICAgIHRoaXMuYnVpbGQoKS5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2lucHV0Jyk7XHJcbiAgICAgICBpZih0aGlzLmlzSW5FcnJvcigpKVxyXG4gICAgICAge1xyXG4gICAgICAgICAgIHZhciBlcnIgPSB0aGlzLm15VmFsaWRhdGlvblJlc3VsdC5kaXNwbGF5RXJyb3JzKCk7XHJcbiAgICAgICAgICAgdGhpcy5lcnJvckVsID0gY3JlYXRlRWxlbWVudEZyb21IVE1MKFwiPHNwYW4gY2xhc3M9J3Rvb2x0aXAgZXJyb3InIGlkPSdcIit0aGlzLm15SWQrXCJfZXJyb3InID5cIitlcnIrXCI8L3NwYW4+XCIpO1xyXG4gICAgICAgIC8vICB2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhcmdldCcpO1xyXG4gICAgICAgICAgIHRoaXMuYnVpbGQoKS5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2lucHV0Jyk7XHJcbiAgICAgICAgICAgdGhpcy5idWlsZCgpLnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lcnJvckVsKTtcclxuICAgICAgICAgICB0aGlzLmJ1aWxkKCkuY2xhc3NMaXN0LmFkZCgnZXJyb3InKTtcclxuICAgICAgIH0gXHJcbiAgICAgICAgXHJcbiAgIH1cclxuICAgaXNJbkVycm9yKClcclxuICAge1xyXG4gICAgICAgaWYoIXRoaXMubXlWYWxpZGF0aW9uUmVzdWx0KVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgIHZhciBydiA9ICB0aGlzLm15VmFsaWRhdGlvblJlc3VsdC5oYXNFcnJvcnMoKTtcclxuICAgICAgIHJldHVybiBydjtcclxuICAgfVxyXG5cclxuICAgLyoqXHJcbiAgICAqIE5hbWUgb2YgZmllbGQgdG8gYmUgdXNlZCBpbiB2YWxpZGF0aW9uIG1lc3NhZ2VzXHJcbiAgICAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZExhYmVsIGRpc3BsYXlhYmxlIG5hbWUgb2YgZmllbGRcclxuICAgICovXHJcbiAgIGxhYmVsKGZpZWxkTGFiZWwpXHJcbiAgIHtcclxuICAgICAgIHRoaXMuZmllbGRMYWJlbCA9IGZpZWxkTGFiZWw7XHJcbiAgICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG4gICBsb29rdXBGaWVsZExhYmVsKClcclxuICAge1xyXG4gICAgaWYodGhpcy5maWVsZExhYmVsICE9IG51bGwpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmllbGRMYWJlbDtcclxuICAgIGlmKHRoaXMucGFyZW50ICE9IG51bGwpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50Lmxvb2t1cEZpZWxkTGFiZWwoKTtcclxuICAgIHJldHVybiB0aGlzLm15SWQ7XHJcbiAgIH1cclxuICAgcmVxdWlyZWQoY2IpXHJcbiAgIHtcclxuICAgICAgIHRoaXMudmFsaWRhdG9yKChlbCxwcm90b2NvbCk9PlxyXG4gICAgICAge1xyXG4gICAgICAgICAgIGlmKCF0aGlzLmNoZWNrRmlsbGVkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgIGlmKGNiICYmIGNiKCk9PWZhbHNlKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgIHZhciBmaWxsZWQgPSB0aGlzLmNoZWNrRmlsbGVkKCk7XHJcbiAgICAgICAgICBpZighZmlsbGVkKVxyXG4gICAgICAgICAgICAgICBwcm90b2NvbC5hZGRFcnJvcih0aGlzLmxvb2t1cEZpZWxkTGFiZWwoKSxcIlBvbGUgbXVzw60gYsO9dCB2eXBsbsSbbm9cIik7XHJcbiAgICAgICB9KVxyXG4gICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgIH1cclxufVxyXG5IZWpsRWxlbWVudC5pZFNlcXVlbmNlID0gMDtcclxuXHJcbmNsYXNzIGhlamxESVYgZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiRElWXCIsb3B0aW9ucylcclxuICAgIH1cclxufVxyXG53aW5kb3cuRElWID0gZnVuY3Rpb24oaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBoZWpsRElWKGlkLG9wdGlvbnMpO1xyXG59XHJcbmNsYXNzIGhlamxTUEFOIGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIlNQQU5cIixvcHRpb25zKVxyXG4gICAgfVxyXG59XHJcbndpbmRvdy5TUEFOID0gZnVuY3Rpb24odGV4dCxpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxTUEFOKGlkLG9wdGlvbnMpLnRleHQodGV4dCk7XHJcbn1cclxuXHJcbmNsYXNzIGhlamxMQUJFTCBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJMQUJFTFwiLG9wdGlvbnMpXHJcbiAgICB9XHJcbiAgICBmb3IoZm9ydGV4dClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmZvcnRleHQgPSBmb3J0ZXh0O1xyXG4gICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgYmluZChtKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuZm9ydGV4dCAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHR4dCA9IHRoaXMuZm9ydGV4dDtcclxuICAgICAgICAgICAgaWYodHlwZW9mIHRoaXMuZm9ydGV4dCAhPT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgICAgIHR4dCA9IHRoaXMuZm9ydGV4dC5teUlkO1xyXG4gICAgICAgICAgICB0aGlzLmJ1aWxkKCkuc2V0QXR0cmlidXRlKFwiZm9yXCIsdHh0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHN1cGVyLmJpbmQobSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbndpbmRvdy5MQUJFTCA9IGZ1bmN0aW9uKHRleHQsaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBoZWpsTEFCRUwoaWQsb3B0aW9ucykudGV4dCh0ZXh0KTtcclxufVxyXG5cclxuY2xhc3MgaGVqbFNUUk9ORyBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJTVFJPTkdcIixvcHRpb25zKVxyXG4gICAgfVxyXG59XHJcbndpbmRvdy5TVFJPTkcgPSBmdW5jdGlvbih0ZXh0LGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbFNUUk9ORyhpZCxvcHRpb25zKS50ZXh0KHRleHQpO1xyXG59XHJcblxyXG5cclxuY2xhc3MgaGVqbFNtYWxsIGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIlNNQUxMXCIsb3B0aW9ucylcclxuICAgIH1cclxufVxyXG53aW5kb3cuU01BTEwgPSBmdW5jdGlvbih0ZXh0LGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbFNtYWxsKGlkLG9wdGlvbnMpLnRleHQodGV4dCk7XHJcbn1cclxuXHJcbndpbmRvdy5ESVYgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxESVYoaWQsb3B0aW9ucyk7XHJcbn1cclxuY2xhc3MgaGVqbEgxIGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIkgxXCIsb3B0aW9ucylcclxuICAgIH1cclxufVxyXG53aW5kb3cuSDEgPSBmdW5jdGlvbiAodGV4dCxpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxIMShpZCxvcHRpb25zKS50ZXh0KHRleHQpO1xyXG59XHJcblxyXG5jbGFzcyBoZWpsSDIgZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiSDJcIixvcHRpb25zKVxyXG4gICAgfVxyXG59XHJcbndpbmRvdy5IMiA9IGZ1bmN0aW9uICh0ZXh0LGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbEgyKGlkLG9wdGlvbnMpLnRleHQodGV4dCk7XHJcbn1cclxuXHJcbmNsYXNzIGhlamxIMyBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJIM1wiLG9wdGlvbnMpXHJcbiAgICB9XHJcbn1cclxud2luZG93LkgzID0gZnVuY3Rpb24gKHRleHQsaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBoZWpsSDMoaWQsb3B0aW9ucykudGV4dCh0ZXh0KTtcclxufVxyXG5jbGFzcyBoZWpsSDQgZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiSDRcIixvcHRpb25zKVxyXG4gICAgfVxyXG59XHJcbndpbmRvdy5INCA9IGZ1bmN0aW9uICh0ZXh0LGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbEg0KGlkLG9wdGlvbnMpLnRleHQodGV4dCk7XHJcbn1cclxuY2xhc3MgaGVqbElGUkFNRSBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJJRlJBTUVcIixvcHRpb25zKTtcclxuICAgICAgICB0aGlzLmJ1aWxkKCkub25sb2FkID0gdGhpcy5vbklmcmFtZUxvYWRlZC5iaW5kKHRoaXMpO1xyXG4gICAgfVxyXG4gICAgc3JjKHNyYylcclxuICAgIHtcclxuICAgICAgICBpZihzcmM9PW51bGwpXHJcbiAgICAgICAgICAgIHNyYyA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5idWlsZCgpLnNyYyA9IHNyYztcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgXHJcbiAgICBzcmNiaW5kZXIoYmluZGVyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3NyY2JpbmRlciA9IGJpbmRlcjtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGJpbmQoZGF0YSlcclxuICAgIHtcclxuICAgICAgICBzdXBlci5iaW5kKGRhdGEpO1xyXG4gICAgICAgIGlmKHRoaXMuX3NyY2JpbmRlcilcclxuICAgICAgICAgVFJZQygoKT0+dGhpcy5zcmModGhpcy5fc3JjYmluZGVyKHRoaXMuZXh0cmFjdGVkTW9kZWwpKSk7XHJcbiAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgb25JZnJhbWVMb2FkZWQoKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG59XHJcblxyXG53aW5kb3cuSUZSQU1FID0gZnVuY3Rpb24oc3JjLGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiAobmV3IGhlamxJRlJBTUUoaWQsb3B0aW9ucykpLnNyYyhzcmMpO1xyXG59XHJcbmNsYXNzIGhlamxCVVRUT04gZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiQlVUVE9OXCIsb3B0aW9ucylcclxuICAgIH1cclxuICAgIGJ1aWxkKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcnYgPSBzdXBlci5idWlsZCgpO1xyXG4gICAgICAgIHJ2LnNldEF0dHJpYnV0ZShcInR5cGVcIixcImJ1dHRvblwiKVxyXG4gICAgICAgIHJldHVybiBydjtcclxuICAgIH1cclxufVxyXG53aW5kb3cuQlVUVE9OID0gZnVuY3Rpb24odGV4dCxjbGlja0NhbGxiYWNrLGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbEJVVFRPTihpZCxvcHRpb25zKS50ZXh0KHRleHQpLmNsaWNrKGNsaWNrQ2FsbGJhY2spO1xyXG59XHJcbndpbmRvdy5DTEJVVFRPTiA9IGZ1bmN0aW9uKGNsYXNzZXMsY2xpY2tDYWxsYmFjayxpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxCVVRUT04oaWQsb3B0aW9ucykuY2xhc3MoY2xhc3NlcykuY2xpY2soY2xpY2tDYWxsYmFjayk7XHJcbn1cclxuXHJcbmNsYXNzIGhlamxTZWxlY3QgZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiU0VMRUNUXCIsb3B0aW9ucylcclxuICAgIH1cclxuICAgIG9wdHMob3B0c0NiLG9wdEJpbmRlcilcclxuICAgIHtcclxuXHJcbiAgICAgICAgdGhpcy5vcHRzQ2IgPSBvcHRzQ2I7XHJcbiAgICAgICAgdGhpcy5vcHRCaW5kZXIgPSBvcHRCaW5kZXIgPT0gbnVsbCA/XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzaG93OiAoaXQpPT5pdC5uYW1lLFxyXG4gICAgICAgICAgICBrZXk6IChpdCk9Pml0LnZhbHVlXHJcbiAgICAgICAgfTpvcHRCaW5kZXI7XHJcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uKHRoaXMub3B0c0NiLHRoaXMuY3JlYXRlT3B0aW9uLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgY3JlYXRlT3B0aW9uKG9wdClcclxuICAgIHtcclxuICAgICAgICB2YXIgcnYgPSBuZXcgSGVqbEVsZW1lbnQodW5kZWZpbmVkLFwiT1BUSU9OXCIpXHJcbiAgICAgICAgcnYudGV4dCh0aGlzLm9wdEJpbmRlci5zaG93KG9wdCkpO1xyXG4gICAgICAgIHJ2LmJ1aWxkKCkudmFsdWUgPSB0aGlzLm9wdEJpbmRlci5rZXkob3B0KTtcclxuICAgICAgICByZXR1cm4gcnY7XHJcbiAgICB9XHJcbiAgIHNlbGVjdE9wdGlvbihpZHgpXHJcbiAgIHtcclxuICAgICB0aGlzLmJ1aWxkKCkub3B0aW9ucy5zZWxlY3RlZEluZGV4ID0gaWR4O1xyXG4gICB9XHJcbiAgIGdldCBzZWxlY3RlZE9wdGlvbigpXHJcbiAgIHtcclxuICAgICAgIHJldHVybiB0aGlzLmJ1aWxkKCkub3B0aW9ucy5zZWxlY3RlZEluZGV4O1xyXG4gICB9XHJcbn1cclxud2luZG93LlNFTEVDVCA9IGZ1bmN0aW9uKGlkLG9wdGlvbnMpXHJcbntcclxuICByZXR1cm4gIG5ldyBoZWpsU2VsZWN0KGlkLG9wdGlvbnMpO1xyXG59XHJcbmNsYXNzIGhlamxTd2l0Y2ggZXh0ZW5kcyBoZWpsQlVUVE9OXHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsb3B0aW9ucyk7XHJcbiAgICAgICAgdGhpcy5jaGVja2VkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5jbGljayh0aGlzLmNsaWNrZWQpO1xyXG4gICAgICAgIHRoaXMuX2NoZWNrZWRDbGFzc2VzID0gW107XHJcbiAgICAgICAgdGhpcy5fbm90Q2hlY2tlZENsYXNzZXMgPSBbXTtcclxuICAgIH1cclxuICAgIGJpbmRDaGVja2VkKGNiKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuYmluZENoZWNrZWRDYWxsYmFjayA9IGNiO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgY2xpY2tlZCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5jaGVja2VkID0gIXRoaXMuY2hlY2tlZDtcclxuICAgICAgIHRoaXMuaGFuZGxlQ2hlY2tlZCgpO1xyXG4gICAgICAgaWYodGhpcy5jaGVja2VkQ2FsbGJhY2spXHJcbiAgICAgICAgdGhpcy5jaGVja2VkQ2FsbGJhY2sodGhpcy5jaGVja2VkLHRoaXMpO1xyXG4gICAgfVxyXG4gICAgaGFuZGxlQ2hlY2tlZCgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRvcmVtb3ZlID0gdGhpcy5jaGVja2VkID9cclxuICAgICAgICAgICAgIHRoaXMuX25vdENoZWNrZWRDbGFzc2VzIDogdGhpcy5fY2hlY2tlZENsYXNzZXM7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdG9yZW1vdmUuZm9yRWFjaChjbD0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVpbGQoKS5jbGFzc0xpc3QucmVtb3ZlKGNsKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB2YXIgdG9hZGQgPSB0aGlzLmNoZWNrZWQgP1xyXG4gICAgICAgICAgICAgdGhpcy5fY2hlY2tlZENsYXNzZXMgOiB0aGlzLl9ub3RDaGVja2VkQ2xhc3NlcztcclxuICAgICAgICB0b2FkZC5mb3JFYWNoKGNsPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5idWlsZCgpLmNsYXNzTGlzdC5hZGQoY2wpOyAgIFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICBcclxuICAgIFxyXG4gICAgfVxyXG4gICAgY2hlY2soY2FsbGJhY2spXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jaGVja2VkQ2FsbGJhY2sgPSBjYWxsYmFjaztcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGNoZWNrZWRDbGFzc2VzKGNsYXNzZXMpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fY2hlY2tlZENsYXNzZXMgPSBjbGFzc2VzO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgbm90Q2hlY2tlZENsYXNzZXMoY2xhc3NlcylcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9ub3RDaGVja2VkQ2xhc3NlcyA9IGNsYXNzZXM7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBiaW5kKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIuYmluZChkYXRhKVxyXG4gICAgICAgIGlmKHRoaXMuYmluZENoZWNrZWRDYWxsYmFjaylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hlY2tlZCA9IHRoaXMuYmluZENoZWNrZWRDYWxsYmFjayh0aGlzLmV4dHJhY3RlZE1vZGVsKTtcclxuICAgICAgICAgICAgdGhpcy5oYW5kbGVDaGVja2VkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG53aW5kb3cuU1dJVENIRkEgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gU1dJVENIQlVUVE9OKFtcImZhXCIsXCJmYS10b2dnbGUtb25cIl0sW1wiZmFcIixcImZhLXRvZ2dsZS1vZmZcIl0saWQsb3B0aW9ucyk7XHJcbn1cclxuXHJcbndpbmRvdy5DSEVDS0ZBID0gZnVuY3Rpb24oaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIFNXSVRDSEJVVFRPTihbXCJmYVwiLFwiZmEtY2hlY2stc3F1YXJlXCJdLFtcImZhXCIsXCJmYS1zcXVhcmVcIl0saWQsb3B0aW9ucyk7XHJcbn1cclxuXHJcbndpbmRvdy5TV0lUQ0hCVVRUT04gPSBmdW5jdGlvbihjaGVja2VkQ2xhc3Nlcyxub3RDaGVja2VkQ2xhc3NlcyxpZCxvcHRpb25zKVxyXG57XHJcbiAgICB2YXIgcnYgPSBuZXcgaGVqbFN3aXRjaChpZCxvcHRpb25zKTtcclxuICAgIHJ2LmNoZWNrZWRDbGFzc2VzKGNoZWNrZWRDbGFzc2VzKTtcclxuICAgIHJ2Lm5vdENoZWNrZWRDbGFzc2VzKG5vdENoZWNrZWRDbGFzc2VzKTtcclxuICAgIHJ2LmNsYXNzKFwiYnV0dG9uXCIpO1xyXG4gICAgcmV0dXJuIHJ2O1xyXG5cclxufVxyXG5jbGFzcyBoZWpsSU1HIGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIklNR1wiLG9wdGlvbnMpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHNyYyhzcmMpXHJcbiAgICB7XHJcbiAgICAgICAgaWYoc3JjPT1udWxsKVxyXG4gICAgICAgICAgIHNyYyA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5idWlsZCgpLnNyYyA9IHNyYztcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIHNyY2JpbmRlcihiaW5kZXIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fc3JjYmluZGVyID0gYmluZGVyO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgYmluZChkYXRhKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyLmJpbmQoZGF0YSk7XHJcbiAgICAgICAgaWYodGhpcy5fc3JjYmluZGVyKVxyXG4gICAgICAgICBUUllDKCgpPT50aGlzLnNyYyh0aGlzLl9zcmNiaW5kZXIodGhpcy5leHRyYWN0ZWRNb2RlbCkpKTtcclxuICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn1cclxud2luZG93LklNRyA9IGZ1bmN0aW9uKGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbElNRyhpZCxvcHRpb25zKTtcclxufVxyXG5cclxuY2xhc3MgaGVqbEhFQURFUiBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJIRUFERVJcIixvcHRpb25zKVxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxud2luZG93LkhFQURFUiA9IGZ1bmN0aW9uKGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbEhFQURFUihpZCxvcHRpb25zKTtcclxufVxyXG5jbGFzcyBoZWpsU1ZHIGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIlNWR1wiLG9wdGlvbnMpXHJcblxyXG4gICAgfSBcclxufVxyXG5jbGFzcyBoZWpsSU5QVVQgZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiSU5QVVRcIixvcHRpb25zKVxyXG4gICAgICAgIHRoaXMuaW5wdXRUeXBlID0gXCJURVhUXCI7XHJcbiAgICB9XHJcbiAgICBwbGFjZWhvbGRlcihwbGFjZWhvbGRlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmJ1aWxkKCkucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlcjtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIHR5cGUodHApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pbnB1dFR5cGUgPXRwO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgYnVpbGQoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBydiA9IHN1cGVyLmJ1aWxkKCk7XHJcbiAgICAgICAgaWYoIXRoaXMuc2V0dXBEb25lKVxyXG4gICAgICAgICAgICB0aGlzLnNldHVwSW5wdXQocnYpO1xyXG4gICAgICAgIHRoaXMuc2V0dXBEb25lID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gcnY7XHJcbiAgICB9XHJcbiAgICBzZXR1cElucHV0KHJ2KVxyXG4gICAge1xyXG4gICAgICAgIHJ2LnNldEF0dHJpYnV0ZShcInR5cGVcIix0aGlzLmlucHV0VHlwZSk7XHJcbiAgICAgICAgcnYuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCgpPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSB0aGlzLmJ1aWxkKCkudmFsdWU7XHJcbiAgICAgICAgICAgIHRoaXMucmVzaXplSW5wdXQoKTtcclxuICAgICAgICAgICAgaWYodGhpcy50ZXh0QmluZEZ1bmMpXHJcbiAgICAgICAgICAgICAgdGhpcy50ZXh0QmluZEZ1bmModmFsLHRoaXMsdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgIHRoaXMuY2hlY2tFcnJvckhpZ2xpZ2h0KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIC8vICB0aGlzLnJlc2l6ZUlucHV0KCk7IC8vIGltbWVkaWF0ZWx5IGNhbGwgdGhlIGZ1bmN0aW9uXHJcblxyXG4gICAgICAgXHJcbiAgICB9XHJcbiBcclxuICAgIGF1dG9SZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZG9BdXRvUmVzaXplID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJlc2l6ZUlucHV0KCkge1xyXG4gICAgICAgIGlmKCF0aGlzLmRvQXV0b1Jlc2l6ZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciB2YWwgPSB0aGlzLmJ1aWxkKCkudmFsdWU7XHJcbiAgICAgICAgaWYodmFsID09IG51bGwgfHwgdmFsID09IG51bGwpXHJcbiAgICAgICAgICAgIHRoaXMuYnVpbGQoKS5zdHlsZS53aWR0aCA9IDEwKyBcImNoXCI7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aGlzLmJ1aWxkKCkuc3R5bGUud2lkdGggPSB2YWwubGVuZ3RoKzEgKyBcImNoXCI7XHJcbiAgICB9XHJcbiAgICB0ZXh0KHR4dClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmJ1aWxkKCkudmFsdWUgPSB0eHQ7XHJcbiAgICAgICAgdGhpcy5yZXNpemVJbnB1dCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgY2hlY2tGaWxsZWQoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0ZXh0ID0gdGhpcy5idWlsZCgpLnZhbHVlO1xyXG4gICAgICAgIHJldHVybiB0ZXh0ICE9IG51bGwgJiYgdGV4dCAhPSBcIlwiO1xyXG4gICAgfVxyXG59XHJcbndpbmRvdy5JTlBVVCA9IGZ1bmN0aW9uIChpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxJTlBVVChpZCxvcHRpb25zKTtcclxufVxyXG5cclxuY2xhc3MgaGVqbFRleHRBcmVhIGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIlRFWFRBUkVBXCIsb3B0aW9ucylcclxuICAgIH1cclxuICAgXHJcbiAgICBidWlsZCgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJ2ID0gc3VwZXIuYnVpbGQoKTtcclxuICAgICAgICBpZighdGhpcy5zZXR1cERvbmUpXHJcbiAgICAgICAgICAgIHJ2LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywoKT0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YWwgPSB0aGlzLmJ1aWxkKCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnRleHRCaW5kRnVuYylcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRleHRCaW5kRnVuYyh2YWwsdGhpcyx0cnVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja0Vycm9ySGlnbGlnaHQoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5zZXR1cERvbmUgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiBydjtcclxuICAgIH1cclxuICAgIHRleHQodHh0KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuYnVpbGQoKS52YWx1ZSA9IHR4dDtcclxuICAgIH1cclxuICAgIGNoZWNrRmlsbGVkKClcclxuICAgIHtcclxuICAgICAgICB2YXIgdHh0ID0gIHRoaXMuYnVpbGQoKS52YWx1ZTtcclxuICAgICAgICByZXR1cm4gdHh0ICE9IG51bGwgJiYgdHh0ICE9IFwiXCI7XHJcbiAgICB9XHJcbiAgICBwbGFjZWhvbGRlcihwbGFjZWhvbGRlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmJ1aWxkKCkucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlcjtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufVxyXG53aW5kb3cuVEVYVEFSRUEgPSBmdW5jdGlvbiAoaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBoZWpsVGV4dEFyZWEoaWQsb3B0aW9ucyk7XHJcbn1cclxuXHJcbmNsYXNzIGhlamxWaWRlbyBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJWSURFT1wiLG9wdGlvbnMpXHJcbiAgICB9XHJcbiAgIFxyXG4gICAgYnVpbGQoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBydiA9IHN1cGVyLmJ1aWxkKCk7XHJcbiAgICBcclxuICAgICAgICB0aGlzLnNvdXJjZSA9IG5ldyBIZWpsRWxlbWVudChudWxsLFwiU09VUkNFXCIpO1xyXG4gICAgICAgIHRoaXMuc291cmNlLmJ1aWxkKCkudHlwZT1cInZpZGVvL21wNFwiO1xyXG4gICAgICAgcnYuYXBwZW5kQ2hpbGQoc291cmNlKTtcclxuICAgICAgICByZXR1cm4gcnY7XHJcbiAgICB9XHJcbiAgIHNyYyhzKVxyXG4gICB7XHJcbiAgICBpZihzPT1udWxsKVxyXG4gICAgICAgIHMgPSBcIlwiO1xyXG4gICAgICAgdGhpcy5zb3VyY2Uuc3JjID0gcztcclxuICAgfVxyXG59XHJcbndpbmRvdy5WSURFTyA9IGZ1bmN0aW9uKGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbFZpZGVvKGlkLG9wdGlvbnMpXHJcbn1cclxud2luZG93LkhPUklaT05UQUwgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gRElWKGlkLG9wdGlvbnMpLmNsYXNzKFtcImhvcml6b250YWxcIl0pO1xyXG59XHJcbndpbmRvdy5IUEFORUwgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gSE9SSVpPTlRBTChpZCxvcHRpb25zKS5jbGFzcygnY29udGFpbmVyJyk7XHJcbn1cclxud2luZG93LkhPUklaT05UQUxTQiA9IGZ1bmN0aW9uKGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBIT1JJWk9OVEFMKGlkLG9wdGlvbnMpLmNsYXNzKFwic3BhY2VCZXR3ZWVuXCIpO1xyXG59XHJcbndpbmRvdy5IUEFORUxTQiA9IGZ1bmN0aW9uKGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBIT1JJWk9OVEFMU0IoaWQsb3B0aW9ucykuY2xhc3MoJ2NvbnRhaW5lcicpO1xyXG59XHJcbndpbmRvdy5WRVJUSUNBTCA9IGZ1bmN0aW9uKGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBESVYoaWQsb3B0aW9ucykuY2xhc3MoXCJ2ZXJ0aWNhbFwiKTtcclxufVxyXG53aW5kb3cuVlBBTkVMID0gZnVuY3Rpb24oaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIFZFUlRJQ0FMKGlkLG9wdGlvbnMpLmNsYXNzKCdjb250YWluZXInKTtcclxufVxyXG53aW5kb3cuTkJTUCA9IGZ1bmN0aW9uKClcclxue1xyXG4gICAgcmV0dXJuIFNQQU4oXCJcIikuaHRtbChcIiZuYnNwO1wiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGVqbEludGVydmFsKGNhbGxiYWNrLGludGVydmFsLGNsZWFySW50ZXJ2YWxPbkVycm9yKVxyXG57XHJcbiAgICB2YXIgbiA9IHdpbmRvdy5zZXRJbnRlcnZhbChcclxuICAgICAgICAoKT0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgc3RvcCA9IFRSWUMoY2FsbGJhY2ssY2xlYXJJbnRlcnZhbE9uRXJyb3IpO1xyXG4gICAgICAgICAgICBpZihzdG9wID09IHRydWUpXHJcbiAgICAgICAgICAgICAgICBjbGVhcigpO1xyXG4gICAgICAgIH0saW50ZXJ2YWwpO1xyXG4gICAgZnVuY3Rpb24gY2xlYXIoKVxyXG4gICAge1xyXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKG4pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjbGVhcjogY2xlYXJcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBoZWpsVGltZW91dChjYWxsYmFjayxpbnRlcnZhbClcclxue1xyXG4gICAgdmFyIG4gPSB3aW5kb3cuc2V0VGltZW91dChGVFJZQyhjYWxsYmFjayksaW50ZXJ2YWwpO1xyXG4gICAgZnVuY3Rpb24gY2xlYXIoKVxyXG4gICAge1xyXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQobik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGNsZWFyOiBjbGVhclxyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGhlamxFdmVudExpc3RlbmVyKGV2ZW50SWQsY2FsbGJhY2spXHJcbntcclxuICAgIHZhciByb290ID0gcmVxdWlyZShcIi4vaGVqbFwiKS5yb290O1xyXG4gICAgZnVuY3Rpb24gaGFuZGxlKGUpXHJcbiAgICB7XHJcbiAgICAgICAgY2FsbGJhY2soZS5kZXRhaWwsZSk7XHJcbiAgICB9XHJcbiAgICByb290LmJ1aWxkKCkuYWRkRXZlbnRMaXN0ZW5lcihldmVudElkLGhhbmRsZSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlbW92ZSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByb290LmJ1aWxkKCkucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudElkLGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gc2VuZEV2ZW50KGV2ZW50SWQsZGF0YSlcclxue1xyXG4gICAgdmFyIHJvb3QgPSByZXF1aXJlKFwiLi9oZWpsXCIpLnJvb3Q7XHJcbiAgICB2YXIgZSA9IG5ldyBDdXN0b21FdmVudChldmVudElkLHsgZGV0YWlsOiBkYXRhfSk7XHJcbiAgICByb290LmJ1aWxkKCkuZGlzcGF0Y2hFdmVudChlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2FzY2FkZUNhbGxzKGNhbGxzLGRlZnZhbClcclxue1xyXG4gICAgaWYoIUFycmF5LmlzQXJyYXkoY2FsbHMpKVxyXG4gICAgICAgIGNhbGxzID0gW2NhbGxzXTtcclxuICAgIHZhciByZXMgPSBudWxsO1xyXG4gICBjYWxscy5maW5kKGNhbGw9PlxyXG4gICAge1xyXG4gICAgICAgIHJlcyA9IFRSWUMoKCk9PmNhbGwocmVzKSk7XHJcbiAgICAgICAgcmV0dXJuIHJlcyA9PSBudWxsO1xyXG4gICAgfSlcclxuICAgIHJldHVybiByZXM7XHJcbn1cclxud2luZG93LkNBU0NBREUgPSBjYXNjYWRlQ2FsbHM7XHJcblxyXG5mdW5jdGlvbiB0cnlDKGNhbGwsZGVmVmFsKVxyXG57XHJcbiAgICB0cnlcclxuICAgIHtcclxuICAgICAgIHJldHVybiBjYWxsKCk7XHJcbiAgICB9XHJcbiAgICBjYXRjaChlKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDYWxsIGZhaWxlZCFcIixlKTtcclxuICAgIH1cclxuICAgIHJldHVybiBkZWZWYWw7XHJcbn1cclxud2luZG93LkVWRU5UTElTVEVORVIgPSBoZWpsRXZlbnRMaXN0ZW5lcjtcclxud2luZG93LlNFTkRFVkVOVCA9IHNlbmRFdmVudDtcclxud2luZG93LklOVEVSVkFMID0gaGVqbEludGVydmFsO1xyXG53aW5kb3cuVFJZQyA9IHRyeUM7XHJcbndpbmRvdy5USU1FT1VUID0gaGVqbFRpbWVvdXQ7XHJcbndpbmRvdy5GVFJZQyA9IGZ1bmN0aW9uKGNhbGwsZGVmdmFsKVxyXG57XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIFRSWUMoY2FsbCxkZWZ2YWwpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBoZWpsSW5wdXRGaWxlcyBleHRlbmRzIGhlamxJTlBVVFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMudHlwZT1cImZpbGVcIjsgICAgICAgIFxyXG4gICAgfVxyXG4gICAgbXVsdGlwbGUobSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm11bHRpcGxlID0gbSA9PSBudWxsID8gdHJ1ZSA6IG07XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBzZXR1cElucHV0KHJ2KVxyXG4gICAge1xyXG4gICAgICAgIC8vc3VwZXIuc2V0dXBJbnB1dChlbCk7XHJcbiAgICAgICAgcnYuc2V0QXR0cmlidXRlKFwidHlwZVwiLHRoaXMudHlwZSk7XHJcbiAgICAgICAgaWYodGhpcy5tdWx0aXBsZSlcclxuICAgICAgICAgICAgcnYuc2V0QXR0cmlidXRlKFwibXVsdGlwbGVcIixcIm11bHRpcGxlXCIpXHJcbiAgICAgICAgcnYuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJyx0aGlzLmZpcmVPbkNoYW5nZS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuICAgIGZpcmVPbkNoYW5nZShhcmdzKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuZmlsZUNiICE9IG51bGwpXHJcbiAgICAgICAgICAgIHRoaXMuZmlsZUNiKHRoaXMuYnVpbGQoKS5maWxlcyxhcmdzLHRoaXMpO1xyXG4gICAgICAgIHRoaXMuYnVpbGQoKS52YWx1ZSA9IG51bGw7XHJcbiAgICB9ICAgXHJcbiAgICBvbkZpbGVzKGZpbGVDYilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmZpbGVDYiA9IGZpbGVDYjtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufVxyXG53aW5kb3cuaGVqbElucHV0RmlsZXMgPSBoZWpsSW5wdXRGaWxlcztcclxuZnVuY3Rpb24gSU5QVVRGSUxFUyh0ZXh0LGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHZhciBpbnBIZWpsID0gbmV3IGhlamxJbnB1dEZpbGVzKFwidXBsb2FkSW5wdXRcIixvcHRpb25zKTtcclxuICAgIHZhciBydiA9XHJcbiAgICAgICAgTEFCRUwoXCJcIixpZCxvcHRpb25zKS5zdGFjayhbXHJcbiAgICAgICAgICAgIFNQQU4oKS5jbGFzcyhbXCJmYVwiLFwiZmEtY2xvdWQtdXBsb2FkXCJdKSxcclxuICAgICAgICAgICAgU1BBTihcIiBcIit0ZXh0LFwibGFiZWxcIiksXHJcbiAgICAgICAgICAgIGlucEhlamxcclxuICAgICAgICBdKTtcclxuICAgICAgICBcclxuICAgICAgICBydi5wcm9jZXNzb3IoKGUpPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGUuYnVpbGQoKS5zZXRBdHRyaWJ1dGUoJ2ZvcicsJ3VwbG9hZElucHV0Jyk7XHJcbiAgICAgICAgfSkuY2xhc3MoXCJjdXN0b20tdXBsb2FkXCIpO1xyXG4gICAgcnYubXVsdGlwbGUgPSBmdW5jdGlvbihhcmcpXHJcbiAgICB7XHJcbiAgICAgICAgaW5wSGVqbC5tdWx0aXBsZShhcmcpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgcnYub25GaWxlcyA9IGZ1bmN0aW9uKGNiKVxyXG4gICAge1xyXG4gICAgICAgIGlucEhlamwub25GaWxlcyhjYilcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIHJ2LmlucHV0SGVqbCA9IGlucEhlamw7XHJcbiAgICBydi5wcm9jZXNzSW5wdXRIZWpsID0gZnVuY3Rpb24oY2IpXHJcbiAgICB7XHJcbiAgICAgICAgY2IodGhpcy5pbnB1dEhlamwpXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcnY7XHJcbn1cclxuXHJcblxyXG53aW5kb3cuSU5QVVRGSUxFUyA9IElOUFVURklMRVM7XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5oZWpsRElWID0gaGVqbERJVjtcclxubW9kdWxlLmV4cG9ydHMuSGVqbEVsZW1lbnQgPSBIZWpsRWxlbWVudDtcclxubW9kdWxlLmV4cG9ydHMuaGVqbElGUkFNRSA9IGhlamxJRlJBTUU7IiwiY29uc3QgaTE4bmV4dCA9IHJlcXVpcmUoJ2kxOG5leHQnKTtcclxuY29uc3QgaTE4bmV4dEh0dHBCYWNrZW5kID0gcmVxdWlyZSgnaTE4bmV4dC1odHRwLWJhY2tlbmQnKTtcclxuXHJcblxyXG5pMThuZXh0XHJcbiAgICAudXNlKGkxOG5leHRIdHRwQmFja2VuZClcclxuICAgIC5pbml0KHtcclxuICAgICAgICBsbmc6ICdjcycsXHJcblxyXG4gICAgICAgIC8vIGFsbG93IGtleXMgdG8gYmUgcGhyYXNlcyBoYXZpbmcgYDpgLCBgLmBcclxuICAgICAgICBuc1NlcGFyYXRvcjogZmFsc2UsXHJcbiAgICAgICAga2V5U2VwYXJhdG9yOiBmYWxzZSxcclxuICAgICAgXHJcbiAgICAgICAgLy8gZG8gbm90IGxvYWQgYSBmYWxsYmFja1xyXG4gICAgICAgIGZhbGxiYWNrTG5nOiBmYWxzZSxcclxuICAgICAgICBuczpbJ2FwcCddLFxyXG4gICAgICAgIGRlZmF1bHROUzogJ2FwcCcsXHJcbiAgICAgICAgYmFja2VuZDoge1xyXG4gICAgICAgICAgICBsb2FkUGF0aDogJy9sb2NhbGVzL3t7bG5nfX0ve3tuc319Lmpzb24nXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbndpbmRvdy5UID0gKGtleSxkYXRhKT0+XHJcbntcclxuICAgIHJldHVybiBpMThuZXh0LnQoa2V5LGRhdGEpO1xyXG59XHJcblxyXG53aW5kb3cuVEIgPSAoa2V5KT0+XHJcbntcclxuICAgIHJldHVybiAoZGF0YSk9PlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpMThuZXh0LnQoa2V5LGRhdGEpO1xyXG4gICAgfVxyXG59IiwiY29uc3QgeyBIZWpsRWxlbWVudCB9ID0gcmVxdWlyZSgnLi9oZWpsRWxlbWVudCcpO1xyXG5cclxuY2xhc3MgSGVqbExvdkJhc2Vcclxue1xyXG4gICAgY29uc3RydWN0b3IoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0aW9uID0gW107XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyID0gbmV3IE9wdGlvbnNNYW5hZ2VyKCk7XHJcbiAgICAgICAgdGhpcy5vcHRCaW5kZXIgPSB7XHJcbiAgICAgICAgICAgIHNob3c6IChpdCk9Pml0LFxyXG4gICAgICAgICAgICBrZXk6IChpdCk9Pml0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2xhdmVzID0gW11cclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogbWFya3MgdGhlIGxvdiBhcyBtdWx0aXNlbGVjdFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc011bHRpc2VsZWN0IHRydWUgaWYgdGhpcyBpcyBtdXRpc2VsZWN0IGxvdiBcclxuICAgICAqL1xyXG4gICAgbXVsdGlzZWxlY3QoaXNNdWx0aXNlbGVjdClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmlzTXVsdGlzZWxlY3QgPSBpc011bHRpc2VsZWN0O1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBhdHRhY2goaGVqbEVsZW1lbnQpXHJcbiAgICB7XHJcbiAgICAgICAgaGVqbEVsZW1lbnQubG92ID0gdGhpcztcclxuICAgICAgICB0aGlzLmhlamxFbGVtZW50ID1oZWpsRWxlbWVudDtcclxuICAgICAgICBoZWpsRWxlbWVudC5vcHRzID0gdGhpcy5vcHRpb25zLmJpbmQodGhpcyk7XHJcbiAgICAgICAgaGVqbEVsZW1lbnQub3B0aW9uQmluZGVyID0gdGhpcy5vcHRpb25CaW5kZXIuYmluZCh0aGlzKTtcclxuICAgICAgICBoZWpsRWxlbWVudC5vcHRpb25zTWFuYWdlciA9IHRoaXMub3B0aW9uc01hbmFnZXIuYmluZCh0aGlzKTtcclxuICAgICAgICBoZWpsRWxlbWVudC5jaGVja0ZpbGxlZCA9IHRoaXMuY2hlY2tGaWxsZWQuYmluZCh0aGlzKTtcclxuICAgICAgICB0aGlzLmVsYmluZGVyID0gaGVqbEVsZW1lbnQuYmluZGVyO1xyXG4gICAgICAgIGhlamxFbGVtZW50LmJpbmRlciA9IHRoaXMuYmluZGVyLmJpbmQodGhpcyk7XHJcbiAgICB9XHJcbiAgICBiaW5kZXIoY2IpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5lbGJpbmRlci5iaW5kKHRoaXMuaGVqbEVsZW1lbnQpKGNiKTtcclxuICAgICAgICB2YXIgb2JpbmRlciA9IHRoaXMuaGVqbEVsZW1lbnQuYmluZEZ1bmM7XHJcbiAgICAgICAgdGhpcy5oZWpsRWxlbWVudC5iaW5kRnVuYyA9IChtb2RlbCxlbCk9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHYgID0gb2JpbmRlci5iaW5kKHRoaXMpKG1vZGVsLGVsKTtcclxuICAgICAgICAgICAgaWYoIUFycmF5LmlzQXJyYXkodikpXHJcbiAgICAgICAgICAgICAgICB2ID0gW3ZdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5zZWxNYXAgPSB7fTtcclxuICAgICAgICAgICAgdi5mb3JFYWNoKHZpPT5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcyA9IHRoaXMubWFuYWdlci5vcHRpb25Gb3JLZXkodmkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHMgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uLnB1c2gocyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsTWFwW3ZpXSA9IHM7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB2O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5oZWpsRWxlbWVudDtcclxuICAgIH1cclxuICAgIGNoZWNrRmlsbGVkKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3Rpb24ubGVuZ3RoID4gMDtcclxuICAgIH1cclxuICAgIG9wdGlvbnMob3B0aW9uc0NiKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9uc0NiID0gb3B0aW9uc0NiO1xyXG4gICAgICAgIHRoaXMubWFuYWdlci5vcHRpb25zQ2FsbGJhY2sob3B0aW9uc0NiKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5oZWpsRWxlbWVudDtcclxuICAgIH1cclxuICAgIG9wdGlvbkJpbmRlcihvcHRpb25zQmluZGVyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0QmluZGVyID0gb3B0aW9uc0JpbmRlcjtcclxuICAgICAgICB0aGlzLm1hbmFnZXIub3B0aW9uQmluZGVyKG9wdGlvbnNCaW5kZXIpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhlamxFbGVtZW50O1xyXG4gICAgfVxyXG4gICAgb3B0aW9uc01hbmFnZXIobWFuYWdlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xyXG4gICAgfVxyXG5cclxuICAgIHNob3coaXQpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0QmluZGVyLnNob3coaXQpO1xyXG4gICAgfVxyXG4gICAgbGlzdE9wdGlvbnMoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hbmFnZXIubGlzdE9wdGlvbnMoKTtcclxuICAgIH1cclxuICAgIGlzU2VsZWN0ZWQoaXQpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGtleSA9IHRoaXMub3B0QmluZGVyLmtleShpdCk7XHJcbiAgICAgICAgdmFyIHJ2ID0gdGhpcy5zZWxNYXBba2V5XSAhPSBudWxsO1xyXG4gICAgXHJcbiAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG4gICAgYWRkU2xhdmUob3RoZXJMb3YpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zbGF2ZXMucHVzaChvdGhlckxvdik7XHJcbiAgICB9XHJcbiAgICBtYXN0ZXJDaGFuZ2VkKG1hc3RlckxvdilcclxuICAgIHtcclxuICAgICAgICB0aGlzLm1hbmFnZXIucmVzZXQobWFzdGVyTG92LnNlbGVjdGlvbik7XHJcbiAgICAgICAgdGhpcy5oZWpsRWxlbWVudC5yZWJpbmQoKTtcclxuICAgIH1cclxuICAgIHNlbGVjdChpdCxzdGF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZihzdGF0ZSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBzdGF0ZSA9IHRydWU7XHJcbiAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGtleSA9IHRoaXMub3B0QmluZGVyLmtleShpdCk7XHJcbiAgICAgICAgaWYoIXRoaXMuaXNNdWx0aXNlbGVjdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uID0gW2l0XTsgLy8gc2luZ2xlIHZhbHVlIHNlbGVjdFxyXG4gICAgICAgICAgICB0aGlzLnNlbE1hcCA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLnNlbE1hcFtrZXldID0gaXQ7XHJcbiAgICAgICAgICAgIHRoaXMuaGVqbEVsZW1lbnQudXBkYXRlKGtleSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZihzdGF0ZSAmJiB0aGlzLnNlbE1hcFtrZXldICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIGlmKCFzdGF0ZSAmJiB0aGlzLnNlbE1hcFtrZXldID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBpZighc3RhdGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnNlbE1hcFtrZXldO1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMuc2VsZWN0aW9uLmluZGV4T2YoaXQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSB0aGlzLnNlbGVjdGlvbi5zcGxpY2UoaWR4LDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxNYXBba2V5XSA9IGl0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24ucHVzaChpdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICB2YXIgcnYgPSBbXVxyXG4gICAgICAgICAgICBmb3IodmFyIGsgaW4gdGhpcy5zZWxNYXApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJ2LnB1c2goayk7XHJcbiAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgICAgIHRoaXMuaGVqbEVsZW1lbnQudXBkYXRlKHJ2KTtcclxuICAgICAgICB9XHJcbiAgICAgICBcclxuICAgICAgICB0aGlzLnNsYXZlcy5mb3JFYWNoKGRlcD0+ZGVwLm1hc3RlckNoYW5nZWQodGhpcykpXHJcbiAgICAgICAgdGhpcy5oZWpsRWxlbWVudC5yZWJpbmQoKTtcclxuICAgICAgICB0aGlzLmhlamxFbGVtZW50LmNoZWNrRXJyb3JIaWdsaWdodCgpO1xyXG4gICAgfVxyXG4gICBcclxuICAgIGZvclNlbGVjdGVkVmFsdWUoY2IpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3Rpb24uZm9yRWFjaChjYik7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5jbGFzcyBPcHRpb25zTWFuYWdlclxyXG57XHJcblxyXG4gICAgb3B0aW9uQmluZGVyKGJpbmRlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbkJpbmRlciA9IGJpbmRlcjtcclxuICAgIH1cclxuICAgIG9wdGlvbnNDYWxsYmFjayhvcHRpb25zQ2IpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zQ2IgPSBvcHRpb25zQ2I7XHJcbiAgICB9XHJcbiAgICBvcHRpb25Gb3JLZXkoa2V5KVxyXG4gICAge1xyXG4gICAgICAgIGlmKCF0aGlzLm9wdGlvbnNNYXApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNNYXAgPSB7fVxyXG4gICAgICAgICAgICB2YXIgbGlzdCA9IHRoaXMubGlzdE9wdGlvbnMoKTtcclxuICAgICAgICAgICAgbGlzdC5mb3JFYWNoKG9wdD0+XHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zTWFwW3RoaXMub3B0aW9uQmluZGVyLmtleShvcHQpXSA9IG9wdDtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBydiA9IHRoaXMub3B0aW9uc01hcFtrZXldO1xyXG4gICAgICAgIHJldHVybiBydjtcclxuICAgIH1cclxuXHJcbiAgICBsaXN0T3B0aW9ucygpXHJcbiAgICB7XHJcbiAgICAgICAgaWYoIXRoaXMub3B0aW9uc0xpc3QpXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9uc0xpc3QgPSB0aGlzLm9wdGlvbnNDYih0aGlzKTtcclxuICAgICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zTGlzdDtcclxuICAgIH1cclxuXHJcbiAgICByZXNldChtYXN0ZXJTZWxlY3Rpb24pXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tYXN0ZXJTZWxlY3Rpb24gPSBtYXN0ZXJTZWxlY3Rpb247XHJcbiAgICAgICAgdGhpcy5vcHRpb25zTWFwID0gbnVsbDtcclxuICAgICAgICB0aGlzLm9wdGlvbnNMaXN0ID0gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMuSGVqbExvdkJhc2UgPSBIZWpsTG92QmFzZTtcclxubW9kdWxlLmV4cG9ydHMuT3B0aW9uc01hbmFnZXIgPSBPcHRpb25zTWFuYWdlcjsiLCJmdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHtcbiAgaWYgKHNlbGYgPT09IHZvaWQgMCkge1xuICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTtcbiAgfVxuXG4gIHJldHVybiBzZWxmO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQ7IiwiZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3Rvcikge1xuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfY2xhc3NDYWxsQ2hlY2s7IiwiZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7XG4gICAgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlO1xuICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7XG4gIGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTtcbiAgcmV0dXJuIENvbnN0cnVjdG9yO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF9jcmVhdGVDbGFzczsiLCJmdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7XG4gIGlmIChrZXkgaW4gb2JqKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7XG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBvYmpba2V5XSA9IHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIG9iajtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfZGVmaW5lUHJvcGVydHk7IiwiZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2Yobykge1xuICAgIHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7XG4gIH07XG4gIHJldHVybiBfZ2V0UHJvdG90eXBlT2Yobyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX2dldFByb3RvdHlwZU9mOyIsInZhciBzZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoXCIuL3NldFByb3RvdHlwZU9mXCIpO1xuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHtcbiAgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvblwiKTtcbiAgfVxuXG4gIHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwge1xuICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICB2YWx1ZTogc3ViQ2xhc3MsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH1cbiAgfSk7XG4gIGlmIChzdXBlckNsYXNzKSBzZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX2luaGVyaXRzOyIsInZhciBkZWZpbmVQcm9wZXJ0eSA9IHJlcXVpcmUoXCIuL2RlZmluZVByb3BlcnR5XCIpO1xuXG5mdW5jdGlvbiBfb2JqZWN0U3ByZWFkKHRhcmdldCkge1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV0gIT0gbnVsbCA/IE9iamVjdChhcmd1bWVudHNbaV0pIDoge307XG4gICAgdmFyIG93bktleXMgPSBPYmplY3Qua2V5cyhzb3VyY2UpO1xuXG4gICAgaWYgKHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvd25LZXlzID0gb3duS2V5cy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzb3VyY2UpLmZpbHRlcihmdW5jdGlvbiAoc3ltKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNvdXJjZSwgc3ltKS5lbnVtZXJhYmxlO1xuICAgICAgfSkpO1xuICAgIH1cblxuICAgIG93bktleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBkZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgc291cmNlW2tleV0pO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfb2JqZWN0U3ByZWFkOyIsInZhciBfdHlwZW9mID0gcmVxdWlyZShcIkBiYWJlbC9ydW50aW1lL2hlbHBlcnMvdHlwZW9mXCIpO1xuXG52YXIgYXNzZXJ0VGhpc0luaXRpYWxpemVkID0gcmVxdWlyZShcIi4vYXNzZXJ0VGhpc0luaXRpYWxpemVkXCIpO1xuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7XG4gIGlmIChjYWxsICYmIChfdHlwZW9mKGNhbGwpID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpKSB7XG4gICAgcmV0dXJuIGNhbGw7XG4gIH1cblxuICByZXR1cm4gYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuOyIsImZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7XG4gICAgby5fX3Byb3RvX18gPSBwO1xuICAgIHJldHVybiBvO1xuICB9O1xuXG4gIHJldHVybiBfc2V0UHJvdG90eXBlT2YobywgcCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX3NldFByb3RvdHlwZU9mOyIsImZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7XG4gIFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjtcblxuICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmo7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBfdHlwZW9mKG9iaik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX3R5cGVvZjsiLCJ2YXIgZmV0Y2hBcGlcbmlmICh0eXBlb2YgZmV0Y2ggPT09ICdmdW5jdGlvbicpIHtcbiAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnICYmIGdsb2JhbC5mZXRjaCkge1xuICAgIGZldGNoQXBpID0gZ2xvYmFsLmZldGNoXG4gIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmZldGNoKSB7XG4gICAgZmV0Y2hBcGkgPSB3aW5kb3cuZmV0Y2hcbiAgfVxufVxuXG5pZiAodHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnICYmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2Ygd2luZG93LmRvY3VtZW50ID09PSAndW5kZWZpbmVkJykpIHtcbiAgdmFyIGYgPSBmZXRjaEFwaSB8fCByZXF1aXJlKCdub2RlLWZldGNoJylcbiAgaWYgKGYuZGVmYXVsdCkgZiA9IGYuZGVmYXVsdFxuICBleHBvcnRzLmRlZmF1bHQgPSBmXG4gIG1vZHVsZS5leHBvcnRzID0gZXhwb3J0cy5kZWZhdWx0XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZvaWQgMDtcblxudmFyIF91dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xuXG52YXIgX3JlcXVlc3QgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCIuL3JlcXVlc3QuanNcIikpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpIHsgaWYgKGtleSBpbiBvYmopIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7IHZhbHVlOiB2YWx1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSB9KTsgfSBlbHNlIHsgb2JqW2tleV0gPSB2YWx1ZTsgfSByZXR1cm4gb2JqOyB9XG5cbnZhciBnZXREZWZhdWx0cyA9IGZ1bmN0aW9uIGdldERlZmF1bHRzKCkge1xuICByZXR1cm4ge1xuICAgIGxvYWRQYXRoOiAnL2xvY2FsZXMve3tsbmd9fS97e25zfX0uanNvbicsXG4gICAgYWRkUGF0aDogJy9sb2NhbGVzL2FkZC97e2xuZ319L3t7bnN9fScsXG4gICAgYWxsb3dNdWx0aUxvYWRpbmc6IGZhbHNlLFxuICAgIHBhcnNlOiBmdW5jdGlvbiBwYXJzZShkYXRhKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9LFxuICAgIHN0cmluZ2lmeTogSlNPTi5zdHJpbmdpZnksXG4gICAgcGFyc2VQYXlsb2FkOiBmdW5jdGlvbiBwYXJzZVBheWxvYWQobmFtZXNwYWNlLCBrZXksIGZhbGxiYWNrVmFsdWUpIHtcbiAgICAgIHJldHVybiBfZGVmaW5lUHJvcGVydHkoe30sIGtleSwgZmFsbGJhY2tWYWx1ZSB8fCAnJyk7XG4gICAgfSxcbiAgICByZXF1ZXN0OiBfcmVxdWVzdC5kZWZhdWx0LFxuICAgIHJlbG9hZEludGVydmFsOiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IGZhbHNlIDogNjAgKiA2MCAqIDEwMDAsXG4gICAgY3VzdG9tSGVhZGVyczoge30sXG4gICAgcXVlcnlTdHJpbmdQYXJhbXM6IHt9LFxuICAgIGNyb3NzRG9tYWluOiBmYWxzZSxcbiAgICB3aXRoQ3JlZGVudGlhbHM6IGZhbHNlLFxuICAgIG92ZXJyaWRlTWltZVR5cGU6IGZhbHNlLFxuICAgIHJlcXVlc3RPcHRpb25zOiB7XG4gICAgICBtb2RlOiAnY29ycycsXG4gICAgICBjcmVkZW50aWFsczogJ3NhbWUtb3JpZ2luJyxcbiAgICAgIGNhY2hlOiAnZGVmYXVsdCdcbiAgICB9XG4gIH07XG59O1xuXG52YXIgQmFja2VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQmFja2VuZChzZXJ2aWNlcykge1xuICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICB2YXIgYWxsT3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQmFja2VuZCk7XG5cbiAgICB0aGlzLnNlcnZpY2VzID0gc2VydmljZXM7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmFsbE9wdGlvbnMgPSBhbGxPcHRpb25zO1xuICAgIHRoaXMudHlwZSA9ICdiYWNrZW5kJztcbiAgICB0aGlzLmluaXQoc2VydmljZXMsIG9wdGlvbnMsIGFsbE9wdGlvbnMpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEJhY2tlbmQsIFt7XG4gICAga2V5OiBcImluaXRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaW5pdChzZXJ2aWNlcykge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgICAgdmFyIGFsbE9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgICAgdGhpcy5zZXJ2aWNlcyA9IHNlcnZpY2VzO1xuICAgICAgdGhpcy5vcHRpb25zID0gKDAsIF91dGlscy5kZWZhdWx0cykob3B0aW9ucywgdGhpcy5vcHRpb25zIHx8IHt9LCBnZXREZWZhdWx0cygpKTtcbiAgICAgIHRoaXMuYWxsT3B0aW9ucyA9IGFsbE9wdGlvbnM7XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVsb2FkSW50ZXJ2YWwpIHtcbiAgICAgICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5yZWxvYWQoKTtcbiAgICAgICAgfSwgdGhpcy5vcHRpb25zLnJlbG9hZEludGVydmFsKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVhZE11bHRpXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlYWRNdWx0aShsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgbG9hZFBhdGggPSB0aGlzLm9wdGlvbnMubG9hZFBhdGg7XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLmxvYWRQYXRoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGxvYWRQYXRoID0gdGhpcy5vcHRpb25zLmxvYWRQYXRoKGxhbmd1YWdlcywgbmFtZXNwYWNlcyk7XG4gICAgICB9XG5cbiAgICAgIHZhciB1cmwgPSB0aGlzLnNlcnZpY2VzLmludGVycG9sYXRvci5pbnRlcnBvbGF0ZShsb2FkUGF0aCwge1xuICAgICAgICBsbmc6IGxhbmd1YWdlcy5qb2luKCcrJyksXG4gICAgICAgIG5zOiBuYW1lc3BhY2VzLmpvaW4oJysnKVxuICAgICAgfSk7XG4gICAgICB0aGlzLmxvYWRVcmwodXJsLCBjYWxsYmFjaywgbGFuZ3VhZ2VzLCBuYW1lc3BhY2VzKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVhZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZWFkKGxhbmd1YWdlLCBuYW1lc3BhY2UsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgbG9hZFBhdGggPSB0aGlzLm9wdGlvbnMubG9hZFBhdGg7XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLmxvYWRQYXRoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGxvYWRQYXRoID0gdGhpcy5vcHRpb25zLmxvYWRQYXRoKFtsYW5ndWFnZV0sIFtuYW1lc3BhY2VdKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHVybCA9IHRoaXMuc2VydmljZXMuaW50ZXJwb2xhdG9yLmludGVycG9sYXRlKGxvYWRQYXRoLCB7XG4gICAgICAgIGxuZzogbGFuZ3VhZ2UsXG4gICAgICAgIG5zOiBuYW1lc3BhY2VcbiAgICAgIH0pO1xuICAgICAgdGhpcy5sb2FkVXJsKHVybCwgY2FsbGJhY2ssIGxhbmd1YWdlLCBuYW1lc3BhY2UpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsb2FkVXJsXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGxvYWRVcmwodXJsLCBjYWxsYmFjaywgbGFuZ3VhZ2VzLCBuYW1lc3BhY2VzKSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgdGhpcy5vcHRpb25zLnJlcXVlc3QodGhpcy5vcHRpb25zLCB1cmwsIHVuZGVmaW5lZCwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgIGlmIChyZXMgJiYgKHJlcy5zdGF0dXMgPj0gNTAwICYmIHJlcy5zdGF0dXMgPCA2MDAgfHwgIXJlcy5zdGF0dXMpKSByZXR1cm4gY2FsbGJhY2soJ2ZhaWxlZCBsb2FkaW5nICcgKyB1cmwsIHRydWUpO1xuICAgICAgICBpZiAocmVzICYmIHJlcy5zdGF0dXMgPj0gNDAwICYmIHJlcy5zdGF0dXMgPCA1MDApIHJldHVybiBjYWxsYmFjaygnZmFpbGVkIGxvYWRpbmcgJyArIHVybCwgZmFsc2UpO1xuICAgICAgICBpZiAoIXJlcyAmJiBlcnIgJiYgZXJyLm1lc3NhZ2UgJiYgZXJyLm1lc3NhZ2UuaW5kZXhPZignRmFpbGVkIHRvIGZldGNoJykgPiAtMSkgcmV0dXJuIGNhbGxiYWNrKCdmYWlsZWQgbG9hZGluZyAnICsgdXJsLCB0cnVlKTtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVyciwgZmFsc2UpO1xuICAgICAgICB2YXIgcmV0LCBwYXJzZUVycjtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzLmRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXQgPSBfdGhpczIub3B0aW9ucy5wYXJzZShyZXMuZGF0YSwgbGFuZ3VhZ2VzLCBuYW1lc3BhY2VzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0ID0gcmVzLmRhdGE7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgcGFyc2VFcnIgPSAnZmFpbGVkIHBhcnNpbmcgJyArIHVybCArICcgdG8ganNvbic7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFyc2VFcnIpIHJldHVybiBjYWxsYmFjayhwYXJzZUVyciwgZmFsc2UpO1xuICAgICAgICBjYWxsYmFjayhudWxsLCByZXQpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGUobGFuZ3VhZ2VzLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSkge1xuICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgIGlmICghdGhpcy5vcHRpb25zLmFkZFBhdGgpIHJldHVybjtcbiAgICAgIGlmICh0eXBlb2YgbGFuZ3VhZ2VzID09PSAnc3RyaW5nJykgbGFuZ3VhZ2VzID0gW2xhbmd1YWdlc107XG4gICAgICB2YXIgcGF5bG9hZCA9IHRoaXMub3B0aW9ucy5wYXJzZVBheWxvYWQobmFtZXNwYWNlLCBrZXksIGZhbGxiYWNrVmFsdWUpO1xuICAgICAgbGFuZ3VhZ2VzLmZvckVhY2goZnVuY3Rpb24gKGxuZykge1xuICAgICAgICB2YXIgdXJsID0gX3RoaXMzLnNlcnZpY2VzLmludGVycG9sYXRvci5pbnRlcnBvbGF0ZShfdGhpczMub3B0aW9ucy5hZGRQYXRoLCB7XG4gICAgICAgICAgbG5nOiBsbmcsXG4gICAgICAgICAgbnM6IG5hbWVzcGFjZVxuICAgICAgICB9KTtcblxuICAgICAgICBfdGhpczMub3B0aW9ucy5yZXF1ZXN0KF90aGlzMy5vcHRpb25zLCB1cmwsIHBheWxvYWQsIGZ1bmN0aW9uIChkYXRhLCByZXMpIHt9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZWxvYWRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVsb2FkKCkge1xuICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgIHZhciBfdGhpcyRzZXJ2aWNlcyA9IHRoaXMuc2VydmljZXMsXG4gICAgICAgICAgYmFja2VuZENvbm5lY3RvciA9IF90aGlzJHNlcnZpY2VzLmJhY2tlbmRDb25uZWN0b3IsXG4gICAgICAgICAgbGFuZ3VhZ2VVdGlscyA9IF90aGlzJHNlcnZpY2VzLmxhbmd1YWdlVXRpbHMsXG4gICAgICAgICAgbG9nZ2VyID0gX3RoaXMkc2VydmljZXMubG9nZ2VyO1xuICAgICAgdmFyIGN1cnJlbnRMYW5ndWFnZSA9IGJhY2tlbmRDb25uZWN0b3IubGFuZ3VhZ2U7XG4gICAgICBpZiAoY3VycmVudExhbmd1YWdlICYmIGN1cnJlbnRMYW5ndWFnZS50b0xvd2VyQ2FzZSgpID09PSAnY2ltb2RlJykgcmV0dXJuO1xuICAgICAgdmFyIHRvTG9hZCA9IFtdO1xuXG4gICAgICB2YXIgYXBwZW5kID0gZnVuY3Rpb24gYXBwZW5kKGxuZykge1xuICAgICAgICB2YXIgbG5ncyA9IGxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KGxuZyk7XG4gICAgICAgIGxuZ3MuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICAgIGlmICh0b0xvYWQuaW5kZXhPZihsKSA8IDApIHRvTG9hZC5wdXNoKGwpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIGFwcGVuZChjdXJyZW50TGFuZ3VhZ2UpO1xuICAgICAgaWYgKHRoaXMuYWxsT3B0aW9ucy5wcmVsb2FkKSB0aGlzLmFsbE9wdGlvbnMucHJlbG9hZC5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmQobCk7XG4gICAgICB9KTtcbiAgICAgIHRvTG9hZC5mb3JFYWNoKGZ1bmN0aW9uIChsbmcpIHtcbiAgICAgICAgX3RoaXM0LmFsbE9wdGlvbnMubnMuZm9yRWFjaChmdW5jdGlvbiAobnMpIHtcbiAgICAgICAgICBiYWNrZW5kQ29ubmVjdG9yLnJlYWQobG5nLCBucywgJ3JlYWQnLCBudWxsLCBudWxsLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSBsb2dnZXIud2FybihcImxvYWRpbmcgbmFtZXNwYWNlIFwiLmNvbmNhdChucywgXCIgZm9yIGxhbmd1YWdlIFwiKS5jb25jYXQobG5nLCBcIiBmYWlsZWRcIiksIGVycik7XG4gICAgICAgICAgICBpZiAoIWVyciAmJiBkYXRhKSBsb2dnZXIubG9nKFwibG9hZGVkIG5hbWVzcGFjZSBcIi5jb25jYXQobnMsIFwiIGZvciBsYW5ndWFnZSBcIikuY29uY2F0KGxuZyksIGRhdGEpO1xuICAgICAgICAgICAgYmFja2VuZENvbm5lY3Rvci5sb2FkZWQoXCJcIi5jb25jYXQobG5nLCBcInxcIikuY29uY2F0KG5zKSwgZXJyLCBkYXRhKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gQmFja2VuZDtcbn0oKTtcblxuQmFja2VuZC50eXBlID0gJ2JhY2tlbmQnO1xudmFyIF9kZWZhdWx0ID0gQmFja2VuZDtcbmV4cG9ydHMuZGVmYXVsdCA9IF9kZWZhdWx0O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzLmRlZmF1bHQ7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSB2b2lkIDA7XG5cbnZhciBfdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcblxudmFyIGZldGNoTm9kZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKHJlcXVpcmUoXCIuL2dldEZldGNoLmpzXCIpKTtcblxuZnVuY3Rpb24gX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlKCkgeyBpZiAodHlwZW9mIFdlYWtNYXAgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIG51bGw7IHZhciBjYWNoZSA9IG5ldyBXZWFrTWFwKCk7IF9nZXRSZXF1aXJlV2lsZGNhcmRDYWNoZSA9IGZ1bmN0aW9uIF9nZXRSZXF1aXJlV2lsZGNhcmRDYWNoZSgpIHsgcmV0dXJuIGNhY2hlOyB9OyByZXR1cm4gY2FjaGU7IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBpZiAob2JqID09PSBudWxsIHx8IF90eXBlb2Yob2JqKSAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2Ygb2JqICE9PSBcImZ1bmN0aW9uXCIpIHsgcmV0dXJuIHsgZGVmYXVsdDogb2JqIH07IH0gdmFyIGNhY2hlID0gX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlKCk7IGlmIChjYWNoZSAmJiBjYWNoZS5oYXMob2JqKSkgeyByZXR1cm4gY2FjaGUuZ2V0KG9iaik7IH0gdmFyIG5ld09iaiA9IHt9OyB2YXIgaGFzUHJvcGVydHlEZXNjcmlwdG9yID0gT2JqZWN0LmRlZmluZVByb3BlcnR5ICYmIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgdmFyIGRlc2MgPSBoYXNQcm9wZXJ0eURlc2NyaXB0b3IgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwga2V5KSA6IG51bGw7IGlmIChkZXNjICYmIChkZXNjLmdldCB8fCBkZXNjLnNldCkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KG5ld09iaiwga2V5LCBkZXNjKTsgfSBlbHNlIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IGlmIChjYWNoZSkgeyBjYWNoZS5zZXQob2JqLCBuZXdPYmopOyB9IHJldHVybiBuZXdPYmo7IH1cblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG52YXIgZmV0Y2hBcGk7XG5cbmlmICh0eXBlb2YgZmV0Y2ggPT09ICdmdW5jdGlvbicpIHtcbiAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnICYmIGdsb2JhbC5mZXRjaCkge1xuICAgIGZldGNoQXBpID0gZ2xvYmFsLmZldGNoO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5mZXRjaCkge1xuICAgIGZldGNoQXBpID0gd2luZG93LmZldGNoO1xuICB9XG59XG5cbnZhciBYbWxIdHRwUmVxdWVzdEFwaTtcblxuaWYgKHR5cGVvZiBYTUxIdHRwUmVxdWVzdCA9PT0gJ2Z1bmN0aW9uJykge1xuICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsLlhNTEh0dHBSZXF1ZXN0KSB7XG4gICAgWG1sSHR0cFJlcXVlc3RBcGkgPSBnbG9iYWwuWE1MSHR0cFJlcXVlc3Q7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LlhNTEh0dHBSZXF1ZXN0KSB7XG4gICAgWG1sSHR0cFJlcXVlc3RBcGkgPSB3aW5kb3cuWE1MSHR0cFJlcXVlc3Q7XG4gIH1cbn1cblxudmFyIEFjdGl2ZVhPYmplY3RBcGk7XG5cbmlmICh0eXBlb2YgQWN0aXZlWE9iamVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsLkFjdGl2ZVhPYmplY3QpIHtcbiAgICBBY3RpdmVYT2JqZWN0QXBpID0gZ2xvYmFsLkFjdGl2ZVhPYmplY3Q7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LkFjdGl2ZVhPYmplY3QpIHtcbiAgICBBY3RpdmVYT2JqZWN0QXBpID0gd2luZG93LkFjdGl2ZVhPYmplY3Q7XG4gIH1cbn1cblxuaWYgKCFmZXRjaEFwaSAmJiBmZXRjaE5vZGUgJiYgIVhtbEh0dHBSZXF1ZXN0QXBpICYmICFBY3RpdmVYT2JqZWN0QXBpKSBmZXRjaEFwaSA9IGZldGNoTm9kZS5kZWZhdWx0IHx8IGZldGNoTm9kZTtcbmlmICh0eXBlb2YgZmV0Y2hBcGkgIT09ICdmdW5jdGlvbicpIGZldGNoQXBpID0gdW5kZWZpbmVkO1xuXG52YXIgYWRkUXVlcnlTdHJpbmcgPSBmdW5jdGlvbiBhZGRRdWVyeVN0cmluZyh1cmwsIHBhcmFtcykge1xuICBpZiAocGFyYW1zICYmIF90eXBlb2YocGFyYW1zKSA9PT0gJ29iamVjdCcpIHtcbiAgICB2YXIgcXVlcnlTdHJpbmcgPSAnJztcblxuICAgIGZvciAodmFyIHBhcmFtTmFtZSBpbiBwYXJhbXMpIHtcbiAgICAgIHF1ZXJ5U3RyaW5nICs9ICcmJyArIGVuY29kZVVSSUNvbXBvbmVudChwYXJhbU5hbWUpICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtc1twYXJhbU5hbWVdKTtcbiAgICB9XG5cbiAgICBpZiAoIXF1ZXJ5U3RyaW5nKSByZXR1cm4gdXJsO1xuICAgIHVybCA9IHVybCArICh1cmwuaW5kZXhPZignPycpICE9PSAtMSA/ICcmJyA6ICc/JykgKyBxdWVyeVN0cmluZy5zbGljZSgxKTtcbiAgfVxuXG4gIHJldHVybiB1cmw7XG59O1xuXG52YXIgcmVxdWVzdFdpdGhGZXRjaCA9IGZ1bmN0aW9uIHJlcXVlc3RXaXRoRmV0Y2gob3B0aW9ucywgdXJsLCBwYXlsb2FkLCBjYWxsYmFjaykge1xuICBpZiAob3B0aW9ucy5xdWVyeVN0cmluZ1BhcmFtcykge1xuICAgIHVybCA9IGFkZFF1ZXJ5U3RyaW5nKHVybCwgb3B0aW9ucy5xdWVyeVN0cmluZ1BhcmFtcyk7XG4gIH1cblxuICB2YXIgaGVhZGVycyA9ICgwLCBfdXRpbHMuZGVmYXVsdHMpKHt9LCB0eXBlb2Ygb3B0aW9ucy5jdXN0b21IZWFkZXJzID09PSAnZnVuY3Rpb24nID8gb3B0aW9ucy5jdXN0b21IZWFkZXJzKCkgOiBvcHRpb25zLmN1c3RvbUhlYWRlcnMpO1xuICBpZiAocGF5bG9hZCkgaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG4gIGZldGNoQXBpKHVybCwgKDAsIF91dGlscy5kZWZhdWx0cykoe1xuICAgIG1ldGhvZDogcGF5bG9hZCA/ICdQT1NUJyA6ICdHRVQnLFxuICAgIGJvZHk6IHBheWxvYWQgPyBvcHRpb25zLnN0cmluZ2lmeShwYXlsb2FkKSA6IHVuZGVmaW5lZCxcbiAgICBoZWFkZXJzOiBoZWFkZXJzXG4gIH0sIHR5cGVvZiBvcHRpb25zLnJlcXVlc3RPcHRpb25zID09PSAnZnVuY3Rpb24nID8gb3B0aW9ucy5yZXF1ZXN0T3B0aW9ucyhwYXlsb2FkKSA6IG9wdGlvbnMucmVxdWVzdE9wdGlvbnMpKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgIGlmICghcmVzcG9uc2Uub2spIHJldHVybiBjYWxsYmFjayhyZXNwb25zZS5zdGF0dXNUZXh0IHx8ICdFcnJvcicsIHtcbiAgICAgIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzXG4gICAgfSk7XG4gICAgcmVzcG9uc2UudGV4dCgpLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtcbiAgICAgICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXG4gICAgICAgIGRhdGE6IGRhdGFcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKGNhbGxiYWNrKTtcbiAgfSkuY2F0Y2goY2FsbGJhY2spO1xufTtcblxudmFyIHJlcXVlc3RXaXRoWG1sSHR0cFJlcXVlc3QgPSBmdW5jdGlvbiByZXF1ZXN0V2l0aFhtbEh0dHBSZXF1ZXN0KG9wdGlvbnMsIHVybCwgcGF5bG9hZCwgY2FsbGJhY2spIHtcbiAgaWYgKHBheWxvYWQgJiYgX3R5cGVvZihwYXlsb2FkKSA9PT0gJ29iamVjdCcpIHtcbiAgICBwYXlsb2FkID0gYWRkUXVlcnlTdHJpbmcoJycsIHBheWxvYWQpLnNsaWNlKDEpO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMucXVlcnlTdHJpbmdQYXJhbXMpIHtcbiAgICB1cmwgPSBhZGRRdWVyeVN0cmluZyh1cmwsIG9wdGlvbnMucXVlcnlTdHJpbmdQYXJhbXMpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICB2YXIgeDtcblxuICAgIGlmIChYbWxIdHRwUmVxdWVzdEFwaSkge1xuICAgICAgeCA9IG5ldyBYbWxIdHRwUmVxdWVzdEFwaSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB4ID0gbmV3IEFjdGl2ZVhPYmplY3RBcGkoJ01TWE1MMi5YTUxIVFRQLjMuMCcpO1xuICAgIH1cblxuICAgIHgub3BlbihwYXlsb2FkID8gJ1BPU1QnIDogJ0dFVCcsIHVybCwgMSk7XG5cbiAgICBpZiAoIW9wdGlvbnMuY3Jvc3NEb21haW4pIHtcbiAgICAgIHguc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpO1xuICAgIH1cblxuICAgIHgud2l0aENyZWRlbnRpYWxzID0gISFvcHRpb25zLndpdGhDcmVkZW50aWFscztcblxuICAgIGlmIChwYXlsb2FkKSB7XG4gICAgICB4LnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKTtcbiAgICB9XG5cbiAgICBpZiAoeC5vdmVycmlkZU1pbWVUeXBlKSB7XG4gICAgICB4Lm92ZXJyaWRlTWltZVR5cGUoJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICB9XG5cbiAgICB2YXIgaCA9IG9wdGlvbnMuY3VzdG9tSGVhZGVycztcbiAgICBoID0gdHlwZW9mIGggPT09ICdmdW5jdGlvbicgPyBoKCkgOiBoO1xuXG4gICAgaWYgKGgpIHtcbiAgICAgIGZvciAodmFyIGkgaW4gaCkge1xuICAgICAgICB4LnNldFJlcXVlc3RIZWFkZXIoaSwgaFtpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgeC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB4LnJlYWR5U3RhdGUgPiAzICYmIGNhbGxiYWNrKHguc3RhdHVzID49IDQwMCA/IHguc3RhdHVzVGV4dCA6IG51bGwsIHtcbiAgICAgICAgc3RhdHVzOiB4LnN0YXR1cyxcbiAgICAgICAgZGF0YTogeC5yZXNwb25zZVRleHRcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICB4LnNlbmQocGF5bG9hZCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlICYmIGNvbnNvbGUubG9nKGUpO1xuICB9XG59O1xuXG52YXIgcmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3Qob3B0aW9ucywgdXJsLCBwYXlsb2FkLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIHBheWxvYWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IHBheWxvYWQ7XG4gICAgcGF5bG9hZCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24gKCkge307XG5cbiAgaWYgKGZldGNoQXBpKSB7XG4gICAgcmV0dXJuIHJlcXVlc3RXaXRoRmV0Y2gob3B0aW9ucywgdXJsLCBwYXlsb2FkLCBjYWxsYmFjayk7XG4gIH1cblxuICBpZiAodHlwZW9mIFhNTEh0dHBSZXF1ZXN0ID09PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBBY3RpdmVYT2JqZWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHJlcXVlc3RXaXRoWG1sSHR0cFJlcXVlc3Qob3B0aW9ucywgdXJsLCBwYXlsb2FkLCBjYWxsYmFjayk7XG4gIH1cbn07XG5cbnZhciBfZGVmYXVsdCA9IHJlcXVlc3Q7XG5leHBvcnRzLmRlZmF1bHQgPSBfZGVmYXVsdDtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cy5kZWZhdWx0OyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0cyA9IGRlZmF1bHRzO1xudmFyIGFyciA9IFtdO1xudmFyIGVhY2ggPSBhcnIuZm9yRWFjaDtcbnZhciBzbGljZSA9IGFyci5zbGljZTtcblxuZnVuY3Rpb24gZGVmYXVsdHMob2JqKSB7XG4gIGVhY2guY2FsbChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlKSB7XG4gICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICBpZiAob2JqW3Byb3BdID09PSB1bmRlZmluZWQpIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufSIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BEZWZhdWx0IChleCkgeyByZXR1cm4gKGV4ICYmICh0eXBlb2YgZXggPT09ICdvYmplY3QnKSAmJiAnZGVmYXVsdCcgaW4gZXgpID8gZXhbJ2RlZmF1bHQnXSA6IGV4OyB9XG5cbnZhciBfdHlwZW9mID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvdHlwZW9mJykpO1xudmFyIF9vYmplY3RTcHJlYWQgPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnQGJhYmVsL3J1bnRpbWUvaGVscGVycy9vYmplY3RTcHJlYWQnKSk7XG52YXIgX2NsYXNzQ2FsbENoZWNrID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvY2xhc3NDYWxsQ2hlY2snKSk7XG52YXIgX2NyZWF0ZUNsYXNzID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvY3JlYXRlQ2xhc3MnKSk7XG52YXIgX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4gPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnQGJhYmVsL3J1bnRpbWUvaGVscGVycy9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuJykpO1xudmFyIF9nZXRQcm90b3R5cGVPZiA9IF9pbnRlcm9wRGVmYXVsdChyZXF1aXJlKCdAYmFiZWwvcnVudGltZS9oZWxwZXJzL2dldFByb3RvdHlwZU9mJykpO1xudmFyIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQgPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnQGJhYmVsL3J1bnRpbWUvaGVscGVycy9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQnKSk7XG52YXIgX2luaGVyaXRzID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMnKSk7XG5cbnZhciBjb25zb2xlTG9nZ2VyID0ge1xuICB0eXBlOiAnbG9nZ2VyJyxcbiAgbG9nOiBmdW5jdGlvbiBsb2coYXJncykge1xuICAgIHRoaXMub3V0cHV0KCdsb2cnLCBhcmdzKTtcbiAgfSxcbiAgd2FybjogZnVuY3Rpb24gd2FybihhcmdzKSB7XG4gICAgdGhpcy5vdXRwdXQoJ3dhcm4nLCBhcmdzKTtcbiAgfSxcbiAgZXJyb3I6IGZ1bmN0aW9uIGVycm9yKGFyZ3MpIHtcbiAgICB0aGlzLm91dHB1dCgnZXJyb3InLCBhcmdzKTtcbiAgfSxcbiAgb3V0cHV0OiBmdW5jdGlvbiBvdXRwdXQodHlwZSwgYXJncykge1xuICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGVbdHlwZV0pIGNvbnNvbGVbdHlwZV0uYXBwbHkoY29uc29sZSwgYXJncyk7XG4gIH1cbn07XG5cbnZhciBMb2dnZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIExvZ2dlcihjb25jcmV0ZUxvZ2dlcikge1xuICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMb2dnZXIpO1xuXG4gICAgdGhpcy5pbml0KGNvbmNyZXRlTG9nZ2VyLCBvcHRpb25zKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhMb2dnZXIsIFt7XG4gICAga2V5OiBcImluaXRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaW5pdChjb25jcmV0ZUxvZ2dlcikge1xuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgICAgdGhpcy5wcmVmaXggPSBvcHRpb25zLnByZWZpeCB8fCAnaTE4bmV4dDonO1xuICAgICAgdGhpcy5sb2dnZXIgPSBjb25jcmV0ZUxvZ2dlciB8fCBjb25zb2xlTG9nZ2VyO1xuICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgIHRoaXMuZGVidWcgPSBvcHRpb25zLmRlYnVnO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzZXREZWJ1Z1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXREZWJ1Zyhib29sKSB7XG4gICAgICB0aGlzLmRlYnVnID0gYm9vbDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibG9nXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGxvZygpIHtcbiAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICBhcmdzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICdsb2cnLCAnJywgdHJ1ZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIndhcm5cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gd2FybigpIHtcbiAgICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuMiksIF9rZXkyID0gMDsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuICAgICAgICBhcmdzW19rZXkyXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmZvcndhcmQoYXJncywgJ3dhcm4nLCAnJywgdHJ1ZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImVycm9yXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGVycm9yKCkge1xuICAgICAgZm9yICh2YXIgX2xlbjMgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4zKSwgX2tleTMgPSAwOyBfa2V5MyA8IF9sZW4zOyBfa2V5MysrKSB7XG4gICAgICAgIGFyZ3NbX2tleTNdID0gYXJndW1lbnRzW19rZXkzXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZm9yd2FyZChhcmdzLCAnZXJyb3InLCAnJyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImRlcHJlY2F0ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkZXByZWNhdGUoKSB7XG4gICAgICBmb3IgKHZhciBfbGVuNCA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjQpLCBfa2V5NCA9IDA7IF9rZXk0IDwgX2xlbjQ7IF9rZXk0KyspIHtcbiAgICAgICAgYXJnc1tfa2V5NF0gPSBhcmd1bWVudHNbX2tleTRdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICd3YXJuJywgJ1dBUk5JTkcgREVQUkVDQVRFRDogJywgdHJ1ZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImZvcndhcmRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZm9yd2FyZChhcmdzLCBsdmwsIHByZWZpeCwgZGVidWdPbmx5KSB7XG4gICAgICBpZiAoZGVidWdPbmx5ICYmICF0aGlzLmRlYnVnKSByZXR1cm4gbnVsbDtcbiAgICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ3N0cmluZycpIGFyZ3NbMF0gPSBcIlwiLmNvbmNhdChwcmVmaXgpLmNvbmNhdCh0aGlzLnByZWZpeCwgXCIgXCIpLmNvbmNhdChhcmdzWzBdKTtcbiAgICAgIHJldHVybiB0aGlzLmxvZ2dlcltsdmxdKGFyZ3MpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlKG1vZHVsZU5hbWUpIHtcbiAgICAgIHJldHVybiBuZXcgTG9nZ2VyKHRoaXMubG9nZ2VyLCBfb2JqZWN0U3ByZWFkKHt9LCB7XG4gICAgICAgIHByZWZpeDogXCJcIi5jb25jYXQodGhpcy5wcmVmaXgsIFwiOlwiKS5jb25jYXQobW9kdWxlTmFtZSwgXCI6XCIpXG4gICAgICB9LCB0aGlzLm9wdGlvbnMpKTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gTG9nZ2VyO1xufSgpO1xuXG52YXIgYmFzZUxvZ2dlciA9IG5ldyBMb2dnZXIoKTtcblxudmFyIEV2ZW50RW1pdHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFdmVudEVtaXR0ZXIpO1xuXG4gICAgdGhpcy5vYnNlcnZlcnMgPSB7fTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhFdmVudEVtaXR0ZXIsIFt7XG4gICAga2V5OiBcIm9uXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uKGV2ZW50cywgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgIGV2ZW50cy5zcGxpdCgnICcpLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIF90aGlzLm9ic2VydmVyc1tldmVudF0gPSBfdGhpcy5vYnNlcnZlcnNbZXZlbnRdIHx8IFtdO1xuXG4gICAgICAgIF90aGlzLm9ic2VydmVyc1tldmVudF0ucHVzaChsaXN0ZW5lcik7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJvZmZcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gb2ZmKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgaWYgKCF0aGlzLm9ic2VydmVyc1tldmVudF0pIHJldHVybjtcblxuICAgICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgICBkZWxldGUgdGhpcy5vYnNlcnZlcnNbZXZlbnRdO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMub2JzZXJ2ZXJzW2V2ZW50XSA9IHRoaXMub2JzZXJ2ZXJzW2V2ZW50XS5maWx0ZXIoZnVuY3Rpb24gKGwpIHtcbiAgICAgICAgcmV0dXJuIGwgIT09IGxpc3RlbmVyO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImVtaXRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZW1pdChldmVudCkge1xuICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICBhcmdzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub2JzZXJ2ZXJzW2V2ZW50XSkge1xuICAgICAgICB2YXIgY2xvbmVkID0gW10uY29uY2F0KHRoaXMub2JzZXJ2ZXJzW2V2ZW50XSk7XG4gICAgICAgIGNsb25lZC5mb3JFYWNoKGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgICAgICAgIG9ic2VydmVyLmFwcGx5KHZvaWQgMCwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5vYnNlcnZlcnNbJyonXSkge1xuICAgICAgICB2YXIgX2Nsb25lZCA9IFtdLmNvbmNhdCh0aGlzLm9ic2VydmVyc1snKiddKTtcblxuICAgICAgICBfY2xvbmVkLmZvckVhY2goZnVuY3Rpb24gKG9ic2VydmVyKSB7XG4gICAgICAgICAgb2JzZXJ2ZXIuYXBwbHkob2JzZXJ2ZXIsIFtldmVudF0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEV2ZW50RW1pdHRlcjtcbn0oKTtcblxuZnVuY3Rpb24gZGVmZXIoKSB7XG4gIHZhciByZXM7XG4gIHZhciByZWo7XG4gIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHJlcyA9IHJlc29sdmU7XG4gICAgcmVqID0gcmVqZWN0O1xuICB9KTtcbiAgcHJvbWlzZS5yZXNvbHZlID0gcmVzO1xuICBwcm9taXNlLnJlamVjdCA9IHJlajtcbiAgcmV0dXJuIHByb21pc2U7XG59XG5mdW5jdGlvbiBtYWtlU3RyaW5nKG9iamVjdCkge1xuICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiAnJztcbiAgcmV0dXJuICcnICsgb2JqZWN0O1xufVxuZnVuY3Rpb24gY29weShhLCBzLCB0KSB7XG4gIGEuZm9yRWFjaChmdW5jdGlvbiAobSkge1xuICAgIGlmIChzW21dKSB0W21dID0gc1ttXTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldExhc3RPZlBhdGgob2JqZWN0LCBwYXRoLCBFbXB0eSkge1xuICBmdW5jdGlvbiBjbGVhbktleShrZXkpIHtcbiAgICByZXR1cm4ga2V5ICYmIGtleS5pbmRleE9mKCcjIyMnKSA+IC0xID8ga2V5LnJlcGxhY2UoLyMjIy9nLCAnLicpIDoga2V5O1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuTm90VHJhdmVyc2VEZWVwZXIoKSB7XG4gICAgcmV0dXJuICFvYmplY3QgfHwgdHlwZW9mIG9iamVjdCA9PT0gJ3N0cmluZyc7XG4gIH1cblxuICB2YXIgc3RhY2sgPSB0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycgPyBbXS5jb25jYXQocGF0aCkgOiBwYXRoLnNwbGl0KCcuJyk7XG5cbiAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDEpIHtcbiAgICBpZiAoY2FuTm90VHJhdmVyc2VEZWVwZXIoKSkgcmV0dXJuIHt9O1xuICAgIHZhciBrZXkgPSBjbGVhbktleShzdGFjay5zaGlmdCgpKTtcbiAgICBpZiAoIW9iamVjdFtrZXldICYmIEVtcHR5KSBvYmplY3Rba2V5XSA9IG5ldyBFbXB0eSgpO1xuICAgIG9iamVjdCA9IG9iamVjdFtrZXldO1xuICB9XG5cbiAgaWYgKGNhbk5vdFRyYXZlcnNlRGVlcGVyKCkpIHJldHVybiB7fTtcbiAgcmV0dXJuIHtcbiAgICBvYmo6IG9iamVjdCxcbiAgICBrOiBjbGVhbktleShzdGFjay5zaGlmdCgpKVxuICB9O1xufVxuXG5mdW5jdGlvbiBzZXRQYXRoKG9iamVjdCwgcGF0aCwgbmV3VmFsdWUpIHtcbiAgdmFyIF9nZXRMYXN0T2ZQYXRoID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgsIE9iamVjdCksXG4gICAgICBvYmogPSBfZ2V0TGFzdE9mUGF0aC5vYmosXG4gICAgICBrID0gX2dldExhc3RPZlBhdGguaztcblxuICBvYmpba10gPSBuZXdWYWx1ZTtcbn1cbmZ1bmN0aW9uIHB1c2hQYXRoKG9iamVjdCwgcGF0aCwgbmV3VmFsdWUsIGNvbmNhdCkge1xuICB2YXIgX2dldExhc3RPZlBhdGgyID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgsIE9iamVjdCksXG4gICAgICBvYmogPSBfZ2V0TGFzdE9mUGF0aDIub2JqLFxuICAgICAgayA9IF9nZXRMYXN0T2ZQYXRoMi5rO1xuXG4gIG9ialtrXSA9IG9ialtrXSB8fCBbXTtcbiAgaWYgKGNvbmNhdCkgb2JqW2tdID0gb2JqW2tdLmNvbmNhdChuZXdWYWx1ZSk7XG4gIGlmICghY29uY2F0KSBvYmpba10ucHVzaChuZXdWYWx1ZSk7XG59XG5mdW5jdGlvbiBnZXRQYXRoKG9iamVjdCwgcGF0aCkge1xuICB2YXIgX2dldExhc3RPZlBhdGgzID0gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgpLFxuICAgICAgb2JqID0gX2dldExhc3RPZlBhdGgzLm9iaixcbiAgICAgIGsgPSBfZ2V0TGFzdE9mUGF0aDMuaztcblxuICBpZiAoIW9iaikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIG9ialtrXTtcbn1cbmZ1bmN0aW9uIGdldFBhdGhXaXRoRGVmYXVsdHMoZGF0YSwgZGVmYXVsdERhdGEsIGtleSkge1xuICB2YXIgdmFsdWUgPSBnZXRQYXRoKGRhdGEsIGtleSk7XG5cbiAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gZ2V0UGF0aChkZWZhdWx0RGF0YSwga2V5KTtcbn1cbmZ1bmN0aW9uIGRlZXBFeHRlbmQodGFyZ2V0LCBzb3VyY2UsIG92ZXJ3cml0ZSkge1xuICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgIGlmIChwcm9wICE9PSAnX19wcm90b19fJyAmJiBwcm9wICE9PSAnY29uc3RydWN0b3InKSB7XG4gICAgICBpZiAocHJvcCBpbiB0YXJnZXQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXRbcHJvcF0gPT09ICdzdHJpbmcnIHx8IHRhcmdldFtwcm9wXSBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2Ygc291cmNlW3Byb3BdID09PSAnc3RyaW5nJyB8fCBzb3VyY2VbcHJvcF0gaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICBpZiAob3ZlcndyaXRlKSB0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVlcEV4dGVuZCh0YXJnZXRbcHJvcF0sIHNvdXJjZVtwcm9wXSwgb3ZlcndyaXRlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiByZWdleEVzY2FwZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bXFwtXFxbXFxdXFwvXFx7XFx9XFwoXFwpXFwqXFwrXFw/XFwuXFxcXFxcXlxcJFxcfF0vZywgJ1xcXFwkJicpO1xufVxudmFyIF9lbnRpdHlNYXAgPSB7XG4gICcmJzogJyZhbXA7JyxcbiAgJzwnOiAnJmx0OycsXG4gICc+JzogJyZndDsnLFxuICAnXCInOiAnJnF1b3Q7JyxcbiAgXCInXCI6ICcmIzM5OycsXG4gICcvJzogJyYjeDJGOydcbn07XG5mdW5jdGlvbiBlc2NhcGUoZGF0YSkge1xuICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGRhdGEucmVwbGFjZSgvWyY8PlwiJ1xcL10vZywgZnVuY3Rpb24gKHMpIHtcbiAgICAgIHJldHVybiBfZW50aXR5TWFwW3NdO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGRhdGE7XG59XG52YXIgaXNJRTEwID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lm5hdmlnYXRvciAmJiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCAmJiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdNU0lFJykgPiAtMTtcblxudmFyIFJlc291cmNlU3RvcmUgPSBmdW5jdGlvbiAoX0V2ZW50RW1pdHRlcikge1xuICBfaW5oZXJpdHMoUmVzb3VyY2VTdG9yZSwgX0V2ZW50RW1pdHRlcik7XG5cbiAgZnVuY3Rpb24gUmVzb3VyY2VTdG9yZShkYXRhKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHtcbiAgICAgIG5zOiBbJ3RyYW5zbGF0aW9uJ10sXG4gICAgICBkZWZhdWx0TlM6ICd0cmFuc2xhdGlvbidcbiAgICB9O1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFJlc291cmNlU3RvcmUpO1xuXG4gICAgX3RoaXMgPSBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBfZ2V0UHJvdG90eXBlT2YoUmVzb3VyY2VTdG9yZSkuY2FsbCh0aGlzKSk7XG5cbiAgICBpZiAoaXNJRTEwKSB7XG4gICAgICBFdmVudEVtaXR0ZXIuY2FsbChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSk7XG4gICAgfVxuXG4gICAgX3RoaXMuZGF0YSA9IGRhdGEgfHwge307XG4gICAgX3RoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICBpZiAoX3RoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgX3RoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IgPSAnLic7XG4gICAgfVxuXG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKFJlc291cmNlU3RvcmUsIFt7XG4gICAga2V5OiBcImFkZE5hbWVzcGFjZXNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkTmFtZXNwYWNlcyhucykge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5ucy5pbmRleE9mKG5zKSA8IDApIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm5zLnB1c2gobnMpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZW1vdmVOYW1lc3BhY2VzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZU5hbWVzcGFjZXMobnMpIHtcbiAgICAgIHZhciBpbmRleCA9IHRoaXMub3B0aW9ucy5ucy5pbmRleE9mKG5zKTtcblxuICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm5zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImdldFJlc291cmNlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFJlc291cmNlKGxuZywgbnMsIGtleSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHt9O1xuICAgICAgdmFyIGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgICB2YXIgcGF0aCA9IFtsbmcsIG5zXTtcbiAgICAgIGlmIChrZXkgJiYgdHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHBhdGggPSBwYXRoLmNvbmNhdChrZXkpO1xuICAgICAgaWYgKGtleSAmJiB0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykgcGF0aCA9IHBhdGguY29uY2F0KGtleVNlcGFyYXRvciA/IGtleS5zcGxpdChrZXlTZXBhcmF0b3IpIDoga2V5KTtcblxuICAgICAgaWYgKGxuZy5pbmRleE9mKCcuJykgPiAtMSkge1xuICAgICAgICBwYXRoID0gbG5nLnNwbGl0KCcuJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBnZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImFkZFJlc291cmNlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFkZFJlc291cmNlKGxuZywgbnMsIGtleSwgdmFsdWUpIHtcbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDQgJiYgYXJndW1lbnRzWzRdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNF0gOiB7XG4gICAgICAgIHNpbGVudDogZmFsc2VcbiAgICAgIH07XG4gICAgICB2YXIga2V5U2VwYXJhdG9yID0gdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICAgIGlmIChrZXlTZXBhcmF0b3IgPT09IHVuZGVmaW5lZCkga2V5U2VwYXJhdG9yID0gJy4nO1xuICAgICAgdmFyIHBhdGggPSBbbG5nLCBuc107XG4gICAgICBpZiAoa2V5KSBwYXRoID0gcGF0aC5jb25jYXQoa2V5U2VwYXJhdG9yID8ga2V5LnNwbGl0KGtleVNlcGFyYXRvcikgOiBrZXkpO1xuXG4gICAgICBpZiAobG5nLmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgICAgIHBhdGggPSBsbmcuc3BsaXQoJy4nKTtcbiAgICAgICAgdmFsdWUgPSBucztcbiAgICAgICAgbnMgPSBwYXRoWzFdO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmFkZE5hbWVzcGFjZXMobnMpO1xuICAgICAgc2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgsIHZhbHVlKTtcbiAgICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHRoaXMuZW1pdCgnYWRkZWQnLCBsbmcsIG5zLCBrZXksIHZhbHVlKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiYWRkUmVzb3VyY2VzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFkZFJlc291cmNlcyhsbmcsIG5zLCByZXNvdXJjZXMpIHtcbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiB7XG4gICAgICAgIHNpbGVudDogZmFsc2VcbiAgICAgIH07XG5cbiAgICAgIGZvciAodmFyIG0gaW4gcmVzb3VyY2VzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzb3VyY2VzW21dID09PSAnc3RyaW5nJyB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KHJlc291cmNlc1ttXSkgPT09ICdbb2JqZWN0IEFycmF5XScpIHRoaXMuYWRkUmVzb3VyY2UobG5nLCBucywgbSwgcmVzb3VyY2VzW21dLCB7XG4gICAgICAgICAgc2lsZW50OiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB0aGlzLmVtaXQoJ2FkZGVkJywgbG5nLCBucywgcmVzb3VyY2VzKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiYWRkUmVzb3VyY2VCdW5kbGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkUmVzb3VyY2VCdW5kbGUobG5nLCBucywgcmVzb3VyY2VzLCBkZWVwLCBvdmVyd3JpdGUpIHtcbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgJiYgYXJndW1lbnRzWzVdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNV0gOiB7XG4gICAgICAgIHNpbGVudDogZmFsc2VcbiAgICAgIH07XG4gICAgICB2YXIgcGF0aCA9IFtsbmcsIG5zXTtcblxuICAgICAgaWYgKGxuZy5pbmRleE9mKCcuJykgPiAtMSkge1xuICAgICAgICBwYXRoID0gbG5nLnNwbGl0KCcuJyk7XG4gICAgICAgIGRlZXAgPSByZXNvdXJjZXM7XG4gICAgICAgIHJlc291cmNlcyA9IG5zO1xuICAgICAgICBucyA9IHBhdGhbMV07XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYWRkTmFtZXNwYWNlcyhucyk7XG4gICAgICB2YXIgcGFjayA9IGdldFBhdGgodGhpcy5kYXRhLCBwYXRoKSB8fCB7fTtcblxuICAgICAgaWYgKGRlZXApIHtcbiAgICAgICAgZGVlcEV4dGVuZChwYWNrLCByZXNvdXJjZXMsIG92ZXJ3cml0ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYWNrID0gX29iamVjdFNwcmVhZCh7fSwgcGFjaywgcmVzb3VyY2VzKTtcbiAgICAgIH1cblxuICAgICAgc2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgsIHBhY2spO1xuICAgICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy5lbWl0KCdhZGRlZCcsIGxuZywgbnMsIHJlc291cmNlcyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbW92ZVJlc291cmNlQnVuZGxlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZVJlc291cmNlQnVuZGxlKGxuZywgbnMpIHtcbiAgICAgIGlmICh0aGlzLmhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmRhdGFbbG5nXVtuc107XG4gICAgICB9XG5cbiAgICAgIHRoaXMucmVtb3ZlTmFtZXNwYWNlcyhucyk7XG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZWQnLCBsbmcsIG5zKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaGFzUmVzb3VyY2VCdW5kbGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaGFzUmVzb3VyY2VCdW5kbGUobG5nLCBucykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzb3VyY2UobG5nLCBucykgIT09IHVuZGVmaW5lZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0UmVzb3VyY2VCdW5kbGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0UmVzb3VyY2VCdW5kbGUobG5nLCBucykge1xuICAgICAgaWYgKCFucykgbnMgPSB0aGlzLm9wdGlvbnMuZGVmYXVsdE5TO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5QVBJID09PSAndjEnKSByZXR1cm4gX29iamVjdFNwcmVhZCh7fSwge30sIHRoaXMuZ2V0UmVzb3VyY2UobG5nLCBucykpO1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0UmVzb3VyY2UobG5nLCBucyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImdldERhdGFCeUxhbmd1YWdlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldERhdGFCeUxhbmd1YWdlKGxuZykge1xuICAgICAgcmV0dXJuIHRoaXMuZGF0YVtsbmddO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJ0b0pTT05cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gdG9KU09OKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gUmVzb3VyY2VTdG9yZTtcbn0oRXZlbnRFbWl0dGVyKTtcblxudmFyIHBvc3RQcm9jZXNzb3IgPSB7XG4gIHByb2Nlc3NvcnM6IHt9LFxuICBhZGRQb3N0UHJvY2Vzc29yOiBmdW5jdGlvbiBhZGRQb3N0UHJvY2Vzc29yKG1vZHVsZSkge1xuICAgIHRoaXMucHJvY2Vzc29yc1ttb2R1bGUubmFtZV0gPSBtb2R1bGU7XG4gIH0sXG4gIGhhbmRsZTogZnVuY3Rpb24gaGFuZGxlKHByb2Nlc3NvcnMsIHZhbHVlLCBrZXksIG9wdGlvbnMsIHRyYW5zbGF0b3IpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgcHJvY2Vzc29ycy5mb3JFYWNoKGZ1bmN0aW9uIChwcm9jZXNzb3IpIHtcbiAgICAgIGlmIChfdGhpcy5wcm9jZXNzb3JzW3Byb2Nlc3Nvcl0pIHZhbHVlID0gX3RoaXMucHJvY2Vzc29yc1twcm9jZXNzb3JdLnByb2Nlc3ModmFsdWUsIGtleSwgb3B0aW9ucywgdHJhbnNsYXRvcik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59O1xuXG52YXIgY2hlY2tlZExvYWRlZEZvciA9IHt9O1xuXG52YXIgVHJhbnNsYXRvciA9IGZ1bmN0aW9uIChfRXZlbnRFbWl0dGVyKSB7XG4gIF9pbmhlcml0cyhUcmFuc2xhdG9yLCBfRXZlbnRFbWl0dGVyKTtcblxuICBmdW5jdGlvbiBUcmFuc2xhdG9yKHNlcnZpY2VzKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRyYW5zbGF0b3IpO1xuXG4gICAgX3RoaXMgPSBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBfZ2V0UHJvdG90eXBlT2YoVHJhbnNsYXRvcikuY2FsbCh0aGlzKSk7XG5cbiAgICBpZiAoaXNJRTEwKSB7XG4gICAgICBFdmVudEVtaXR0ZXIuY2FsbChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSk7XG4gICAgfVxuXG4gICAgY29weShbJ3Jlc291cmNlU3RvcmUnLCAnbGFuZ3VhZ2VVdGlscycsICdwbHVyYWxSZXNvbHZlcicsICdpbnRlcnBvbGF0b3InLCAnYmFja2VuZENvbm5lY3RvcicsICdpMThuRm9ybWF0JywgJ3V0aWxzJ10sIHNlcnZpY2VzLCBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSk7XG4gICAgX3RoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICBpZiAoX3RoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgX3RoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3IgPSAnLic7XG4gICAgfVxuXG4gICAgX3RoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ3RyYW5zbGF0b3InKTtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoVHJhbnNsYXRvciwgW3tcbiAgICBrZXk6IFwiY2hhbmdlTGFuZ3VhZ2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2hhbmdlTGFuZ3VhZ2UobG5nKSB7XG4gICAgICBpZiAobG5nKSB0aGlzLmxhbmd1YWdlID0gbG5nO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJleGlzdHNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZXhpc3RzKGtleSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHtcbiAgICAgICAgaW50ZXJwb2xhdGlvbjoge31cbiAgICAgIH07XG4gICAgICB2YXIgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmUoa2V5LCBvcHRpb25zKTtcbiAgICAgIHJldHVybiByZXNvbHZlZCAmJiByZXNvbHZlZC5yZXMgIT09IHVuZGVmaW5lZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZXh0cmFjdEZyb21LZXlcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZXh0cmFjdEZyb21LZXkoa2V5LCBvcHRpb25zKSB7XG4gICAgICB2YXIgbnNTZXBhcmF0b3IgPSBvcHRpb25zLm5zU2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLm5zU2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLm5zU2VwYXJhdG9yO1xuICAgICAgaWYgKG5zU2VwYXJhdG9yID09PSB1bmRlZmluZWQpIG5zU2VwYXJhdG9yID0gJzonO1xuICAgICAgdmFyIGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG4gICAgICB2YXIgbmFtZXNwYWNlcyA9IG9wdGlvbnMubnMgfHwgdGhpcy5vcHRpb25zLmRlZmF1bHROUztcblxuICAgICAgaWYgKG5zU2VwYXJhdG9yICYmIGtleS5pbmRleE9mKG5zU2VwYXJhdG9yKSA+IC0xKSB7XG4gICAgICAgIHZhciBtID0ga2V5Lm1hdGNoKHRoaXMuaW50ZXJwb2xhdG9yLm5lc3RpbmdSZWdleHApO1xuXG4gICAgICAgIGlmIChtICYmIG0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgIG5hbWVzcGFjZXM6IG5hbWVzcGFjZXNcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBhcnRzID0ga2V5LnNwbGl0KG5zU2VwYXJhdG9yKTtcbiAgICAgICAgaWYgKG5zU2VwYXJhdG9yICE9PSBrZXlTZXBhcmF0b3IgfHwgbnNTZXBhcmF0b3IgPT09IGtleVNlcGFyYXRvciAmJiB0aGlzLm9wdGlvbnMubnMuaW5kZXhPZihwYXJ0c1swXSkgPiAtMSkgbmFtZXNwYWNlcyA9IHBhcnRzLnNoaWZ0KCk7XG4gICAgICAgIGtleSA9IHBhcnRzLmpvaW4oa2V5U2VwYXJhdG9yKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBuYW1lc3BhY2VzID09PSAnc3RyaW5nJykgbmFtZXNwYWNlcyA9IFtuYW1lc3BhY2VzXTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBuYW1lc3BhY2VzOiBuYW1lc3BhY2VzXG4gICAgICB9O1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJ0cmFuc2xhdGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gdHJhbnNsYXRlKGtleXMsIG9wdGlvbnMsIGxhc3RLZXkpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICBpZiAoX3R5cGVvZihvcHRpb25zKSAhPT0gJ29iamVjdCcgJiYgdGhpcy5vcHRpb25zLm92ZXJsb2FkVHJhbnNsYXRpb25PcHRpb25IYW5kbGVyKSB7XG4gICAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMub3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXIoYXJndW1lbnRzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gICAgICBpZiAoa2V5cyA9PT0gdW5kZWZpbmVkIHx8IGtleXMgPT09IG51bGwpIHJldHVybiAnJztcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkga2V5cyA9IFtTdHJpbmcoa2V5cyldO1xuICAgICAgdmFyIGtleVNlcGFyYXRvciA9IG9wdGlvbnMua2V5U2VwYXJhdG9yICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmtleVNlcGFyYXRvciA6IHRoaXMub3B0aW9ucy5rZXlTZXBhcmF0b3I7XG5cbiAgICAgIHZhciBfdGhpcyRleHRyYWN0RnJvbUtleSA9IHRoaXMuZXh0cmFjdEZyb21LZXkoa2V5c1trZXlzLmxlbmd0aCAtIDFdLCBvcHRpb25zKSxcbiAgICAgICAgICBrZXkgPSBfdGhpcyRleHRyYWN0RnJvbUtleS5rZXksXG4gICAgICAgICAgbmFtZXNwYWNlcyA9IF90aGlzJGV4dHJhY3RGcm9tS2V5Lm5hbWVzcGFjZXM7XG5cbiAgICAgIHZhciBuYW1lc3BhY2UgPSBuYW1lc3BhY2VzW25hbWVzcGFjZXMubGVuZ3RoIC0gMV07XG4gICAgICB2YXIgbG5nID0gb3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZTtcbiAgICAgIHZhciBhcHBlbmROYW1lc3BhY2VUb0NJTW9kZSA9IG9wdGlvbnMuYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGUgfHwgdGhpcy5vcHRpb25zLmFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlO1xuXG4gICAgICBpZiAobG5nICYmIGxuZy50b0xvd2VyQ2FzZSgpID09PSAnY2ltb2RlJykge1xuICAgICAgICBpZiAoYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGUpIHtcbiAgICAgICAgICB2YXIgbnNTZXBhcmF0b3IgPSBvcHRpb25zLm5zU2VwYXJhdG9yIHx8IHRoaXMub3B0aW9ucy5uc1NlcGFyYXRvcjtcbiAgICAgICAgICByZXR1cm4gbmFtZXNwYWNlICsgbnNTZXBhcmF0b3IgKyBrZXk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgfVxuXG4gICAgICB2YXIgcmVzb2x2ZWQgPSB0aGlzLnJlc29sdmUoa2V5cywgb3B0aW9ucyk7XG4gICAgICB2YXIgcmVzID0gcmVzb2x2ZWQgJiYgcmVzb2x2ZWQucmVzO1xuICAgICAgdmFyIHJlc1VzZWRLZXkgPSByZXNvbHZlZCAmJiByZXNvbHZlZC51c2VkS2V5IHx8IGtleTtcbiAgICAgIHZhciByZXNFeGFjdFVzZWRLZXkgPSByZXNvbHZlZCAmJiByZXNvbHZlZC5leGFjdFVzZWRLZXkgfHwga2V5O1xuICAgICAgdmFyIHJlc1R5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KHJlcyk7XG4gICAgICB2YXIgbm9PYmplY3QgPSBbJ1tvYmplY3QgTnVtYmVyXScsICdbb2JqZWN0IEZ1bmN0aW9uXScsICdbb2JqZWN0IFJlZ0V4cF0nXTtcbiAgICAgIHZhciBqb2luQXJyYXlzID0gb3B0aW9ucy5qb2luQXJyYXlzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmpvaW5BcnJheXMgOiB0aGlzLm9wdGlvbnMuam9pbkFycmF5cztcbiAgICAgIHZhciBoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCA9ICF0aGlzLmkxOG5Gb3JtYXQgfHwgdGhpcy5pMThuRm9ybWF0LmhhbmRsZUFzT2JqZWN0O1xuICAgICAgdmFyIGhhbmRsZUFzT2JqZWN0ID0gdHlwZW9mIHJlcyAhPT0gJ3N0cmluZycgJiYgdHlwZW9mIHJlcyAhPT0gJ2Jvb2xlYW4nICYmIHR5cGVvZiByZXMgIT09ICdudW1iZXInO1xuXG4gICAgICBpZiAoaGFuZGxlQXNPYmplY3RJbkkxOG5Gb3JtYXQgJiYgcmVzICYmIGhhbmRsZUFzT2JqZWN0ICYmIG5vT2JqZWN0LmluZGV4T2YocmVzVHlwZSkgPCAwICYmICEodHlwZW9mIGpvaW5BcnJheXMgPT09ICdzdHJpbmcnICYmIHJlc1R5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpKSB7XG4gICAgICAgIGlmICghb3B0aW9ucy5yZXR1cm5PYmplY3RzICYmICF0aGlzLm9wdGlvbnMucmV0dXJuT2JqZWN0cykge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ2FjY2Vzc2luZyBhbiBvYmplY3QgLSBidXQgcmV0dXJuT2JqZWN0cyBvcHRpb25zIGlzIG5vdCBlbmFibGVkIScpO1xuICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMucmV0dXJuZWRPYmplY3RIYW5kbGVyID8gdGhpcy5vcHRpb25zLnJldHVybmVkT2JqZWN0SGFuZGxlcihyZXNVc2VkS2V5LCByZXMsIG9wdGlvbnMpIDogXCJrZXkgJ1wiLmNvbmNhdChrZXksIFwiIChcIikuY29uY2F0KHRoaXMubGFuZ3VhZ2UsIFwiKScgcmV0dXJuZWQgYW4gb2JqZWN0IGluc3RlYWQgb2Ygc3RyaW5nLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXlTZXBhcmF0b3IpIHtcbiAgICAgICAgICB2YXIgcmVzVHlwZUlzQXJyYXkgPSByZXNUeXBlID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgICAgICAgIHZhciBjb3B5JCQxID0gcmVzVHlwZUlzQXJyYXkgPyBbXSA6IHt9O1xuICAgICAgICAgIHZhciBuZXdLZXlUb1VzZSA9IHJlc1R5cGVJc0FycmF5ID8gcmVzRXhhY3RVc2VkS2V5IDogcmVzVXNlZEtleTtcblxuICAgICAgICAgIGZvciAodmFyIG0gaW4gcmVzKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlcywgbSkpIHtcbiAgICAgICAgICAgICAgdmFyIGRlZXBLZXkgPSBcIlwiLmNvbmNhdChuZXdLZXlUb1VzZSkuY29uY2F0KGtleVNlcGFyYXRvcikuY29uY2F0KG0pO1xuICAgICAgICAgICAgICBjb3B5JCQxW21dID0gdGhpcy50cmFuc2xhdGUoZGVlcEtleSwgX29iamVjdFNwcmVhZCh7fSwgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIGpvaW5BcnJheXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG5zOiBuYW1lc3BhY2VzXG4gICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgaWYgKGNvcHkkJDFbbV0gPT09IGRlZXBLZXkpIGNvcHkkJDFbbV0gPSByZXNbbV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzID0gY29weSQkMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCAmJiB0eXBlb2Ygam9pbkFycmF5cyA9PT0gJ3N0cmluZycgJiYgcmVzVHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICByZXMgPSByZXMuam9pbihqb2luQXJyYXlzKTtcbiAgICAgICAgaWYgKHJlcykgcmVzID0gdGhpcy5leHRlbmRUcmFuc2xhdGlvbihyZXMsIGtleXMsIG9wdGlvbnMsIGxhc3RLZXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHVzZWREZWZhdWx0ID0gZmFsc2U7XG4gICAgICAgIHZhciB1c2VkS2V5ID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWRMb29rdXAocmVzKSAmJiBvcHRpb25zLmRlZmF1bHRWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdXNlZERlZmF1bHQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKG9wdGlvbnMuY291bnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IHRoaXMucGx1cmFsUmVzb2x2ZXIuZ2V0U3VmZml4KGxuZywgb3B0aW9ucy5jb3VudCk7XG4gICAgICAgICAgICByZXMgPSBvcHRpb25zW1wiZGVmYXVsdFZhbHVlXCIuY29uY2F0KHN1ZmZpeCldO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghcmVzKSByZXMgPSBvcHRpb25zLmRlZmF1bHRWYWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5pc1ZhbGlkTG9va3VwKHJlcykpIHtcbiAgICAgICAgICB1c2VkS2V5ID0gdHJ1ZTtcbiAgICAgICAgICByZXMgPSBrZXk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdXBkYXRlTWlzc2luZyA9IG9wdGlvbnMuZGVmYXVsdFZhbHVlICYmIG9wdGlvbnMuZGVmYXVsdFZhbHVlICE9PSByZXMgJiYgdGhpcy5vcHRpb25zLnVwZGF0ZU1pc3Npbmc7XG5cbiAgICAgICAgaWYgKHVzZWRLZXkgfHwgdXNlZERlZmF1bHQgfHwgdXBkYXRlTWlzc2luZykge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLmxvZyh1cGRhdGVNaXNzaW5nID8gJ3VwZGF0ZUtleScgOiAnbWlzc2luZ0tleScsIGxuZywgbmFtZXNwYWNlLCBrZXksIHVwZGF0ZU1pc3NpbmcgPyBvcHRpb25zLmRlZmF1bHRWYWx1ZSA6IHJlcyk7XG5cbiAgICAgICAgICBpZiAoa2V5U2VwYXJhdG9yKSB7XG4gICAgICAgICAgICB2YXIgZmsgPSB0aGlzLnJlc29sdmUoa2V5LCBfb2JqZWN0U3ByZWFkKHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgIGtleVNlcGFyYXRvcjogZmFsc2VcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGlmIChmayAmJiBmay5yZXMpIHRoaXMubG9nZ2VyLndhcm4oJ1NlZW1zIHRoZSBsb2FkZWQgdHJhbnNsYXRpb25zIHdlcmUgaW4gZmxhdCBKU09OIGZvcm1hdCBpbnN0ZWFkIG9mIG5lc3RlZC4gRWl0aGVyIHNldCBrZXlTZXBhcmF0b3I6IGZhbHNlIG9uIGluaXQgb3IgbWFrZSBzdXJlIHlvdXIgdHJhbnNsYXRpb25zIGFyZSBwdWJsaXNoZWQgaW4gbmVzdGVkIGZvcm1hdC4nKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgbG5ncyA9IFtdO1xuICAgICAgICAgIHZhciBmYWxsYmFja0xuZ3MgPSB0aGlzLmxhbmd1YWdlVXRpbHMuZ2V0RmFsbGJhY2tDb2Rlcyh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcsIG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UpO1xuXG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1RvID09PSAnZmFsbGJhY2snICYmIGZhbGxiYWNrTG5ncyAmJiBmYWxsYmFja0xuZ3NbMF0pIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmFsbGJhY2tMbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGxuZ3MucHVzaChmYWxsYmFja0xuZ3NbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnNhdmVNaXNzaW5nVG8gPT09ICdhbGwnKSB7XG4gICAgICAgICAgICBsbmdzID0gdGhpcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG5ncy5wdXNoKG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBzZW5kID0gZnVuY3Rpb24gc2VuZChsLCBrKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMyLm9wdGlvbnMubWlzc2luZ0tleUhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgX3RoaXMyLm9wdGlvbnMubWlzc2luZ0tleUhhbmRsZXIobCwgbmFtZXNwYWNlLCBrLCB1cGRhdGVNaXNzaW5nID8gb3B0aW9ucy5kZWZhdWx0VmFsdWUgOiByZXMsIHVwZGF0ZU1pc3NpbmcsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChfdGhpczIuYmFja2VuZENvbm5lY3RvciAmJiBfdGhpczIuYmFja2VuZENvbm5lY3Rvci5zYXZlTWlzc2luZykge1xuICAgICAgICAgICAgICBfdGhpczIuYmFja2VuZENvbm5lY3Rvci5zYXZlTWlzc2luZyhsLCBuYW1lc3BhY2UsIGssIHVwZGF0ZU1pc3NpbmcgPyBvcHRpb25zLmRlZmF1bHRWYWx1ZSA6IHJlcywgdXBkYXRlTWlzc2luZywgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF90aGlzMi5lbWl0KCdtaXNzaW5nS2V5JywgbCwgbmFtZXNwYWNlLCBrLCByZXMpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNhdmVNaXNzaW5nKSB7XG4gICAgICAgICAgICB2YXIgbmVlZHNQbHVyYWxIYW5kbGluZyA9IG9wdGlvbnMuY291bnQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0aW9ucy5jb3VudCAhPT0gJ3N0cmluZyc7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2F2ZU1pc3NpbmdQbHVyYWxzICYmIG5lZWRzUGx1cmFsSGFuZGxpbmcpIHtcbiAgICAgICAgICAgICAgbG5ncy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBsdXJhbHMgPSBfdGhpczIucGx1cmFsUmVzb2x2ZXIuZ2V0UGx1cmFsRm9ybXNPZktleShsLCBrZXkpO1xuXG4gICAgICAgICAgICAgICAgcGx1cmFscy5mb3JFYWNoKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gc2VuZChbbF0sIHApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNlbmQobG5ncywga2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXMgPSB0aGlzLmV4dGVuZFRyYW5zbGF0aW9uKHJlcywga2V5cywgb3B0aW9ucywgcmVzb2x2ZWQsIGxhc3RLZXkpO1xuICAgICAgICBpZiAodXNlZEtleSAmJiByZXMgPT09IGtleSAmJiB0aGlzLm9wdGlvbnMuYXBwZW5kTmFtZXNwYWNlVG9NaXNzaW5nS2V5KSByZXMgPSBcIlwiLmNvbmNhdChuYW1lc3BhY2UsIFwiOlwiKS5jb25jYXQoa2V5KTtcbiAgICAgICAgaWYgKHVzZWRLZXkgJiYgdGhpcy5vcHRpb25zLnBhcnNlTWlzc2luZ0tleUhhbmRsZXIpIHJlcyA9IHRoaXMub3B0aW9ucy5wYXJzZU1pc3NpbmdLZXlIYW5kbGVyKHJlcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImV4dGVuZFRyYW5zbGF0aW9uXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGV4dGVuZFRyYW5zbGF0aW9uKHJlcywga2V5LCBvcHRpb25zLCByZXNvbHZlZCwgbGFzdEtleSkge1xuICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgIGlmICh0aGlzLmkxOG5Gb3JtYXQgJiYgdGhpcy5pMThuRm9ybWF0LnBhcnNlKSB7XG4gICAgICAgIHJlcyA9IHRoaXMuaTE4bkZvcm1hdC5wYXJzZShyZXMsIG9wdGlvbnMsIHJlc29sdmVkLnVzZWRMbmcsIHJlc29sdmVkLnVzZWROUywgcmVzb2x2ZWQudXNlZEtleSwge1xuICAgICAgICAgIHJlc29sdmVkOiByZXNvbHZlZFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoIW9wdGlvbnMuc2tpcEludGVycG9sYXRpb24pIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaW50ZXJwb2xhdGlvbikgdGhpcy5pbnRlcnBvbGF0b3IuaW5pdChfb2JqZWN0U3ByZWFkKHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgaW50ZXJwb2xhdGlvbjogX29iamVjdFNwcmVhZCh7fSwgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24sIG9wdGlvbnMuaW50ZXJwb2xhdGlvbilcbiAgICAgICAgfSkpO1xuICAgICAgICB2YXIgc2tpcE9uVmFyaWFibGVzID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uICYmIG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXMgfHwgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uc2tpcE9uVmFyaWFibGVzO1xuICAgICAgICB2YXIgbmVzdEJlZjtcblxuICAgICAgICBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgICAgdmFyIG5iID0gcmVzLm1hdGNoKHRoaXMuaW50ZXJwb2xhdG9yLm5lc3RpbmdSZWdleHApO1xuICAgICAgICAgIG5lc3RCZWYgPSBuYiAmJiBuYi5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGF0YSA9IG9wdGlvbnMucmVwbGFjZSAmJiB0eXBlb2Ygb3B0aW9ucy5yZXBsYWNlICE9PSAnc3RyaW5nJyA/IG9wdGlvbnMucmVwbGFjZSA6IG9wdGlvbnM7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzKSBkYXRhID0gX29iamVjdFNwcmVhZCh7fSwgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcywgZGF0YSk7XG4gICAgICAgIHJlcyA9IHRoaXMuaW50ZXJwb2xhdG9yLmludGVycG9sYXRlKHJlcywgZGF0YSwgb3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZSwgb3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICAgIHZhciBuYSA9IHJlcy5tYXRjaCh0aGlzLmludGVycG9sYXRvci5uZXN0aW5nUmVnZXhwKTtcbiAgICAgICAgICB2YXIgbmVzdEFmdCA9IG5hICYmIG5hLmxlbmd0aDtcbiAgICAgICAgICBpZiAobmVzdEJlZiA8IG5lc3RBZnQpIG9wdGlvbnMubmVzdCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMubmVzdCAhPT0gZmFsc2UpIHJlcyA9IHRoaXMuaW50ZXJwb2xhdG9yLm5lc3QocmVzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgICAgICBhcmdzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChsYXN0S2V5ICYmIGxhc3RLZXlbMF0gPT09IGFyZ3NbMF0gJiYgIW9wdGlvbnMuY29udGV4dCkge1xuICAgICAgICAgICAgX3RoaXMzLmxvZ2dlci53YXJuKFwiSXQgc2VlbXMgeW91IGFyZSBuZXN0aW5nIHJlY3Vyc2l2ZWx5IGtleTogXCIuY29uY2F0KGFyZ3NbMF0sIFwiIGluIGtleTogXCIpLmNvbmNhdChrZXlbMF0pKTtcblxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIF90aGlzMy50cmFuc2xhdGUuYXBwbHkoX3RoaXMzLCBhcmdzLmNvbmNhdChba2V5XSkpO1xuICAgICAgICB9LCBvcHRpb25zKTtcbiAgICAgICAgaWYgKG9wdGlvbnMuaW50ZXJwb2xhdGlvbikgdGhpcy5pbnRlcnBvbGF0b3IucmVzZXQoKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHBvc3RQcm9jZXNzID0gb3B0aW9ucy5wb3N0UHJvY2VzcyB8fCB0aGlzLm9wdGlvbnMucG9zdFByb2Nlc3M7XG4gICAgICB2YXIgcG9zdFByb2Nlc3Nvck5hbWVzID0gdHlwZW9mIHBvc3RQcm9jZXNzID09PSAnc3RyaW5nJyA/IFtwb3N0UHJvY2Vzc10gOiBwb3N0UHJvY2VzcztcblxuICAgICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkICYmIHJlcyAhPT0gbnVsbCAmJiBwb3N0UHJvY2Vzc29yTmFtZXMgJiYgcG9zdFByb2Nlc3Nvck5hbWVzLmxlbmd0aCAmJiBvcHRpb25zLmFwcGx5UG9zdFByb2Nlc3NvciAhPT0gZmFsc2UpIHtcbiAgICAgICAgcmVzID0gcG9zdFByb2Nlc3Nvci5oYW5kbGUocG9zdFByb2Nlc3Nvck5hbWVzLCByZXMsIGtleSwgdGhpcy5vcHRpb25zICYmIHRoaXMub3B0aW9ucy5wb3N0UHJvY2Vzc1Bhc3NSZXNvbHZlZCA/IF9vYmplY3RTcHJlYWQoe1xuICAgICAgICAgIGkxOG5SZXNvbHZlZDogcmVzb2x2ZWRcbiAgICAgICAgfSwgb3B0aW9ucykgOiBvcHRpb25zLCB0aGlzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVzb2x2ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXNvbHZlKGtleXMpIHtcbiAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgICB2YXIgZm91bmQ7XG4gICAgICB2YXIgdXNlZEtleTtcbiAgICAgIHZhciBleGFjdFVzZWRLZXk7XG4gICAgICB2YXIgdXNlZExuZztcbiAgICAgIHZhciB1c2VkTlM7XG4gICAgICBpZiAodHlwZW9mIGtleXMgPT09ICdzdHJpbmcnKSBrZXlzID0gW2tleXNdO1xuICAgICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIGlmIChfdGhpczQuaXNWYWxpZExvb2t1cChmb3VuZCkpIHJldHVybjtcblxuICAgICAgICB2YXIgZXh0cmFjdGVkID0gX3RoaXM0LmV4dHJhY3RGcm9tS2V5KGssIG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBrZXkgPSBleHRyYWN0ZWQua2V5O1xuICAgICAgICB1c2VkS2V5ID0ga2V5O1xuICAgICAgICB2YXIgbmFtZXNwYWNlcyA9IGV4dHJhY3RlZC5uYW1lc3BhY2VzO1xuICAgICAgICBpZiAoX3RoaXM0Lm9wdGlvbnMuZmFsbGJhY2tOUykgbmFtZXNwYWNlcyA9IG5hbWVzcGFjZXMuY29uY2F0KF90aGlzNC5vcHRpb25zLmZhbGxiYWNrTlMpO1xuICAgICAgICB2YXIgbmVlZHNQbHVyYWxIYW5kbGluZyA9IG9wdGlvbnMuY291bnQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0aW9ucy5jb3VudCAhPT0gJ3N0cmluZyc7XG4gICAgICAgIHZhciBuZWVkc0NvbnRleHRIYW5kbGluZyA9IG9wdGlvbnMuY29udGV4dCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zLmNvbnRleHQgPT09ICdzdHJpbmcnICYmIG9wdGlvbnMuY29udGV4dCAhPT0gJyc7XG4gICAgICAgIHZhciBjb2RlcyA9IG9wdGlvbnMubG5ncyA/IG9wdGlvbnMubG5ncyA6IF90aGlzNC5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShvcHRpb25zLmxuZyB8fCBfdGhpczQubGFuZ3VhZ2UsIG9wdGlvbnMuZmFsbGJhY2tMbmcpO1xuICAgICAgICBuYW1lc3BhY2VzLmZvckVhY2goZnVuY3Rpb24gKG5zKSB7XG4gICAgICAgICAgaWYgKF90aGlzNC5pc1ZhbGlkTG9va3VwKGZvdW5kKSkgcmV0dXJuO1xuICAgICAgICAgIHVzZWROUyA9IG5zO1xuXG4gICAgICAgICAgaWYgKCFjaGVja2VkTG9hZGVkRm9yW1wiXCIuY29uY2F0KGNvZGVzWzBdLCBcIi1cIikuY29uY2F0KG5zKV0gJiYgX3RoaXM0LnV0aWxzICYmIF90aGlzNC51dGlscy5oYXNMb2FkZWROYW1lc3BhY2UgJiYgIV90aGlzNC51dGlscy5oYXNMb2FkZWROYW1lc3BhY2UodXNlZE5TKSkge1xuICAgICAgICAgICAgY2hlY2tlZExvYWRlZEZvcltcIlwiLmNvbmNhdChjb2Rlc1swXSwgXCItXCIpLmNvbmNhdChucyldID0gdHJ1ZTtcblxuICAgICAgICAgICAgX3RoaXM0LmxvZ2dlci53YXJuKFwia2V5IFxcXCJcIi5jb25jYXQodXNlZEtleSwgXCJcXFwiIGZvciBsYW5ndWFnZXMgXFxcIlwiKS5jb25jYXQoY29kZXMuam9pbignLCAnKSwgXCJcXFwiIHdvbid0IGdldCByZXNvbHZlZCBhcyBuYW1lc3BhY2UgXFxcIlwiKS5jb25jYXQodXNlZE5TLCBcIlxcXCIgd2FzIG5vdCB5ZXQgbG9hZGVkXCIpLCAnVGhpcyBtZWFucyBzb21ldGhpbmcgSVMgV1JPTkcgaW4geW91ciBzZXR1cC4gWW91IGFjY2VzcyB0aGUgdCBmdW5jdGlvbiBiZWZvcmUgaTE4bmV4dC5pbml0IC8gaTE4bmV4dC5sb2FkTmFtZXNwYWNlIC8gaTE4bmV4dC5jaGFuZ2VMYW5ndWFnZSB3YXMgZG9uZS4gV2FpdCBmb3IgdGhlIGNhbGxiYWNrIG9yIFByb21pc2UgdG8gcmVzb2x2ZSBiZWZvcmUgYWNjZXNzaW5nIGl0ISEhJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29kZXMuZm9yRWFjaChmdW5jdGlvbiAoY29kZSkge1xuICAgICAgICAgICAgaWYgKF90aGlzNC5pc1ZhbGlkTG9va3VwKGZvdW5kKSkgcmV0dXJuO1xuICAgICAgICAgICAgdXNlZExuZyA9IGNvZGU7XG4gICAgICAgICAgICB2YXIgZmluYWxLZXkgPSBrZXk7XG4gICAgICAgICAgICB2YXIgZmluYWxLZXlzID0gW2ZpbmFsS2V5XTtcblxuICAgICAgICAgICAgaWYgKF90aGlzNC5pMThuRm9ybWF0ICYmIF90aGlzNC5pMThuRm9ybWF0LmFkZExvb2t1cEtleXMpIHtcbiAgICAgICAgICAgICAgX3RoaXM0LmkxOG5Gb3JtYXQuYWRkTG9va3VwS2V5cyhmaW5hbEtleXMsIGtleSwgY29kZSwgbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdmFyIHBsdXJhbFN1ZmZpeDtcbiAgICAgICAgICAgICAgaWYgKG5lZWRzUGx1cmFsSGFuZGxpbmcpIHBsdXJhbFN1ZmZpeCA9IF90aGlzNC5wbHVyYWxSZXNvbHZlci5nZXRTdWZmaXgoY29kZSwgb3B0aW9ucy5jb3VudCk7XG4gICAgICAgICAgICAgIGlmIChuZWVkc1BsdXJhbEhhbmRsaW5nICYmIG5lZWRzQ29udGV4dEhhbmRsaW5nKSBmaW5hbEtleXMucHVzaChmaW5hbEtleSArIHBsdXJhbFN1ZmZpeCk7XG4gICAgICAgICAgICAgIGlmIChuZWVkc0NvbnRleHRIYW5kbGluZykgZmluYWxLZXlzLnB1c2goZmluYWxLZXkgKz0gXCJcIi5jb25jYXQoX3RoaXM0Lm9wdGlvbnMuY29udGV4dFNlcGFyYXRvcikuY29uY2F0KG9wdGlvbnMuY29udGV4dCkpO1xuICAgICAgICAgICAgICBpZiAobmVlZHNQbHVyYWxIYW5kbGluZykgZmluYWxLZXlzLnB1c2goZmluYWxLZXkgKz0gcGx1cmFsU3VmZml4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHBvc3NpYmxlS2V5O1xuXG4gICAgICAgICAgICB3aGlsZSAocG9zc2libGVLZXkgPSBmaW5hbEtleXMucG9wKCkpIHtcbiAgICAgICAgICAgICAgaWYgKCFfdGhpczQuaXNWYWxpZExvb2t1cChmb3VuZCkpIHtcbiAgICAgICAgICAgICAgICBleGFjdFVzZWRLZXkgPSBwb3NzaWJsZUtleTtcbiAgICAgICAgICAgICAgICBmb3VuZCA9IF90aGlzNC5nZXRSZXNvdXJjZShjb2RlLCBucywgcG9zc2libGVLZXksIG9wdGlvbnMpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXM6IGZvdW5kLFxuICAgICAgICB1c2VkS2V5OiB1c2VkS2V5LFxuICAgICAgICBleGFjdFVzZWRLZXk6IGV4YWN0VXNlZEtleSxcbiAgICAgICAgdXNlZExuZzogdXNlZExuZyxcbiAgICAgICAgdXNlZE5TOiB1c2VkTlNcbiAgICAgIH07XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImlzVmFsaWRMb29rdXBcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaXNWYWxpZExvb2t1cChyZXMpIHtcbiAgICAgIHJldHVybiByZXMgIT09IHVuZGVmaW5lZCAmJiAhKCF0aGlzLm9wdGlvbnMucmV0dXJuTnVsbCAmJiByZXMgPT09IG51bGwpICYmICEoIXRoaXMub3B0aW9ucy5yZXR1cm5FbXB0eVN0cmluZyAmJiByZXMgPT09ICcnKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0UmVzb3VyY2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0UmVzb3VyY2UoY29kZSwgbnMsIGtleSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHt9O1xuICAgICAgaWYgKHRoaXMuaTE4bkZvcm1hdCAmJiB0aGlzLmkxOG5Gb3JtYXQuZ2V0UmVzb3VyY2UpIHJldHVybiB0aGlzLmkxOG5Gb3JtYXQuZ2V0UmVzb3VyY2UoY29kZSwgbnMsIGtleSwgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gdGhpcy5yZXNvdXJjZVN0b3JlLmdldFJlc291cmNlKGNvZGUsIG5zLCBrZXksIG9wdGlvbnMpO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBUcmFuc2xhdG9yO1xufShFdmVudEVtaXR0ZXIpO1xuXG5mdW5jdGlvbiBjYXBpdGFsaXplKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKDEpO1xufVxuXG52YXIgTGFuZ3VhZ2VVdGlsID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBMYW5ndWFnZVV0aWwob3B0aW9ucykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMYW5ndWFnZVV0aWwpO1xuXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLndoaXRlbGlzdCA9IHRoaXMub3B0aW9ucy5zdXBwb3J0ZWRMbmdzIHx8IGZhbHNlO1xuICAgIHRoaXMuc3VwcG9ydGVkTG5ncyA9IHRoaXMub3B0aW9ucy5zdXBwb3J0ZWRMbmdzIHx8IGZhbHNlO1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ2xhbmd1YWdlVXRpbHMnKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhMYW5ndWFnZVV0aWwsIFt7XG4gICAga2V5OiBcImdldFNjcmlwdFBhcnRGcm9tQ29kZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRTY3JpcHRQYXJ0RnJvbUNvZGUoY29kZSkge1xuICAgICAgaWYgKCFjb2RlIHx8IGNvZGUuaW5kZXhPZignLScpIDwgMCkgcmV0dXJuIG51bGw7XG4gICAgICB2YXIgcCA9IGNvZGUuc3BsaXQoJy0nKTtcbiAgICAgIGlmIChwLmxlbmd0aCA9PT0gMikgcmV0dXJuIG51bGw7XG4gICAgICBwLnBvcCgpO1xuICAgICAgaWYgKHBbcC5sZW5ndGggLSAxXS50b0xvd2VyQ2FzZSgpID09PSAneCcpIHJldHVybiBudWxsO1xuICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKHAuam9pbignLScpKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSkge1xuICAgICAgaWYgKCFjb2RlIHx8IGNvZGUuaW5kZXhPZignLScpIDwgMCkgcmV0dXJuIGNvZGU7XG4gICAgICB2YXIgcCA9IGNvZGUuc3BsaXQoJy0nKTtcbiAgICAgIHJldHVybiB0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShwWzBdKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZm9ybWF0TGFuZ3VhZ2VDb2RlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGZvcm1hdExhbmd1YWdlQ29kZShjb2RlKSB7XG4gICAgICBpZiAodHlwZW9mIGNvZGUgPT09ICdzdHJpbmcnICYmIGNvZGUuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgdmFyIHNwZWNpYWxDYXNlcyA9IFsnaGFucycsICdoYW50JywgJ2xhdG4nLCAnY3lybCcsICdjYW5zJywgJ21vbmcnLCAnYXJhYiddO1xuICAgICAgICB2YXIgcCA9IGNvZGUuc3BsaXQoJy0nKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmxvd2VyQ2FzZUxuZykge1xuICAgICAgICAgIHAgPSBwLm1hcChmdW5jdGlvbiAocGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChwLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgIHBbMF0gPSBwWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgcFsxXSA9IHBbMV0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgICBpZiAoc3BlY2lhbENhc2VzLmluZGV4T2YocFsxXS50b0xvd2VyQ2FzZSgpKSA+IC0xKSBwWzFdID0gY2FwaXRhbGl6ZShwWzFdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICB9IGVsc2UgaWYgKHAubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgcFswXSA9IHBbMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBpZiAocFsxXS5sZW5ndGggPT09IDIpIHBbMV0gPSBwWzFdLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgaWYgKHBbMF0gIT09ICdzZ24nICYmIHBbMl0ubGVuZ3RoID09PSAyKSBwWzJdID0gcFsyXS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgIGlmIChzcGVjaWFsQ2FzZXMuaW5kZXhPZihwWzFdLnRvTG93ZXJDYXNlKCkpID4gLTEpIHBbMV0gPSBjYXBpdGFsaXplKHBbMV0udG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgaWYgKHNwZWNpYWxDYXNlcy5pbmRleE9mKHBbMl0udG9Mb3dlckNhc2UoKSkgPiAtMSkgcFsyXSA9IGNhcGl0YWxpemUocFsyXS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwLmpvaW4oJy0nKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGVhbkNvZGUgfHwgdGhpcy5vcHRpb25zLmxvd2VyQ2FzZUxuZyA/IGNvZGUudG9Mb3dlckNhc2UoKSA6IGNvZGU7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImlzV2hpdGVsaXN0ZWRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaXNXaGl0ZWxpc3RlZChjb2RlKSB7XG4gICAgICB0aGlzLmxvZ2dlci5kZXByZWNhdGUoJ2xhbmd1YWdlVXRpbHMuaXNXaGl0ZWxpc3RlZCcsICdmdW5jdGlvbiBcImlzV2hpdGVsaXN0ZWRcIiB3aWxsIGJlIHJlbmFtZWQgdG8gXCJpc1N1cHBvcnRlZENvZGVcIiBpbiB0aGUgbmV4dCBtYWpvciAtIHBsZWFzZSBtYWtlIHN1cmUgdG8gcmVuYW1lIGl0XFwncyB1c2FnZSBhc2FwLicpO1xuICAgICAgcmV0dXJuIHRoaXMuaXNTdXBwb3J0ZWRDb2RlKGNvZGUpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJpc1N1cHBvcnRlZENvZGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaXNTdXBwb3J0ZWRDb2RlKGNvZGUpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCA9PT0gJ2xhbmd1YWdlT25seScgfHwgdGhpcy5vcHRpb25zLm5vbkV4cGxpY2l0U3VwcG9ydGVkTG5ncykge1xuICAgICAgICBjb2RlID0gdGhpcy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICF0aGlzLnN1cHBvcnRlZExuZ3MgfHwgIXRoaXMuc3VwcG9ydGVkTG5ncy5sZW5ndGggfHwgdGhpcy5zdXBwb3J0ZWRMbmdzLmluZGV4T2YoY29kZSkgPiAtMTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0QmVzdE1hdGNoRnJvbUNvZGVzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldEJlc3RNYXRjaEZyb21Db2Rlcyhjb2Rlcykge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgaWYgKCFjb2RlcykgcmV0dXJuIG51bGw7XG4gICAgICB2YXIgZm91bmQ7XG4gICAgICBjb2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICAgIGlmIChmb3VuZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBjbGVhbmVkTG5nID0gX3RoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpO1xuXG4gICAgICAgIGlmICghX3RoaXMub3B0aW9ucy5zdXBwb3J0ZWRMbmdzIHx8IF90aGlzLmlzU3VwcG9ydGVkQ29kZShjbGVhbmVkTG5nKSkgZm91bmQgPSBjbGVhbmVkTG5nO1xuICAgICAgfSk7XG5cbiAgICAgIGlmICghZm91bmQgJiYgdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MpIHtcbiAgICAgICAgY29kZXMuZm9yRWFjaChmdW5jdGlvbiAoY29kZSkge1xuICAgICAgICAgIGlmIChmb3VuZCkgcmV0dXJuO1xuXG4gICAgICAgICAgdmFyIGxuZ09ubHkgPSBfdGhpcy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKTtcblxuICAgICAgICAgIGlmIChfdGhpcy5pc1N1cHBvcnRlZENvZGUobG5nT25seSkpIHJldHVybiBmb3VuZCA9IGxuZ09ubHk7XG4gICAgICAgICAgZm91bmQgPSBfdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MuZmluZChmdW5jdGlvbiAoc3VwcG9ydGVkTG5nKSB7XG4gICAgICAgICAgICBpZiAoc3VwcG9ydGVkTG5nLmluZGV4T2YobG5nT25seSkgPT09IDApIHJldHVybiBzdXBwb3J0ZWRMbmc7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IHRoaXMuZ2V0RmFsbGJhY2tDb2Rlcyh0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcpWzBdO1xuICAgICAgcmV0dXJuIGZvdW5kO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRGYWxsYmFja0NvZGVzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldEZhbGxiYWNrQ29kZXMoZmFsbGJhY2tzLCBjb2RlKSB7XG4gICAgICBpZiAoIWZhbGxiYWNrcykgcmV0dXJuIFtdO1xuICAgICAgaWYgKHR5cGVvZiBmYWxsYmFja3MgPT09ICdmdW5jdGlvbicpIGZhbGxiYWNrcyA9IGZhbGxiYWNrcyhjb2RlKTtcbiAgICAgIGlmICh0eXBlb2YgZmFsbGJhY2tzID09PSAnc3RyaW5nJykgZmFsbGJhY2tzID0gW2ZhbGxiYWNrc107XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5hcHBseShmYWxsYmFja3MpID09PSAnW29iamVjdCBBcnJheV0nKSByZXR1cm4gZmFsbGJhY2tzO1xuICAgICAgaWYgKCFjb2RlKSByZXR1cm4gZmFsbGJhY2tzW1wiZGVmYXVsdFwiXSB8fCBbXTtcbiAgICAgIHZhciBmb3VuZCA9IGZhbGxiYWNrc1tjb2RlXTtcbiAgICAgIGlmICghZm91bmQpIGZvdW5kID0gZmFsbGJhY2tzW3RoaXMuZ2V0U2NyaXB0UGFydEZyb21Db2RlKGNvZGUpXTtcbiAgICAgIGlmICghZm91bmQpIGZvdW5kID0gZmFsbGJhY2tzW3RoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpXTtcbiAgICAgIGlmICghZm91bmQpIGZvdW5kID0gZmFsbGJhY2tzW3RoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSldO1xuICAgICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3NbXCJkZWZhdWx0XCJdO1xuICAgICAgcmV0dXJuIGZvdW5kIHx8IFtdO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJ0b1Jlc29sdmVIaWVyYXJjaHlcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gdG9SZXNvbHZlSGllcmFyY2h5KGNvZGUsIGZhbGxiYWNrQ29kZSkge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgIHZhciBmYWxsYmFja0NvZGVzID0gdGhpcy5nZXRGYWxsYmFja0NvZGVzKGZhbGxiYWNrQ29kZSB8fCB0aGlzLm9wdGlvbnMuZmFsbGJhY2tMbmcgfHwgW10sIGNvZGUpO1xuICAgICAgdmFyIGNvZGVzID0gW107XG5cbiAgICAgIHZhciBhZGRDb2RlID0gZnVuY3Rpb24gYWRkQ29kZShjKSB7XG4gICAgICAgIGlmICghYykgcmV0dXJuO1xuXG4gICAgICAgIGlmIChfdGhpczIuaXNTdXBwb3J0ZWRDb2RlKGMpKSB7XG4gICAgICAgICAgY29kZXMucHVzaChjKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfdGhpczIubG9nZ2VyLndhcm4oXCJyZWplY3RpbmcgbGFuZ3VhZ2UgY29kZSBub3QgZm91bmQgaW4gc3VwcG9ydGVkTG5nczogXCIuY29uY2F0KGMpKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKHR5cGVvZiBjb2RlID09PSAnc3RyaW5nJyAmJiBjb2RlLmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCAhPT0gJ2xhbmd1YWdlT25seScpIGFkZENvZGUodGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUoY29kZSkpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmxvYWQgIT09ICdsYW5ndWFnZU9ubHknICYmIHRoaXMub3B0aW9ucy5sb2FkICE9PSAnY3VycmVudE9ubHknKSBhZGRDb2RlKHRoaXMuZ2V0U2NyaXB0UGFydEZyb21Db2RlKGNvZGUpKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2FkICE9PSAnY3VycmVudE9ubHknKSBhZGRDb2RlKHRoaXMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSkpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY29kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgYWRkQ29kZSh0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKSk7XG4gICAgICB9XG5cbiAgICAgIGZhbGxiYWNrQ29kZXMuZm9yRWFjaChmdW5jdGlvbiAoZmMpIHtcbiAgICAgICAgaWYgKGNvZGVzLmluZGV4T2YoZmMpIDwgMCkgYWRkQ29kZShfdGhpczIuZm9ybWF0TGFuZ3VhZ2VDb2RlKGZjKSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjb2RlcztcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gTGFuZ3VhZ2VVdGlsO1xufSgpO1xuXG52YXIgc2V0cyA9IFt7XG4gIGxuZ3M6IFsnYWNoJywgJ2FrJywgJ2FtJywgJ2FybicsICdicicsICdmaWwnLCAnZ3VuJywgJ2xuJywgJ21mZScsICdtZycsICdtaScsICdvYycsICdwdCcsICdwdC1CUicsICd0ZycsICd0aScsICd0cicsICd1eicsICd3YSddLFxuICBucjogWzEsIDJdLFxuICBmYzogMVxufSwge1xuICBsbmdzOiBbJ2FmJywgJ2FuJywgJ2FzdCcsICdheicsICdiZycsICdibicsICdjYScsICdkYScsICdkZScsICdkZXYnLCAnZWwnLCAnZW4nLCAnZW8nLCAnZXMnLCAnZXQnLCAnZXUnLCAnZmknLCAnZm8nLCAnZnVyJywgJ2Z5JywgJ2dsJywgJ2d1JywgJ2hhJywgJ2hpJywgJ2h1JywgJ2h5JywgJ2lhJywgJ2l0JywgJ2tuJywgJ2t1JywgJ2xiJywgJ21haScsICdtbCcsICdtbicsICdtcicsICduYWgnLCAnbmFwJywgJ25iJywgJ25lJywgJ25sJywgJ25uJywgJ25vJywgJ25zbycsICdwYScsICdwYXAnLCAncG1zJywgJ3BzJywgJ3B0LVBUJywgJ3JtJywgJ3NjbycsICdzZScsICdzaScsICdzbycsICdzb24nLCAnc3EnLCAnc3YnLCAnc3cnLCAndGEnLCAndGUnLCAndGsnLCAndXInLCAneW8nXSxcbiAgbnI6IFsxLCAyXSxcbiAgZmM6IDJcbn0sIHtcbiAgbG5nczogWydheScsICdibycsICdjZ2cnLCAnZmEnLCAnaHQnLCAnaWQnLCAnamEnLCAnamJvJywgJ2thJywgJ2trJywgJ2ttJywgJ2tvJywgJ2t5JywgJ2xvJywgJ21zJywgJ3NhaCcsICdzdScsICd0aCcsICd0dCcsICd1ZycsICd2aScsICd3bycsICd6aCddLFxuICBucjogWzFdLFxuICBmYzogM1xufSwge1xuICBsbmdzOiBbJ2JlJywgJ2JzJywgJ2NucicsICdkeicsICdocicsICdydScsICdzcicsICd1ayddLFxuICBucjogWzEsIDIsIDVdLFxuICBmYzogNFxufSwge1xuICBsbmdzOiBbJ2FyJ10sXG4gIG5yOiBbMCwgMSwgMiwgMywgMTEsIDEwMF0sXG4gIGZjOiA1XG59LCB7XG4gIGxuZ3M6IFsnY3MnLCAnc2snXSxcbiAgbnI6IFsxLCAyLCA1XSxcbiAgZmM6IDZcbn0sIHtcbiAgbG5nczogWydjc2InLCAncGwnXSxcbiAgbnI6IFsxLCAyLCA1XSxcbiAgZmM6IDdcbn0sIHtcbiAgbG5nczogWydjeSddLFxuICBucjogWzEsIDIsIDMsIDhdLFxuICBmYzogOFxufSwge1xuICBsbmdzOiBbJ2ZyJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiA5XG59LCB7XG4gIGxuZ3M6IFsnZ2EnXSxcbiAgbnI6IFsxLCAyLCAzLCA3LCAxMV0sXG4gIGZjOiAxMFxufSwge1xuICBsbmdzOiBbJ2dkJ10sXG4gIG5yOiBbMSwgMiwgMywgMjBdLFxuICBmYzogMTFcbn0sIHtcbiAgbG5nczogWydpcyddLFxuICBucjogWzEsIDJdLFxuICBmYzogMTJcbn0sIHtcbiAgbG5nczogWydqdiddLFxuICBucjogWzAsIDFdLFxuICBmYzogMTNcbn0sIHtcbiAgbG5nczogWydrdyddLFxuICBucjogWzEsIDIsIDMsIDRdLFxuICBmYzogMTRcbn0sIHtcbiAgbG5nczogWydsdCddLFxuICBucjogWzEsIDIsIDEwXSxcbiAgZmM6IDE1XG59LCB7XG4gIGxuZ3M6IFsnbHYnXSxcbiAgbnI6IFsxLCAyLCAwXSxcbiAgZmM6IDE2XG59LCB7XG4gIGxuZ3M6IFsnbWsnXSxcbiAgbnI6IFsxLCAyXSxcbiAgZmM6IDE3XG59LCB7XG4gIGxuZ3M6IFsnbW5rJ10sXG4gIG5yOiBbMCwgMSwgMl0sXG4gIGZjOiAxOFxufSwge1xuICBsbmdzOiBbJ210J10sXG4gIG5yOiBbMSwgMiwgMTEsIDIwXSxcbiAgZmM6IDE5XG59LCB7XG4gIGxuZ3M6IFsnb3InXSxcbiAgbnI6IFsyLCAxXSxcbiAgZmM6IDJcbn0sIHtcbiAgbG5nczogWydybyddLFxuICBucjogWzEsIDIsIDIwXSxcbiAgZmM6IDIwXG59LCB7XG4gIGxuZ3M6IFsnc2wnXSxcbiAgbnI6IFs1LCAxLCAyLCAzXSxcbiAgZmM6IDIxXG59LCB7XG4gIGxuZ3M6IFsnaGUnLCAnaXcnXSxcbiAgbnI6IFsxLCAyLCAyMCwgMjFdLFxuICBmYzogMjJcbn1dO1xudmFyIF9ydWxlc1BsdXJhbHNUeXBlcyA9IHtcbiAgMTogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID4gMSk7XG4gIH0sXG4gIDI6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiAhPSAxKTtcbiAgfSxcbiAgMzogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIDA7XG4gIH0sXG4gIDQ6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiAlIDEwID09IDEgJiYgbiAlIDEwMCAhPSAxMSA/IDAgOiBuICUgMTAgPj0gMiAmJiBuICUgMTAgPD0gNCAmJiAobiAlIDEwMCA8IDEwIHx8IG4gJSAxMDAgPj0gMjApID8gMSA6IDIpO1xuICB9LFxuICA1OiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMCA/IDAgOiBuID09IDEgPyAxIDogbiA9PSAyID8gMiA6IG4gJSAxMDAgPj0gMyAmJiBuICUgMTAwIDw9IDEwID8gMyA6IG4gJSAxMDAgPj0gMTEgPyA0IDogNSk7XG4gIH0sXG4gIDY6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPj0gMiAmJiBuIDw9IDQgPyAxIDogMik7XG4gIH0sXG4gIDc6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gJSAxMCA+PSAyICYmIG4gJSAxMCA8PSA0ICYmIChuICUgMTAwIDwgMTAgfHwgbiAlIDEwMCA+PSAyMCkgPyAxIDogMik7XG4gIH0sXG4gIDg6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMiA/IDEgOiBuICE9IDggJiYgbiAhPSAxMSA/IDIgOiAzKTtcbiAgfSxcbiAgOTogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID49IDIpO1xuICB9LFxuICAxMDogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgPyAwIDogbiA9PSAyID8gMSA6IG4gPCA3ID8gMiA6IG4gPCAxMSA/IDMgOiA0KTtcbiAgfSxcbiAgMTE6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxIHx8IG4gPT0gMTEgPyAwIDogbiA9PSAyIHx8IG4gPT0gMTIgPyAxIDogbiA+IDIgJiYgbiA8IDIwID8gMiA6IDMpO1xuICB9LFxuICAxMjogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICUgMTAgIT0gMSB8fCBuICUgMTAwID09IDExKTtcbiAgfSxcbiAgMTM6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiAhPT0gMCk7XG4gIH0sXG4gIDE0OiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogbiA9PSAzID8gMiA6IDMpO1xuICB9LFxuICAxNTogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICUgMTAgPT0gMSAmJiBuICUgMTAwICE9IDExID8gMCA6IG4gJSAxMCA+PSAyICYmIChuICUgMTAwIDwgMTAgfHwgbiAlIDEwMCA+PSAyMCkgPyAxIDogMik7XG4gIH0sXG4gIDE2OiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gJSAxMCA9PSAxICYmIG4gJSAxMDAgIT0gMTEgPyAwIDogbiAhPT0gMCA/IDEgOiAyKTtcbiAgfSxcbiAgMTc6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxIHx8IG4gJSAxMCA9PSAxICYmIG4gJSAxMDAgIT0gMTEgPyAwIDogMSk7XG4gIH0sXG4gIDE4OiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMCA/IDAgOiBuID09IDEgPyAxIDogMik7XG4gIH0sXG4gIDE5OiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDAgfHwgbiAlIDEwMCA+IDEgJiYgbiAlIDEwMCA8IDExID8gMSA6IG4gJSAxMDAgPiAxMCAmJiBuICUgMTAwIDwgMjAgPyAyIDogMyk7XG4gIH0sXG4gIDIwOiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDAgfHwgbiAlIDEwMCA+IDAgJiYgbiAlIDEwMCA8IDIwID8gMSA6IDIpO1xuICB9LFxuICAyMTogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICUgMTAwID09IDEgPyAxIDogbiAlIDEwMCA9PSAyID8gMiA6IG4gJSAxMDAgPT0gMyB8fCBuICUgMTAwID09IDQgPyAzIDogMCk7XG4gIH0sXG4gIDIyOiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogKG4gPCAwIHx8IG4gPiAxMCkgJiYgbiAlIDEwID09IDAgPyAyIDogMyk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVJ1bGVzKCkge1xuICB2YXIgcnVsZXMgPSB7fTtcbiAgc2V0cy5mb3JFYWNoKGZ1bmN0aW9uIChzZXQpIHtcbiAgICBzZXQubG5ncy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICBydWxlc1tsXSA9IHtcbiAgICAgICAgbnVtYmVyczogc2V0Lm5yLFxuICAgICAgICBwbHVyYWxzOiBfcnVsZXNQbHVyYWxzVHlwZXNbc2V0LmZjXVxuICAgICAgfTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiBydWxlcztcbn1cblxudmFyIFBsdXJhbFJlc29sdmVyID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBQbHVyYWxSZXNvbHZlcihsYW5ndWFnZVV0aWxzKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFBsdXJhbFJlc29sdmVyKTtcblxuICAgIHRoaXMubGFuZ3VhZ2VVdGlscyA9IGxhbmd1YWdlVXRpbHM7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCdwbHVyYWxSZXNvbHZlcicpO1xuICAgIHRoaXMucnVsZXMgPSBjcmVhdGVSdWxlcygpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKFBsdXJhbFJlc29sdmVyLCBbe1xuICAgIGtleTogXCJhZGRSdWxlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFkZFJ1bGUobG5nLCBvYmopIHtcbiAgICAgIHRoaXMucnVsZXNbbG5nXSA9IG9iajtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0UnVsZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRSdWxlKGNvZGUpIHtcbiAgICAgIHJldHVybiB0aGlzLnJ1bGVzW2NvZGVdIHx8IHRoaXMucnVsZXNbdGhpcy5sYW5ndWFnZVV0aWxzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpXTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibmVlZHNQbHVyYWxcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbmVlZHNQbHVyYWwoY29kZSkge1xuICAgICAgdmFyIHJ1bGUgPSB0aGlzLmdldFJ1bGUoY29kZSk7XG4gICAgICByZXR1cm4gcnVsZSAmJiBydWxlLm51bWJlcnMubGVuZ3RoID4gMTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0UGx1cmFsRm9ybXNPZktleVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRQbHVyYWxGb3Jtc09mS2V5KGNvZGUsIGtleSkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgdmFyIHJ1bGUgPSB0aGlzLmdldFJ1bGUoY29kZSk7XG4gICAgICBpZiAoIXJ1bGUpIHJldHVybiByZXQ7XG4gICAgICBydWxlLm51bWJlcnMuZm9yRWFjaChmdW5jdGlvbiAobikge1xuICAgICAgICB2YXIgc3VmZml4ID0gX3RoaXMuZ2V0U3VmZml4KGNvZGUsIG4pO1xuXG4gICAgICAgIHJldC5wdXNoKFwiXCIuY29uY2F0KGtleSkuY29uY2F0KHN1ZmZpeCkpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRTdWZmaXhcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0U3VmZml4KGNvZGUsIGNvdW50KSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgdmFyIHJ1bGUgPSB0aGlzLmdldFJ1bGUoY29kZSk7XG5cbiAgICAgIGlmIChydWxlKSB7XG4gICAgICAgIHZhciBpZHggPSBydWxlLm5vQWJzID8gcnVsZS5wbHVyYWxzKGNvdW50KSA6IHJ1bGUucGx1cmFscyhNYXRoLmFicyhjb3VudCkpO1xuICAgICAgICB2YXIgc3VmZml4ID0gcnVsZS5udW1iZXJzW2lkeF07XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaW1wbGlmeVBsdXJhbFN1ZmZpeCAmJiBydWxlLm51bWJlcnMubGVuZ3RoID09PSAyICYmIHJ1bGUubnVtYmVyc1swXSA9PT0gMSkge1xuICAgICAgICAgIGlmIChzdWZmaXggPT09IDIpIHtcbiAgICAgICAgICAgIHN1ZmZpeCA9ICdwbHVyYWwnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc3VmZml4ID09PSAxKSB7XG4gICAgICAgICAgICBzdWZmaXggPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmV0dXJuU3VmZml4ID0gZnVuY3Rpb24gcmV0dXJuU3VmZml4KCkge1xuICAgICAgICAgIHJldHVybiBfdGhpczIub3B0aW9ucy5wcmVwZW5kICYmIHN1ZmZpeC50b1N0cmluZygpID8gX3RoaXMyLm9wdGlvbnMucHJlcGVuZCArIHN1ZmZpeC50b1N0cmluZygpIDogc3VmZml4LnRvU3RyaW5nKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jb21wYXRpYmlsaXR5SlNPTiA9PT0gJ3YxJykge1xuICAgICAgICAgIGlmIChzdWZmaXggPT09IDEpIHJldHVybiAnJztcbiAgICAgICAgICBpZiAodHlwZW9mIHN1ZmZpeCA9PT0gJ251bWJlcicpIHJldHVybiBcIl9wbHVyYWxfXCIuY29uY2F0KHN1ZmZpeC50b1N0cmluZygpKTtcbiAgICAgICAgICByZXR1cm4gcmV0dXJuU3VmZml4KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OID09PSAndjInKSB7XG4gICAgICAgICAgcmV0dXJuIHJldHVyblN1ZmZpeCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zaW1wbGlmeVBsdXJhbFN1ZmZpeCAmJiBydWxlLm51bWJlcnMubGVuZ3RoID09PSAyICYmIHJ1bGUubnVtYmVyc1swXSA9PT0gMSkge1xuICAgICAgICAgIHJldHVybiByZXR1cm5TdWZmaXgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMucHJlcGVuZCAmJiBpZHgudG9TdHJpbmcoKSA/IHRoaXMub3B0aW9ucy5wcmVwZW5kICsgaWR4LnRvU3RyaW5nKCkgOiBpZHgudG9TdHJpbmcoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5sb2dnZXIud2FybihcIm5vIHBsdXJhbCBydWxlIGZvdW5kIGZvcjogXCIuY29uY2F0KGNvZGUpKTtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gUGx1cmFsUmVzb2x2ZXI7XG59KCk7XG5cbnZhciBJbnRlcnBvbGF0b3IgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEludGVycG9sYXRvcigpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSW50ZXJwb2xhdG9yKTtcblxuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ2ludGVycG9sYXRvcicpO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICB0aGlzLmZvcm1hdCA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvbiAmJiBvcHRpb25zLmludGVycG9sYXRpb24uZm9ybWF0IHx8IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICB0aGlzLmluaXQob3B0aW9ucyk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoSW50ZXJwb2xhdG9yLCBbe1xuICAgIGtleTogXCJpbml0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgICBpZiAoIW9wdGlvbnMuaW50ZXJwb2xhdGlvbikgb3B0aW9ucy5pbnRlcnBvbGF0aW9uID0ge1xuICAgICAgICBlc2NhcGVWYWx1ZTogdHJ1ZVxuICAgICAgfTtcbiAgICAgIHZhciBpT3B0cyA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvbjtcbiAgICAgIHRoaXMuZXNjYXBlID0gaU9wdHMuZXNjYXBlICE9PSB1bmRlZmluZWQgPyBpT3B0cy5lc2NhcGUgOiBlc2NhcGU7XG4gICAgICB0aGlzLmVzY2FwZVZhbHVlID0gaU9wdHMuZXNjYXBlVmFsdWUgIT09IHVuZGVmaW5lZCA/IGlPcHRzLmVzY2FwZVZhbHVlIDogdHJ1ZTtcbiAgICAgIHRoaXMudXNlUmF3VmFsdWVUb0VzY2FwZSA9IGlPcHRzLnVzZVJhd1ZhbHVlVG9Fc2NhcGUgIT09IHVuZGVmaW5lZCA/IGlPcHRzLnVzZVJhd1ZhbHVlVG9Fc2NhcGUgOiBmYWxzZTtcbiAgICAgIHRoaXMucHJlZml4ID0gaU9wdHMucHJlZml4ID8gcmVnZXhFc2NhcGUoaU9wdHMucHJlZml4KSA6IGlPcHRzLnByZWZpeEVzY2FwZWQgfHwgJ3t7JztcbiAgICAgIHRoaXMuc3VmZml4ID0gaU9wdHMuc3VmZml4ID8gcmVnZXhFc2NhcGUoaU9wdHMuc3VmZml4KSA6IGlPcHRzLnN1ZmZpeEVzY2FwZWQgfHwgJ319JztcbiAgICAgIHRoaXMuZm9ybWF0U2VwYXJhdG9yID0gaU9wdHMuZm9ybWF0U2VwYXJhdG9yID8gaU9wdHMuZm9ybWF0U2VwYXJhdG9yIDogaU9wdHMuZm9ybWF0U2VwYXJhdG9yIHx8ICcsJztcbiAgICAgIHRoaXMudW5lc2NhcGVQcmVmaXggPSBpT3B0cy51bmVzY2FwZVN1ZmZpeCA/ICcnIDogaU9wdHMudW5lc2NhcGVQcmVmaXggfHwgJy0nO1xuICAgICAgdGhpcy51bmVzY2FwZVN1ZmZpeCA9IHRoaXMudW5lc2NhcGVQcmVmaXggPyAnJyA6IGlPcHRzLnVuZXNjYXBlU3VmZml4IHx8ICcnO1xuICAgICAgdGhpcy5uZXN0aW5nUHJlZml4ID0gaU9wdHMubmVzdGluZ1ByZWZpeCA/IHJlZ2V4RXNjYXBlKGlPcHRzLm5lc3RpbmdQcmVmaXgpIDogaU9wdHMubmVzdGluZ1ByZWZpeEVzY2FwZWQgfHwgcmVnZXhFc2NhcGUoJyR0KCcpO1xuICAgICAgdGhpcy5uZXN0aW5nU3VmZml4ID0gaU9wdHMubmVzdGluZ1N1ZmZpeCA/IHJlZ2V4RXNjYXBlKGlPcHRzLm5lc3RpbmdTdWZmaXgpIDogaU9wdHMubmVzdGluZ1N1ZmZpeEVzY2FwZWQgfHwgcmVnZXhFc2NhcGUoJyknKTtcbiAgICAgIHRoaXMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3IgPSBpT3B0cy5uZXN0aW5nT3B0aW9uc1NlcGFyYXRvciA/IGlPcHRzLm5lc3RpbmdPcHRpb25zU2VwYXJhdG9yIDogaU9wdHMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3IgfHwgJywnO1xuICAgICAgdGhpcy5tYXhSZXBsYWNlcyA9IGlPcHRzLm1heFJlcGxhY2VzID8gaU9wdHMubWF4UmVwbGFjZXMgOiAxMDAwO1xuICAgICAgdGhpcy5hbHdheXNGb3JtYXQgPSBpT3B0cy5hbHdheXNGb3JtYXQgIT09IHVuZGVmaW5lZCA/IGlPcHRzLmFsd2F5c0Zvcm1hdCA6IGZhbHNlO1xuICAgICAgdGhpcy5yZXNldFJlZ0V4cCgpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZXNldFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMpIHRoaXMuaW5pdCh0aGlzLm9wdGlvbnMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZXNldFJlZ0V4cFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXNldFJlZ0V4cCgpIHtcbiAgICAgIHZhciByZWdleHBTdHIgPSBcIlwiLmNvbmNhdCh0aGlzLnByZWZpeCwgXCIoLis/KVwiKS5jb25jYXQodGhpcy5zdWZmaXgpO1xuICAgICAgdGhpcy5yZWdleHAgPSBuZXcgUmVnRXhwKHJlZ2V4cFN0ciwgJ2cnKTtcbiAgICAgIHZhciByZWdleHBVbmVzY2FwZVN0ciA9IFwiXCIuY29uY2F0KHRoaXMucHJlZml4KS5jb25jYXQodGhpcy51bmVzY2FwZVByZWZpeCwgXCIoLis/KVwiKS5jb25jYXQodGhpcy51bmVzY2FwZVN1ZmZpeCkuY29uY2F0KHRoaXMuc3VmZml4KTtcbiAgICAgIHRoaXMucmVnZXhwVW5lc2NhcGUgPSBuZXcgUmVnRXhwKHJlZ2V4cFVuZXNjYXBlU3RyLCAnZycpO1xuICAgICAgdmFyIG5lc3RpbmdSZWdleHBTdHIgPSBcIlwiLmNvbmNhdCh0aGlzLm5lc3RpbmdQcmVmaXgsIFwiKC4rPylcIikuY29uY2F0KHRoaXMubmVzdGluZ1N1ZmZpeCk7XG4gICAgICB0aGlzLm5lc3RpbmdSZWdleHAgPSBuZXcgUmVnRXhwKG5lc3RpbmdSZWdleHBTdHIsICdnJyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImludGVycG9sYXRlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGludGVycG9sYXRlKHN0ciwgZGF0YSwgbG5nLCBvcHRpb25zKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICB2YXIgbWF0Y2g7XG4gICAgICB2YXIgdmFsdWU7XG4gICAgICB2YXIgcmVwbGFjZXM7XG4gICAgICB2YXIgZGVmYXVsdERhdGEgPSB0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24gJiYgdGhpcy5vcHRpb25zLmludGVycG9sYXRpb24uZGVmYXVsdFZhcmlhYmxlcyB8fCB7fTtcblxuICAgICAgZnVuY3Rpb24gcmVnZXhTYWZlKHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsLnJlcGxhY2UoL1xcJC9nLCAnJCQkJCcpO1xuICAgICAgfVxuXG4gICAgICB2YXIgaGFuZGxlRm9ybWF0ID0gZnVuY3Rpb24gaGFuZGxlRm9ybWF0KGtleSkge1xuICAgICAgICBpZiAoa2V5LmluZGV4T2YoX3RoaXMuZm9ybWF0U2VwYXJhdG9yKSA8IDApIHtcbiAgICAgICAgICB2YXIgcGF0aCA9IGdldFBhdGhXaXRoRGVmYXVsdHMoZGF0YSwgZGVmYXVsdERhdGEsIGtleSk7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLmFsd2F5c0Zvcm1hdCA/IF90aGlzLmZvcm1hdChwYXRoLCB1bmRlZmluZWQsIGxuZykgOiBwYXRoO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHAgPSBrZXkuc3BsaXQoX3RoaXMuZm9ybWF0U2VwYXJhdG9yKTtcbiAgICAgICAgdmFyIGsgPSBwLnNoaWZ0KCkudHJpbSgpO1xuICAgICAgICB2YXIgZiA9IHAuam9pbihfdGhpcy5mb3JtYXRTZXBhcmF0b3IpLnRyaW0oKTtcbiAgICAgICAgcmV0dXJuIF90aGlzLmZvcm1hdChnZXRQYXRoV2l0aERlZmF1bHRzKGRhdGEsIGRlZmF1bHREYXRhLCBrKSwgZiwgbG5nLCBvcHRpb25zKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMucmVzZXRSZWdFeHAoKTtcbiAgICAgIHZhciBtaXNzaW5nSW50ZXJwb2xhdGlvbkhhbmRsZXIgPSBvcHRpb25zICYmIG9wdGlvbnMubWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyIHx8IHRoaXMub3B0aW9ucy5taXNzaW5nSW50ZXJwb2xhdGlvbkhhbmRsZXI7XG4gICAgICB2YXIgc2tpcE9uVmFyaWFibGVzID0gb3B0aW9ucyAmJiBvcHRpb25zLmludGVycG9sYXRpb24gJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcyB8fCB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXM7XG4gICAgICB2YXIgdG9kb3MgPSBbe1xuICAgICAgICByZWdleDogdGhpcy5yZWdleHBVbmVzY2FwZSxcbiAgICAgICAgc2FmZVZhbHVlOiBmdW5jdGlvbiBzYWZlVmFsdWUodmFsKSB7XG4gICAgICAgICAgcmV0dXJuIHJlZ2V4U2FmZSh2YWwpO1xuICAgICAgICB9XG4gICAgICB9LCB7XG4gICAgICAgIHJlZ2V4OiB0aGlzLnJlZ2V4cCxcbiAgICAgICAgc2FmZVZhbHVlOiBmdW5jdGlvbiBzYWZlVmFsdWUodmFsKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLmVzY2FwZVZhbHVlID8gcmVnZXhTYWZlKF90aGlzLmVzY2FwZSh2YWwpKSA6IHJlZ2V4U2FmZSh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XTtcbiAgICAgIHRvZG9zLmZvckVhY2goZnVuY3Rpb24gKHRvZG8pIHtcbiAgICAgICAgcmVwbGFjZXMgPSAwO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCA9IHRvZG8ucmVnZXguZXhlYyhzdHIpKSB7XG4gICAgICAgICAgdmFsdWUgPSBoYW5kbGVGb3JtYXQobWF0Y2hbMV0udHJpbSgpKTtcblxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICB2YXIgdGVtcCA9IG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlcihzdHIsIG1hdGNoLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgdmFsdWUgPSB0eXBlb2YgdGVtcCA9PT0gJ3N0cmluZycgPyB0ZW1wIDogJyc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNraXBPblZhcmlhYmxlcykge1xuICAgICAgICAgICAgICB2YWx1ZSA9IG1hdGNoWzBdO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIF90aGlzLmxvZ2dlci53YXJuKFwibWlzc2VkIHRvIHBhc3MgaW4gdmFyaWFibGUgXCIuY29uY2F0KG1hdGNoWzFdLCBcIiBmb3IgaW50ZXJwb2xhdGluZyBcIikuY29uY2F0KHN0cikpO1xuXG4gICAgICAgICAgICAgIHZhbHVlID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnICYmICFfdGhpcy51c2VSYXdWYWx1ZVRvRXNjYXBlKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG1ha2VTdHJpbmcodmFsdWUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKG1hdGNoWzBdLCB0b2RvLnNhZmVWYWx1ZSh2YWx1ZSkpO1xuICAgICAgICAgIHRvZG8ucmVnZXgubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICByZXBsYWNlcysrO1xuXG4gICAgICAgICAgaWYgKHJlcGxhY2VzID49IF90aGlzLm1heFJlcGxhY2VzKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibmVzdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBuZXN0KHN0ciwgZmMpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG4gICAgICB2YXIgbWF0Y2g7XG4gICAgICB2YXIgdmFsdWU7XG5cbiAgICAgIHZhciBjbG9uZWRPcHRpb25zID0gX29iamVjdFNwcmVhZCh7fSwgb3B0aW9ucyk7XG5cbiAgICAgIGNsb25lZE9wdGlvbnMuYXBwbHlQb3N0UHJvY2Vzc29yID0gZmFsc2U7XG4gICAgICBkZWxldGUgY2xvbmVkT3B0aW9ucy5kZWZhdWx0VmFsdWU7XG5cbiAgICAgIGZ1bmN0aW9uIGhhbmRsZUhhc09wdGlvbnMoa2V5LCBpbmhlcml0ZWRPcHRpb25zKSB7XG4gICAgICAgIHZhciBzZXAgPSB0aGlzLm5lc3RpbmdPcHRpb25zU2VwYXJhdG9yO1xuICAgICAgICBpZiAoa2V5LmluZGV4T2Yoc2VwKSA8IDApIHJldHVybiBrZXk7XG4gICAgICAgIHZhciBjID0ga2V5LnNwbGl0KG5ldyBSZWdFeHAoXCJcIi5jb25jYXQoc2VwLCBcIlsgXSp7XCIpKSk7XG4gICAgICAgIHZhciBvcHRpb25zU3RyaW5nID0gXCJ7XCIuY29uY2F0KGNbMV0pO1xuICAgICAgICBrZXkgPSBjWzBdO1xuICAgICAgICBvcHRpb25zU3RyaW5nID0gdGhpcy5pbnRlcnBvbGF0ZShvcHRpb25zU3RyaW5nLCBjbG9uZWRPcHRpb25zKTtcbiAgICAgICAgb3B0aW9uc1N0cmluZyA9IG9wdGlvbnNTdHJpbmcucmVwbGFjZSgvJy9nLCAnXCInKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNsb25lZE9wdGlvbnMgPSBKU09OLnBhcnNlKG9wdGlvbnNTdHJpbmcpO1xuICAgICAgICAgIGlmIChpbmhlcml0ZWRPcHRpb25zKSBjbG9uZWRPcHRpb25zID0gX29iamVjdFNwcmVhZCh7fSwgaW5oZXJpdGVkT3B0aW9ucywgY2xvbmVkT3B0aW9ucyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKFwiZmFpbGVkIHBhcnNpbmcgb3B0aW9ucyBzdHJpbmcgaW4gbmVzdGluZyBmb3Iga2V5IFwiLmNvbmNhdChrZXkpLCBlKTtcbiAgICAgICAgICByZXR1cm4gXCJcIi5jb25jYXQoa2V5KS5jb25jYXQoc2VwKS5jb25jYXQob3B0aW9uc1N0cmluZyk7XG4gICAgICAgIH1cblxuICAgICAgICBkZWxldGUgY2xvbmVkT3B0aW9ucy5kZWZhdWx0VmFsdWU7XG4gICAgICAgIHJldHVybiBrZXk7XG4gICAgICB9XG5cbiAgICAgIHdoaWxlIChtYXRjaCA9IHRoaXMubmVzdGluZ1JlZ2V4cC5leGVjKHN0cikpIHtcbiAgICAgICAgdmFyIGZvcm1hdHRlcnMgPSBbXTtcbiAgICAgICAgdmFyIGRvUmVkdWNlID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKG1hdGNoWzBdLmluY2x1ZGVzKHRoaXMuZm9ybWF0U2VwYXJhdG9yKSAmJiAhL3suKn0vLnRlc3QobWF0Y2hbMV0pKSB7XG4gICAgICAgICAgdmFyIHIgPSBtYXRjaFsxXS5zcGxpdCh0aGlzLmZvcm1hdFNlcGFyYXRvcikubWFwKGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbS50cmltKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgbWF0Y2hbMV0gPSByLnNoaWZ0KCk7XG4gICAgICAgICAgZm9ybWF0dGVycyA9IHI7XG4gICAgICAgICAgZG9SZWR1Y2UgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFsdWUgPSBmYyhoYW5kbGVIYXNPcHRpb25zLmNhbGwodGhpcywgbWF0Y2hbMV0udHJpbSgpLCBjbG9uZWRPcHRpb25zKSwgY2xvbmVkT3B0aW9ucyk7XG4gICAgICAgIGlmICh2YWx1ZSAmJiBtYXRjaFswXSA9PT0gc3RyICYmIHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHJldHVybiB2YWx1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHZhbHVlID0gbWFrZVN0cmluZyh2YWx1ZSk7XG5cbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oXCJtaXNzZWQgdG8gcmVzb2x2ZSBcIi5jb25jYXQobWF0Y2hbMV0sIFwiIGZvciBuZXN0aW5nIFwiKS5jb25jYXQoc3RyKSk7XG4gICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb1JlZHVjZSkge1xuICAgICAgICAgIHZhbHVlID0gZm9ybWF0dGVycy5yZWR1Y2UoZnVuY3Rpb24gKHYsIGYpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpczIuZm9ybWF0KHYsIGYsIG9wdGlvbnMubG5nLCBvcHRpb25zKTtcbiAgICAgICAgICB9LCB2YWx1ZS50cmltKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UobWF0Y2hbMF0sIHZhbHVlKTtcbiAgICAgICAgdGhpcy5yZWdleHAubGFzdEluZGV4ID0gMDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gSW50ZXJwb2xhdG9yO1xufSgpO1xuXG5mdW5jdGlvbiByZW1vdmUoYXJyLCB3aGF0KSB7XG4gIHZhciBmb3VuZCA9IGFyci5pbmRleE9mKHdoYXQpO1xuXG4gIHdoaWxlIChmb3VuZCAhPT0gLTEpIHtcbiAgICBhcnIuc3BsaWNlKGZvdW5kLCAxKTtcbiAgICBmb3VuZCA9IGFyci5pbmRleE9mKHdoYXQpO1xuICB9XG59XG5cbnZhciBDb25uZWN0b3IgPSBmdW5jdGlvbiAoX0V2ZW50RW1pdHRlcikge1xuICBfaW5oZXJpdHMoQ29ubmVjdG9yLCBfRXZlbnRFbWl0dGVyKTtcblxuICBmdW5jdGlvbiBDb25uZWN0b3IoYmFja2VuZCwgc3RvcmUsIHNlcnZpY2VzKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHt9O1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIENvbm5lY3Rvcik7XG5cbiAgICBfdGhpcyA9IF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIF9nZXRQcm90b3R5cGVPZihDb25uZWN0b3IpLmNhbGwodGhpcykpO1xuXG4gICAgaWYgKGlzSUUxMCkge1xuICAgICAgRXZlbnRFbWl0dGVyLmNhbGwoX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpO1xuICAgIH1cblxuICAgIF90aGlzLmJhY2tlbmQgPSBiYWNrZW5kO1xuICAgIF90aGlzLnN0b3JlID0gc3RvcmU7XG4gICAgX3RoaXMuc2VydmljZXMgPSBzZXJ2aWNlcztcbiAgICBfdGhpcy5sYW5ndWFnZVV0aWxzID0gc2VydmljZXMubGFuZ3VhZ2VVdGlscztcbiAgICBfdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICBfdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgnYmFja2VuZENvbm5lY3RvcicpO1xuICAgIF90aGlzLnN0YXRlID0ge307XG4gICAgX3RoaXMucXVldWUgPSBbXTtcblxuICAgIGlmIChfdGhpcy5iYWNrZW5kICYmIF90aGlzLmJhY2tlbmQuaW5pdCkge1xuICAgICAgX3RoaXMuYmFja2VuZC5pbml0KHNlcnZpY2VzLCBvcHRpb25zLmJhY2tlbmQsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhDb25uZWN0b3IsIFt7XG4gICAga2V5OiBcInF1ZXVlTG9hZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBxdWV1ZUxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgIHZhciB0b0xvYWQgPSBbXTtcbiAgICAgIHZhciBwZW5kaW5nID0gW107XG4gICAgICB2YXIgdG9Mb2FkTGFuZ3VhZ2VzID0gW107XG4gICAgICB2YXIgdG9Mb2FkTmFtZXNwYWNlcyA9IFtdO1xuICAgICAgbGFuZ3VhZ2VzLmZvckVhY2goZnVuY3Rpb24gKGxuZykge1xuICAgICAgICB2YXIgaGFzQWxsTmFtZXNwYWNlcyA9IHRydWU7XG4gICAgICAgIG5hbWVzcGFjZXMuZm9yRWFjaChmdW5jdGlvbiAobnMpIHtcbiAgICAgICAgICB2YXIgbmFtZSA9IFwiXCIuY29uY2F0KGxuZywgXCJ8XCIpLmNvbmNhdChucyk7XG5cbiAgICAgICAgICBpZiAoIW9wdGlvbnMucmVsb2FkICYmIF90aGlzMi5zdG9yZS5oYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSkge1xuICAgICAgICAgICAgX3RoaXMyLnN0YXRlW25hbWVdID0gMjtcbiAgICAgICAgICB9IGVsc2UgaWYgKF90aGlzMi5zdGF0ZVtuYW1lXSA8IDApIDsgZWxzZSBpZiAoX3RoaXMyLnN0YXRlW25hbWVdID09PSAxKSB7XG4gICAgICAgICAgICBpZiAocGVuZGluZy5pbmRleE9mKG5hbWUpIDwgMCkgcGVuZGluZy5wdXNoKG5hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfdGhpczIuc3RhdGVbbmFtZV0gPSAxO1xuICAgICAgICAgICAgaGFzQWxsTmFtZXNwYWNlcyA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKHBlbmRpbmcuaW5kZXhPZihuYW1lKSA8IDApIHBlbmRpbmcucHVzaChuYW1lKTtcbiAgICAgICAgICAgIGlmICh0b0xvYWQuaW5kZXhPZihuYW1lKSA8IDApIHRvTG9hZC5wdXNoKG5hbWUpO1xuICAgICAgICAgICAgaWYgKHRvTG9hZE5hbWVzcGFjZXMuaW5kZXhPZihucykgPCAwKSB0b0xvYWROYW1lc3BhY2VzLnB1c2gobnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghaGFzQWxsTmFtZXNwYWNlcykgdG9Mb2FkTGFuZ3VhZ2VzLnB1c2gobG5nKTtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodG9Mb2FkLmxlbmd0aCB8fCBwZW5kaW5nLmxlbmd0aCkge1xuICAgICAgICB0aGlzLnF1ZXVlLnB1c2goe1xuICAgICAgICAgIHBlbmRpbmc6IHBlbmRpbmcsXG4gICAgICAgICAgbG9hZGVkOiB7fSxcbiAgICAgICAgICBlcnJvcnM6IFtdLFxuICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdG9Mb2FkOiB0b0xvYWQsXG4gICAgICAgIHBlbmRpbmc6IHBlbmRpbmcsXG4gICAgICAgIHRvTG9hZExhbmd1YWdlczogdG9Mb2FkTGFuZ3VhZ2VzLFxuICAgICAgICB0b0xvYWROYW1lc3BhY2VzOiB0b0xvYWROYW1lc3BhY2VzXG4gICAgICB9O1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsb2FkZWRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbG9hZGVkKG5hbWUsIGVyciwgZGF0YSkge1xuICAgICAgdmFyIHMgPSBuYW1lLnNwbGl0KCd8Jyk7XG4gICAgICB2YXIgbG5nID0gc1swXTtcbiAgICAgIHZhciBucyA9IHNbMV07XG4gICAgICBpZiAoZXJyKSB0aGlzLmVtaXQoJ2ZhaWxlZExvYWRpbmcnLCBsbmcsIG5zLCBlcnIpO1xuXG4gICAgICBpZiAoZGF0YSkge1xuICAgICAgICB0aGlzLnN0b3JlLmFkZFJlc291cmNlQnVuZGxlKGxuZywgbnMsIGRhdGEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YXRlW25hbWVdID0gZXJyID8gLTEgOiAyO1xuICAgICAgdmFyIGxvYWRlZCA9IHt9O1xuICAgICAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uIChxKSB7XG4gICAgICAgIHB1c2hQYXRoKHEubG9hZGVkLCBbbG5nXSwgbnMpO1xuICAgICAgICByZW1vdmUocS5wZW5kaW5nLCBuYW1lKTtcbiAgICAgICAgaWYgKGVycikgcS5lcnJvcnMucHVzaChlcnIpO1xuXG4gICAgICAgIGlmIChxLnBlbmRpbmcubGVuZ3RoID09PSAwICYmICFxLmRvbmUpIHtcbiAgICAgICAgICBPYmplY3Qua2V5cyhxLmxvYWRlZCkuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICAgICAgaWYgKCFsb2FkZWRbbF0pIGxvYWRlZFtsXSA9IFtdO1xuXG4gICAgICAgICAgICBpZiAocS5sb2FkZWRbbF0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHEubG9hZGVkW2xdLmZvckVhY2goZnVuY3Rpb24gKG5zKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZFtsXS5pbmRleE9mKG5zKSA8IDApIGxvYWRlZFtsXS5wdXNoKG5zKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcS5kb25lID0gdHJ1ZTtcblxuICAgICAgICAgIGlmIChxLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHEuY2FsbGJhY2socS5lcnJvcnMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBxLmNhbGxiYWNrKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZW1pdCgnbG9hZGVkJywgbG9hZGVkKTtcbiAgICAgIHRoaXMucXVldWUgPSB0aGlzLnF1ZXVlLmZpbHRlcihmdW5jdGlvbiAocSkge1xuICAgICAgICByZXR1cm4gIXEuZG9uZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZWFkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlYWQobG5nLCBucywgZmNOYW1lKSB7XG4gICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgdmFyIHRyaWVkID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiAwO1xuICAgICAgdmFyIHdhaXQgPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IDM1MDtcbiAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiA1ID8gYXJndW1lbnRzWzVdIDogdW5kZWZpbmVkO1xuICAgICAgaWYgKCFsbmcubGVuZ3RoKSByZXR1cm4gY2FsbGJhY2sobnVsbCwge30pO1xuICAgICAgcmV0dXJuIHRoaXMuYmFja2VuZFtmY05hbWVdKGxuZywgbnMsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgaWYgKGVyciAmJiBkYXRhICYmIHRyaWVkIDwgNSkge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMzLnJlYWQuY2FsbChfdGhpczMsIGxuZywgbnMsIGZjTmFtZSwgdHJpZWQgKyAxLCB3YWl0ICogMiwgY2FsbGJhY2spO1xuICAgICAgICAgIH0sIHdhaXQpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrKGVyciwgZGF0YSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicHJlcGFyZUxvYWRpbmdcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcHJlcGFyZUxvYWRpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzKSB7XG4gICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgICAgdmFyIGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgPyBhcmd1bWVudHNbM10gOiB1bmRlZmluZWQ7XG5cbiAgICAgIGlmICghdGhpcy5iYWNrZW5kKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ05vIGJhY2tlbmQgd2FzIGFkZGVkIHZpYSBpMThuZXh0LnVzZS4gV2lsbCBub3QgbG9hZCByZXNvdXJjZXMuJyk7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayAmJiBjYWxsYmFjaygpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGxhbmd1YWdlcyA9PT0gJ3N0cmluZycpIGxhbmd1YWdlcyA9IHRoaXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkobGFuZ3VhZ2VzKTtcbiAgICAgIGlmICh0eXBlb2YgbmFtZXNwYWNlcyA9PT0gJ3N0cmluZycpIG5hbWVzcGFjZXMgPSBbbmFtZXNwYWNlc107XG4gICAgICB2YXIgdG9Mb2FkID0gdGhpcy5xdWV1ZUxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBvcHRpb25zLCBjYWxsYmFjayk7XG5cbiAgICAgIGlmICghdG9Mb2FkLnRvTG9hZC5sZW5ndGgpIHtcbiAgICAgICAgaWYgKCF0b0xvYWQucGVuZGluZy5sZW5ndGgpIGNhbGxiYWNrKCk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICB0b0xvYWQudG9Mb2FkLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgX3RoaXM0LmxvYWRPbmUobmFtZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibG9hZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBsb2FkKGxhbmd1YWdlcywgbmFtZXNwYWNlcywgY2FsbGJhY2spIHtcbiAgICAgIHRoaXMucHJlcGFyZUxvYWRpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCB7fSwgY2FsbGJhY2spO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZWxvYWRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVsb2FkKGxhbmd1YWdlcywgbmFtZXNwYWNlcywgY2FsbGJhY2spIHtcbiAgICAgIHRoaXMucHJlcGFyZUxvYWRpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCB7XG4gICAgICAgIHJlbG9hZDogdHJ1ZVxuICAgICAgfSwgY2FsbGJhY2spO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsb2FkT25lXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGxvYWRPbmUobmFtZSkge1xuICAgICAgdmFyIF90aGlzNSA9IHRoaXM7XG5cbiAgICAgIHZhciBwcmVmaXggPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6ICcnO1xuICAgICAgdmFyIHMgPSBuYW1lLnNwbGl0KCd8Jyk7XG4gICAgICB2YXIgbG5nID0gc1swXTtcbiAgICAgIHZhciBucyA9IHNbMV07XG4gICAgICB0aGlzLnJlYWQobG5nLCBucywgJ3JlYWQnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICBpZiAoZXJyKSBfdGhpczUubG9nZ2VyLndhcm4oXCJcIi5jb25jYXQocHJlZml4LCBcImxvYWRpbmcgbmFtZXNwYWNlIFwiKS5jb25jYXQobnMsIFwiIGZvciBsYW5ndWFnZSBcIikuY29uY2F0KGxuZywgXCIgZmFpbGVkXCIpLCBlcnIpO1xuICAgICAgICBpZiAoIWVyciAmJiBkYXRhKSBfdGhpczUubG9nZ2VyLmxvZyhcIlwiLmNvbmNhdChwcmVmaXgsIFwibG9hZGVkIG5hbWVzcGFjZSBcIikuY29uY2F0KG5zLCBcIiBmb3IgbGFuZ3VhZ2UgXCIpLmNvbmNhdChsbmcpLCBkYXRhKTtcblxuICAgICAgICBfdGhpczUubG9hZGVkKG5hbWUsIGVyciwgZGF0YSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic2F2ZU1pc3NpbmdcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2F2ZU1pc3NpbmcobGFuZ3VhZ2VzLCBuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSwgaXNVcGRhdGUpIHtcbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgJiYgYXJndW1lbnRzWzVdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNV0gOiB7fTtcblxuICAgICAgaWYgKHRoaXMuc2VydmljZXMudXRpbHMgJiYgdGhpcy5zZXJ2aWNlcy51dGlscy5oYXNMb2FkZWROYW1lc3BhY2UgJiYgIXRoaXMuc2VydmljZXMudXRpbHMuaGFzTG9hZGVkTmFtZXNwYWNlKG5hbWVzcGFjZSkpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihcImRpZCBub3Qgc2F2ZSBrZXkgXFxcIlwiLmNvbmNhdChrZXksIFwiXFxcIiBhcyB0aGUgbmFtZXNwYWNlIFxcXCJcIikuY29uY2F0KG5hbWVzcGFjZSwgXCJcXFwiIHdhcyBub3QgeWV0IGxvYWRlZFwiKSwgJ1RoaXMgbWVhbnMgc29tZXRoaW5nIElTIFdST05HIGluIHlvdXIgc2V0dXAuIFlvdSBhY2Nlc3MgdGhlIHQgZnVuY3Rpb24gYmVmb3JlIGkxOG5leHQuaW5pdCAvIGkxOG5leHQubG9hZE5hbWVzcGFjZSAvIGkxOG5leHQuY2hhbmdlTGFuZ3VhZ2Ugd2FzIGRvbmUuIFdhaXQgZm9yIHRoZSBjYWxsYmFjayBvciBQcm9taXNlIHRvIHJlc29sdmUgYmVmb3JlIGFjY2Vzc2luZyBpdCEhIScpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCB8fCBrZXkgPT09IG51bGwgfHwga2V5ID09PSAnJykgcmV0dXJuO1xuXG4gICAgICBpZiAodGhpcy5iYWNrZW5kICYmIHRoaXMuYmFja2VuZC5jcmVhdGUpIHtcbiAgICAgICAgdGhpcy5iYWNrZW5kLmNyZWF0ZShsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlLCBudWxsLCBfb2JqZWN0U3ByZWFkKHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgaXNVcGRhdGU6IGlzVXBkYXRlXG4gICAgICAgIH0pKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFsYW5ndWFnZXMgfHwgIWxhbmd1YWdlc1swXSkgcmV0dXJuO1xuICAgICAgdGhpcy5zdG9yZS5hZGRSZXNvdXJjZShsYW5ndWFnZXNbMF0sIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlKTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gQ29ubmVjdG9yO1xufShFdmVudEVtaXR0ZXIpO1xuXG5mdW5jdGlvbiBnZXQoKSB7XG4gIHJldHVybiB7XG4gICAgZGVidWc6IGZhbHNlLFxuICAgIGluaXRJbW1lZGlhdGU6IHRydWUsXG4gICAgbnM6IFsndHJhbnNsYXRpb24nXSxcbiAgICBkZWZhdWx0TlM6IFsndHJhbnNsYXRpb24nXSxcbiAgICBmYWxsYmFja0xuZzogWydkZXYnXSxcbiAgICBmYWxsYmFja05TOiBmYWxzZSxcbiAgICB3aGl0ZWxpc3Q6IGZhbHNlLFxuICAgIG5vbkV4cGxpY2l0V2hpdGVsaXN0OiBmYWxzZSxcbiAgICBzdXBwb3J0ZWRMbmdzOiBmYWxzZSxcbiAgICBub25FeHBsaWNpdFN1cHBvcnRlZExuZ3M6IGZhbHNlLFxuICAgIGxvYWQ6ICdhbGwnLFxuICAgIHByZWxvYWQ6IGZhbHNlLFxuICAgIHNpbXBsaWZ5UGx1cmFsU3VmZml4OiB0cnVlLFxuICAgIGtleVNlcGFyYXRvcjogJy4nLFxuICAgIG5zU2VwYXJhdG9yOiAnOicsXG4gICAgcGx1cmFsU2VwYXJhdG9yOiAnXycsXG4gICAgY29udGV4dFNlcGFyYXRvcjogJ18nLFxuICAgIHBhcnRpYWxCdW5kbGVkTGFuZ3VhZ2VzOiBmYWxzZSxcbiAgICBzYXZlTWlzc2luZzogZmFsc2UsXG4gICAgdXBkYXRlTWlzc2luZzogZmFsc2UsXG4gICAgc2F2ZU1pc3NpbmdUbzogJ2ZhbGxiYWNrJyxcbiAgICBzYXZlTWlzc2luZ1BsdXJhbHM6IHRydWUsXG4gICAgbWlzc2luZ0tleUhhbmRsZXI6IGZhbHNlLFxuICAgIG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlcjogZmFsc2UsXG4gICAgcG9zdFByb2Nlc3M6IGZhbHNlLFxuICAgIHBvc3RQcm9jZXNzUGFzc1Jlc29sdmVkOiBmYWxzZSxcbiAgICByZXR1cm5OdWxsOiB0cnVlLFxuICAgIHJldHVybkVtcHR5U3RyaW5nOiB0cnVlLFxuICAgIHJldHVybk9iamVjdHM6IGZhbHNlLFxuICAgIGpvaW5BcnJheXM6IGZhbHNlLFxuICAgIHJldHVybmVkT2JqZWN0SGFuZGxlcjogZmFsc2UsXG4gICAgcGFyc2VNaXNzaW5nS2V5SGFuZGxlcjogZmFsc2UsXG4gICAgYXBwZW5kTmFtZXNwYWNlVG9NaXNzaW5nS2V5OiBmYWxzZSxcbiAgICBhcHBlbmROYW1lc3BhY2VUb0NJTW9kZTogZmFsc2UsXG4gICAgb3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXI6IGZ1bmN0aW9uIGhhbmRsZShhcmdzKSB7XG4gICAgICB2YXIgcmV0ID0ge307XG4gICAgICBpZiAoX3R5cGVvZihhcmdzWzFdKSA9PT0gJ29iamVjdCcpIHJldCA9IGFyZ3NbMV07XG4gICAgICBpZiAodHlwZW9mIGFyZ3NbMV0gPT09ICdzdHJpbmcnKSByZXQuZGVmYXVsdFZhbHVlID0gYXJnc1sxXTtcbiAgICAgIGlmICh0eXBlb2YgYXJnc1syXSA9PT0gJ3N0cmluZycpIHJldC50RGVzY3JpcHRpb24gPSBhcmdzWzJdO1xuXG4gICAgICBpZiAoX3R5cGVvZihhcmdzWzJdKSA9PT0gJ29iamVjdCcgfHwgX3R5cGVvZihhcmdzWzNdKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBhcmdzWzNdIHx8IGFyZ3NbMl07XG4gICAgICAgIE9iamVjdC5rZXlzKG9wdGlvbnMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgIHJldFtrZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuICAgIGludGVycG9sYXRpb246IHtcbiAgICAgIGVzY2FwZVZhbHVlOiB0cnVlLFxuICAgICAgZm9ybWF0OiBmdW5jdGlvbiBmb3JtYXQodmFsdWUsIF9mb3JtYXQsIGxuZywgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9LFxuICAgICAgcHJlZml4OiAne3snLFxuICAgICAgc3VmZml4OiAnfX0nLFxuICAgICAgZm9ybWF0U2VwYXJhdG9yOiAnLCcsXG4gICAgICB1bmVzY2FwZVByZWZpeDogJy0nLFxuICAgICAgbmVzdGluZ1ByZWZpeDogJyR0KCcsXG4gICAgICBuZXN0aW5nU3VmZml4OiAnKScsXG4gICAgICBuZXN0aW5nT3B0aW9uc1NlcGFyYXRvcjogJywnLFxuICAgICAgbWF4UmVwbGFjZXM6IDEwMDAsXG4gICAgICBza2lwT25WYXJpYWJsZXM6IGZhbHNlXG4gICAgfVxuICB9O1xufVxuZnVuY3Rpb24gdHJhbnNmb3JtT3B0aW9ucyhvcHRpb25zKSB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5ucyA9PT0gJ3N0cmluZycpIG9wdGlvbnMubnMgPSBbb3B0aW9ucy5uc107XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5mYWxsYmFja0xuZyA9PT0gJ3N0cmluZycpIG9wdGlvbnMuZmFsbGJhY2tMbmcgPSBbb3B0aW9ucy5mYWxsYmFja0xuZ107XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5mYWxsYmFja05TID09PSAnc3RyaW5nJykgb3B0aW9ucy5mYWxsYmFja05TID0gW29wdGlvbnMuZmFsbGJhY2tOU107XG5cbiAgaWYgKG9wdGlvbnMud2hpdGVsaXN0KSB7XG4gICAgaWYgKG9wdGlvbnMud2hpdGVsaXN0ICYmIG9wdGlvbnMud2hpdGVsaXN0LmluZGV4T2YoJ2NpbW9kZScpIDwgMCkge1xuICAgICAgb3B0aW9ucy53aGl0ZWxpc3QgPSBvcHRpb25zLndoaXRlbGlzdC5jb25jYXQoWydjaW1vZGUnXSk7XG4gICAgfVxuXG4gICAgb3B0aW9ucy5zdXBwb3J0ZWRMbmdzID0gb3B0aW9ucy53aGl0ZWxpc3Q7XG4gIH1cblxuICBpZiAob3B0aW9ucy5ub25FeHBsaWNpdFdoaXRlbGlzdCkge1xuICAgIG9wdGlvbnMubm9uRXhwbGljaXRTdXBwb3J0ZWRMbmdzID0gb3B0aW9ucy5ub25FeHBsaWNpdFdoaXRlbGlzdDtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnN1cHBvcnRlZExuZ3MgJiYgb3B0aW9ucy5zdXBwb3J0ZWRMbmdzLmluZGV4T2YoJ2NpbW9kZScpIDwgMCkge1xuICAgIG9wdGlvbnMuc3VwcG9ydGVkTG5ncyA9IG9wdGlvbnMuc3VwcG9ydGVkTG5ncy5jb25jYXQoWydjaW1vZGUnXSk7XG4gIH1cblxuICByZXR1cm4gb3B0aW9ucztcbn1cblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnZhciBJMThuID0gZnVuY3Rpb24gKF9FdmVudEVtaXR0ZXIpIHtcbiAgX2luaGVyaXRzKEkxOG4sIF9FdmVudEVtaXR0ZXIpO1xuXG4gIGZ1bmN0aW9uIEkxOG4oKSB7XG4gICAgdmFyIF90aGlzO1xuXG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIHZhciBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEkxOG4pO1xuXG4gICAgX3RoaXMgPSBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBfZ2V0UHJvdG90eXBlT2YoSTE4bikuY2FsbCh0aGlzKSk7XG5cbiAgICBpZiAoaXNJRTEwKSB7XG4gICAgICBFdmVudEVtaXR0ZXIuY2FsbChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSk7XG4gICAgfVxuXG4gICAgX3RoaXMub3B0aW9ucyA9IHRyYW5zZm9ybU9wdGlvbnMob3B0aW9ucyk7XG4gICAgX3RoaXMuc2VydmljZXMgPSB7fTtcbiAgICBfdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyO1xuICAgIF90aGlzLm1vZHVsZXMgPSB7XG4gICAgICBleHRlcm5hbDogW11cbiAgICB9O1xuXG4gICAgaWYgKGNhbGxiYWNrICYmICFfdGhpcy5pc0luaXRpYWxpemVkICYmICFvcHRpb25zLmlzQ2xvbmUpIHtcbiAgICAgIGlmICghX3RoaXMub3B0aW9ucy5pbml0SW1tZWRpYXRlKSB7XG4gICAgICAgIF90aGlzLmluaXQob3B0aW9ucywgY2FsbGJhY2spO1xuXG4gICAgICAgIHJldHVybiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihfdGhpcywgX2Fzc2VydFRoaXNJbml0aWFsaXplZChfdGhpcykpO1xuICAgICAgfVxuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3RoaXMuaW5pdChvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgICB9LCAwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoSTE4biwgW3tcbiAgICBrZXk6IFwiaW5pdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLndoaXRlbGlzdCAmJiAhb3B0aW9ucy5zdXBwb3J0ZWRMbmdzKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmRlcHJlY2F0ZSgnd2hpdGVsaXN0JywgJ29wdGlvbiBcIndoaXRlbGlzdFwiIHdpbGwgYmUgcmVuYW1lZCB0byBcInN1cHBvcnRlZExuZ3NcIiBpbiB0aGUgbmV4dCBtYWpvciAtIHBsZWFzZSBtYWtlIHN1cmUgdG8gcmVuYW1lIHRoaXMgb3B0aW9uIGFzYXAuJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLm5vbkV4cGxpY2l0V2hpdGVsaXN0ICYmICFvcHRpb25zLm5vbkV4cGxpY2l0U3VwcG9ydGVkTG5ncykge1xuICAgICAgICB0aGlzLmxvZ2dlci5kZXByZWNhdGUoJ3doaXRlbGlzdCcsICdvcHRpb25zIFwibm9uRXhwbGljaXRXaGl0ZWxpc3RcIiB3aWxsIGJlIHJlbmFtZWQgdG8gXCJub25FeHBsaWNpdFN1cHBvcnRlZExuZ3NcIiBpbiB0aGUgbmV4dCBtYWpvciAtIHBsZWFzZSBtYWtlIHN1cmUgdG8gcmVuYW1lIHRoaXMgb3B0aW9uIGFzYXAuJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub3B0aW9ucyA9IF9vYmplY3RTcHJlYWQoe30sIGdldCgpLCB0aGlzLm9wdGlvbnMsIHRyYW5zZm9ybU9wdGlvbnMob3B0aW9ucykpO1xuICAgICAgdGhpcy5mb3JtYXQgPSB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5mb3JtYXQ7XG4gICAgICBpZiAoIWNhbGxiYWNrKSBjYWxsYmFjayA9IG5vb3A7XG5cbiAgICAgIGZ1bmN0aW9uIGNyZWF0ZUNsYXNzT25EZW1hbmQoQ2xhc3NPck9iamVjdCkge1xuICAgICAgICBpZiAoIUNsYXNzT3JPYmplY3QpIHJldHVybiBudWxsO1xuICAgICAgICBpZiAodHlwZW9mIENsYXNzT3JPYmplY3QgPT09ICdmdW5jdGlvbicpIHJldHVybiBuZXcgQ2xhc3NPck9iamVjdCgpO1xuICAgICAgICByZXR1cm4gQ2xhc3NPck9iamVjdDtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuaXNDbG9uZSkge1xuICAgICAgICBpZiAodGhpcy5tb2R1bGVzLmxvZ2dlcikge1xuICAgICAgICAgIGJhc2VMb2dnZXIuaW5pdChjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5sb2dnZXIpLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJhc2VMb2dnZXIuaW5pdChudWxsLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGx1ID0gbmV3IExhbmd1YWdlVXRpbCh0aGlzLm9wdGlvbnMpO1xuICAgICAgICB0aGlzLnN0b3JlID0gbmV3IFJlc291cmNlU3RvcmUodGhpcy5vcHRpb25zLnJlc291cmNlcywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdmFyIHMgPSB0aGlzLnNlcnZpY2VzO1xuICAgICAgICBzLmxvZ2dlciA9IGJhc2VMb2dnZXI7XG4gICAgICAgIHMucmVzb3VyY2VTdG9yZSA9IHRoaXMuc3RvcmU7XG4gICAgICAgIHMubGFuZ3VhZ2VVdGlscyA9IGx1O1xuICAgICAgICBzLnBsdXJhbFJlc29sdmVyID0gbmV3IFBsdXJhbFJlc29sdmVyKGx1LCB7XG4gICAgICAgICAgcHJlcGVuZDogdGhpcy5vcHRpb25zLnBsdXJhbFNlcGFyYXRvcixcbiAgICAgICAgICBjb21wYXRpYmlsaXR5SlNPTjogdGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OLFxuICAgICAgICAgIHNpbXBsaWZ5UGx1cmFsU3VmZml4OiB0aGlzLm9wdGlvbnMuc2ltcGxpZnlQbHVyYWxTdWZmaXhcbiAgICAgICAgfSk7XG4gICAgICAgIHMuaW50ZXJwb2xhdG9yID0gbmV3IEludGVycG9sYXRvcih0aGlzLm9wdGlvbnMpO1xuICAgICAgICBzLnV0aWxzID0ge1xuICAgICAgICAgIGhhc0xvYWRlZE5hbWVzcGFjZTogdGhpcy5oYXNMb2FkZWROYW1lc3BhY2UuYmluZCh0aGlzKVxuICAgICAgICB9O1xuICAgICAgICBzLmJhY2tlbmRDb25uZWN0b3IgPSBuZXcgQ29ubmVjdG9yKGNyZWF0ZUNsYXNzT25EZW1hbmQodGhpcy5tb2R1bGVzLmJhY2tlbmQpLCBzLnJlc291cmNlU3RvcmUsIHMsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHMuYmFja2VuZENvbm5lY3Rvci5vbignKicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIF90aGlzMi5lbWl0LmFwcGx5KF90aGlzMiwgW2V2ZW50XS5jb25jYXQoYXJncykpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5tb2R1bGVzLmxhbmd1YWdlRGV0ZWN0b3IpIHtcbiAgICAgICAgICBzLmxhbmd1YWdlRGV0ZWN0b3IgPSBjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5sYW5ndWFnZURldGVjdG9yKTtcbiAgICAgICAgICBzLmxhbmd1YWdlRGV0ZWN0b3IuaW5pdChzLCB0aGlzLm9wdGlvbnMuZGV0ZWN0aW9uLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubW9kdWxlcy5pMThuRm9ybWF0KSB7XG4gICAgICAgICAgcy5pMThuRm9ybWF0ID0gY3JlYXRlQ2xhc3NPbkRlbWFuZCh0aGlzLm1vZHVsZXMuaTE4bkZvcm1hdCk7XG4gICAgICAgICAgaWYgKHMuaTE4bkZvcm1hdC5pbml0KSBzLmkxOG5Gb3JtYXQuaW5pdCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudHJhbnNsYXRvciA9IG5ldyBUcmFuc2xhdG9yKHRoaXMuc2VydmljZXMsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHRoaXMudHJhbnNsYXRvci5vbignKicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuMiA+IDEgPyBfbGVuMiAtIDEgOiAwKSwgX2tleTIgPSAxOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgICAgICAgICBhcmdzW19rZXkyIC0gMV0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIF90aGlzMi5lbWl0LmFwcGx5KF90aGlzMiwgW2V2ZW50XS5jb25jYXQoYXJncykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5tb2R1bGVzLmV4dGVybmFsLmZvckVhY2goZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICBpZiAobS5pbml0KSBtLmluaXQoX3RoaXMyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yICYmICF0aGlzLm9wdGlvbnMubG5nKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ2luaXQ6IG5vIGxhbmd1YWdlRGV0ZWN0b3IgaXMgdXNlZCBhbmQgbm8gbG5nIGlzIGRlZmluZWQnKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHN0b3JlQXBpID0gWydnZXRSZXNvdXJjZScsICdoYXNSZXNvdXJjZUJ1bmRsZScsICdnZXRSZXNvdXJjZUJ1bmRsZScsICdnZXREYXRhQnlMYW5ndWFnZSddO1xuICAgICAgc3RvcmVBcGkuZm9yRWFjaChmdW5jdGlvbiAoZmNOYW1lKSB7XG4gICAgICAgIF90aGlzMltmY05hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBfdGhpczIkc3RvcmU7XG5cbiAgICAgICAgICByZXR1cm4gKF90aGlzMiRzdG9yZSA9IF90aGlzMi5zdG9yZSlbZmNOYW1lXS5hcHBseShfdGhpczIkc3RvcmUsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIHZhciBzdG9yZUFwaUNoYWluZWQgPSBbJ2FkZFJlc291cmNlJywgJ2FkZFJlc291cmNlcycsICdhZGRSZXNvdXJjZUJ1bmRsZScsICdyZW1vdmVSZXNvdXJjZUJ1bmRsZSddO1xuICAgICAgc3RvcmVBcGlDaGFpbmVkLmZvckVhY2goZnVuY3Rpb24gKGZjTmFtZSkge1xuICAgICAgICBfdGhpczJbZmNOYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgX3RoaXMyJHN0b3JlMjtcblxuICAgICAgICAgIChfdGhpczIkc3RvcmUyID0gX3RoaXMyLnN0b3JlKVtmY05hbWVdLmFwcGx5KF90aGlzMiRzdG9yZTIsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICByZXR1cm4gX3RoaXMyO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuXG4gICAgICB2YXIgbG9hZCA9IGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgICAgIF90aGlzMi5jaGFuZ2VMYW5ndWFnZShfdGhpczIub3B0aW9ucy5sbmcsIGZ1bmN0aW9uIChlcnIsIHQpIHtcbiAgICAgICAgICBfdGhpczIuaXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgICAgaWYgKCFfdGhpczIub3B0aW9ucy5pc0Nsb25lKSBfdGhpczIubG9nZ2VyLmxvZygnaW5pdGlhbGl6ZWQnLCBfdGhpczIub3B0aW9ucyk7XG5cbiAgICAgICAgICBfdGhpczIuZW1pdCgnaW5pdGlhbGl6ZWQnLCBfdGhpczIub3B0aW9ucyk7XG5cbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHQpO1xuICAgICAgICAgIGNhbGxiYWNrKGVyciwgdCk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZXNvdXJjZXMgfHwgIXRoaXMub3B0aW9ucy5pbml0SW1tZWRpYXRlKSB7XG4gICAgICAgIGxvYWQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQobG9hZCwgMCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibG9hZFJlc291cmNlc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBsb2FkUmVzb3VyY2VzKGxhbmd1YWdlKSB7XG4gICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgdmFyIGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBub29wO1xuICAgICAgdmFyIHVzZWRDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgdmFyIHVzZWRMbmcgPSB0eXBlb2YgbGFuZ3VhZ2UgPT09ICdzdHJpbmcnID8gbGFuZ3VhZ2UgOiB0aGlzLmxhbmd1YWdlO1xuICAgICAgaWYgKHR5cGVvZiBsYW5ndWFnZSA9PT0gJ2Z1bmN0aW9uJykgdXNlZENhbGxiYWNrID0gbGFuZ3VhZ2U7XG5cbiAgICAgIGlmICghdGhpcy5vcHRpb25zLnJlc291cmNlcyB8fCB0aGlzLm9wdGlvbnMucGFydGlhbEJ1bmRsZWRMYW5ndWFnZXMpIHtcbiAgICAgICAgaWYgKHVzZWRMbmcgJiYgdXNlZExuZy50b0xvd2VyQ2FzZSgpID09PSAnY2ltb2RlJykgcmV0dXJuIHVzZWRDYWxsYmFjaygpO1xuICAgICAgICB2YXIgdG9Mb2FkID0gW107XG5cbiAgICAgICAgdmFyIGFwcGVuZCA9IGZ1bmN0aW9uIGFwcGVuZChsbmcpIHtcbiAgICAgICAgICBpZiAoIWxuZykgcmV0dXJuO1xuXG4gICAgICAgICAgdmFyIGxuZ3MgPSBfdGhpczMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkobG5nKTtcblxuICAgICAgICAgIGxuZ3MuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICAgICAgaWYgKHRvTG9hZC5pbmRleE9mKGwpIDwgMCkgdG9Mb2FkLnB1c2gobCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCF1c2VkTG5nKSB7XG4gICAgICAgICAgdmFyIGZhbGxiYWNrcyA9IHRoaXMuc2VydmljZXMubGFuZ3VhZ2VVdGlscy5nZXRGYWxsYmFja0NvZGVzKHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZyk7XG4gICAgICAgICAgZmFsbGJhY2tzLmZvckVhY2goZnVuY3Rpb24gKGwpIHtcbiAgICAgICAgICAgIHJldHVybiBhcHBlbmQobCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXBwZW5kKHVzZWRMbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wcmVsb2FkKSB7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLnByZWxvYWQuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICAgICAgcmV0dXJuIGFwcGVuZChsKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5sb2FkKHRvTG9hZCwgdGhpcy5vcHRpb25zLm5zLCB1c2VkQ2FsbGJhY2spO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXNlZENhbGxiYWNrKG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZWxvYWRSZXNvdXJjZXNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVsb2FkUmVzb3VyY2VzKGxuZ3MsIG5zLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgIGlmICghbG5ncykgbG5ncyA9IHRoaXMubGFuZ3VhZ2VzO1xuICAgICAgaWYgKCFucykgbnMgPSB0aGlzLm9wdGlvbnMubnM7XG4gICAgICBpZiAoIWNhbGxiYWNrKSBjYWxsYmFjayA9IG5vb3A7XG4gICAgICB0aGlzLnNlcnZpY2VzLmJhY2tlbmRDb25uZWN0b3IucmVsb2FkKGxuZ3MsIG5zLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJ1c2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXNlKG1vZHVsZSkge1xuICAgICAgaWYgKCFtb2R1bGUpIHRocm93IG5ldyBFcnJvcignWW91IGFyZSBwYXNzaW5nIGFuIHVuZGVmaW5lZCBtb2R1bGUhIFBsZWFzZSBjaGVjayB0aGUgb2JqZWN0IHlvdSBhcmUgcGFzc2luZyB0byBpMThuZXh0LnVzZSgpJyk7XG4gICAgICBpZiAoIW1vZHVsZS50eXBlKSB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBhcmUgcGFzc2luZyBhIHdyb25nIG1vZHVsZSEgUGxlYXNlIGNoZWNrIHRoZSBvYmplY3QgeW91IGFyZSBwYXNzaW5nIHRvIGkxOG5leHQudXNlKCknKTtcblxuICAgICAgaWYgKG1vZHVsZS50eXBlID09PSAnYmFja2VuZCcpIHtcbiAgICAgICAgdGhpcy5tb2R1bGVzLmJhY2tlbmQgPSBtb2R1bGU7XG4gICAgICB9XG5cbiAgICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2xvZ2dlcicgfHwgbW9kdWxlLmxvZyAmJiBtb2R1bGUud2FybiAmJiBtb2R1bGUuZXJyb3IpIHtcbiAgICAgICAgdGhpcy5tb2R1bGVzLmxvZ2dlciA9IG1vZHVsZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG1vZHVsZS50eXBlID09PSAnbGFuZ3VhZ2VEZXRlY3RvcicpIHtcbiAgICAgICAgdGhpcy5tb2R1bGVzLmxhbmd1YWdlRGV0ZWN0b3IgPSBtb2R1bGU7XG4gICAgICB9XG5cbiAgICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ2kxOG5Gb3JtYXQnKSB7XG4gICAgICAgIHRoaXMubW9kdWxlcy5pMThuRm9ybWF0ID0gbW9kdWxlO1xuICAgICAgfVxuXG4gICAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdwb3N0UHJvY2Vzc29yJykge1xuICAgICAgICBwb3N0UHJvY2Vzc29yLmFkZFBvc3RQcm9jZXNzb3IobW9kdWxlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG1vZHVsZS50eXBlID09PSAnM3JkUGFydHknKSB7XG4gICAgICAgIHRoaXMubW9kdWxlcy5leHRlcm5hbC5wdXNoKG1vZHVsZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjaGFuZ2VMYW5ndWFnZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjaGFuZ2VMYW5ndWFnZShsbmcsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuICAgICAgdGhpcy5pc0xhbmd1YWdlQ2hhbmdpbmdUbyA9IGxuZztcbiAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICB0aGlzLmVtaXQoJ2xhbmd1YWdlQ2hhbmdpbmcnLCBsbmcpO1xuXG4gICAgICB2YXIgZG9uZSA9IGZ1bmN0aW9uIGRvbmUoZXJyLCBsKSB7XG4gICAgICAgIGlmIChsKSB7XG4gICAgICAgICAgX3RoaXM0Lmxhbmd1YWdlID0gbDtcbiAgICAgICAgICBfdGhpczQubGFuZ3VhZ2VzID0gX3RoaXM0LnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KGwpO1xuXG4gICAgICAgICAgX3RoaXM0LnRyYW5zbGF0b3IuY2hhbmdlTGFuZ3VhZ2UobCk7XG5cbiAgICAgICAgICBfdGhpczQuaXNMYW5ndWFnZUNoYW5naW5nVG8gPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICBfdGhpczQuZW1pdCgnbGFuZ3VhZ2VDaGFuZ2VkJywgbCk7XG5cbiAgICAgICAgICBfdGhpczQubG9nZ2VyLmxvZygnbGFuZ3VhZ2VDaGFuZ2VkJywgbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX3RoaXM0LmlzTGFuZ3VhZ2VDaGFuZ2luZ1RvID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzNC50LmFwcGx5KF90aGlzNCwgYXJndW1lbnRzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzNC50LmFwcGx5KF90aGlzNCwgYXJndW1lbnRzKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgc2V0TG5nID0gZnVuY3Rpb24gc2V0TG5nKGxuZ3MpIHtcbiAgICAgICAgdmFyIGwgPSB0eXBlb2YgbG5ncyA9PT0gJ3N0cmluZycgPyBsbmdzIDogX3RoaXM0LnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMuZ2V0QmVzdE1hdGNoRnJvbUNvZGVzKGxuZ3MpO1xuXG4gICAgICAgIGlmIChsKSB7XG4gICAgICAgICAgaWYgKCFfdGhpczQubGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIF90aGlzNC5sYW5ndWFnZSA9IGw7XG4gICAgICAgICAgICBfdGhpczQubGFuZ3VhZ2VzID0gX3RoaXM0LnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KGwpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghX3RoaXM0LnRyYW5zbGF0b3IubGFuZ3VhZ2UpIF90aGlzNC50cmFuc2xhdG9yLmNoYW5nZUxhbmd1YWdlKGwpO1xuICAgICAgICAgIGlmIChfdGhpczQuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvcikgX3RoaXM0LnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuY2FjaGVVc2VyTGFuZ3VhZ2UobCk7XG4gICAgICAgIH1cblxuICAgICAgICBfdGhpczQubG9hZFJlc291cmNlcyhsLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgZG9uZShlcnIsIGwpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIGlmICghbG5nICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiAhdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmFzeW5jKSB7XG4gICAgICAgIHNldExuZyh0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0KCkpO1xuICAgICAgfSBlbHNlIGlmICghbG5nICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3RvciAmJiB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuYXN5bmMpIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yLmRldGVjdChzZXRMbmcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0TG5nKGxuZyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0Rml4ZWRUXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldEZpeGVkVChsbmcsIG5zKSB7XG4gICAgICB2YXIgX3RoaXM1ID0gdGhpcztcblxuICAgICAgdmFyIGZpeGVkVCA9IGZ1bmN0aW9uIGZpeGVkVChrZXksIG9wdHMpIHtcbiAgICAgICAgdmFyIG9wdGlvbnM7XG5cbiAgICAgICAgaWYgKF90eXBlb2Yob3B0cykgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgZm9yICh2YXIgX2xlbjMgPSBhcmd1bWVudHMubGVuZ3RoLCByZXN0ID0gbmV3IEFycmF5KF9sZW4zID4gMiA/IF9sZW4zIC0gMiA6IDApLCBfa2V5MyA9IDI7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgICAgICAgIHJlc3RbX2tleTMgLSAyXSA9IGFyZ3VtZW50c1tfa2V5M107XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb3B0aW9ucyA9IF90aGlzNS5vcHRpb25zLm92ZXJsb2FkVHJhbnNsYXRpb25PcHRpb25IYW5kbGVyKFtrZXksIG9wdHNdLmNvbmNhdChyZXN0KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3B0aW9ucyA9IF9vYmplY3RTcHJlYWQoe30sIG9wdHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucy5sbmcgPSBvcHRpb25zLmxuZyB8fCBmaXhlZFQubG5nO1xuICAgICAgICBvcHRpb25zLmxuZ3MgPSBvcHRpb25zLmxuZ3MgfHwgZml4ZWRULmxuZ3M7XG4gICAgICAgIG9wdGlvbnMubnMgPSBvcHRpb25zLm5zIHx8IGZpeGVkVC5ucztcbiAgICAgICAgcmV0dXJuIF90aGlzNS50KGtleSwgb3B0aW9ucyk7XG4gICAgICB9O1xuXG4gICAgICBpZiAodHlwZW9mIGxuZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZml4ZWRULmxuZyA9IGxuZztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZpeGVkVC5sbmdzID0gbG5nO1xuICAgICAgfVxuXG4gICAgICBmaXhlZFQubnMgPSBucztcbiAgICAgIHJldHVybiBmaXhlZFQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gdCgpIHtcbiAgICAgIHZhciBfdGhpcyR0cmFuc2xhdG9yO1xuXG4gICAgICByZXR1cm4gdGhpcy50cmFuc2xhdG9yICYmIChfdGhpcyR0cmFuc2xhdG9yID0gdGhpcy50cmFuc2xhdG9yKS50cmFuc2xhdGUuYXBwbHkoX3RoaXMkdHJhbnNsYXRvciwgYXJndW1lbnRzKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZXhpc3RzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGV4aXN0cygpIHtcbiAgICAgIHZhciBfdGhpcyR0cmFuc2xhdG9yMjtcblxuICAgICAgcmV0dXJuIHRoaXMudHJhbnNsYXRvciAmJiAoX3RoaXMkdHJhbnNsYXRvcjIgPSB0aGlzLnRyYW5zbGF0b3IpLmV4aXN0cy5hcHBseShfdGhpcyR0cmFuc2xhdG9yMiwgYXJndW1lbnRzKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwic2V0RGVmYXVsdE5hbWVzcGFjZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXREZWZhdWx0TmFtZXNwYWNlKG5zKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZGVmYXVsdE5TID0gbnM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImhhc0xvYWRlZE5hbWVzcGFjZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBoYXNMb2FkZWROYW1lc3BhY2UobnMpIHtcbiAgICAgIHZhciBfdGhpczYgPSB0aGlzO1xuXG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG5cbiAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ2hhc0xvYWRlZE5hbWVzcGFjZTogaTE4bmV4dCB3YXMgbm90IGluaXRpYWxpemVkJywgdGhpcy5sYW5ndWFnZXMpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5sYW5ndWFnZXMgfHwgIXRoaXMubGFuZ3VhZ2VzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKCdoYXNMb2FkZWROYW1lc3BhY2U6IGkxOG4ubGFuZ3VhZ2VzIHdlcmUgdW5kZWZpbmVkIG9yIGVtcHR5JywgdGhpcy5sYW5ndWFnZXMpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciBsbmcgPSB0aGlzLmxhbmd1YWdlc1swXTtcbiAgICAgIHZhciBmYWxsYmFja0xuZyA9IHRoaXMub3B0aW9ucyA/IHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZyA6IGZhbHNlO1xuICAgICAgdmFyIGxhc3RMbmcgPSB0aGlzLmxhbmd1YWdlc1t0aGlzLmxhbmd1YWdlcy5sZW5ndGggLSAxXTtcbiAgICAgIGlmIChsbmcudG9Mb3dlckNhc2UoKSA9PT0gJ2NpbW9kZScpIHJldHVybiB0cnVlO1xuXG4gICAgICB2YXIgbG9hZE5vdFBlbmRpbmcgPSBmdW5jdGlvbiBsb2FkTm90UGVuZGluZyhsLCBuKSB7XG4gICAgICAgIHZhciBsb2FkU3RhdGUgPSBfdGhpczYuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5zdGF0ZVtcIlwiLmNvbmNhdChsLCBcInxcIikuY29uY2F0KG4pXTtcblxuICAgICAgICByZXR1cm4gbG9hZFN0YXRlID09PSAtMSB8fCBsb2FkU3RhdGUgPT09IDI7XG4gICAgICB9O1xuXG4gICAgICBpZiAob3B0aW9ucy5wcmVjaGVjaykge1xuICAgICAgICB2YXIgcHJlUmVzdWx0ID0gb3B0aW9ucy5wcmVjaGVjayh0aGlzLCBsb2FkTm90UGVuZGluZyk7XG4gICAgICAgIGlmIChwcmVSZXN1bHQgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHByZVJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuaGFzUmVzb3VyY2VCdW5kbGUobG5nLCBucykpIHJldHVybiB0cnVlO1xuICAgICAgaWYgKCF0aGlzLnNlcnZpY2VzLmJhY2tlbmRDb25uZWN0b3IuYmFja2VuZCkgcmV0dXJuIHRydWU7XG4gICAgICBpZiAobG9hZE5vdFBlbmRpbmcobG5nLCBucykgJiYgKCFmYWxsYmFja0xuZyB8fCBsb2FkTm90UGVuZGluZyhsYXN0TG5nLCBucykpKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibG9hZE5hbWVzcGFjZXNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbG9hZE5hbWVzcGFjZXMobnMsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgX3RoaXM3ID0gdGhpcztcblxuICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcblxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMubnMpIHtcbiAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG5zID09PSAnc3RyaW5nJykgbnMgPSBbbnNdO1xuICAgICAgbnMuZm9yRWFjaChmdW5jdGlvbiAobikge1xuICAgICAgICBpZiAoX3RoaXM3Lm9wdGlvbnMubnMuaW5kZXhPZihuKSA8IDApIF90aGlzNy5vcHRpb25zLm5zLnB1c2gobik7XG4gICAgICB9KTtcbiAgICAgIHRoaXMubG9hZFJlc291cmNlcyhmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZGVmZXJyZWQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImxvYWRMYW5ndWFnZXNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbG9hZExhbmd1YWdlcyhsbmdzLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgIGlmICh0eXBlb2YgbG5ncyA9PT0gJ3N0cmluZycpIGxuZ3MgPSBbbG5nc107XG4gICAgICB2YXIgcHJlbG9hZGVkID0gdGhpcy5vcHRpb25zLnByZWxvYWQgfHwgW107XG4gICAgICB2YXIgbmV3TG5ncyA9IGxuZ3MuZmlsdGVyKGZ1bmN0aW9uIChsbmcpIHtcbiAgICAgICAgcmV0dXJuIHByZWxvYWRlZC5pbmRleE9mKGxuZykgPCAwO1xuICAgICAgfSk7XG5cbiAgICAgIGlmICghbmV3TG5ncy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub3B0aW9ucy5wcmVsb2FkID0gcHJlbG9hZGVkLmNvbmNhdChuZXdMbmdzKTtcbiAgICAgIHRoaXMubG9hZFJlc291cmNlcyhmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZGVmZXJyZWQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImRpclwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkaXIobG5nKSB7XG4gICAgICBpZiAoIWxuZykgbG5nID0gdGhpcy5sYW5ndWFnZXMgJiYgdGhpcy5sYW5ndWFnZXMubGVuZ3RoID4gMCA/IHRoaXMubGFuZ3VhZ2VzWzBdIDogdGhpcy5sYW5ndWFnZTtcbiAgICAgIGlmICghbG5nKSByZXR1cm4gJ3J0bCc7XG4gICAgICB2YXIgcnRsTG5ncyA9IFsnYXInLCAnc2h1JywgJ3NxcicsICdzc2gnLCAneGFhJywgJ3loZCcsICd5dWQnLCAnYWFvJywgJ2FiaCcsICdhYnYnLCAnYWNtJywgJ2FjcScsICdhY3cnLCAnYWN4JywgJ2FjeScsICdhZGYnLCAnYWRzJywgJ2FlYicsICdhZWMnLCAnYWZiJywgJ2FqcCcsICdhcGMnLCAnYXBkJywgJ2FyYicsICdhcnEnLCAnYXJzJywgJ2FyeScsICdhcnonLCAnYXV6JywgJ2F2bCcsICdheWgnLCAnYXlsJywgJ2F5bicsICdheXAnLCAnYmJ6JywgJ3BnYScsICdoZScsICdpdycsICdwcycsICdwYnQnLCAncGJ1JywgJ3BzdCcsICdwcnAnLCAncHJkJywgJ3VnJywgJ3VyJywgJ3lkZCcsICd5ZHMnLCAneWloJywgJ2ppJywgJ3lpJywgJ2hibycsICdtZW4nLCAneG1uJywgJ2ZhJywgJ2pwcicsICdwZW8nLCAncGVzJywgJ3BycycsICdkdicsICdzYW0nXTtcbiAgICAgIHJldHVybiBydGxMbmdzLmluZGV4T2YodGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGxuZykpID49IDAgPyAncnRsJyA6ICdsdHInO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjcmVhdGVJbnN0YW5jZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVJbnN0YW5jZSgpIHtcbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuICAgICAgcmV0dXJuIG5ldyBJMThuKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY2xvbmVJbnN0YW5jZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjbG9uZUluc3RhbmNlKCkge1xuICAgICAgdmFyIF90aGlzOCA9IHRoaXM7XG5cbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogbm9vcDtcblxuICAgICAgdmFyIG1lcmdlZE9wdGlvbnMgPSBfb2JqZWN0U3ByZWFkKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgaXNDbG9uZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIHZhciBjbG9uZSA9IG5ldyBJMThuKG1lcmdlZE9wdGlvbnMpO1xuICAgICAgdmFyIG1lbWJlcnNUb0NvcHkgPSBbJ3N0b3JlJywgJ3NlcnZpY2VzJywgJ2xhbmd1YWdlJ107XG4gICAgICBtZW1iZXJzVG9Db3B5LmZvckVhY2goZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgY2xvbmVbbV0gPSBfdGhpczhbbV07XG4gICAgICB9KTtcbiAgICAgIGNsb25lLnNlcnZpY2VzID0gX29iamVjdFNwcmVhZCh7fSwgdGhpcy5zZXJ2aWNlcyk7XG4gICAgICBjbG9uZS5zZXJ2aWNlcy51dGlscyA9IHtcbiAgICAgICAgaGFzTG9hZGVkTmFtZXNwYWNlOiBjbG9uZS5oYXNMb2FkZWROYW1lc3BhY2UuYmluZChjbG9uZSlcbiAgICAgIH07XG4gICAgICBjbG9uZS50cmFuc2xhdG9yID0gbmV3IFRyYW5zbGF0b3IoY2xvbmUuc2VydmljZXMsIGNsb25lLm9wdGlvbnMpO1xuICAgICAgY2xvbmUudHJhbnNsYXRvci5vbignKicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBmb3IgKHZhciBfbGVuNCA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjQgPiAxID8gX2xlbjQgLSAxIDogMCksIF9rZXk0ID0gMTsgX2tleTQgPCBfbGVuNDsgX2tleTQrKykge1xuICAgICAgICAgIGFyZ3NbX2tleTQgLSAxXSA9IGFyZ3VtZW50c1tfa2V5NF07XG4gICAgICAgIH1cblxuICAgICAgICBjbG9uZS5lbWl0LmFwcGx5KGNsb25lLCBbZXZlbnRdLmNvbmNhdChhcmdzKSk7XG4gICAgICB9KTtcbiAgICAgIGNsb25lLmluaXQobWVyZ2VkT3B0aW9ucywgY2FsbGJhY2spO1xuICAgICAgY2xvbmUudHJhbnNsYXRvci5vcHRpb25zID0gY2xvbmUub3B0aW9ucztcbiAgICAgIGNsb25lLnRyYW5zbGF0b3IuYmFja2VuZENvbm5lY3Rvci5zZXJ2aWNlcy51dGlscyA9IHtcbiAgICAgICAgaGFzTG9hZGVkTmFtZXNwYWNlOiBjbG9uZS5oYXNMb2FkZWROYW1lc3BhY2UuYmluZChjbG9uZSlcbiAgICAgIH07XG4gICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIEkxOG47XG59KEV2ZW50RW1pdHRlcik7XG5cbnZhciBpMThuZXh0ID0gbmV3IEkxOG4oKTtcblxubW9kdWxlLmV4cG9ydHMgPSBpMThuZXh0O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIHJlZjogaHR0cHM6Ly9naXRodWIuY29tL3RjMzkvcHJvcG9zYWwtZ2xvYmFsXG52YXIgZ2V0R2xvYmFsID0gZnVuY3Rpb24gKCkge1xuXHQvLyB0aGUgb25seSByZWxpYWJsZSBtZWFucyB0byBnZXQgdGhlIGdsb2JhbCBvYmplY3QgaXNcblx0Ly8gYEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKClgXG5cdC8vIEhvd2V2ZXIsIHRoaXMgY2F1c2VzIENTUCB2aW9sYXRpb25zIGluIENocm9tZSBhcHBzLlxuXHRpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7IHJldHVybiBzZWxmOyB9XG5cdGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgeyByZXR1cm4gd2luZG93OyB9XG5cdGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykgeyByZXR1cm4gZ2xvYmFsOyB9XG5cdHRocm93IG5ldyBFcnJvcigndW5hYmxlIHRvIGxvY2F0ZSBnbG9iYWwgb2JqZWN0Jyk7XG59XG5cbnZhciBnbG9iYWwgPSBnZXRHbG9iYWwoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZ2xvYmFsLmZldGNoO1xuXG4vLyBOZWVkZWQgZm9yIFR5cGVTY3JpcHQgYW5kIFdlYnBhY2suXG5pZiAoZ2xvYmFsLmZldGNoKSB7XG5cdGV4cG9ydHMuZGVmYXVsdCA9IGdsb2JhbC5mZXRjaC5iaW5kKGdsb2JhbCk7XG59XG5cbmV4cG9ydHMuSGVhZGVycyA9IGdsb2JhbC5IZWFkZXJzO1xuZXhwb3J0cy5SZXF1ZXN0ID0gZ2xvYmFsLlJlcXVlc3Q7XG5leHBvcnRzLlJlc3BvbnNlID0gZ2xvYmFsLlJlc3BvbnNlOyIsInZhciB7SGVqbEVsZW1lbnQgfSA9IHJlcXVpcmUoJy4vaGVqbEVsZW1lbnQnKTtcclxuXHJcblxyXG5jbGFzcyBIZWpsQXBwIGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIkRJVlwiLG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMud2luU3RhY2sgPSBbXTtcclxuICAgICAgICB0aGlzLmRpYWxvZ1BhbmUgPSBESVYoXCJkaWFsb2dQYW5lXCIpLnZpc2libGUoKG0sZWwpPT5lbC5jaGlsZHJlbi5sZW5ndGggPiAwKTtcclxuICAgICAgICB0aGlzLnByb2dyZXMgPSBESVYoXCJwcm9ncmVzXCIpLnN0YWNrKFxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICBTUEFOKCkuY2xhc3MoW1wiZmFcIixcImZhLTN4XCIsXCJmYS1zcGluXCIsXCJmYS1zcGlubmVyXCJdKSxcclxuICAgICAgICAgICAgICAgIEgxKCkudGV4dEJpbmRlcigoKT0+dGhpcy5wcm9ncmVzc1RleHQpXHJcbiAgICAgICAgICAgIF0pLnZpc2libGUoKCk9PnRoaXMucHJvZ3Jlc3NUZXh0ICE9IG51bGwpOyBcclxuICAgICAgICB0aGlzLmNsYXNzKCdwbGFpbkFwcCcpLnN0YWNrKFt0aGlzLnByb2dyZXMsXSk7XHJcbiAgICAgICAgdGhpcy5oaWRlUHJvZ3Jlc3MoKTtcclxuICAgICAgICB0aGlzLmNsb3NlRGlhbG9nKCk7XHJcbiAgICB9XHJcbiAgICBzaG93UHJvZ3Jlc3ModGV4dClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnByb2dyZXNzVGV4dCA9IHRleHQ7XHJcbiAgICAgICAgdGhpcy5wcm9ncmVzLnJlYmluZCgpO1xyXG5cclxuICAgIH1cclxuICAgIGhpZGVQcm9ncmVzcygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zaG93UHJvZ3Jlc3MobnVsbCk7XHJcbiAgICB9XHJcbiAgICBjb250ZW50KGNudClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNvbnRlbnRFbCA9IGNudDtcclxuICAgICAgICB0aGlzLnJlbW92ZUNoaWxkcmVuKCk7XHJcbiAgICAgICAgdGhpcy5zdGFja1VwKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBzdGFja1VwKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnN0YWNrKFt0aGlzLnByb2dyZXMsdGhpcy5kaWFsb2dQYW5lLHRoaXMuY29udGVudEVsXSlcclxuICAgIH1cclxuICAgIHNob3dEaWFsb2coaGVsKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2RpYWxvZ0VsID0gaGVsO1xyXG4gICAgICAgIHRoaXMuX2RpYWxvZ0VsLmNsb3NlID0gdGhpcy5jbG9zZURpYWxvZy5iaW5kKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuZGlhbG9nUGFuZS5zdGFjayhbaGVsXSk7XHJcbiAgICAgICAgdGhpcy5kaWFsb2dQYW5lLmJpbmQoe30pO1xyXG4gICAgICAgIGlmKHRoaXMuY29udGVudEVsICE9IG51bGwgJiYgdGhpcy5jb250ZW50RWwub25DbG9zZSlcclxuICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRFbC5vbkNsb3NlKHRoaXMpO1xyXG4gIFxyXG4gIFxyXG4gICAgICAgIGlmKHRoaXMuX2RpYWxvZ0VsLm9uU2hvdylcclxuICAgICAgICAgICAgIFRSWUModGhpcy5fZGlhbG9nRWwub25TaG93KTtcclxuXHJcbiAgICB9XHJcbiAgICBjbG9zZURpYWxvZyhyZXN1bWVDb250ZW50KVxyXG4gICAge1xyXG4gICAgICAgIGlmKCFyZXN1bWVDb250ZW50KVxyXG4gICAgICAgICAgICByZXN1bWVDb250ZW50ID0gdHJ1ZTtcclxuICAgICAgICBpZih0aGlzLl9kaWFsb2dFbCA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmKHRoaXMuX2RpYWxvZ0VsLm9uQ2xvc2UpXHJcbiAgICAgICAgICAgIFRSWUModGhpcy5fZGlhbG9nRWwub25DbG9zZSk7XHJcbiAgICAgICAgdGhpcy5fZGlhbG9nRWwgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuZGlhbG9nUGFuZS5yZW1vdmVDaGlsZHJlbigpO1xyXG4gICAgICAgIHRoaXMuZGlhbG9nUGFuZS5iaW5kKHt9KTtcclxuICAgICAgICBpZihyZXN1bWVDb250ZW50ICYmIHRoaXMuY29udGVudEVsICE9IG51bGwgJiYgdGhpcy5jb250ZW50RWwub25SZXN1bWUpXHJcbiAgICAgICAgICAgVFJZQygoKT0+dGhpcy5jb250ZW50RWwub25SZXN1bWUodGhpcykpO1xyXG4gICAgfVxyXG4gICAgcGVlaygpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy53aW5TdGFjay5sZW5ndGggPT0gMClcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMud2luU3RhY2tbdGhpcy53aW5TdGFjay5sZW5ndGgtMV07XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIENsb3NlcyAgdmlld3Mgb24gc3RhY2ssIG9ubHkgPHVwVG8+IGxvd2VzdCB2aWV3cyBhcmUga2VwdFxyXG4gICAgICogQHBhcmFtIHtpbnR9IHVwVG8gXHJcbiAgICAgKi9cclxuICAgIHVud2luZCh1cFRvKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0b2Nsb3NlID0gW11cclxuICAgICAgICBpZih0aGlzLndpblN0YWNrLmxlbmd0aCA8PSAgdXBUby0xKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdmFyIGxlbiA9IHRoaXMud2luU3RhY2subGVuZ3RoO1xyXG4gICAgICAgIGZvcih2YXIgaSA9IGxlbisxOyBpID4gdXBUbzsgaS0tIClcclxuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICBcclxuICAgIH1cclxuICAgIHNob3coZWwsbm9PblNob3csdClcclxuICAgIHtcclxuICAgICAgICBpZighZWwpXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJIRUpMOiBDYW5ub3Qgc2hvdyBudWxsL3VuZGVmaW5lZCBlbGVtZW50XCIpO1xyXG4gICAgICAgIGlmKHRoaXMuY29udGVudEVsKVxyXG4gICAgICAgICAgICB0aGlzLndpblN0YWNrLnB1c2goe2NvbnRlbnQ6IHRoaXMuY29udGVudEVsfSk7XHJcbiAgICAgICAgdGhpcy5jb250ZW50KGVsKTtcclxuICAgICAgICBpZighbm9PblNob3cgJiYgdGhpcy5jb250ZW50RWwub25TaG93KVxyXG4gICAgICAgICAgICBUUllDKCgpPT50aGlzLmNvbnRlbnRFbC5vblNob3codGhpcykpO1xyXG4gICAgICAgIGVsLmNsb3NlID0gdGhpcy5jbG9zZS5iaW5kKHRoaXMpO1xyXG4gICAgfVxyXG4gXHJcbiAgICBjbG9zZSgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy53aW5TdGFjay5sZW5ndGggPT0gMClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciByZWMgPSB0aGlzLndpblN0YWNrLnBvcCgpO1xyXG4gICAgICAgIHRoaXMuY2xvc2VEaWFsb2coZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZG9PbkNsb3NlKCk7XHJcbiAgICAgICAgdGhpcy5jb250ZW50RWwgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuc2hvdyhyZWMuY29udGVudCx0cnVlIC8qbm8gb25TaG93Ki8pO1xyXG4gICAgICAgIGlmKHJlYy5jb250ZW50Lm9uUmVzdW1lKVxyXG4gICAgICAgICAgVFJZQygoKT0+cmVjLmNvbnRlbnQub25SZXN1bWUodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIGRvT25DbG9zZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5jb250ZW50RWwgIT0gbnVsbCAmJiB0aGlzLmNvbnRlbnRFbC5vbkNsb3NlKVxyXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbC5vbkNsb3NlKHRoaXMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gQVBQKGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgSGVqbEFwcChpZCxvcHRpb25zKTtcclxufVxyXG5cclxuaWYoIXdpbmRvdy5ub0hlamxHbG9iYWxzKVxyXG57XHJcbiAgICB3aW5kb3cuQVBQID0gQVBQXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLkhlamxBcHAgPSBIZWpsQXBwO1xyXG5tb2R1bGUuZXhwb3J0cy5BUFAgPSBBUFA7XHJcbiIsImNvbnN0IHtIZWpsTG92QmFzZX0gPSByZXF1aXJlKFwiLi9sb3ZiYXNlXCIpO1xyXG5mdW5jdGlvbiBjcmVhdGVSYWRpbyhpZCxvcHRpb25zKVxyXG57XHJcbiAgICB2YXIgbG92YmFzZSA9IG5ldyBIZWpsTG92QmFzZShyYWRpbyk7XHJcblxyXG4gICAgdmFyIHJhZGlvID0gRElWKGlkKS5kZWZhdWx0KFwiXCIpLmNsYXNzKFsnYnV0dG9uQXJlYScsJ3JhZGlvJ10pLnN0YWNrKFtcclxuICAgICAgICBESVYoKS5jb2xsZWN0aW9uKCgpPT5sb3ZiYXNlLmxpc3RPcHRpb25zKCksY3JlYXRlSXRlbVZpZXcpXSk7XHJcbiAgICBsb3ZiYXNlLmF0dGFjaChyYWRpbyk7XHJcblxyXG4gICAgZnVuY3Rpb24gY3JlYXRlSXRlbVZpZXcoaXQpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJ2ID0gQlVUVE9OKGxvdmJhc2Uuc2hvdyhpdCksKCk9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGxvdmJhc2Uuc2VsZWN0KGl0KTtcclxuICAgICAgICAgXHJcbiAgICAgICAgfSkuYmluZGVyKChzKT0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBydi5idWlsZCgpLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgaWYobG92YmFzZS5pc1NlbGVjdGVkKGl0KSlcclxuICAgICAgICAgICAgICAgICBydi5idWlsZCgpLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgIFxyXG4gICAgcmV0dXJuIHJhZGlvO1xyXG59XHJcbndpbmRvdy5SQURJTyA9IGNyZWF0ZVJhZGlvO1xyXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVJhZGlvOyIsIi8qKlxyXG4gKiByZXN1bHQgb2YgRm9ybS9Vc2VyIGlucHV0IHZhbGlkYXRpb25cclxuICovXHJcbmNsYXNzIEhlamxWYWxpZGF0aW9uUHJvdG9jb2xcclxue1xyXG4gICAgY29uc3RydWN0b3IoKVxyXG4gICAge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEB0eXBlIHtIZWpsVmFsaWRhdGlvbk1lc3NhZ2V9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IFtdXHJcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgbmV3IHZhbGlkYXRpb24gbWVzc2FnZSB0byByZXN1bHRcclxuICAgICAqIEBwYXJhbSB7SGVqbFZhbGlkYXRpb25NZXNzYWdlfSBoZWpsVmFsaWRhdGlvbk1lc3NhZ2UgXHJcbiAgICAgKi9cclxuICAgIGFkZE1lc3NhZ2UobWVzc2FnZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm1lc3NhZ2VzLnB1c2gobWVzc2FnZSk7XHJcbiAgICAgICAgaWYobWVzc2FnZS5pc0Vycm9yKVxyXG4gICAgICAgICAgICB0aGlzLmVycm9ycy5wdXNoKG1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gIHRydWUgd2hlbiBwcm90b2NvbCBjb250YWlucyBlcnJvciBtZXNzYWdlc1xyXG4gICAgICovXHJcbiAgICBoYXNFcnJvcnMoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVycm9ycy5sZW5ndGggPiAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkcyBuZXcgZXJyb3IgaW50byB0aGUgcHJvdG9jb2xcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIFxyXG4gICAgICovXHJcbiAgICBhZGRFcnJvcihmaWVsZExhYmVsLG1lc3NhZ2UpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5hZGRNZXNzYWdlKG5ldyBIZWpsVmFsaWRhdGlvbkVycm9yKGZpZWxkTGFiZWwsbWVzc2FnZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY29udmVydCBwcm90b2NvbCB0byBzdHJpbmdcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGRpc3BsYXlQcm90b2NvbCgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJ2ID0gXCJcIjtcclxuICAgICAgICB0aGlzLm1lc3NhZ2VzLmZvckVhY2gobT0+XHJcbiAgICAgICAgICAgIHJ2ICs9IG0uZGlzcGxheU1lc3NhZ2UoKStcIlxcblwiKTtcclxuICAgICAgICByZXR1cm4gcnY7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjb252ZXJ0IHByb3RvY29sIGVycm9ycyB0byBzdHJpbmcsIG5vIGZpZWxkIG5hbWVzLCBsZXZlbHNcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGRpc3BsYXlFcnJvcnMoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBydiA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5lcnJvcnMuZm9yRWFjaChtPT5cclxuICAgICAgICAgICAgcnYgKz0gbS5tZXNzYWdlK1wiXFxuXCIpO1xyXG4gICAgICAgIHJldHVybiBydjtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogbWVyZ2VzIG1lc3NhZ2VzIG9mIGdpdmVuIHByb3RvY29sIHRvIHRoaXMgb25lIFxyXG4gICAgICogVGhpcyBpcyBzdXBwb3J0IGZvciBoaWVhcmNoaWNhbCBzdWJ2YWxpZGF0aW9uc1xyXG4gICAgICogQHBhcmFtIHtIZWpsVmFsaWRhdGlvblByb3RvY29sfSBwcm90b2NvbCBcclxuICAgICAqL1xyXG4gICAgbWVyZ2UocHJvdG9jb2wpXHJcbiAgICB7XHJcbiAgICAgICAgcHJvdG9jb2wubWVzc2FnZXMuZm9yRWFjaChtPT5cclxuICAgICAgICAgICAgdGhpcy5hZGRNZXNzYWdlKG0pKTtcclxuICAgIH1cclxuXHJcbiAgICBjaGVjayhwcmVtaXNlLG1lc3NhZ2UpXHJcbiAgICB7XHJcbiAgICAgICAgaWYoIXByZW1pc2UpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZih0eXBlb2YgbWVzc2FnZSA9PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IG5ldyBIZWpsVmFsaWRhdGlvbkVycm9yKG51bGwsbWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShtZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEhlamxWYWxpZGF0aW9uTWVzc2FnZVxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihsZXZlbCxsZXZlbERlc2MsZmllbGROYW1lLG1lc3NhZ2UpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5sZXZlbCA9IGxldmVsO1xyXG4gICAgICAgIHRoaXMubGV2ZWxEZXNjID0gbGV2ZWxEZXNjO1xyXG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XHJcbiAgICAgICAgdGhpcy5pc0Vycm9yID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5pc1dhcm5pbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzTm90ZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZmllbGROYW1lID0gZmllbGROYW1lO1xyXG4gICAgfVxyXG4gICAgZGlzcGxheU1lc3NhZ2UoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBUKHRoaXMubGV2ZWxEZXNjKStcIjogXCIrKHRoaXMuZmllbGROYW1lID8gKFQodGhpcy5maWVsZE5hbWUpK1wiIC0gXCIpOlwiXCIpK1QodGhpcy5tZXNzYWdlKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgSGVqbFZhbGlkYXRpb25FcnJvciBleHRlbmRzIEhlamxWYWxpZGF0aW9uTWVzc2FnZVxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihmaWVsZE5hbWUsbWVzc2FnZSlcclxuICAgIHtcclxuICAgICAgICBzdXBlcihcIkVcIixcIkNoeWJhXCIsZmllbGROYW1lLG1lc3NhZ2UpO1xyXG4gICAgICAgIHRoaXMuaXNFcnJvciA9IHRydWU7ICAgXHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEhlamxWYWxpZGF0aW9uV2FybmluZyBleHRlbmRzIEhlamxWYWxpZGF0aW9uTWVzc2FnZVxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihmaWVsZE5hbWUsbWVzc2FnZSlcclxuICAgIHtcclxuICAgICAgICBzdXBlcihcIldcIixcIlZhcm92w6Fuw61cIixmaWVsZE5hbWUsbWVzc2FnZSk7XHJcbiAgICAgICAgdGhpcy5pc1dhcm5pbmcgPSB0cnVlO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBIZWpsVmFsaWRhdGlvbk5vdGUgZXh0ZW5kcyBIZWpsVmFsaWRhdGlvbk1lc3NhZ2Vcclxue1xyXG4gICAgY29uc3RydWN0b3IoZmllbGROYW1lLG1lc3NhZ2UpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoXCJOXCIsXCJQb3puw6Fta2FcIixmaWVsZE5hbWUsbWVzc2FnZSk7XHJcbiAgICAgICAgdGhpcy5pc05vdGUgPSB0cnVlO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHsgSGVqbFZhbGlkYXRpb25Qcm90b2NvbCwgSGVqbFZhbGlkYXRpb25NZXNzYWdlLEhlamxWYWxpZGF0aW9uV2FybmluZyxIZWpsVmFsaWRhdGlvbk5vdGV9IiwiXHJcblxyXG5cclxudmFyIGh0dHBHZXRDYWNoZSA9IHt9XHJcblxyXG4vKipcclxuICogQGNhbGxiYWNrIGxvYWRDYWxsYmFja1xyXG4gKiBAcGFyYW0ge1N0cmluZ30gbG9hZGVkVGV4dCBsb2FkZWQgZGF0YSBhcyB0ZXh0XHJcbiAqL1xyXG4vKipcclxuICogXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgdXJsIG9mIGh0dHAgcmVzb3VyY2UgIGZpbGUgdG8gYmUgbG9hZGVkXHJcbiAqIEBwYXJhbSB7bG9hZENhbGxiYWNrfSBjYWxsYmFjayBcclxuICovXHJcbnZhciBodHRwR2V0ID0gZnVuY3Rpb24odXJsLGNhbGxiYWNrLHRyeUNhY2hlLG9wdGlvbnMpXHJcbntcclxuICB0cnlcclxue1xyXG4gIGlmKHRyeUNhY2hlKVxyXG4gIHtcclxuICAgIGlmKGh0dHBHZXRDYWNoZS5oYXNPd25Qcm9wZXJ0eSh1cmwpKVxyXG4gICAgICB7XHJcbiAgICAgICAgdmFyIHJ2ID0gaHR0cEdldENhY2hlW3VybF07XHJcbiAgICAgICAgY2FsbGJhY2socnYpO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICAgIH1cclxuICB9XHJcblxyXG4gICAgICB2YXIgeGhyID0gY3JlYXRlQ09SU1JlcXVlc3QoKG9wdGlvbnMgIT0gbnVsbCAmJiBvcHRpb25zLm1ldGhvZCkgPyBvcHRpb25zLm1ldGhvZCA6IFwiR0VUXCIsdXJsKTtcclxuICAgICAgaWYob3B0aW9ucyAmJiBvcHRpb25zLmhlYWRlcnMpXHJcbiAgICAgIHtcclxuICAgICAgICBmb3IodmFyIGhlYWRlciBpbiBvcHRpb25zLmhlYWRlcnMpXHJcbiAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsb3B0aW9ucy5oZWFkZXJzW2hlYWRlcl0pO1xyXG4gICAgICB9XHJcbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT0gNClcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBpZih4aHIuc3RhdHVzID09IDIwMClcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZih0cnlDYWNoZSlcclxuICAgICAgICAgICAgICAgICAgICBodHRwR2V0Q2FjaGVbdXJsXSA9IHhoci5yZXNwb25zZVRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh4aHIucmVzcG9uc2VUZXh0LHhocik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwseGhyKTtcclxuICAgICAgICAgIH1cclxuICAgICB9O1xyXG5cclxuICAgIFxyXG4gICAgICB4aHIudGltZW91dCA9IDMwMDAwO1xyXG4gICAgICB4aHIuc2VuZCgob3B0aW9ucyAhPSBudWxsICYmIG9wdGlvbnMuZGF0YSkgPyBvcHRpb25zLmRhdGEgOm51bGwpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goZXJyb3IpXHJcbiAgICB7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyhlcnJvci5zdGFjayk7XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsbnVsbCxlcnJvcik7XHJcbiAgICB9XHJcbiAgIFxyXG4gfVxyXG5mdW5jdGlvbiBkb0h0dHBSZXF1ZXN0KHVybCxvcHRpb25zKVxyXG57XHJcbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSxyZWplY3QpPT5cclxuICB7XHJcbiAgICBodHRwR2V0KHVybCxmdW5jdGlvbihkYXRhLHhocixleGNlcHRpb24pXHJcbiAgICB7XHJcbiAgICAgIGlmKGRhdGEgIT0gbnVsbClcclxuICAgICAgICByZXNvbHZlKGRhdGEpO1xyXG4gICAgICBlbHNlXHJcbiAgICAgIHtcclxuICAgICAgICBpZihleGNlcHRpb24pXHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZG9IdHRwUmVxdWVzdCBmb3IgXCIrdXJsK1wiZmFpbGVkIHdpdGggZXhjZXB0aW9uXCIsZXhjZXB0aW9uKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZG9IdHRwUmVxdWVzdCBmb3IgXCIrdXJsK1wiIGZhaWxlZCwgc3RhdHVzPVwiLHhoci5zdGF0dXMpO1xyXG4gICAgICAgIHJlamVjdCh7IHhocjp4aHIsZXhjZXB0aW9uOmV4Y2VwdGlvbn0pOyAgXHJcbiAgICAgIH1cclxuICAgIH0sZmFsc2Usb3B0aW9ucyk7XHJcbiAgfSlcclxuICByZXR1cm4gcHJvbWlzZTtcclxufVxyXG4gIGZ1bmN0aW9uIHJlbmRlclVybFRlbXBsYXRlKHVybCxtb2RlbClcclxuICB7XHJcbiAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUscmVqZWN0KVxyXG4gICAgeyAgaHR0cEdldCh1cmwsZnVuY3Rpb24oZGF0YSxycSlcclxuICAgICAge1xyXG4gICAgICAgIGlmKGRhdGEgPT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICByZWplY3QocnEpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcnYgPSBkYXRhLnJlbmRlclRlbXBsYXRlKG1vZGVsKTtcclxuICAgICAgICByZXNvbHZlKHJ2KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBwcm9taXNlO1xyXG4gfVxyXG5cclxuIGZ1bmN0aW9uIGNyZWF0ZUNPUlNSZXF1ZXN0KG1ldGhvZCwgdXJsKSB7XHJcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICBpZiAoXCJ3aXRoQ3JlZGVudGlhbHNcIiBpbiB4aHIpIHtcclxuICBcclxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIFhNTEh0dHBSZXF1ZXN0IG9iamVjdCBoYXMgYSBcIndpdGhDcmVkZW50aWFsc1wiIHByb3BlcnR5LlxyXG4gICAgICAvLyBcIndpdGhDcmVkZW50aWFsc1wiIG9ubHkgZXhpc3RzIG9uIFhNTEhUVFBSZXF1ZXN0MiBvYmplY3RzLlxyXG4gICAgICB4aHIub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XHJcbiAgXHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBYRG9tYWluUmVxdWVzdCAhPSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgXHJcbiAgICAgIC8vIE90aGVyd2lzZSwgY2hlY2sgaWYgWERvbWFpblJlcXVlc3QuXHJcbiAgICAgIC8vIFhEb21haW5SZXF1ZXN0IG9ubHkgZXhpc3RzIGluIElFLCBhbmQgaXMgSUUncyB3YXkgb2YgbWFraW5nIENPUlMgcmVxdWVzdHMuXHJcbiAgICAgIHhociA9IG5ldyBYRG9tYWluUmVxdWVzdCgpO1xyXG4gICAgICB4aHIub3BlbihtZXRob2QsIHVybCk7XHJcbiAgXHJcbiAgICB9IGVsc2Uge1xyXG4gIFxyXG4gICAgICAvLyBPdGhlcndpc2UsIENPUlMgaXMgbm90IHN1cHBvcnRlZCBieSB0aGUgYnJvd3Nlci5cclxuICAgICAgeGhyID0gbnVsbDtcclxuICBcclxuICAgIH1cclxuICAgIHJldHVybiB4aHI7XHJcbiAgfVxyXG5cclxuICB3aW5kb3cuaHR0cEdldCA9IGh0dHBHZXQ7XHJcbiAgd2luZG93LmRvSHR0cFJlcXVlc3QgPSBkb0h0dHBSZXF1ZXN0O1xyXG4gIG1vZHVsZS5leHBvcnRzLmh0dHBHZXQgPSBodHRwR2V0O1xyXG4gIG1vZHVsZS5leHBvcnRzLmRvSHR0cFJlcXVlc3QgPSBkb0h0dHBSZXF1ZXN0O1xyXG4iLCJcclxuY2xhc3MgRGF0YVN0b3JlXHJcbntcclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgaWYob3B0aW9ucyA9PSBudWxsKVxyXG4gICAgICAgICAgICBvcHRpb25zICA9IHsgfVxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XHJcblxyXG5cclxuICAgICAgICB0aGlzLmZpbGVzID0ge307XHJcbiAgICB9XHJcbiAgICBhZGREYXRhRmlsZShmaWxlTmFtZSlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLmZpbGVzW2ZpbGVOYW1lXSA9PSBudWxsKVxyXG4gICAgICAgICAgICB0aGlzLmZpbGVzW2ZpbGVOYW1lXSA9IHRoaXMubmV3RGF0YUZpbGUoZmlsZU5hbWUpO1xyXG5cclxuICAgICAgICB2YXIgcnYgPSB0aGlzLmZpbGVzW2ZpbGVOYW1lXTtcclxuICAgICAgICByZXR1cm4gcnY7XHJcbiAgICB9XHJcbiAgICBhZGREb2N1bWVudEZpbGUoZmlsZW5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJ2ID0gdGhpcy5hZGREYXRhRmlsZShmaWxlbmFtZSk7XHJcbiAgICAgICAgcnYuc2V0RG9jdW1lbnRNb2RlKCk7XHJcbiAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG5cclxuICAgIGdldERvY3VtZW50VHJhbnNmb3JtZXIoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBlbXB0eVRyYW5zZm9ybWVyO1xyXG4gICAgfVxyXG59XHJcblxyXG5EYXRhU3RvcmUuX3N0b3JlVHlwZXMgPSB7fVxyXG5EYXRhU3RvcmUuY3JlYXRlID0gZnVuY3Rpb24oc3RvcmVUeXBlLG9wdGlvbnMpXHJcbntcclxuICAgIHZhciBjb25zdHJ1Y3RvciA9IERhdGFTdG9yZS5fc3RvcmVUeXBlc1tzdG9yZVR5cGVdO1xyXG4gICAgaWYoY29uc3RydWN0b3IgPT0gbnVsbClcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIHZhciBydiA9IGNvbnN0cnVjdG9yKG9wdGlvbnMpO1xyXG4gICAgcmV0dXJuIHJ2O1xyXG59XHJcblxyXG5jbGFzcyBEYXRhRmlsZVxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihkYXRhU3RvcmUsZmlsZU5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5kYXRhU3RvcmUgPSBkYXRhU3RvcmU7XHJcbiAgICAgICAgdGhpcy5maWxlTmFtZSA9IGZpbGVOYW1lO1xyXG4gICAgICAgIHRoaXMudHJhbnNmb3JtZXIgPSBlbXB0eVRyYW5zZm9ybWVyO1xyXG4gICAgfVxyXG5cclxuICAgIHNldERvY3VtZW50TW9kZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy50cmFuc2Zvcm1lciA9IHRoaXMuZGF0YVN0b3JlLmdldERvY3VtZW50VHJhbnNmb3JtZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBsaXN0KG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICBcclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IHRoaXMubGlzdEludGVybmFsKG9wdGlvbnMpXHJcbiAgICAgICAgdmFyIHJ2ID0gYXdhaXQgdGhpcy50cmFuc2Zvcm1lci50cmFuc2Zvcm1SZXN1bHQoZGF0YSk7XHJcbiAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG4gICAgYXN5bmMgZmluZEJ5SWQoaWQpXHJcbiAgICB7XHJcbiAgICAgXHJcbiAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCB0aGlzLmZpbmRCeUlkSW50ZXJuYWwoaWQpXHJcbiAgICAgICAgdmFyIHJ2ID0gYXdhaXQgdGhpcy50cmFuc2Zvcm1lci50cmFuc2Zvcm1SZXN1bHQoZGF0YSk7XHJcbiAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHNhdmUoZGF0YSxpZClcclxuICAgIHtcclxuICAgICAgICB2YXIgcGF5bG9hZCA9IHRoaXMudHJhbnNmb3JtZXIudHJhbnNmb3JtSW5wdXQoZGF0YSk7XHJcbiAgICAgIFxyXG4gICAgICAgICBcclxuICAgICAgICBpZihpZCA9PSBudWxsKVxyXG4gICAgICAgICAgICBpZCA9IHRoaXMudHJhbnNmb3JtZXIuZXh0cmFjdElkKGRhdGEpO1xyXG4gICAgICAgXHJcbiAgICAgICAgdmFyIHJlc2RhdGEgPSBhd2FpdCB0aGlzLnNhdmVJbnRlcm5hbChwYXlsb2FkLGlkKTtcclxuICAgICAgICAgdmFyIHJ2ID0gdGhpcy50cmFuc2Zvcm1lci50cmFuc2Zvcm1SZXN1bHQocmVzZGF0YSk7XHJcbiAgICAgICAgIGlmKHRoaXMudHJhbnNmb3JtZXIudXBkYXRlQWZ0ZXJTYXZlKVxyXG4gICAgICAgICAgICB0aGlzLnRyYW5zZm9ybWVyLnVwZGF0ZUFmdGVyU2F2ZShkYXRhLHJ2KTtcclxuICAgICAgICByZXR1cm4gcnY7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuY29uc3QgZW1wdHlUcmFuc2Zvcm1lciA9IFxyXG57XHJcbiAgICBleHRyYWN0SWQ6IChkYXRhKT0+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9LFxyXG4gICAgdHJhbnNmb3JtUmVzdWx0OiAoZGF0YSk9PlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfSxcclxuICAgIHRyYW5zZm9ybUlucHV0OiAoZGF0YSk9PlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzLkRhdGFTdG9yZSA9IERhdGFTdG9yZTtcclxubW9kdWxlLmV4cG9ydHMuRGF0YUZpbGUgPSBEYXRhRmlsZTtcclxubW9kdWxlLmV4cG9ydHMuZmlsZXMgPSB7fTtcclxubW9kdWxlLmV4cG9ydHMuc3RvcmVzID0ge307XHJcblxyXG5yZXF1aXJlKFwiLi9kYXRhc3RvcmVSZXN0XCIpO1xyXG5cclxuY29uc3QgeyBkYXRhRmlsZXMgfSA9IHJlcXVpcmUoJy4uLy4uLy4uL2FwcC9kYXRhZmlsZXMnKTtcclxuZm9yKHZhciBza2V5IGluIGRhdGFGaWxlcylcclxue1xyXG4gICAgdmFyIHN0b3JlICA9IGRhdGFGaWxlc1tza2V5XTtcclxuICAgIHZhciBpbnN0ID0gRGF0YVN0b3JlLmNyZWF0ZShzdG9yZS50eXBlLHN0b3JlLm9wdGlvbnMpO1xyXG4gICAgbW9kdWxlLmV4cG9ydHMuc3RvcmVzW3NrZXldID0gaW5zdDtcclxuXHJcbiAgICBmb3IodmFyIGtleSBpbiBzdG9yZS5maWxlcylcclxuICAgIHtcclxuICAgICAgICAgdmFyIGZpbGUgPSBzdG9yZS5maWxlc1trZXldO1xyXG4gICAgICAgICB2YXIgZmluc3QgPSBmaWxlLnR5cGUgPT09ICdkb2N1bWVudCdcclxuICAgICAgICAgICAgPyBpbnN0LmFkZERvY3VtZW50RmlsZShrZXksZmlsZSlcclxuICAgICAgICAgICAgOiBpbnN0LmFkZERhdGFGaWxlKGtleSxmaWxlKVxyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmZpbGVzW2tleV0gPSBmaW5zdDtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbiIsImNvbnN0IHsgRGF0YVN0b3JlLERhdGFGaWxlIH0gPSByZXF1aXJlKCcuL2RhdGFzdG9yZScpXHJcbmNvbnN0IHsgZG9IdHRwUmVxdWVzdCB9ID0gcmVxdWlyZSgnLi4vaHR0cGhlbHBlcicpXHJcblxyXG5jbGFzcyBEYXRhU3RvcmVSZXN0IGV4dGVuZHMgRGF0YVN0b3JlXHJcbntcclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgaWYob3B0aW9ucyA9PSBudWxsKVxyXG4gICAgICAgICAgICBvcHRpb25zICA9IHtcclxuICAgICAgICAgICAgICAgIHVybEJhc2U6XCJhcGlcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgIHN1cGVyKG9wdGlvbnMpXHJcbiAgICB9XHJcbiAgXHJcbiAgICBnZXREb2N1bWVudFRyYW5zZm9ybWVyKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4ganNvbkRvY3VtZW50UmVzdFRyYW5zZm9ybWVyO1xyXG4gICAgfVxyXG4gICAgZ2V0VXJsQmFzZSgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5vcHRpb25zLnVybEJhc2UgPT0gbnVsbClcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnVybEJhc2UgPSBcImFwaVwiXHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy51cmxCYXNlO1xyXG4gICAgfVxyXG5cclxuICAgIG5ld0RhdGFGaWxlKGZpbGVOYW1lKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgRGF0YUZpbGVSZXN0KHRoaXMsZmlsZU5hbWUpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuY2xhc3MgRGF0YUZpbGVSZXN0IGV4dGVuZHMgRGF0YUZpbGVcclxue1xyXG4gICAgY29uc3RydWN0b3IoZGF0YVN0b3JlLGZpbGVOYW1lKVxyXG4gICAge1xyXG4gICAgICAgc3VwZXIoZGF0YVN0b3JlLGZpbGVOYW1lKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgIGdldERvY3VtZW50VHJhbmZvcm1lcigpXHJcbiAgIHtcclxuICAgICAgIHJldHVybiBqc29uRG9jdW1lbnRSZXN0VHJhbnNmb3JtZXI7XHJcbiAgIH1cclxuICAgIGdldFVybEJhc2UoaWQpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZGF0YVN0b3JlLmdldFVybEJhc2UoKStcIi9cIit0aGlzLmZpbGVOYW1lOyAgXHJcbiAgICAgICAgaWYoaWQgIT0gbnVsbClcclxuICAgICAgICAgICAgdXJsICs9IFwiL1wiK2lkO1xyXG4gICAgICAgIHJldHVybiB1cmw7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGFzeW5jIGxpc3RJbnRlcm5hbChvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldFVybEJhc2UoKTtcclxuICAgICAgICByZXR1cm4gYXdhaXQgZG9IdHRwUmVxdWVzdCh1cmwpO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgZmluZEJ5SWRJbnRlcm5hbChpZClcclxuICAgIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRVcmxCYXNlKGlkKTtcclxuICAgICAgICByZXR1cm4gYXdhaXQgZG9IdHRwUmVxdWVzdCh1cmwpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHNhdmVJbnRlcm5hbChkYXRhLGlkKVxyXG4gICAge1xyXG4gICAgICAgXHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0VXJsQmFzZShpZCk7XHJcbiAgICAgICAgdmFyIHJlc2RhdGEgPSBhd2FpdCBkb0h0dHBSZXF1ZXN0KHVybCxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbWV0aG9kOmlkID09IG51bGwgPyBcIlBPU1RcIjpcIlBVVFwiLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzp0aGlzLnRyYW5zZm9ybWVyLmNvbnRlbnRUeXBlKGRhdGEpfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgIHJldHVybiByZXNkYXRhO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuY29uc3QganNvbkRvY3VtZW50UmVzdFRyYW5zZm9ybWVyID0gXHJcbntcclxuICAgIGV4dHJhY3RJZDogKGRvYyk9PlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBkb2MuX2lkO1xyXG4gICAgfSxcclxuICAgIHRyYW5zZm9ybVJlc3VsdDogKGRhdGEpPT5cclxuICAgIHtcclxuICAgICAgICB2YXIgcnYgPSBKU09OLnBhcnNlKGRhdGEpO1xyXG4gICAgICAgIHJldHVybiBydjtcclxuICAgIH0sXHJcbiAgICB0cmFuc2Zvcm1JbnB1dDogKGRhdGEpPT5cclxuICAgIHtcclxuICAgICAgICBpZih0eXBlb2YgZGF0YSA9PSBcIm9iamVjdFwiKVxyXG4gICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShkYXRhLG51bGwsMik7XHJcbiAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICB9LFxyXG4gICAgY29udGVudFR5cGU6KGRhdGEpPT5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgIH0sXHJcbiAgICB1cGRhdGVBZnRlclNhdmUoZGF0YSxydilcclxuICAgIHtcclxuICAgICAgICBpZihkYXRhLl9pZCA9PSBudWxsKVxyXG4gICAgICAgICAgICBkYXRhLl9pZCA9IHJ2LmlkO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuRGF0YVN0b3JlLnJlc3RBcGkgPSBmdW5jdGlvbihvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IERhdGFTdG9yZVJlc3Qob3B0aW9ucyk7XHJcbn1cclxuRGF0YVN0b3JlLl9zdG9yZVR5cGVzW1wicmVzdFwiXSA9IERhdGFTdG9yZS5yZXN0QXBpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMuRGF0YVN0b3JlUmVzdCA9IERhdGFTdG9yZVJlc3Q7XHJcbm1vZHVsZS5leHBvcnRzLkRhdGFGaWxlUmVzdCA9IERhdGFGaWxlUmVzdDsiXX0=
