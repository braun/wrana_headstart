(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var hejl = require('../hejlfram/hejl');

const { HejlHamApp } = require('../hejlfram/hamapp');


const CLCARD = require('./components/clcard')

hejl.setHejlRoot(() => {

    // create main content pane
    var hejlContent = DIV().class("container").collection(data => data,
        (checklist) => CLCARD("std", checklist.title, checklist => checklist)
    )

    // create general application layout
    var hejlRoot = (new HejlHamApp()).content(hejlContent);

    // take pointer to side navigation panel (main menu)
    var sideNav = hejlRoot.sidenav;

    // setup logo overlay of layout
    var logoOverlay = DIV("logoOverlay").class("botright").stack([
        SPAN().textBinder(() => user().displayName).class("overlogo")
    ]);
    logoOverlay.bind(user());
    sideNav.logoCont.build().appendChild(logoOverlay.build());

    // setup main menu items
    var menuItems = [
        sideMenuItem("miTemplates", ["ri-folders-fill"], T("Checklist Templates")),
        sideMenuItem("mitNew", ["ri-add-fill"], T("New Checklist"), () => {
            guimodel.list = [{ items: [] }]
        }),
        sideMenuItem("mitLogout", ["ri-logout-box-line"], T("Logout"), () => {
            window.location.href = "user/logout"
        }),
        sideMenuItem("mitLogout", ["ri-user-line"], T("Profile"), () => {
            window.location.href = "user/profile"
        })

    ]
    sideNav.menuCont.stack(menuItems);

    hejl.setTitle(T(manifest.title));



    // initialize application background services
    const { DataStore, files } = require("../wrana/webcommons/model/datastore");


    var guimodel = {}

    // business logic
    const templatesBag = files.templates;

    templatesBag.list().then(data => {
        guimodel.list = data;
        hejlRoot.bind(data);
    })
    return hejlRoot;
});



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
      contextMenuItem("CLONE",["ri-file-copy-fill"],T("Clone"),async (event,button)=>{
            var newdata = JSON.parse(JSON.stringify(mydata));
            delete newdata._id;
            await files.instances.save(newdata)
            guimodel.list.push(newdata);
            hejlRoot.rebind();
             rv.bind(curdata);
         }),
      
         contextMenuItem("EDIT",["ri-pencil-fill"],T("Edit"),async (event,button)=>{
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

var bootDone = false;
function hejlBoot()
{
  bootDone = true;
  if(root == null)
    return;
// installHejlRoot();
}
var root;
function setHejlRoot(hejlNode)
{
  root = hejlNode;
    module.exports.root = root;
 // installHejlRoot();
}
function installHejlRoot()
{
  if(!bootDone)
    return;
  
  if(typeof root == 'function')
    root = root();
    module.exports.root = root;
  var domNode = root.build();
    document.body.appendChild(domNode)  
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

require('./radio')

require("./hejli18n")().then(()=>
{
  installHejlRoot();
})
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
    var root = document;//require("./hejl").root;
    function handle(e)
    {
        callback(e.detail,e);
    }
    root.addEventListener(eventId,handle);
    return {
        remove()
        {
            root.removeEventListener(eventId,callback);
        }
    }
}
function sendEvent(eventId,data)
{
    var root = document;// require("./hejl").root;
    var e = new CustomEvent(eventId,{ detail: data});
    root.dispatchEvent(e);
}

function cascadeCalls(calls,defval)
{
    if(!Array.isArray(calls))
        calls = [calls];
    var res = null;
   calls.find(call=>
    {
        if(typeof call != 'function')
            res = call;
        else
        res = TRYC(()=>call(res));
        return res == null || res == false;
    })
    return (res == null || res == false) ? defval:res;
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
},{"./validationProtocol":30}],10:[function(require,module,exports){
const i18next = require('i18next');
const i18nextHttpBackend = require('i18next-http-backend');

function init() {

    const rv = new Promise((resolve, reject) => {
        i18next
            .use(i18nextHttpBackend)
            .init({
                lng: 'cs',

                // allow keys to be phrases having `:`, `.`
                nsSeparator: false,
                keySeparator: false,
                debug: true,
                // do not load a fallback
                fallbackLng: false,
                ns: ['app'],
                defaultNS: 'app',
                backend: {
                    loadPath: '/locales/{{lng}}/{{ns}}.json'
                }
            }, () => {
                console.log("i18n Init complete");
                resolve();
            })
    })


    window.T = (key, data) => {
        return i18next.t(key, data);
    }

    window.TB = (key) => {
        return (data) => {
            return i18next.t(key, data);
        }
    }
    return rv;
}

module.exports = init;
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
        this.class('plainApp').stack([this.progres]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL1VzZXJzL3N0YW5pL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImFwcC9hcHAuanMiLCJhcHAvY29tcG9uZW50cy9jbGNhcmQuanMiLCJhcHAvZGF0YWZpbGVzLmpzIiwiaGVqbGZyYW0vY2FyZC5qcyIsImhlamxmcmFtL2NvbXBvbmVudHMvY29udGV4dE1lbnVJdGVtLmpzIiwiaGVqbGZyYW0vY29tcG9uZW50cy9lZGl0YWJsZVRleHQuanMiLCJoZWpsZnJhbS9oYW1hcHAuanMiLCJoZWpsZnJhbS9oZWpsLmpzIiwiaGVqbGZyYW0vaGVqbEVsZW1lbnQuanMiLCJoZWpsZnJhbS9oZWpsaTE4bi5qcyIsImhlamxmcmFtL2xvdmJhc2UuanMiLCJoZWpsZnJhbS9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQuanMiLCJoZWpsZnJhbS9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9jbGFzc0NhbGxDaGVjay5qcyIsImhlamxmcmFtL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2NyZWF0ZUNsYXNzLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZGVmaW5lUHJvcGVydHkuanMiLCJoZWpsZnJhbS9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9nZXRQcm90b3R5cGVPZi5qcyIsImhlamxmcmFtL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2luaGVyaXRzLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvb2JqZWN0U3ByZWFkLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvcG9zc2libGVDb25zdHJ1Y3RvclJldHVybi5qcyIsImhlamxmcmFtL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL3NldFByb3RvdHlwZU9mLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvdHlwZW9mLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL2kxOG5leHQtaHR0cC1iYWNrZW5kL2Nqcy9nZXRGZXRjaC5qcyIsImhlamxmcmFtL25vZGVfbW9kdWxlcy9pMThuZXh0LWh0dHAtYmFja2VuZC9janMvaW5kZXguanMiLCJoZWpsZnJhbS9ub2RlX21vZHVsZXMvaTE4bmV4dC1odHRwLWJhY2tlbmQvY2pzL3JlcXVlc3QuanMiLCJoZWpsZnJhbS9ub2RlX21vZHVsZXMvaTE4bmV4dC1odHRwLWJhY2tlbmQvY2pzL3V0aWxzLmpzIiwiaGVqbGZyYW0vbm9kZV9tb2R1bGVzL2kxOG5leHQvZGlzdC9janMvaTE4bmV4dC5qcyIsImhlamxmcmFtL25vZGVfbW9kdWxlcy9ub2RlLWZldGNoL2Jyb3dzZXIuanMiLCJoZWpsZnJhbS9wbGFpbmFwcC5qcyIsImhlamxmcmFtL3JhZGlvLmpzIiwiaGVqbGZyYW0vdmFsaWRhdGlvblByb3RvY29sLmpzIiwid3JhbmEvd2ViY29tbW9ucy9odHRwaGVscGVyLmpzIiwid3JhbmEvd2ViY29tbW9ucy9tb2RlbC9kYXRhc3RvcmUuanMiLCJ3cmFuYS93ZWJjb21tb25zL21vZGVsL2RhdGFzdG9yZVJlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3h4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0dUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ2YXIgaGVqbCA9IHJlcXVpcmUoJy4uL2hlamxmcmFtL2hlamwnKTtcclxuXHJcbmNvbnN0IHsgSGVqbEhhbUFwcCB9ID0gcmVxdWlyZSgnLi4vaGVqbGZyYW0vaGFtYXBwJyk7XHJcblxyXG5cclxuY29uc3QgQ0xDQVJEID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL2NsY2FyZCcpXHJcblxyXG5oZWpsLnNldEhlamxSb290KCgpID0+IHtcclxuXHJcbiAgICAvLyBjcmVhdGUgbWFpbiBjb250ZW50IHBhbmVcclxuICAgIHZhciBoZWpsQ29udGVudCA9IERJVigpLmNsYXNzKFwiY29udGFpbmVyXCIpLmNvbGxlY3Rpb24oZGF0YSA9PiBkYXRhLFxyXG4gICAgICAgIChjaGVja2xpc3QpID0+IENMQ0FSRChcInN0ZFwiLCBjaGVja2xpc3QudGl0bGUsIGNoZWNrbGlzdCA9PiBjaGVja2xpc3QpXHJcbiAgICApXHJcblxyXG4gICAgLy8gY3JlYXRlIGdlbmVyYWwgYXBwbGljYXRpb24gbGF5b3V0XHJcbiAgICB2YXIgaGVqbFJvb3QgPSAobmV3IEhlamxIYW1BcHAoKSkuY29udGVudChoZWpsQ29udGVudCk7XHJcblxyXG4gICAgLy8gdGFrZSBwb2ludGVyIHRvIHNpZGUgbmF2aWdhdGlvbiBwYW5lbCAobWFpbiBtZW51KVxyXG4gICAgdmFyIHNpZGVOYXYgPSBoZWpsUm9vdC5zaWRlbmF2O1xyXG5cclxuICAgIC8vIHNldHVwIGxvZ28gb3ZlcmxheSBvZiBsYXlvdXRcclxuICAgIHZhciBsb2dvT3ZlcmxheSA9IERJVihcImxvZ29PdmVybGF5XCIpLmNsYXNzKFwiYm90cmlnaHRcIikuc3RhY2soW1xyXG4gICAgICAgIFNQQU4oKS50ZXh0QmluZGVyKCgpID0+IHVzZXIoKS5kaXNwbGF5TmFtZSkuY2xhc3MoXCJvdmVybG9nb1wiKVxyXG4gICAgXSk7XHJcbiAgICBsb2dvT3ZlcmxheS5iaW5kKHVzZXIoKSk7XHJcbiAgICBzaWRlTmF2LmxvZ29Db250LmJ1aWxkKCkuYXBwZW5kQ2hpbGQobG9nb092ZXJsYXkuYnVpbGQoKSk7XHJcblxyXG4gICAgLy8gc2V0dXAgbWFpbiBtZW51IGl0ZW1zXHJcbiAgICB2YXIgbWVudUl0ZW1zID0gW1xyXG4gICAgICAgIHNpZGVNZW51SXRlbShcIm1pVGVtcGxhdGVzXCIsIFtcInJpLWZvbGRlcnMtZmlsbFwiXSwgVChcIkNoZWNrbGlzdCBUZW1wbGF0ZXNcIikpLFxyXG4gICAgICAgIHNpZGVNZW51SXRlbShcIm1pdE5ld1wiLCBbXCJyaS1hZGQtZmlsbFwiXSwgVChcIk5ldyBDaGVja2xpc3RcIiksICgpID0+IHtcclxuICAgICAgICAgICAgZ3VpbW9kZWwubGlzdCA9IFt7IGl0ZW1zOiBbXSB9XVxyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHNpZGVNZW51SXRlbShcIm1pdExvZ291dFwiLCBbXCJyaS1sb2dvdXQtYm94LWxpbmVcIl0sIFQoXCJMb2dvdXRcIiksICgpID0+IHtcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBcInVzZXIvbG9nb3V0XCJcclxuICAgICAgICB9KSxcclxuICAgICAgICBzaWRlTWVudUl0ZW0oXCJtaXRMb2dvdXRcIiwgW1wicmktdXNlci1saW5lXCJdLCBUKFwiUHJvZmlsZVwiKSwgKCkgPT4ge1xyXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFwidXNlci9wcm9maWxlXCJcclxuICAgICAgICB9KVxyXG5cclxuICAgIF1cclxuICAgIHNpZGVOYXYubWVudUNvbnQuc3RhY2sobWVudUl0ZW1zKTtcclxuXHJcbiAgICBoZWpsLnNldFRpdGxlKFQobWFuaWZlc3QudGl0bGUpKTtcclxuXHJcblxyXG5cclxuICAgIC8vIGluaXRpYWxpemUgYXBwbGljYXRpb24gYmFja2dyb3VuZCBzZXJ2aWNlc1xyXG4gICAgY29uc3QgeyBEYXRhU3RvcmUsIGZpbGVzIH0gPSByZXF1aXJlKFwiLi4vd3JhbmEvd2ViY29tbW9ucy9tb2RlbC9kYXRhc3RvcmVcIik7XHJcblxyXG5cclxuICAgIHZhciBndWltb2RlbCA9IHt9XHJcblxyXG4gICAgLy8gYnVzaW5lc3MgbG9naWNcclxuICAgIGNvbnN0IHRlbXBsYXRlc0JhZyA9IGZpbGVzLnRlbXBsYXRlcztcclxuXHJcbiAgICB0ZW1wbGF0ZXNCYWcubGlzdCgpLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgZ3VpbW9kZWwubGlzdCA9IGRhdGE7XHJcbiAgICAgICAgaGVqbFJvb3QuYmluZChkYXRhKTtcclxuICAgIH0pXHJcbiAgICByZXR1cm4gaGVqbFJvb3Q7XHJcbn0pO1xyXG5cclxuXHJcbiIsIlxyXG5jb25zdCB7IENBUkQgfSA9IHJlcXVpcmUoJy4uLy4uL2hlamxmcmFtL2NhcmQnKTtcclxuY29uc3QgeyBlZGl0YWJsZVRleHR9ID0gcmVxdWlyZSgnLi4vLi4vaGVqbGZyYW0vY29tcG9uZW50cy9lZGl0YWJsZVRleHQnKTtcclxuXHJcbmZ1bmN0aW9uIENMQ0FSRChjb2xvcix0aXRsZSxiaW5kZXIpXHJcbntcclxuICAgIHZhciBjdXJkYXRhO1xyXG4gICAgdmFyIG15ZGF0YTtcclxuICAgIHZhciBlZGl0TW9kZSA9IGZhbHNlO1xyXG4gICAgZnVuY3Rpb24gaW5FZGl0TW9kZSgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGVkaXRNb2RlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZGlzcGxheUNvbXBsZXRpb24oY2hlY2tsaXN0KVxyXG4gICAge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IGNoZWNrbGlzdC5pdGVtczs7XHJcbiAgICAgICAgaWYoaXRlbXMgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgdmFyIGZpbGxlZCA9IDA7XHJcbiAgICAgICAgaXRlbXMuZm9yRWFjaChpdD0+e1xyXG4gICAgICAgICAgICBpZihpdC5kb25lKVxyXG4gICAgICAgICAgICAgICAgZmlsbGVkKys7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiAgXCIgKFwiK2ZpbGxlZCtcIi9cIitjdXJkYXRhLml0ZW1zLmxlbmd0aCtcIilcIjtcclxuICAgIH1cclxuICAgIHZhciBydiA9IENBUkQodGl0bGUpO1xyXG4gICAgcnYuY2xhc3MoY29sb3IrXCJDYXJkXCIpLmJpbmRlcigoZGF0YSk9PntcclxuICAgICAgICAgY3VyZGF0YT1kYXRhO1xyXG4gICAgICAgIG15ZGF0YSA9ICBiaW5kZXIoZGF0YSk7XHJcbiAgICAgICAgcmV0dXJuIG15ZGF0YTsgXHJcbiAgICB9KVxyXG4gICAgLmhlYWRlckludGVybmFscyhbXHJcbiAgICAgICBIT1JJWk9OVEFMKCkuc3RhY2soW1xyXG4gICAgICAgICAgICBlZGl0YWJsZVRleHQoSDIoKSwodmFsLGVsLHVwZCk9PntcclxuICAgICAgICAgICAgICAgIGlmKHZhbCAhPSBudWxsICYmIHVwZCkgXHJcbiAgICAgICAgICAgICAgICAgICAgbXlkYXRhLnRpdGxlID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG15ZGF0YS50aXRsZTtcclxuICAgICAgICAgICAgfSxpbkVkaXRNb2RlKSxcclxuICAgICAgICAgICAgSDIoKS5jbGFzcyhcInBhZGxlZnRcIikudGV4dEJpbmRlcigoKT0+ZGlzcGxheUNvbXBsZXRpb24oY3VyZGF0YSkpXHJcbiAgICAgICAgXSksXHJcbiAgICAgICAgcnYuX2J1dHRvbkFyZWFdKVxyXG4gICAgLmJ1dHRvbnMoW1xyXG4gICAgICAgIFNXSVRDSEJVVFRPTihbXCJyaS10b2dnbGUtZmlsbFwiXSxbXCJyaS10b2dnbGUtbGluZVwiXSkuY2xhc3MoW1wicmktMnhcIl0pLmNoZWNrKChldmVudCxidXR0b24pPT57XHJcbiAgICAgICAgICAgIHJ2LnNob3dCb2R5ID0gIXJ2LnNob3dCb2R5O1xyXG4gICAgICAgICAgICBydi5iaW5kKGN1cmRhdGEpO1xyXG4gICAgICAgIH0pLmJpbmRDaGVja2VkKCgpPT5ydi5zaG93Qm9keSksXHJcbiAgICAgICAgQ0xCVVRUT04oW1wicmktbW9yZS0yLWZpbGxcIixcInJpLTJ4XCJdLCgpPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJ2LnRvZ2dsZUNvbnRleHRNZW51KCk7XHJcbiAgICAgICAgfSldKVxyXG4gICAgLmNvbnRleHRNZW51SXRlbXMoW1xyXG4gICAgICBjb250ZXh0TWVudUl0ZW0oXCJDTE9ORVwiLFtcInJpLWZpbGUtY29weS1maWxsXCJdLFQoXCJDbG9uZVwiKSxhc3luYyAoZXZlbnQsYnV0dG9uKT0+e1xyXG4gICAgICAgICAgICB2YXIgbmV3ZGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobXlkYXRhKSk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBuZXdkYXRhLl9pZDtcclxuICAgICAgICAgICAgYXdhaXQgZmlsZXMuaW5zdGFuY2VzLnNhdmUobmV3ZGF0YSlcclxuICAgICAgICAgICAgZ3VpbW9kZWwubGlzdC5wdXNoKG5ld2RhdGEpO1xyXG4gICAgICAgICAgICBoZWpsUm9vdC5yZWJpbmQoKTtcclxuICAgICAgICAgICAgIHJ2LmJpbmQoY3VyZGF0YSk7XHJcbiAgICAgICAgIH0pLFxyXG4gICAgICBcclxuICAgICAgICAgY29udGV4dE1lbnVJdGVtKFwiRURJVFwiLFtcInJpLXBlbmNpbC1maWxsXCJdLFQoXCJFZGl0XCIpLGFzeW5jIChldmVudCxidXR0b24pPT57XHJcbiAgICAgICAgICAgICBlZGl0TW9kZSA9ICFlZGl0TW9kZTtcclxuICAgICAgICAgICAgIHJ2LmJpbmQoY3VyZGF0YSk7XHJcbiAgICAgICAgIH0pXHJcbiAgICBdKSAgICAgICAgICAgXHJcbiAgICAuYm9keUNvbGxlY3Rpb24oXHJcbiAgICAgICAgZGF0YT0+ZGF0YS5pdGVtcyxcclxuICAgICAgICAoaXRlbSk9PntcclxuICAgICAgICAgICAgdmFyIHJ2aSA9IEhQQU5FTCgpLmNsYXNzKFtcInNwYWNlQmV0d2VlblwiLFwiY2hlY2tsaXN0aXRlbVwiXSkuc3RhY2soW1xyXG4gICAgICAgICAgICAgICAgZWRpdGFibGVUZXh0KFNUUk9ORygpLCh2YWwsZWwsdXBkKT0+e1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHZhbCAhPSBudWxsICYmIHVwZCkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udGl0bGUgPSB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0udGl0bGU7XHJcbiAgICAgICAgICAgICAgICB9LGluRWRpdE1vZGUpLFxyXG4gICAgICAgICAgICAgICAgU1dJVENIQlVUVE9OKFxyXG4gICAgICAgICAgICAgICAgICAgIFtcInJpLWNoZWNrLWZpbGxcIixcImdyZWVuXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIFtcInJpLWNoZWNrLWZpbGxcIixcImdyYXlcIl0pLmNsYXNzKFtcInJpLTJ4XCJdKS5jaGVjaygoY2hlY2tlZCk9PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gY2hlY2tlZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcnYucmViaW5kKCk7ICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfSkuYmluZENoZWNrZWQoKCk9Pml0ZW0uZG9uZSlcclxuICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgcmV0dXJuIHJ2aTtcclxuICAgICAgICB9KS5zdGFja1VwKCk7XHJcbiAgICAgICBcclxuICAgIHJ2Ll9ib2R5LnZpc2libGUoKCk9PnJ2LnNob3dCb2R5KVxyXG4gICAgcmV0dXJuIHJ2O1xyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gQ0xDQVJEOyIsIlxyXG52YXIgZGF0YUZpbGVzID0ge1xyXG4gICAgcmVzdDpcclxuICAgIHtcclxuICAgICAgICB0eXBlOiAncmVzdCcsXHJcbiAgICAgICAgb3B0aW9uczoge30sXHJcbiAgICAgICAgZmlsZXM6IHtcclxuICAgICAgICAgICAgdGVtcGxhdGVzOiB7IHR5cGU6ICdkb2N1bWVudCcsIHVzZXJzcGVjOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIGluc3RhbmNlczogeyB0eXBlOiAnZG9jdW1lbnQnLCB1c2Vyc3BlYzogdHJ1ZSB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5kYXRhRmlsZXMgPSBkYXRhRmlsZXM7XHJcbiAgICBcclxuIiwiY29uc3QgeyBjb250ZXh0TWVudUl0ZW0gfSA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9jb250ZXh0TWVudUl0ZW0nKVxyXG5jb25zdCB7IEhlamxFbGVtZW50IH0gPSByZXF1aXJlKCcuL2hlamxFbGVtZW50Jyk7XHJcblxyXG5jbGFzcyBoZWpsQ2FyZCBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKHRpdGxlLGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJESVZcIixvcHRpb25zKTtcclxuICAgICAgICB0aGlzLl9idXR0b25BcmVhID0gICAgIEhPUklaT05UQUwoJ2J1dHRvbkFyZWEnKS5jbGFzcygnYnV0dG9uQXJlYScpO1xyXG4gICAgICAgIHRoaXMuX2hlYWRlckludGVybmFscyA9IFsgIEgyKHRpdGxlKSwgdGhpcy5fYnV0dG9uQXJlYSBdO1xyXG4gICAgICAgIHRoaXMuX2hlYWRlciA9ICBIRUFERVIoKS5jbGFzcyhbXCJyZWxhdGl2ZVwiLFwiaG9yaXpvbnRhbFwiLFwic3BhY2VCZXR3ZWVuXCJdKTtcclxuICAgICAgICB0aGlzLl9ib2R5SW50ZXJuYWxzID0gW107XHJcbiAgICAgICAgdGhpcy5fYm9keSA9IERJVihcImNhcmRib2R5XCIpLmNsYXNzKFtcImNhcmRib2R5XCIsXCJ0YWJMZWZ0XCJdKTtcclxuICAgICAgICB0aGlzLl9jb250ZXh0TWVudSA9IERJVigpLmNsYXNzKFsnY29udGV4dE1lbnUnXSlcclxuICAgICAgICAgLnZpc2libGUoKCk9PnRoaXMuc2hvd0NvbnRleHRNZW51KTtcclxuICAgICAgICB0aGlzLnNob3dCb2R5ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnNob3dDb250ZXh0TWVudSA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgdGl0bGUoaGVqbHRpdGxlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2hlYWRlckludGVybmFscyA9IFsgIGhlamx0aXRsZSwgdGhpcy5fYnV0dG9uQXJlYSBdO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgaGVhZGVyKGgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5faGVhZGVyID0gaDtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGhlYWRlckludGVybmFscyhoaSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9oZWFkZXJJbnRlcm5hbHMgPSBoaTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgXHJcbiAgICBidXR0b25zKGIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYnV0dG9uQXJlYS5zdGFjayhiKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGJvZHkoYilcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9ib2R5ID0gYjtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGJvZHlTdGFjayhiKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2JvZHlJbnRlcm5hbHMgPSBiO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgYm9keUNvbGxlY3Rpb24oaXRlbUNhbGxiYWNrLGl0ZW1WaWV3Q2FsbGJhY2spXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fYm9keS5jb2xsZWN0aW9uKGl0ZW1DYWxsYmFjayxpdGVtVmlld0NhbGxiYWNrKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGNvbnRleHRNZW51SXRlbXMoaXRzKVxyXG4gICAge1xyXG4gICAgICAgIGl0cy5mb3JFYWNoKGl0ID0+IHtcclxuICAgICAgICAgICAgaXQuY2FyZCA9IHRoaXM7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dE1lbnUuc3RhY2soaXRzKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIHRvZ2dsZUNvbnRleHRNZW51KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNob3dDb250ZXh0TWVudSA9ICF0aGlzLnNob3dDb250ZXh0TWVudTtcclxuICAgICAgICB0aGlzLl9jb250ZXh0TWVudS5oYW5kbGVWaXNpYmlsaXR5KCk7XHJcbiAgICB9XHJcbiAgICBzdGFja1VwKClcclxuICAgIHtcclxuXHJcbiAgICAgICAgdGhpcy5faGVhZGVyLnN0YWNrKHRoaXMuX2hlYWRlckludGVybmFscyk7XHJcbiAgICAgICAgdGhpcy5fYm9keS5zdGFjayh0aGlzLl9ib2R5SW50ZXJuYWxzKTtcclxuICAgICAgICB0aGlzLnN0YWNrKFtcclxuICAgICAgICAgICAgdGhpcy5faGVhZGVyLFxyXG4gICAgICAgICAgICBESVYoKS5jbGFzcygncmVsYXRpdmUnKS5zdGFjayhbdGhpcy5fY29udGV4dE1lbnVdKSxcclxuICAgICAgICAgICAgdGhpcy5fYm9keV0pO1xyXG4gICBcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIFxyXG59XHJcbiBmdW5jdGlvbiBDQVJEKHRpdGxlLGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbENhcmQodGl0bGUsaWQsb3B0aW9ucyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzLkNBUkQgPSBDQVJEO1xyXG5tb2R1bGUuZXhwb3J0cy5oZWpsQ2FyZCA9IGhlamxDYXJkOyIsImZ1bmN0aW9uIGNvbnRleHRNZW51SXRlbShpZCxpY29uQ2xhc3NlcyxsYWJlbCxjYWxsYmFjaylcclxue1xyXG5cclxuICAgIHZhciBydiA9IERJVihpZCkuY2xhc3MoXCJjb250ZXh0TWVudUl0ZW1cIikuc3RhY2soW1xyXG4gICAgICAgIFNQQU4obnVsbCxpZCtcIl9pY29uXCIpLmNsYXNzKGljb25DbGFzc2VzKSxcclxuICAgICAgICBTUEFOKGxhYmVsLGlkK1wiX3RleHRcIikuY2xhc3MoJ2xhYmVsJyldKVxyXG4gICAgLmNsaWNrKChldmVudCxoZWpsKT0+XHJcbiAgICB7XHJcbiAgICAgICAgaWYoaGVqbC5jYXJkICYmIGhlamwuY2FyZC50b2dnbGVDb250ZXh0TWVudSlcclxuICAgICAgICAgICAgaGVqbC5jYXJkLnRvZ2dsZUNvbnRleHRNZW51KCk7XHJcbiAgICAgICAgY2FsbGJhY2soZXZlbnQsaGVqbCk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBydjtcclxufVxyXG5pZighd2luZG93Lm5vSGVqbEdsb2JhbHMpXHJcbntcclxuICAgIHdpbmRvdy5jb250ZXh0TWVudUl0ZW0gPSBjb250ZXh0TWVudUl0ZW07XHJcbn1cclxubW9kdWxlLmV4cG9ydHMuY29udGV4dE1lbnVJdGVtID0gY29udGV4dE1lbnVJdGVtOyIsImZ1bmN0aW9uIGVkaXRhYmxlVGV4dCh0ZXh0RWxlbWVudCxiaW5kZXIsZWRpdEJpbmRlcixpZCxvcHRpb25zKVxyXG57XHJcbiAgICB2YXIgcnYgPSBESVYoKS5zdGFjayhcclxuICAgICAgICAgICAgWyB0ZXh0RWxlbWVudC50ZXh0QmluZGVyKGJpbmRlcikudmlzaWJsZSgoKT0+IWVkaXRCaW5kZXIoKSksXHJcbiAgICAgICAgICAgICAgICBJTlBVVCgpLnRleHRCaW5kZXIoYmluZGVyKS52aXNpYmxlKGVkaXRCaW5kZXIpXHJcbiAgICBdKTtcclxuICAgIHJldHVybiBydjtcclxufVxyXG5cclxuaWYoIXdpbmRvdy5ub0hlamxHbG9iYWxzKVxyXG57XHJcbiAgICB3aW5kb3cuZWRpdGFibGVUZXh0ID0gZWRpdGFibGVUZXh0O1xyXG59XHJcbm1vZHVsZS5leHBvcnRzLmVkaXRhYmxlVGV4dCA9IGVkaXRhYmxlVGV4dDsiLCJ2YXIgaGVqbCA9IHJlcXVpcmUoJy4vaGVqbCcpO1xyXG52YXIge0hlamxFbGVtZW50IH0gPSByZXF1aXJlKCcuL2hlamxFbGVtZW50Jyk7XHJcblxyXG52YXIgeyBIZWpsQXBwIH0gPSByZXF1aXJlKCcuL3BsYWluYXBwJyk7IFxyXG5cclxuY2xhc3MgSGVqbEhhbUFwcCBleHRlbmRzIEhlamxBcHBcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxvcHRpb25zKTtcclxuICAgICAgICB0aGlzLmNsYXNzKFtcImhhbUxheW91dFwiXSk7XHJcblxyXG4gICAgICAgIHRoaXMuc2lkZW5hdiA9IFNJREVOQVYoKTtcclxuICAgICAgICB0aGlzLmhhbUJ1dHRvbiA9IG5ldyBoZWpsSGFtQnV0dG9uKCk7XHJcbiAgICAgICAgdGhpcy5zaWRlTmF2VmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaGFtQnV0dG9uLmNsaWNrKCgpPT57XHJcbiAgICAgICAgICAgIHRoaXMuc2lkZU5hdlZpc2libGUgPSAhdGhpcy5zaWRlTmF2VmlzaWJsZVxyXG4gICAgICAgICAgICB0aGlzLnNpZGVuYXYuaGFuZGxlVmlzaWJpbGl0eSgpO1xyXG4gICAgICAgICAgICB0aGlzLmhhbUJ1dHRvbi5yZWJpbmQoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmhhbUJ1dHRvbi5iaW5kZXIoKGRhdGEsYnQpPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuc2lkZU5hdlZpc2libGUpXHJcbiAgICAgICAgICAgICAgICBidC5idWlsZCgpLmNsYXNzTGlzdC5hZGQoXCJvcGVuZWRcIik7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGJ0LmJ1aWxkKCkuY2xhc3NMaXN0LnJlbW92ZShcIm9wZW5lZFwiKTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLnNpZGVuYXYudmlzaWJsZSgoKT0+dGhpcy5zaWRlTmF2VmlzaWJsZSk7XHJcbiAgICB9XHJcblxyXG4gIFxyXG4gICAgY29udGVudChjb250ZW50KVxyXG4gICAge1xyXG4gICAgICAgIGNvbnRlbnQuY2xhc3MoXCJoYW1Db250ZW50XCIpO1xyXG4gICAgICAgIHJldHVybiBzdXBlci5jb250ZW50KGNvbnRlbnQpXHJcbiAgICB9XHJcbiAgICBzdGFja1VwKClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnN0YWNrKFt0aGlzLnByb2dyZXMsdGhpcy5kaWFsb2dQYW5lLHRoaXMuaGFtQnV0dG9uLHRoaXMuc2lkZW5hdix0aGlzLmNvbnRlbnRFbF0pXHJcbiAgICB9XHJcbiAgICBtZW51aXRlbXMoaXRzKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc2lkZW5hdi5tZW51Q29udC5zdGFjayhpdHMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcbmNsYXNzIGhlamxIYW1CdXR0b24gZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHR5cGVvZiBpZCA9PSBcIm9iamVjdFwiKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb3B0aW9ucyA9IGlkXHJcbiAgICAgICAgICAgIGlkID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoaWQgPT0gbnVsbClcclxuICAgICAgICAgICAgaWQ9XCJIYW1CdXR0b25cIlxyXG5cclxuICAgICAgICBzdXBlcihpZCxcIkRJVlwiLG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMuY2xhc3MoW1wiaGFtQnV0dG9uXCIsXCJyaS1tZW51LWZpbGxcIixcInJpLTJ4XCJdKTtcclxuXHJcbiAgICAgICAvLyB0aGlzLnNpZGVuYXYgPSBTSURFTkFWKCk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5jbGFzcyBoZWpsU2lkZU5hdiBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJESVZcIixvcHRpb25zKTtcclxuICAgICAgICB0aGlzLmNsYXNzKFwic2lkZW5hdlwiKTtcclxuICAgICAgIC8vIHRoaXMuY2xhc3MoW1wiaG9yaXpvbnRhbFwiLFwicmVsYXRpdmVcIl0pO1xyXG4gICAgICAgdGhpcy5sb2dvQ29udCA9IERJVihcImxvZ29Db250XCIpLmNsYXNzKFwicmVsYXRpdmVcIik7XHJcbiAgICAgICB0aGlzLmxvZ28gPSBJTUcoXCJsb2dvXCIpLnNyYyhcImltYWdlcy9sb2dvLnN2Z1wiKTtcclxuICAgICAgIHRoaXMubG9nb0NvbnQuc3RhY2soW3RoaXMubG9nb10pXHJcbiAgICAgICB0aGlzLm1lbnVDb250ID0gRElWKFwibWVudUNvbnRcIikuY2xhc3MoXCJ2ZXJ0aWNhbFwiKTtcclxuICAgICAgICB0aGlzLnN0YWNrVXAoKTtcclxuICAgICAgIC8vIHRoaXMuc2lkZW5hdiA9IFNJREVOQVYoKTtcclxuICAgIH1cclxuICAgIHN0YWNrVXAoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc3RhY2soW3RoaXMubG9nb0NvbnQsdGhpcy5tZW51Q29udF0pO1xyXG4gICAgfVxyXG59XHJcbndpbmRvdy5TSURFTkFWID0gZnVuY3Rpb24oaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBoZWpsU2lkZU5hdihpZCxvcHRpb25zKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2lkZU1lbnVJdGVtKGlkLGljb25DbGFzc2VzLGxhYmVsLGNhbGxiYWNrKVxyXG57XHJcblxyXG4gICAgdmFyIHJ2ID0gRElWKGlkKS5jbGFzcyhcIm5hdkJhck1lbnVJdGVtXCIpLnN0YWNrKFtcclxuICAgICAgICBTUEFOKG51bGwsaWQrXCJfaWNvblwiKS5jbGFzcyhpY29uQ2xhc3NlcyksXHJcbiAgICAgICAgU1BBTihsYWJlbCxpZCtcIl90ZXh0XCIpXSkuY2xpY2soY2FsbGJhY2spO1xyXG4gICAgcmV0dXJuIHJ2O1xyXG59XHJcblxyXG5pZighd2luZG93Lm5vSGVqbEdsb2JhbHMpXHJcbntcclxuICAgIHdpbmRvdy5IQU1MQVlPVVQgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgaGVqbEhhbUxheW91dChpZCxvcHRpb25zKTtcclxuICAgIH1cclxuICAgIHdpbmRvdy5zaWRlTWVudUl0ZW0gPSBzaWRlTWVudUl0ZW07XHJcbn1cclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMuSGVqbEhhbUFwcCA9IEhlamxIYW1BcHA7XHJcbiIsIlxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsZnVuY3Rpb24oKVxyXG57XHJcbiAgaGVqbEJvb3QoKTtcclxufSk7XHJcblxyXG52YXIgYm9vdERvbmUgPSBmYWxzZTtcclxuZnVuY3Rpb24gaGVqbEJvb3QoKVxyXG57XHJcbiAgYm9vdERvbmUgPSB0cnVlO1xyXG4gIGlmKHJvb3QgPT0gbnVsbClcclxuICAgIHJldHVybjtcclxuLy8gaW5zdGFsbEhlamxSb290KCk7XHJcbn1cclxudmFyIHJvb3Q7XHJcbmZ1bmN0aW9uIHNldEhlamxSb290KGhlamxOb2RlKVxyXG57XHJcbiAgcm9vdCA9IGhlamxOb2RlO1xyXG4gICAgbW9kdWxlLmV4cG9ydHMucm9vdCA9IHJvb3Q7XHJcbiAvLyBpbnN0YWxsSGVqbFJvb3QoKTtcclxufVxyXG5mdW5jdGlvbiBpbnN0YWxsSGVqbFJvb3QoKVxyXG57XHJcbiAgaWYoIWJvb3REb25lKVxyXG4gICAgcmV0dXJuO1xyXG4gIFxyXG4gIGlmKHR5cGVvZiByb290ID09ICdmdW5jdGlvbicpXHJcbiAgICByb290ID0gcm9vdCgpO1xyXG4gICAgbW9kdWxlLmV4cG9ydHMucm9vdCA9IHJvb3Q7XHJcbiAgdmFyIGRvbU5vZGUgPSByb290LmJ1aWxkKCk7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRvbU5vZGUpICBcclxufVxyXG5mdW5jdGlvbiBzZXRUaXRsZSh0aXRsZSlcclxue1xyXG4gIGRvY3VtZW50LnRpdGxlID0gdGl0bGU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlc3RydWN0dXJlKG1vZHZhcixtb2QpXHJcbntcclxuICB2YXIgcnYgPSBcIlwiO1xyXG4gXHJcbiAgICBmb3IobGV0IGsgaW4gbW9kKVxyXG4gICAgICBydiArPSAocnYubGVuZ3RoID4gMCA/IFwiLFwiOiBcIlwiKSArIGs7XHJcbiAgICBydiA9IFwiY29uc3QgeyBcIityditcIn0gPSBcIittb2R2YXIrXCI7XFxuXCI7XHJcbiAgICBjb25zb2xlLmxvZyhcImRlc3RydWN0dXJpbmc6IFwiKyBtb2R2YXIscnYpXHJcbiAgcmV0dXJuIHJ2O1xyXG59XHJcbndpbmRvdy5kZXN0cnVjdHVyZSA9IGRlc3RydWN0dXJlO1xyXG5tb2R1bGUuZXhwb3J0cy5zZXRIZWpsUm9vdCA9IHNldEhlamxSb290O1xyXG5tb2R1bGUuZXhwb3J0cy5zZXRUaXRsZSA9IHNldFRpdGxlO1xyXG5cclxucmVxdWlyZSgnLi9oZWpsRWxlbWVudCcpO1xyXG5cclxucmVxdWlyZSgnLi9yYWRpbycpXHJcblxyXG5yZXF1aXJlKFwiLi9oZWpsaTE4blwiKSgpLnRoZW4oKCk9PlxyXG57XHJcbiAgaW5zdGFsbEhlamxSb290KCk7XHJcbn0pIiwiXHJcbmNvbnN0IHsgSGVqbFZhbGlkYXRpb25Qcm90b2NvbCwgSGVqbFZhbGlkYXRpb25NZXNzYWdlLEhlamxWYWxpZGF0aW9uV2FybmluZyxIZWpsVmFsaWRhdGlvbk5vdGV9ID0gIHJlcXVpcmUoJy4vdmFsaWRhdGlvblByb3RvY29sJylcclxuXHJcblxyXG5cclxuICAvKipcclxuICAgICogY2FsbGJhY2sgZm9yIHRoIGFiZHVjdG9yIGZ1bmN0aW9uYWxpdHlcclxuICAgICogQGNhbGxiYWNrIEhlamxFbGVtZW50fmtpZG5hcHBlckNhbGxiYWNrIFxyXG4gICAgKiBAcGFyYW0ge0hlamxFbGVtZW50fSBjaGlsZCB0byBiZSBcclxuICAgICogQHBhcmFtIHtIZWpsRWxlbWVudH0gbmVzdG9yIGtlZXBlciBvZiB0aGUgbmVzdCBvZiBjaGlsZFxyXG4gICAgKiBAcmV0dXJucyB7SGVqbEVsZW1lbnR8dW5kZWZpbmVkfSBwb3RlbmNpb25hbCBjdWNrb28gZWdnXHJcbiAgICAqL1xyXG5cclxuY2xhc3MgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsZG9tRWxlbWVudE5hbWUsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcclxuICAgICAgICBpZih0eXBlb2YgaWQgPT0gXCJvYmplY3RcIilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IGlkO1xyXG4gICAgICAgICAgICBpZCA9IG9wdGlvbnMuaWQ7XHJcbiAgICAgICAgfSAgICAgICAgICAgXHJcblxyXG4gICAgICAgIGlmKHR5cGVvZiBkb21FbGVtZW50TmFtZSA9PSBcIm9iamVjdFwiKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gZG9tRWxlbWVudE5hbWU7XHJcbiAgICAgICAgICAgIGRvbUVsZW1lbnROYW1lID0gb3B0aW9ucy5kb21FbGVtZW50TmFtZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhpcy5vcHRpb25zID09IG51bGwpXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IHsgaWQ6IGlkfTtcclxuXHJcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9W107XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLmRvbUVsZW1lbnROYW1lID0gZG9tRWxlbWVudE5hbWU7XHJcbiAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMudmFsaWRhdG9ycyA9IFtdO1xyXG4gICAgICAgIHRoaXMubXlWYWxpZGF0aW9uUmVzdWx0ID0gbnVsbDtcclxuICAgICAgICB0aGlzLnZsaWRhdGlvblJlc3VsdCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5raWRuYXBwZXJzID0gW107XHJcbiAgICAgICAgdGhpcy5teUlkID0gdGhpcy5nZW5lcmF0ZUlkKGlkKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kZXJzID0gW107XHJcbiAgICB9XHJcbiAgICBwcm9jZXNzb3IocHJvY2VzRnVuYylcclxuICAgIHtcclxuICAgICAgICB0aGlzLnByb2Nlc0Z1bmMgPSBwcm9jZXNGdW5jO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgYmluZGVyKGJpbmRGdW5jKVxyXG4gICAge1xyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYmluZEZ1bmMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5iaW5kRnVuYyA9IGJpbmRGdW5jWzBdXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlcihiaW5kRnVuY1sxXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdGhpcy5iaW5kRnVuYyA9IGJpbmRGdW5jO1xyXG4gICAgICAgIHRoaXMudHJ5SWRIaW50KCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICB0cnlJZEhpbnQoKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuYmluZEZ1bmMuaGludElkKVxyXG4gICAgICAgIHRoaXMuaWQodGhpcy5iaW5kRnVuYy5oaW50SWQoKSk7XHJcbiAgICB9XHJcbiAgICB1cGRhdGVyKHVwZGF0ZUZ1bmMpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVGdW5jID0gdXBkYXRlRnVuYztcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIHVwZGF0ZSh2YWwpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy51cGRhdGVGdW5jKVxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUZ1bmModmFsLHRoaXMubW9kZWwsdGhpcyk7XHJcbiAgICAgICAgZWxzZSBpZih0aGlzLnBhcmVudClcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQudXBkYXRlKHZhbCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJIRUpMOiBubyB1cGRhdGVyIGZvdW5kIGZvciB2YWx1ZVwiLHZhbCk7XHJcbiAgICB9XHJcbiAgICB0ZXh0QmluZGVyKGJpbmRGdW5jKVxyXG4gICAge1xyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYmluZEZ1bmMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGdldHRlciA9IGJpbmRGdW5jWzBdO1xyXG4gICAgICAgICAgICB2YXIgc2V0dGVyID0gYmluZEZ1bmNbMV07XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRleHRCaW5kRnVuYyA9IGZ1bmN0aW9uKHZhbCxlbCxzZXR0aW5nKVxyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmKHNldHRpbmcpXHJcbiAgICAgICAgICAgICAgICAgICBzZXR0ZXIodmFsKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldHRlcihlbCk7XHJcblxyXG4gICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIHRoaXMudGV4dEJpbmRGdW5jID0gYmluZEZ1bmM7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICByZWJpbmQoKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMuX3JlYmluZFNjaGVkdWxlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlYmluZFNjaGVkdWxlZC5jbGVhcigpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fcmViaW5kU2NoZWR1bGVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJpbmQodGhpcy5tb2RlbClcclxuICAgIH1cclxuICAgIHNjaGVkdWxlUmViaW5kKHRtbylcclxuICAgIHtcclxuICAgICAgICBpZih0bW8gPT0gbnVsbClcclxuICAgICAgICAgICAgdG1vID0gMTAwO1xyXG4gICAgICAgICBpZih0aGlzLl9yZWJpbmRTY2hlZHVsZWQpXHJcbiAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgdGhpcy5fcmViaW5kU2NoZWR1bGVkID0gIFRJTUVPVVQodGhpcy5yZWJpbmQuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgICB0cnlQcm9jZXNzb3IoKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMucHJvY2VzRnVuYyAmJiAhdGhpcy5wcm9jZXNzRG9uZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0RvbmUgPSBUUllDKCgpPT50aGlzLnByb2Nlc0Z1bmModGhpcykpXHJcbiAgICAgICAgICAgIGlmKHRoaXMucHJvY2VzRG9uZSA9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NEb25lID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBkZWZhdWx0KGRlZmF1bHRNb2RlbClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRlZmF1bHRNb2RlbCA9ZGVmYXVsdE1vZGVsO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBiaW5kKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IGRhdGE7XHJcbiAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICB0aGlzLl90cnlOZXN0aW5nKCk7XHJcbiAgICAgICB0aGlzLnRyeVByb2Nlc3NvcigpO1xyXG4gICAgICAgIGlmKHRoaXMuYmluZEZ1bmMgIT0gbnVsbClcclxuICAgICAgICAgICAgZGF0YSA9IFRSWUMoKCk9PnRoaXMuYmluZEZ1bmMoZGF0YSx0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5leHRyYWN0ZWRNb2RlbCA9IGRhdGE7XHJcblxyXG4gICAgICAgIGlmKCF0aGlzLmhhbmRsZVZpc2liaWxpdHkoKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuY2hlY2tFcnJvckhpZ2xpZ2h0KCk7XHJcbiAgICAgICAgaWYodGhpcy5leHRyYWN0ZWRNb2RlbCA9PSBudWxsICYmIHRoaXMuZGVmYXVsdE1vZGVsICE9IG51bGwpXHJcbiAgICAgICAgICAgIHRoaXMuZXh0cmFjdGVkTW9kZWwgPSB0aGlzLmRlZmF1bHRNb2RlbDtcclxuICAgICAgICBpZih0aGlzLmV4dHJhY3RlZE1vZGVsID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIC8vIGJpbmQgY2hpbGRyZW4gd2l0aCBzdWJtb2RlbFxyXG4gICAgICAgIFRSWUMoKCk9PnRoaXMuaGFuZGxlVGV4dEJpbmQoKSk7XHJcbiAgICAgICBcclxuICAgICAgIGxldCBpc2NvbCA9IHRoaXMuaGFuZGxlQ29sbGVjdGlvbkJpbmQoKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goY2hpbGQ9PntcclxuICAgICAgICAgICAgY2hpbGQuYmluZChpc2NvbCA/IGNoaWxkLm1vZGVsOmRhdGEpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgaGFuZGxlVGV4dEJpbmQoKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKHRoaXMudGV4dEJpbmRGdW5jICE9IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdHh0ID0gXCJcIjtcclxuICAgICAgICAgICAgdmFyIHR4dCA9IFRSWUMoKCk9PnRoaXMudGV4dEJpbmRGdW5jKHRoaXMuZXh0cmFjdGVkTW9kZWwsdGhpcykpO1xyXG4gICAgICAgICAgICBpZih0eHQgPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHR4dCA9IFwiXCI7XHJcbiAgICAgICAgICAgIHRoaXMudGV4dCh0eHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgIH1cclxuICAgIGhhbmRsZVZpc2liaWxpdHkoKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKHRoaXMudmlzaWJsZUNhbGxiYWNrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodGhpcy5vcmlnaW5hbERpc3BsYXkgPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpbmFsRGlzcGxheSA9IHRoaXMuYnVpbGQoKS5zdHlsZS5kaXNwbGF5O1xyXG4gICAgICAgICAgICAgICAgaWYoIXRoaXMub3JpZ2luYWxEaXNwbGF5KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luYWxEaXNwbGF5ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHZpc2libGUgPSB0aGlzLmV4dHJhY3RlZE1vZGVsICYmIFRSWUMoKCk9PnRoaXMudmlzaWJsZUNhbGxiYWNrKHRoaXMuZXh0cmFjdGVkTW9kZWwsdGhpcykpO1xyXG4gICAgICAgICAgICBpZighdmlzaWJsZSlcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVpbGQoKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgICAgICBlbHNlIGlmKHRoaXMub3JpZ2luYWxEaXNwbGF5ID09IGZhbHNlKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idWlsZCgpLnN0eWxlLmRpc3BsYXkgPSBudWxsO1xyXG4gICAgICAgICAgICBlbHNlICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5idWlsZCgpLnN0eWxlLmRpc3BsYXkgPSB0aGlzLm9yaWdpbmFsRGlzcGxheTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gdmlzaWJsZSA9PT0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBoYW5kbGVDb2xsZWN0aW9uQmluZCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5pdGVtQ2FsbGJhY2sgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBjb2wgPSBUUllDKCgpPT50aGlzLml0ZW1DYWxsYmFjayh0aGlzLmV4dHJhY3RlZE1vZGVsLHRoaXMpLFtdKTtcclxuICAgICAgICB2YXIgaXRzID0gW107XHJcbiAgICAgICAgaWYoY29sID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJIRUpMOiBDb2xsZWN0aW9uIGJpbmRlciByZXR1cm4gbnVsbCwgaXQgaXMgaW50ZW5kZWQgP1wiLHRoaXMuaXRlbUNhbGxiYWNrKTtcclxuICAgICAgICAgICAgY29sID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGNvbC5mb3JFYWNoID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiSEVKTDogQ29sbGVjdGlvbiBiaW5kZXIgZGlkIG5vdCByZXR1cm4gY29sbGVjdGlvbiB3aXRoIGZvckVhY2ggbWV0aG9kXCIsdGhpcy5pdGVtQ2FsbGJhY2spO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbC5mb3JFYWNoKGl0ZW09PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmlldyA9IFRSWUMoKCk9PnRoaXMuaXRlbVZpZXdDYWxsYmFjayhpdGVtLHRoaXMuZXh0cmFjdGVkTW9kZWwsdGhpcy5tb2RlbCkpO1xyXG4gICAgICAgICAgICAgICAgaXRzLnB1c2godmlldyk7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLm5lc3QpXHJcbiAgICAgICAgICAgICAgICAgICAgdmlldy5fdHJ5QWRkVG9OZXN0KHRoaXMubmVzdCk7XHJcbiAgICAgICAgICAgICAgICB2aWV3Lm1vZGVsID0gaXRlbTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5idWlsZCgpLnRleHRDb250ZW50PVwiXCI7XHJcbiAgICAgICAgdGhpcy5zdGFjayhpdHMpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICBcclxuICAgIH1cclxuICAgYnVpbGQoKVxyXG4gICB7XHJcbiAgICAgICBpZih0aGlzLmRvbUVsZW1lbnQgPT0gbnVsbClcclxuICAgICAgIHtcclxuICAgICAgICB2YXIgb2lkID0gdGhpcy5vcHRpb25zLmlkO1xyXG4gICAgICAgIHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGhpcy5vcHRpb25zLmRvbUVsZW1lbnROYW1lKTtcclxuICAgICAgXHJcbiAgICAgICB0aGlzLl9zZXR1cElkKCk7XHJcbiAgICAgICAgdGhpcy5kb21FbGVtZW50Ll9qc0VsZW1lbnQgPSB0aGlzO1xyXG4gICAgICAgIGlmKHRoaXMub3B0aW9ucyAhPSBudWxsICYmIHRoaXMub3B0aW9ucy5hdHRycyAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yKGxldCBhdHRyIGluIHRoaXMub3B0aW9ucy5hdHRycylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbCAgPSB0aGlzLm9wdGlvbnMuYXR0cnNbYXR0cl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRvbUVsZW1lbnRbYXR0cl0gPSB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50cnlQcm9jZXNzb3IoKTtcclxuICAgICAgIH1cclxuICAgICAgIHJldHVybiB0aGlzLmRvbUVsZW1lbnQ7XHJcbiAgIH1cclxuICAgaWQoaWQpXHJcbiAgIHtcclxuICAgICB0aGlzLm15SWQgPSB0aGlzLmdlbmVyYXRlSWQoaWQpO1xyXG4gICAgIHRoaXMub3B0aW9ucy5pZCA9IGlkO1xyXG4gICAgIHRoaXMuYnVpbGQoKTtcclxuICAgICB0aGlzLl9zZXR1cElkKCk7XHJcbiAgICAgcmV0dXJuIHRoaXM7XHJcbiAgIH1cclxuICAgIF9zZXR1cElkKClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgb2lkID0gdGhpcy5vcHRpb25zLmlkO1xyXG4gICAgICAgIGlmKHRoaXMubXlJZClcclxuICAgICAgICAgICAgdGhpcy5kb21FbGVtZW50LmlkID0gdGhpcy5teUlkO1xyXG4gICAgICAgIGlmKG9pZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZG9tRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKG9pZCk7XHJcbiAgICAgICAgICAgIHRoaXMuZG9tRWxlbWVudC5jbGFzc0xpc3QuYWRkKG9pZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICBhdHRhY2goZG9tRWxlbWVudFJvb3QpXHJcbiAgIHtcclxuICAgICAgIGlmKGRvbUVsZW1lbnRSb290ID09IG51bGwpXHJcbiAgICAgICAgZG9tRWxlbWVudFJvb3QgPSBkb2N1bWVudC5ib2R5O1xyXG4gICAgICB2YXIgbXllbCA9IGRvbUVsZW1lbnRSb290LmdldEVsZW1lbnRCeUlkKHRoaXMubXlJZCk7XHJcbiAgICAgIGlmKG15ZWwgIT0gbnVsbClcclxuICAgICAge1xyXG4gICAgICAgIHRoaXMuZG9tRWxlbWVudCA9IG15ZWw7XHJcbiAgICAgICAgdGhpcy5kb21FbGVtZW50Ll9qc0VsZW1lbnQgPSB0aGlzO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcbiAgICBcclxuICAgZ2VuZXJhdGVJZChpZClcclxuICAge1xyXG4gICAgICAgaWYoaWQgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkID0gaWQrXCJfXCIrSGVqbEVsZW1lbnQuaWRTZXF1ZW5jZSsrO1xyXG4gICAgICAgIH1cclxuICAgICAgIHJldHVybiBpZDtcclxuICAgfVxyXG5cclxuICAgY2xhc3Moc3BlYylcclxuICAge1xyXG4gICAgICAgaWYodHlwZW9mIHNwZWMgPT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgc3BlYyA9IFtzcGVjXTtcclxuICAgICAgICBzcGVjLmZvckVhY2goY2w9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkKCkuY2xhc3NMaXN0LmFkZChjbClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG5cclxuICAgZ2V0IGNsYXNzTGlzdCgpXHJcbiAgIHtcclxuICAgICAgIHJldHVybiB0aGlzLmJ1aWxkKCkuY2xhc3NMaXN0O1xyXG4gICB9XHJcbiAgIGh0bWwodGV4dClcclxuICAge1xyXG4gICAgICAgaWYodGV4dCA9PSBudWxsKVxyXG4gICAgICAgIHRleHQgPSBcIlwiO1xyXG4gICAgICAgdGhpcy5idWlsZCgpLmlubmVySFRNTCA9IHRleHQ7XHJcbiAgICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG4gICB0ZXh0KHRleHQpXHJcbiAgIHtcclxuICAgICAgIGlmKHRleHQgPT0gbnVsbClcclxuICAgICAgICB0ZXh0ID0gXCJcIjtcclxuICAgICAgIHRoaXMuYnVpbGQoKS5pbm5lclRleHQgPSB0ZXh0O1xyXG4gICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgIH1cclxuXHJcbiAgIHJlbW92ZUNoaWxkcmVuKClcclxuICAge1xyXG4gICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdO1xyXG4gICAgICAgdGhpcy5idWlsZCgpLmlubmVyVGV4dCA9IFwiXCI7XHJcbiAgIH1cclxuXHJcbiAgIC8qKlxyXG4gICAgKiBjcmVhdGUgbmVzdCBmb3IgY2hpZGxyZW4gcmVxdWVzdGluZyBuZXN0aW5nXHJcbiAgICAqIHRoaXMgbWFya3MgdGhlIG5lc3RpbmcuXHJcbiAgICAqIG5lc3QgaXMgc2ltcGxlIG9iamVjdCBhbmQgdGhlIGNoaWxkcmVuIGFyZSBoZXJlIGFzIHByb3BlcnRpZXNcclxuICAgICovXHJcbiAgIG5lc3RvcigpXHJcbiAgIHtcclxuICAgICAgIHRoaXMubmVzdCA9IHt9XHJcbiAgICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG4gICAvKipcclxuICAgICpyZXVlc3QgbmVzdGluZyBpbiBuZXN0aW5nIGNvbnRleHQgb2YgaXRzIHBhcmVudFxyXG4gICAgKiBlbGVtZW50IGhhcyB0byBoYXZlIHNwZWNpZmllZCBpZCB0byBiZSBuZXN0ZWRcclxuICAgICogQHBhcmFtIHtib29sZWFufHVuZGVmaW5lZH0gZG9uZXN0IFxyXG4gICAgKi9cclxuICAgbmVzdE1lKGRvbmVzdClcclxuICAge1xyXG4gICAgIHRoaXMuX25lc3RNZSA9IGRvbmVzdCA9PSB1bmRlZmluZWQgPyB0cnVlIDogZG9uZXN0XHJcbiAgICAgcmV0dXJuIHRoaXM7XHJcbiAgIH1cclxuXHJcbiAgIC8qKlxyXG4gICAgKiBjYWxsZWQgYXMgcGFydCBvZiBiaW5kLlxyXG4gICAgKiB0cmllcyBwb3B1bGF0ZSBvd24gbmVzdCB3aXRoIG5lc3RpbmcgcmVxdWVzdGluZyBjaGlsZHJlblxyXG4gICAgKi9cclxuICAgX3RyeU5lc3RpbmcoKVxyXG4gICB7XHJcbiAgICAgICBpZighdGhpcy5uZXN0IHx8IHRoaXMuX25lc3RpbmdEb25lKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdGhpcy5fbmVzdGluZ0RvbmUgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX3RyeU5lc3RDaGlsZHJlbih0aGlzLm5lc3QpXHJcbiAgICAgICAgdGhpcy5raWRuYXBwZXJzLmZvckVhY2goa3JlY29yZD0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvcih2YXIga2lkIGluIHRoaXMubmVzdClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLm5lc3Rba2lkXTtcclxuICAgICAgICAgICAgICAgICAgICAgaWYoa3JlY29yZC5jaGlsZElkID09IG51bGwgfHwga2lkID09IGtyZWNvcmQuY2hpbGRJZClcclxuICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1Y2tvb0VnZyA9IFRSWUMoKCk9PmtyZWNvcmQua2lkbmFwcGVyKGNoaWxkLHRoaXMpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGN1Y2tvb0VnZyAmJiBjdWNrb29FZ2cgIT09IGNoaWxkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vaW5zdGFsbCBjdWNrb28gZWdnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXN0W2tpZF0gPSBjdWNrb29FZ2c7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQucGFyZW50Ll9pbnN0YWxsQ3Vja29vRWdnKGN1Y2tvb0VnZyxjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgfVxyXG4gICBfdHJ5QWRkVG9OZXN0KG5lc3QpXHJcbiAgIHtcclxuICAgICAgIFxyXG4gICAgICAgIGlmKHRoaXMuX25lc3RNZSAmJiB0aGlzLm9wdGlvbnMuaWQpXHJcbiAgICAgICAgICAgIG5lc3RbdGhpcy5vcHRpb25zLmlkXSA9IHRoaXM7IC8vIG5lc3QgXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYodGhpcy5uZXN0KVxyXG4gICAgICAgICAgICByZXR1cm47IC8vIGJvcmRlciBvZiBuZXN0aW5nIGNvbnRleHRcclxuICAgICAgICB0aGlzLl90cnlOZXN0Q2hpbGRyZW4obmVzdCk7XHJcbiAgICAgICAgXHJcbiAgIH1cclxuICAgaXNEaXJ0eSgpXHJcbiAgIHtcclxuICAgICAgIHZhciBydjtcclxuICAgICAgIGlmKHRoaXMuZGlydHkpXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgaWYodGhpcy5uZXN0KVxyXG4gICAgICAgICAgIGZvcih2YXIgayBpbiB0aGlzLm5lc3QpXHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLm5lc3Rba10uaXNEaXJ0eSgpKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgfVxyXG4gICBfdHJ5TmVzdENoaWxkcmVuKG5lc3QpXHJcbiAgIHtcclxuICAgICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goKGMpPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGMuX3RyeUFkZFRvTmVzdChuZXN0KTtcclxuICAgICAgICB9KVxyXG4gICB9XHJcbiBcclxuICAgLyoqXHJcbiAgICAqIGtpZG5hcGVyIGNhbiBpbnRlcmNlcHQgYWxsIGNoaWxkcmVkIGluIHRoZSBuZXN0LlxyXG4gICAgKiBBYnVzZSB0aGVtICBhbmQgY2FuIHJlcGxhY2UgdGhlbSB3aXRoIGl0cyBvd24gSGVqbEVsZW1lbnQgKGN1Y2tvbyBlZ2cpXHJcbiAgICAqIHRoZSBjaGlsZCB3aXRoIGlkIHlvdSBhcmUgaW50ZXJlc3RlZCB0byBjYW4gYmUgc3BlY2lmaWVkIGJ5IGNoaWxkSWRcclxuICAgICogQHBhcmFtIHtIZWpsRWxlbWVudH5raWRuYXBwZXJDYWxsYmFja30ga2lkbmFwcGVyXHJcbiAgICAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gY2hpbGRJZCBcclxuICAgICovXHJcbiAgIGFiZHVjdG9yKGtpZG5hcHBlcixjaGlsZElkKVxyXG4gICB7XHJcbiAgICAgICAgdGhpcy5raWRuYXBwZXJzLnB1c2goeyBraWRuYXBwZXI6IGtpZG5hcHBlciwgY2hpbGRJZDpjaGlsZElkIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcbiAgIC8qKlxyXG4gICAgKiByZXBsYWNlcyB0aGUgZ2l2ZW4gYWN0dWFsIGNoaWxkIHdpdGggdGhlIG5ldyBvbmVcclxuICAgICogQHBhcmFtIHtIZWpsRWxlbWVudH0gY3Vja29vRWdnIG5ldyBlbGVtZW50IHRvIGJlIGluc3RhbGxlZFxyXG4gICAgKiBAcGFyYW0ge0hlamxFbGVtZW50fSBjaGlsZCBlbGVtZW50IHRvIGJlIHJlcGxhY2VkXHJcbiAgICAqL1xyXG4gICBfaW5zdGFsbEN1Y2tvb0VnZyhjdWNrb29FZ2csY2hpbGQpXHJcbiAgIHtcclxuICAgICAgIHZhciBpZHggPSB0aGlzLmNoaWxkcmVuLmluZGV4T2YoY2hpbGQpO1xyXG4gICAgICAgaWYoaWR4ID09IC0xKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgICB0aGlzLmN1Y2tvb0VnZy5pZChjaGlsZC5teUlkKTtcclxuICAgICAgICB0aGlzLmN1Y2tvb0VnZy5vcHRpb25zLmlkID0gY2hpbGQub3B0aW9ucy5pZDtcclxuICAgICAgICB0aGlzLmNoaWxkcmVuLnNwbGljZShpZHgsMSxbY3Vja29vRWdnXSlcclxuICAgICAgdGhpcy5idWlsZCgpLnJlcGxhY2VDaGlsZChjdWNrb29FZ2cuYnVpbGQoKSwgY2hpbGQuYnVpbGQoKSk7XHJcbiAgIH1cclxuXHJcbiAgIF9pbnN0YWxsQ2hpbGQoY2hpbGQpXHJcbiAgIHtcclxuICAgICAgICBsZXQgaW5zdGFsbENoaWxkID0gKGNoaWxkKT0+XHJcbiAgICAgICAge1xyXG4gICAgICBcclxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgIGNoaWxkLnBhcmVudCA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMuYnVpbGQoKS5hcHBlbmRDaGlsZChjaGlsZC5idWlsZCgpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoY2hpbGQubmV4dCAhPSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZG9cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGV0IGdjaGlsZCA9IGNoaWxkLm5leHQoKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmKGdjaGlsZCA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgaW5zdGFsbENoaWxkKGdjaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd2hpbGUodHJ1ZSApXHJcbiAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgaW5zdGFsbENoaWxkKGNoaWxkKTtcclxuICAgfVxyXG4gICBzdGFjayhjaGlsZHJlbilcclxuICAge1xyXG4gICAgICAgdGhpcy5yZW1vdmVDaGlsZHJlbigpO1xyXG4gICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdO1xyXG5cclxuICAgXHJcbiAgICAgICBjaGlsZHJlbi5mb3JFYWNoKHRoaXMuX2luc3RhbGxDaGlsZC5iaW5kKHRoaXMpKVxyXG4gICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG4gIFxyXG4gICBzdGFja0FkZChjaGlsZHJlbilcclxuICAge1xyXG4gICAgICBpZighQXJyYXkuaXNBcnJheShjaGlsZHJlbikpXHJcbiAgICAgICAgICAgIGNoaWxkcmVuID0gWyBjaGlsZHJlbiBdO1xyXG4gICAgIC8vIHRoaXMuY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuLmNvbmNhdChjaGlsZHJlbik7XHJcbiAgICAgICBjaGlsZHJlbi5mb3JFYWNoKHRoaXMuX2luc3RhbGxDaGlsZC5iaW5kKHRoaXMpKVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG5cclxuICAgY2xpY2soY2xpY2tDYWxsYmFjaylcclxuICAge1xyXG4gICAgICAgaWYoY2xpY2tDYWxsYmFjayA9PSBudWxsKVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgdGhpcy5jbGlja0NhbGxiYWNrID0gY2xpY2tDYWxsYmFjaztcclxuICAgICAgIHRoaXMuYnVpbGQoKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsXHJcbiAgICAgICAoZXZlbnQpPT57XHJcbiAgICAgICAgICBUUllDKCgpPT57XHJcbiAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tDYWxsYmFjayhldmVudCx0aGlzKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgfSk7XHJcbiAgICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG4gICBcclxuICAgdmlzaWJsZShjYWxsYmFjaylcclxuICAge1xyXG4gICAgICAgdGhpcy52aXNpYmxlQ2FsbGJhY2sgPSBjYWxsYmFjaztcclxuICAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcblxyXG4gICBjb2xsZWN0aW9uKGl0ZW1DYWxsYmFjayxpdGVtVmlld0NhbGxiYWNrKVxyXG4gICB7XHJcbiAgICAgICB0aGlzLml0ZW1DYWxsYmFjayA9IGl0ZW1DYWxsYmFjaztcclxuICAgICAgIHRoaXMuaXRlbVZpZXdDYWxsYmFjayA9IGl0ZW1WaWV3Q2FsbGJhY2s7XHJcbiAgICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG5cclxuXHJcbiBcclxuICAgdmFsaWRhdG9yKHZhbGlkYXRvckNiKVxyXG4gICB7XHJcbiAgICAgICB0aGlzLnZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3JDYik7XHJcbiAgICAgICByZXR1cm4gdGhpcztcclxuICAgfVxyXG5cclxuICAgdmFsaWRhdGUocHJvdG9jb2wpXHJcbiAgIHtcclxuICAgICAgIFxyXG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdCA9IG5ldyBIZWpsVmFsaWRhdGlvblByb3RvY29sKCk7XHJcbiAgICAgICAgdGhpcy5teVZhbGlkYXRpb25SZXN1bHQgPSBuZXcgSGVqbFZhbGlkYXRpb25Qcm90b2NvbCgpO1xyXG4gICAgICAgIHRoaXMudmFsaWRhdG9ycy5mb3JFYWNoKHY9PlxyXG4gICAgICAgICAgICBUUllDKCgpPT52KHRoaXMsIHRoaXMubXlWYWxpZGF0aW9uUmVzdWx0KSlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHQubWVyZ2UodGhpcy5teVZhbGlkYXRpb25SZXN1bHQpO1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChjaGlsZD0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdC5tZXJnZShjaGlsZC52YWxpZGF0ZSgpKTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYocHJvdG9jb2wgIT0gbnVsbClcclxuICAgICAgICAgICAgcHJvdG9jb2wubWVyZ2UodGhpcy52YWxpZGF0aW9uUmVzdWx0KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHByb3RvY29sID0gdGhpcy52YWxpZGF0aW9uUmVzdWx0O1xyXG5cclxuICAgICAgICB0aGlzLmhpZ2hsaWdodEVycm9yKCk7XHJcbiAgICAgICAgcmV0dXJuIHByb3RvY29sO1xyXG4gICB9XHJcbiAgIGNoZWNrRXJyb3JIaWdsaWdodCgpXHJcbiAgIHtcclxuICAgICAgICBpZih0aGlzLm15VmFsaWRhdGlvblJlc3VsdCkgLy92YWxpZGF0ZWQgb25jZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy52YWxpZGF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmhpZ2hsaWdodEVycm9yKCk7XHJcbiAgICAgICAgfVxyXG4gICB9XHJcbiAgIGhpZ2hsaWdodEVycm9yKClcclxuICAge1xyXG4gICAgICAgdGhpcy5idWlsZCgpLmNsYXNzTGlzdC5yZW1vdmUoXCJlcnJvclwiKVxyXG4gICAgICAgaWYodGhpcy5idWlsZCgpLnBhcmVudEVsZW1lbnQgPT0gbnVsbClcclxuICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgaWYodGhpcy5lcnJvckVsKVxyXG4gICAgICAgICAgdGhpcy5idWlsZCgpLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5lcnJvckVsKTtcclxuICAgICAgIGRlbGV0ZSB0aGlzLmVycm9yRWw7XHJcbiAgICAgICB0aGlzLmJ1aWxkKCkucGFyZW50RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdpbnB1dCcpO1xyXG4gICAgICAgaWYodGhpcy5pc0luRXJyb3IoKSlcclxuICAgICAgIHtcclxuICAgICAgICAgICB2YXIgZXJyID0gdGhpcy5teVZhbGlkYXRpb25SZXN1bHQuZGlzcGxheUVycm9ycygpO1xyXG4gICAgICAgICAgIHRoaXMuZXJyb3JFbCA9IGNyZWF0ZUVsZW1lbnRGcm9tSFRNTChcIjxzcGFuIGNsYXNzPSd0b29sdGlwIGVycm9yJyBpZD0nXCIrdGhpcy5teUlkK1wiX2Vycm9yJyA+XCIrZXJyK1wiPC9zcGFuPlwiKTtcclxuICAgICAgICAvLyAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXJnZXQnKTtcclxuICAgICAgICAgICB0aGlzLmJ1aWxkKCkucGFyZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdpbnB1dCcpO1xyXG4gICAgICAgICAgIHRoaXMuYnVpbGQoKS5wYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZXJyb3JFbCk7XHJcbiAgICAgICAgICAgdGhpcy5idWlsZCgpLmNsYXNzTGlzdC5hZGQoJ2Vycm9yJyk7XHJcbiAgICAgICB9IFxyXG4gICAgICAgIFxyXG4gICB9XHJcbiAgIGlzSW5FcnJvcigpXHJcbiAgIHtcclxuICAgICAgIGlmKCF0aGlzLm15VmFsaWRhdGlvblJlc3VsdClcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICB2YXIgcnYgPSAgdGhpcy5teVZhbGlkYXRpb25SZXN1bHQuaGFzRXJyb3JzKCk7XHJcbiAgICAgICByZXR1cm4gcnY7XHJcbiAgIH1cclxuXHJcbiAgIC8qKlxyXG4gICAgKiBOYW1lIG9mIGZpZWxkIHRvIGJlIHVzZWQgaW4gdmFsaWRhdGlvbiBtZXNzYWdlc1xyXG4gICAgKiBAcGFyYW0ge1N0cmluZ30gZmllbGRMYWJlbCBkaXNwbGF5YWJsZSBuYW1lIG9mIGZpZWxkXHJcbiAgICAqL1xyXG4gICBsYWJlbChmaWVsZExhYmVsKVxyXG4gICB7XHJcbiAgICAgICB0aGlzLmZpZWxkTGFiZWwgPSBmaWVsZExhYmVsO1xyXG4gICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgIH1cclxuICAgbG9va3VwRmllbGRMYWJlbCgpXHJcbiAgIHtcclxuICAgIGlmKHRoaXMuZmllbGRMYWJlbCAhPSBudWxsKVxyXG4gICAgICAgIHJldHVybiB0aGlzLmZpZWxkTGFiZWw7XHJcbiAgICBpZih0aGlzLnBhcmVudCAhPSBudWxsKVxyXG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5sb29rdXBGaWVsZExhYmVsKCk7XHJcbiAgICByZXR1cm4gdGhpcy5teUlkO1xyXG4gICB9XHJcbiAgIHJlcXVpcmVkKGNiKVxyXG4gICB7XHJcbiAgICAgICB0aGlzLnZhbGlkYXRvcigoZWwscHJvdG9jb2wpPT5cclxuICAgICAgIHtcclxuICAgICAgICAgICBpZighdGhpcy5jaGVja0ZpbGxlZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICBpZihjYiAmJiBjYigpPT1mYWxzZSlcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICB2YXIgZmlsbGVkID0gdGhpcy5jaGVja0ZpbGxlZCgpO1xyXG4gICAgICAgICAgaWYoIWZpbGxlZClcclxuICAgICAgICAgICAgICAgcHJvdG9jb2wuYWRkRXJyb3IodGhpcy5sb29rdXBGaWVsZExhYmVsKCksXCJQb2xlIG11c8OtIGLDvXQgdnlwbG7Em25vXCIpO1xyXG4gICAgICAgfSlcclxuICAgICAgIHJldHVybiB0aGlzO1xyXG4gICB9XHJcbn1cclxuSGVqbEVsZW1lbnQuaWRTZXF1ZW5jZSA9IDA7XHJcblxyXG5jbGFzcyBoZWpsRElWIGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIkRJVlwiLG9wdGlvbnMpXHJcbiAgICB9XHJcbn1cclxud2luZG93LkRJViA9IGZ1bmN0aW9uKGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbERJVihpZCxvcHRpb25zKTtcclxufVxyXG5jbGFzcyBoZWpsU1BBTiBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJTUEFOXCIsb3B0aW9ucylcclxuICAgIH1cclxufVxyXG53aW5kb3cuU1BBTiA9IGZ1bmN0aW9uKHRleHQsaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBoZWpsU1BBTihpZCxvcHRpb25zKS50ZXh0KHRleHQpO1xyXG59XHJcblxyXG5jbGFzcyBoZWpsTEFCRUwgZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiTEFCRUxcIixvcHRpb25zKVxyXG4gICAgfVxyXG4gICAgZm9yKGZvcnRleHQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5mb3J0ZXh0ID0gZm9ydGV4dDtcclxuICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGJpbmQobSlcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLmZvcnRleHQgIT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0eHQgPSB0aGlzLmZvcnRleHQ7XHJcbiAgICAgICAgICAgIGlmKHR5cGVvZiB0aGlzLmZvcnRleHQgIT09IFwic3RyaW5nXCIpXHJcbiAgICAgICAgICAgICAgICB0eHQgPSB0aGlzLmZvcnRleHQubXlJZDtcclxuICAgICAgICAgICAgdGhpcy5idWlsZCgpLnNldEF0dHJpYnV0ZShcImZvclwiLHR4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzdXBlci5iaW5kKG0pO1xyXG4gICAgfVxyXG59XHJcblxyXG53aW5kb3cuTEFCRUwgPSBmdW5jdGlvbih0ZXh0LGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbExBQkVMKGlkLG9wdGlvbnMpLnRleHQodGV4dCk7XHJcbn1cclxuXHJcbmNsYXNzIGhlamxTVFJPTkcgZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiU1RST05HXCIsb3B0aW9ucylcclxuICAgIH1cclxufVxyXG53aW5kb3cuU1RST05HID0gZnVuY3Rpb24odGV4dCxpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxTVFJPTkcoaWQsb3B0aW9ucykudGV4dCh0ZXh0KTtcclxufVxyXG5cclxuXHJcbmNsYXNzIGhlamxTbWFsbCBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJTTUFMTFwiLG9wdGlvbnMpXHJcbiAgICB9XHJcbn1cclxud2luZG93LlNNQUxMID0gZnVuY3Rpb24odGV4dCxpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxTbWFsbChpZCxvcHRpb25zKS50ZXh0KHRleHQpO1xyXG59XHJcblxyXG53aW5kb3cuRElWID0gZnVuY3Rpb24oaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBoZWpsRElWKGlkLG9wdGlvbnMpO1xyXG59XHJcbmNsYXNzIGhlamxIMSBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJIMVwiLG9wdGlvbnMpXHJcbiAgICB9XHJcbn1cclxud2luZG93LkgxID0gZnVuY3Rpb24gKHRleHQsaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBoZWpsSDEoaWQsb3B0aW9ucykudGV4dCh0ZXh0KTtcclxufVxyXG5cclxuY2xhc3MgaGVqbEgyIGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIkgyXCIsb3B0aW9ucylcclxuICAgIH1cclxufVxyXG53aW5kb3cuSDIgPSBmdW5jdGlvbiAodGV4dCxpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxIMihpZCxvcHRpb25zKS50ZXh0KHRleHQpO1xyXG59XHJcblxyXG5jbGFzcyBoZWpsSDMgZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiSDNcIixvcHRpb25zKVxyXG4gICAgfVxyXG59XHJcbndpbmRvdy5IMyA9IGZ1bmN0aW9uICh0ZXh0LGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbEgzKGlkLG9wdGlvbnMpLnRleHQodGV4dCk7XHJcbn1cclxuY2xhc3MgaGVqbEg0IGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIkg0XCIsb3B0aW9ucylcclxuICAgIH1cclxufVxyXG53aW5kb3cuSDQgPSBmdW5jdGlvbiAodGV4dCxpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxINChpZCxvcHRpb25zKS50ZXh0KHRleHQpO1xyXG59XHJcbmNsYXNzIGhlamxJRlJBTUUgZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiSUZSQU1FXCIsb3B0aW9ucyk7XHJcbiAgICAgICAgdGhpcy5idWlsZCgpLm9ubG9hZCA9IHRoaXMub25JZnJhbWVMb2FkZWQuYmluZCh0aGlzKTtcclxuICAgIH1cclxuICAgIHNyYyhzcmMpXHJcbiAgICB7XHJcbiAgICAgICAgaWYoc3JjPT1udWxsKVxyXG4gICAgICAgICAgICBzcmMgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuYnVpbGQoKS5zcmMgPSBzcmM7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgIFxyXG4gICAgc3JjYmluZGVyKGJpbmRlcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9zcmNiaW5kZXIgPSBiaW5kZXI7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBiaW5kKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIuYmluZChkYXRhKTtcclxuICAgICAgICBpZih0aGlzLl9zcmNiaW5kZXIpXHJcbiAgICAgICAgIFRSWUMoKCk9PnRoaXMuc3JjKHRoaXMuX3NyY2JpbmRlcih0aGlzLmV4dHJhY3RlZE1vZGVsKSkpO1xyXG4gICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIG9uSWZyYW1lTG9hZGVkKClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgIH1cclxufVxyXG5cclxud2luZG93LklGUkFNRSA9IGZ1bmN0aW9uKHNyYyxpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gKG5ldyBoZWpsSUZSQU1FKGlkLG9wdGlvbnMpKS5zcmMoc3JjKTtcclxufVxyXG5jbGFzcyBoZWpsQlVUVE9OIGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIkJVVFRPTlwiLG9wdGlvbnMpXHJcbiAgICB9XHJcbiAgICBidWlsZCgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJ2ID0gc3VwZXIuYnVpbGQoKTtcclxuICAgICAgICBydi5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsXCJidXR0b25cIilcclxuICAgICAgICByZXR1cm4gcnY7XHJcbiAgICB9XHJcbn1cclxud2luZG93LkJVVFRPTiA9IGZ1bmN0aW9uKHRleHQsY2xpY2tDYWxsYmFjayxpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxCVVRUT04oaWQsb3B0aW9ucykudGV4dCh0ZXh0KS5jbGljayhjbGlja0NhbGxiYWNrKTtcclxufVxyXG53aW5kb3cuQ0xCVVRUT04gPSBmdW5jdGlvbihjbGFzc2VzLGNsaWNrQ2FsbGJhY2ssaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBoZWpsQlVUVE9OKGlkLG9wdGlvbnMpLmNsYXNzKGNsYXNzZXMpLmNsaWNrKGNsaWNrQ2FsbGJhY2spO1xyXG59XHJcblxyXG5jbGFzcyBoZWpsU2VsZWN0IGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIlNFTEVDVFwiLG9wdGlvbnMpXHJcbiAgICB9XHJcbiAgICBvcHRzKG9wdHNDYixvcHRCaW5kZXIpXHJcbiAgICB7XHJcblxyXG4gICAgICAgIHRoaXMub3B0c0NiID0gb3B0c0NiO1xyXG4gICAgICAgIHRoaXMub3B0QmluZGVyID0gb3B0QmluZGVyID09IG51bGwgP1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2hvdzogKGl0KT0+aXQubmFtZSxcclxuICAgICAgICAgICAga2V5OiAoaXQpPT5pdC52YWx1ZVxyXG4gICAgICAgIH06b3B0QmluZGVyO1xyXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbih0aGlzLm9wdHNDYix0aGlzLmNyZWF0ZU9wdGlvbi5iaW5kKHRoaXMpKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGNyZWF0ZU9wdGlvbihvcHQpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJ2ID0gbmV3IEhlamxFbGVtZW50KHVuZGVmaW5lZCxcIk9QVElPTlwiKVxyXG4gICAgICAgIHJ2LnRleHQodGhpcy5vcHRCaW5kZXIuc2hvdyhvcHQpKTtcclxuICAgICAgICBydi5idWlsZCgpLnZhbHVlID0gdGhpcy5vcHRCaW5kZXIua2V5KG9wdCk7XHJcbiAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG4gICBzZWxlY3RPcHRpb24oaWR4KVxyXG4gICB7XHJcbiAgICAgdGhpcy5idWlsZCgpLm9wdGlvbnMuc2VsZWN0ZWRJbmRleCA9IGlkeDtcclxuICAgfVxyXG4gICBnZXQgc2VsZWN0ZWRPcHRpb24oKVxyXG4gICB7XHJcbiAgICAgICByZXR1cm4gdGhpcy5idWlsZCgpLm9wdGlvbnMuc2VsZWN0ZWRJbmRleDtcclxuICAgfVxyXG59XHJcbndpbmRvdy5TRUxFQ1QgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG57XHJcbiAgcmV0dXJuICBuZXcgaGVqbFNlbGVjdChpZCxvcHRpb25zKTtcclxufVxyXG5jbGFzcyBoZWpsU3dpdGNoIGV4dGVuZHMgaGVqbEJVVFRPTlxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMuY2hlY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuY2xpY2sodGhpcy5jbGlja2VkKTtcclxuICAgICAgICB0aGlzLl9jaGVja2VkQ2xhc3NlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX25vdENoZWNrZWRDbGFzc2VzID0gW107XHJcbiAgICB9XHJcbiAgICBiaW5kQ2hlY2tlZChjYilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmJpbmRDaGVja2VkQ2FsbGJhY2sgPSBjYjtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGNsaWNrZWQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuY2hlY2tlZCA9ICF0aGlzLmNoZWNrZWQ7XHJcbiAgICAgICB0aGlzLmhhbmRsZUNoZWNrZWQoKTtcclxuICAgICAgIGlmKHRoaXMuY2hlY2tlZENhbGxiYWNrKVxyXG4gICAgICAgIHRoaXMuY2hlY2tlZENhbGxiYWNrKHRoaXMuY2hlY2tlZCx0aGlzKTtcclxuICAgIH1cclxuICAgIGhhbmRsZUNoZWNrZWQoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0b3JlbW92ZSA9IHRoaXMuY2hlY2tlZCA/XHJcbiAgICAgICAgICAgICB0aGlzLl9ub3RDaGVja2VkQ2xhc3NlcyA6IHRoaXMuX2NoZWNrZWRDbGFzc2VzO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRvcmVtb3ZlLmZvckVhY2goY2w9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkKCkuY2xhc3NMaXN0LnJlbW92ZShjbCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgdmFyIHRvYWRkID0gdGhpcy5jaGVja2VkID9cclxuICAgICAgICAgICAgIHRoaXMuX2NoZWNrZWRDbGFzc2VzIDogdGhpcy5fbm90Q2hlY2tlZENsYXNzZXM7XHJcbiAgICAgICAgdG9hZGQuZm9yRWFjaChjbD0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVpbGQoKS5jbGFzc0xpc3QuYWRkKGNsKTsgICBcclxuICAgICAgICAgICAgfSlcclxuICAgICAgXHJcbiAgICBcclxuICAgIH1cclxuICAgIGNoZWNrKGNhbGxiYWNrKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuY2hlY2tlZENhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBjaGVja2VkQ2xhc3NlcyhjbGFzc2VzKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2NoZWNrZWRDbGFzc2VzID0gY2xhc3NlcztcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIG5vdENoZWNrZWRDbGFzc2VzKGNsYXNzZXMpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fbm90Q2hlY2tlZENsYXNzZXMgPSBjbGFzc2VzO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgYmluZChkYXRhKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyLmJpbmQoZGF0YSlcclxuICAgICAgICBpZih0aGlzLmJpbmRDaGVja2VkQ2FsbGJhY2spXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmNoZWNrZWQgPSB0aGlzLmJpbmRDaGVja2VkQ2FsbGJhY2sodGhpcy5leHRyYWN0ZWRNb2RlbCk7XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlQ2hlY2tlZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxud2luZG93LlNXSVRDSEZBID0gZnVuY3Rpb24oaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIFNXSVRDSEJVVFRPTihbXCJmYVwiLFwiZmEtdG9nZ2xlLW9uXCJdLFtcImZhXCIsXCJmYS10b2dnbGUtb2ZmXCJdLGlkLG9wdGlvbnMpO1xyXG59XHJcblxyXG53aW5kb3cuQ0hFQ0tGQSA9IGZ1bmN0aW9uKGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBTV0lUQ0hCVVRUT04oW1wiZmFcIixcImZhLWNoZWNrLXNxdWFyZVwiXSxbXCJmYVwiLFwiZmEtc3F1YXJlXCJdLGlkLG9wdGlvbnMpO1xyXG59XHJcblxyXG53aW5kb3cuU1dJVENIQlVUVE9OID0gZnVuY3Rpb24oY2hlY2tlZENsYXNzZXMsbm90Q2hlY2tlZENsYXNzZXMsaWQsb3B0aW9ucylcclxue1xyXG4gICAgdmFyIHJ2ID0gbmV3IGhlamxTd2l0Y2goaWQsb3B0aW9ucyk7XHJcbiAgICBydi5jaGVja2VkQ2xhc3NlcyhjaGVja2VkQ2xhc3Nlcyk7XHJcbiAgICBydi5ub3RDaGVja2VkQ2xhc3Nlcyhub3RDaGVja2VkQ2xhc3Nlcyk7XHJcbiAgICBydi5jbGFzcyhcImJ1dHRvblwiKTtcclxuICAgIHJldHVybiBydjtcclxuXHJcbn1cclxuY2xhc3MgaGVqbElNRyBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJJTUdcIixvcHRpb25zKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBzcmMoc3JjKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHNyYz09bnVsbClcclxuICAgICAgICAgICBzcmMgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuYnVpbGQoKS5zcmMgPSBzcmM7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBzcmNiaW5kZXIoYmluZGVyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3NyY2JpbmRlciA9IGJpbmRlcjtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGJpbmQoZGF0YSlcclxuICAgIHtcclxuICAgICAgICBzdXBlci5iaW5kKGRhdGEpO1xyXG4gICAgICAgIGlmKHRoaXMuX3NyY2JpbmRlcilcclxuICAgICAgICAgVFJZQygoKT0+dGhpcy5zcmModGhpcy5fc3JjYmluZGVyKHRoaXMuZXh0cmFjdGVkTW9kZWwpKSk7XHJcbiAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59XHJcbndpbmRvdy5JTUcgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxJTUcoaWQsb3B0aW9ucyk7XHJcbn1cclxuXHJcbmNsYXNzIGhlamxIRUFERVIgZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiSEVBREVSXCIsb3B0aW9ucylcclxuICAgIH1cclxuICAgIFxyXG59XHJcbndpbmRvdy5IRUFERVIgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxIRUFERVIoaWQsb3B0aW9ucyk7XHJcbn1cclxuY2xhc3MgaGVqbFNWRyBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJTVkdcIixvcHRpb25zKVxyXG5cclxuICAgIH0gXHJcbn1cclxuY2xhc3MgaGVqbElOUFVUIGV4dGVuZHMgSGVqbEVsZW1lbnRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxcIklOUFVUXCIsb3B0aW9ucylcclxuICAgICAgICB0aGlzLmlucHV0VHlwZSA9IFwiVEVYVFwiO1xyXG4gICAgfVxyXG4gICAgcGxhY2Vob2xkZXIocGxhY2Vob2xkZXIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5idWlsZCgpLnBsYWNlaG9sZGVyID0gcGxhY2Vob2xkZXI7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICB0eXBlKHRwKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaW5wdXRUeXBlID10cDtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGJ1aWxkKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcnYgPSBzdXBlci5idWlsZCgpO1xyXG4gICAgICAgIGlmKCF0aGlzLnNldHVwRG9uZSlcclxuICAgICAgICAgICAgdGhpcy5zZXR1cElucHV0KHJ2KTtcclxuICAgICAgICB0aGlzLnNldHVwRG9uZSA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG4gICAgc2V0dXBJbnB1dChydilcclxuICAgIHtcclxuICAgICAgICBydi5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsdGhpcy5pbnB1dFR5cGUpO1xyXG4gICAgICAgIHJ2LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywoKT0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdmFsID0gdGhpcy5idWlsZCgpLnZhbHVlO1xyXG4gICAgICAgICAgICB0aGlzLnJlc2l6ZUlucHV0KCk7XHJcbiAgICAgICAgICAgIGlmKHRoaXMudGV4dEJpbmRGdW5jKVxyXG4gICAgICAgICAgICAgIHRoaXMudGV4dEJpbmRGdW5jKHZhbCx0aGlzLHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICB0aGlzLmNoZWNrRXJyb3JIaWdsaWdodCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAvLyAgdGhpcy5yZXNpemVJbnB1dCgpOyAvLyBpbW1lZGlhdGVseSBjYWxsIHRoZSBmdW5jdGlvblxyXG5cclxuICAgICAgIFxyXG4gICAgfVxyXG4gXHJcbiAgICBhdXRvUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmRvQXV0b1Jlc2l6ZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICByZXNpemVJbnB1dCgpIHtcclxuICAgICAgICBpZighdGhpcy5kb0F1dG9SZXNpemUpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB2YXIgdmFsID0gdGhpcy5idWlsZCgpLnZhbHVlO1xyXG4gICAgICAgIGlmKHZhbCA9PSBudWxsIHx8IHZhbCA9PSBudWxsKVxyXG4gICAgICAgICAgICB0aGlzLmJ1aWxkKCkuc3R5bGUud2lkdGggPSAxMCsgXCJjaFwiO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdGhpcy5idWlsZCgpLnN0eWxlLndpZHRoID0gdmFsLmxlbmd0aCsxICsgXCJjaFwiO1xyXG4gICAgfVxyXG4gICAgdGV4dCh0eHQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5idWlsZCgpLnZhbHVlID0gdHh0O1xyXG4gICAgICAgIHRoaXMucmVzaXplSW5wdXQoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGNoZWNrRmlsbGVkKClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGV4dCA9IHRoaXMuYnVpbGQoKS52YWx1ZTtcclxuICAgICAgICByZXR1cm4gdGV4dCAhPSBudWxsICYmIHRleHQgIT0gXCJcIjtcclxuICAgIH1cclxufVxyXG53aW5kb3cuSU5QVVQgPSBmdW5jdGlvbiAoaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBoZWpsSU5QVVQoaWQsb3B0aW9ucyk7XHJcbn1cclxuXHJcbmNsYXNzIGhlamxUZXh0QXJlYSBleHRlbmRzIEhlamxFbGVtZW50XHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGlkLG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoaWQsXCJURVhUQVJFQVwiLG9wdGlvbnMpXHJcbiAgICB9XHJcbiAgIFxyXG4gICAgYnVpbGQoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBydiA9IHN1cGVyLmJ1aWxkKCk7XHJcbiAgICAgICAgaWYoIXRoaXMuc2V0dXBEb25lKVxyXG4gICAgICAgICAgICBydi5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsKCk9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gdGhpcy5idWlsZCgpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYodGhpcy50ZXh0QmluZEZ1bmMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50ZXh0QmluZEZ1bmModmFsLHRoaXMsdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tFcnJvckhpZ2xpZ2h0KCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuc2V0dXBEb25lID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gcnY7XHJcbiAgICB9XHJcbiAgICB0ZXh0KHR4dClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmJ1aWxkKCkudmFsdWUgPSB0eHQ7XHJcbiAgICB9XHJcbiAgICBjaGVja0ZpbGxlZCgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHR4dCA9ICB0aGlzLmJ1aWxkKCkudmFsdWU7XHJcbiAgICAgICAgcmV0dXJuIHR4dCAhPSBudWxsICYmIHR4dCAhPSBcIlwiO1xyXG4gICAgfVxyXG4gICAgcGxhY2Vob2xkZXIocGxhY2Vob2xkZXIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5idWlsZCgpLnBsYWNlaG9sZGVyID0gcGxhY2Vob2xkZXI7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn1cclxud2luZG93LlRFWFRBUkVBID0gZnVuY3Rpb24gKGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBuZXcgaGVqbFRleHRBcmVhKGlkLG9wdGlvbnMpO1xyXG59XHJcblxyXG5jbGFzcyBoZWpsVmlkZW8gZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiVklERU9cIixvcHRpb25zKVxyXG4gICAgfVxyXG4gICBcclxuICAgIGJ1aWxkKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcnYgPSBzdXBlci5idWlsZCgpO1xyXG4gICAgXHJcbiAgICAgICAgdGhpcy5zb3VyY2UgPSBuZXcgSGVqbEVsZW1lbnQobnVsbCxcIlNPVVJDRVwiKTtcclxuICAgICAgICB0aGlzLnNvdXJjZS5idWlsZCgpLnR5cGU9XCJ2aWRlby9tcDRcIjtcclxuICAgICAgIHJ2LmFwcGVuZENoaWxkKHNvdXJjZSk7XHJcbiAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG4gICBzcmMocylcclxuICAge1xyXG4gICAgaWYocz09bnVsbClcclxuICAgICAgICBzID0gXCJcIjtcclxuICAgICAgIHRoaXMuc291cmNlLnNyYyA9IHM7XHJcbiAgIH1cclxufVxyXG53aW5kb3cuVklERU8gPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IGhlamxWaWRlbyhpZCxvcHRpb25zKVxyXG59XHJcbndpbmRvdy5IT1JJWk9OVEFMID0gZnVuY3Rpb24oaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIERJVihpZCxvcHRpb25zKS5jbGFzcyhbXCJob3Jpem9udGFsXCJdKTtcclxufVxyXG53aW5kb3cuSFBBTkVMID0gZnVuY3Rpb24oaWQsb3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIEhPUklaT05UQUwoaWQsb3B0aW9ucykuY2xhc3MoJ2NvbnRhaW5lcicpO1xyXG59XHJcbndpbmRvdy5IT1JJWk9OVEFMU0IgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gSE9SSVpPTlRBTChpZCxvcHRpb25zKS5jbGFzcyhcInNwYWNlQmV0d2VlblwiKTtcclxufVxyXG53aW5kb3cuSFBBTkVMU0IgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gSE9SSVpPTlRBTFNCKGlkLG9wdGlvbnMpLmNsYXNzKCdjb250YWluZXInKTtcclxufVxyXG53aW5kb3cuVkVSVElDQUwgPSBmdW5jdGlvbihpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gRElWKGlkLG9wdGlvbnMpLmNsYXNzKFwidmVydGljYWxcIik7XHJcbn1cclxud2luZG93LlZQQU5FTCA9IGZ1bmN0aW9uKGlkLG9wdGlvbnMpXHJcbntcclxuICAgIHJldHVybiBWRVJUSUNBTChpZCxvcHRpb25zKS5jbGFzcygnY29udGFpbmVyJyk7XHJcbn1cclxud2luZG93Lk5CU1AgPSBmdW5jdGlvbigpXHJcbntcclxuICAgIHJldHVybiBTUEFOKFwiXCIpLmh0bWwoXCImbmJzcDtcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhlamxJbnRlcnZhbChjYWxsYmFjayxpbnRlcnZhbCxjbGVhckludGVydmFsT25FcnJvcilcclxue1xyXG4gICAgdmFyIG4gPSB3aW5kb3cuc2V0SW50ZXJ2YWwoXHJcbiAgICAgICAgKCk9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHN0b3AgPSBUUllDKGNhbGxiYWNrLGNsZWFySW50ZXJ2YWxPbkVycm9yKTtcclxuICAgICAgICAgICAgaWYoc3RvcCA9PSB0cnVlKVxyXG4gICAgICAgICAgICAgICAgY2xlYXIoKTtcclxuICAgICAgICB9LGludGVydmFsKTtcclxuICAgIGZ1bmN0aW9uIGNsZWFyKClcclxuICAgIHtcclxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChuKTtcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY2xlYXI6IGNsZWFyXHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gaGVqbFRpbWVvdXQoY2FsbGJhY2ssaW50ZXJ2YWwpXHJcbntcclxuICAgIHZhciBuID0gd2luZG93LnNldFRpbWVvdXQoRlRSWUMoY2FsbGJhY2spLGludGVydmFsKTtcclxuICAgIGZ1bmN0aW9uIGNsZWFyKClcclxuICAgIHtcclxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KG4pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjbGVhcjogY2xlYXJcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBoZWpsRXZlbnRMaXN0ZW5lcihldmVudElkLGNhbGxiYWNrKVxyXG57XHJcbiAgICB2YXIgcm9vdCA9IGRvY3VtZW50Oy8vcmVxdWlyZShcIi4vaGVqbFwiKS5yb290O1xyXG4gICAgZnVuY3Rpb24gaGFuZGxlKGUpXHJcbiAgICB7XHJcbiAgICAgICAgY2FsbGJhY2soZS5kZXRhaWwsZSk7XHJcbiAgICB9XHJcbiAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRJZCxoYW5kbGUpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZW1vdmUoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcm9vdC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50SWQsY2FsbGJhY2spO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBzZW5kRXZlbnQoZXZlbnRJZCxkYXRhKVxyXG57XHJcbiAgICB2YXIgcm9vdCA9IGRvY3VtZW50Oy8vIHJlcXVpcmUoXCIuL2hlamxcIikucm9vdDtcclxuICAgIHZhciBlID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50SWQseyBkZXRhaWw6IGRhdGF9KTtcclxuICAgIHJvb3QuZGlzcGF0Y2hFdmVudChlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2FzY2FkZUNhbGxzKGNhbGxzLGRlZnZhbClcclxue1xyXG4gICAgaWYoIUFycmF5LmlzQXJyYXkoY2FsbHMpKVxyXG4gICAgICAgIGNhbGxzID0gW2NhbGxzXTtcclxuICAgIHZhciByZXMgPSBudWxsO1xyXG4gICBjYWxscy5maW5kKGNhbGw9PlxyXG4gICAge1xyXG4gICAgICAgIGlmKHR5cGVvZiBjYWxsICE9ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgIHJlcyA9IGNhbGw7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHJlcyA9IFRSWUMoKCk9PmNhbGwocmVzKSk7XHJcbiAgICAgICAgcmV0dXJuIHJlcyA9PSBudWxsIHx8IHJlcyA9PSBmYWxzZTtcclxuICAgIH0pXHJcbiAgICByZXR1cm4gKHJlcyA9PSBudWxsIHx8IHJlcyA9PSBmYWxzZSkgPyBkZWZ2YWw6cmVzO1xyXG59XHJcbndpbmRvdy5DQVNDQURFID0gY2FzY2FkZUNhbGxzO1xyXG5cclxuZnVuY3Rpb24gdHJ5QyhjYWxsLGRlZlZhbClcclxue1xyXG4gICAgdHJ5XHJcbiAgICB7XHJcbiAgICAgICByZXR1cm4gY2FsbCgpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goZSlcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiQ2FsbCBmYWlsZWQhXCIsZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZGVmVmFsO1xyXG59XHJcbndpbmRvdy5FVkVOVExJU1RFTkVSID0gaGVqbEV2ZW50TGlzdGVuZXI7XHJcbndpbmRvdy5TRU5ERVZFTlQgPSBzZW5kRXZlbnQ7XHJcbndpbmRvdy5JTlRFUlZBTCA9IGhlamxJbnRlcnZhbDtcclxud2luZG93LlRSWUMgPSB0cnlDO1xyXG53aW5kb3cuVElNRU9VVCA9IGhlamxUaW1lb3V0O1xyXG53aW5kb3cuRlRSWUMgPSBmdW5jdGlvbihjYWxsLGRlZnZhbClcclxue1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBUUllDKGNhbGwsZGVmdmFsKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgaGVqbElucHV0RmlsZXMgZXh0ZW5kcyBoZWpsSU5QVVRcclxue1xyXG4gICAgY29uc3RydWN0b3IoaWQsb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcihpZCxvcHRpb25zKTtcclxuICAgICAgICB0aGlzLnR5cGU9XCJmaWxlXCI7ICAgICAgICBcclxuICAgIH1cclxuICAgIG11bHRpcGxlKG0pXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tdWx0aXBsZSA9IG0gPT0gbnVsbCA/IHRydWUgOiBtO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgc2V0dXBJbnB1dChydilcclxuICAgIHtcclxuICAgICAgICAvL3N1cGVyLnNldHVwSW5wdXQoZWwpO1xyXG4gICAgICAgIHJ2LnNldEF0dHJpYnV0ZShcInR5cGVcIix0aGlzLnR5cGUpO1xyXG4gICAgICAgIGlmKHRoaXMubXVsdGlwbGUpXHJcbiAgICAgICAgICAgIHJ2LnNldEF0dHJpYnV0ZShcIm11bHRpcGxlXCIsXCJtdWx0aXBsZVwiKVxyXG4gICAgICAgIHJ2LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsdGhpcy5maXJlT25DaGFuZ2UuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgICBmaXJlT25DaGFuZ2UoYXJncylcclxuICAgIHtcclxuICAgICAgICBpZih0aGlzLmZpbGVDYiAhPSBudWxsKVxyXG4gICAgICAgICAgICB0aGlzLmZpbGVDYih0aGlzLmJ1aWxkKCkuZmlsZXMsYXJncyx0aGlzKTtcclxuICAgICAgICB0aGlzLmJ1aWxkKCkudmFsdWUgPSBudWxsO1xyXG4gICAgfSAgIFxyXG4gICAgb25GaWxlcyhmaWxlQ2IpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5maWxlQ2IgPSBmaWxlQ2I7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn1cclxud2luZG93LmhlamxJbnB1dEZpbGVzID0gaGVqbElucHV0RmlsZXM7XHJcbmZ1bmN0aW9uIElOUFVURklMRVModGV4dCxpZCxvcHRpb25zKVxyXG57XHJcbiAgICB2YXIgaW5wSGVqbCA9IG5ldyBoZWpsSW5wdXRGaWxlcyhcInVwbG9hZElucHV0XCIsb3B0aW9ucyk7XHJcbiAgICB2YXIgcnYgPVxyXG4gICAgICAgIExBQkVMKFwiXCIsaWQsb3B0aW9ucykuc3RhY2soW1xyXG4gICAgICAgICAgICBTUEFOKCkuY2xhc3MoW1wiZmFcIixcImZhLWNsb3VkLXVwbG9hZFwiXSksXHJcbiAgICAgICAgICAgIFNQQU4oXCIgXCIrdGV4dCxcImxhYmVsXCIpLFxyXG4gICAgICAgICAgICBpbnBIZWpsXHJcbiAgICAgICAgXSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcnYucHJvY2Vzc29yKChlKT0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBlLmJ1aWxkKCkuc2V0QXR0cmlidXRlKCdmb3InLCd1cGxvYWRJbnB1dCcpO1xyXG4gICAgICAgIH0pLmNsYXNzKFwiY3VzdG9tLXVwbG9hZFwiKTtcclxuICAgIHJ2Lm11bHRpcGxlID0gZnVuY3Rpb24oYXJnKVxyXG4gICAge1xyXG4gICAgICAgIGlucEhlamwubXVsdGlwbGUoYXJnKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIHJ2Lm9uRmlsZXMgPSBmdW5jdGlvbihjYilcclxuICAgIHtcclxuICAgICAgICBpbnBIZWpsLm9uRmlsZXMoY2IpXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBydi5pbnB1dEhlamwgPSBpbnBIZWpsO1xyXG4gICAgcnYucHJvY2Vzc0lucHV0SGVqbCA9IGZ1bmN0aW9uKGNiKVxyXG4gICAge1xyXG4gICAgICAgIGNiKHRoaXMuaW5wdXRIZWpsKVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJ2O1xyXG59XHJcblxyXG5cclxud2luZG93LklOUFVURklMRVMgPSBJTlBVVEZJTEVTO1xyXG5cclxubW9kdWxlLmV4cG9ydHMuaGVqbERJViA9IGhlamxESVY7XHJcbm1vZHVsZS5leHBvcnRzLkhlamxFbGVtZW50ID0gSGVqbEVsZW1lbnQ7XHJcbm1vZHVsZS5leHBvcnRzLmhlamxJRlJBTUUgPSBoZWpsSUZSQU1FOyIsImNvbnN0IGkxOG5leHQgPSByZXF1aXJlKCdpMThuZXh0Jyk7XHJcbmNvbnN0IGkxOG5leHRIdHRwQmFja2VuZCA9IHJlcXVpcmUoJ2kxOG5leHQtaHR0cC1iYWNrZW5kJyk7XHJcblxyXG5mdW5jdGlvbiBpbml0KCkge1xyXG5cclxuICAgIGNvbnN0IHJ2ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGkxOG5leHRcclxuICAgICAgICAgICAgLnVzZShpMThuZXh0SHR0cEJhY2tlbmQpXHJcbiAgICAgICAgICAgIC5pbml0KHtcclxuICAgICAgICAgICAgICAgIGxuZzogJ2NzJyxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBhbGxvdyBrZXlzIHRvIGJlIHBocmFzZXMgaGF2aW5nIGA6YCwgYC5gXHJcbiAgICAgICAgICAgICAgICBuc1NlcGFyYXRvcjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBrZXlTZXBhcmF0b3I6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZGVidWc6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAvLyBkbyBub3QgbG9hZCBhIGZhbGxiYWNrXHJcbiAgICAgICAgICAgICAgICBmYWxsYmFja0xuZzogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBuczogWydhcHAnXSxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHROUzogJ2FwcCcsXHJcbiAgICAgICAgICAgICAgICBiYWNrZW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZFBhdGg6ICcvbG9jYWxlcy97e2xuZ319L3t7bnN9fS5qc29uJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImkxOG4gSW5pdCBjb21wbGV0ZVwiKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgIH0pXHJcblxyXG5cclxuICAgIHdpbmRvdy5UID0gKGtleSwgZGF0YSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBpMThuZXh0LnQoa2V5LCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICB3aW5kb3cuVEIgPSAoa2V5KSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBpMThuZXh0LnQoa2V5LCBkYXRhKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcnY7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaW5pdDsiLCJjb25zdCB7IEhlamxFbGVtZW50IH0gPSByZXF1aXJlKCcuL2hlamxFbGVtZW50Jyk7XHJcblxyXG5jbGFzcyBIZWpsTG92QmFzZVxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcigpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBbXTtcclxuICAgICAgICB0aGlzLm1hbmFnZXIgPSBuZXcgT3B0aW9uc01hbmFnZXIoKTtcclxuICAgICAgICB0aGlzLm9wdEJpbmRlciA9IHtcclxuICAgICAgICAgICAgc2hvdzogKGl0KT0+aXQsXHJcbiAgICAgICAgICAgIGtleTogKGl0KT0+aXRcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zbGF2ZXMgPSBbXVxyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBtYXJrcyB0aGUgbG92IGFzIG11bHRpc2VsZWN0XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzTXVsdGlzZWxlY3QgdHJ1ZSBpZiB0aGlzIGlzIG11dGlzZWxlY3QgbG92IFxyXG4gICAgICovXHJcbiAgICBtdWx0aXNlbGVjdChpc011bHRpc2VsZWN0KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXNNdWx0aXNlbGVjdCA9IGlzTXVsdGlzZWxlY3Q7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGF0dGFjaChoZWpsRWxlbWVudClcclxuICAgIHtcclxuICAgICAgICBoZWpsRWxlbWVudC5sb3YgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuaGVqbEVsZW1lbnQgPWhlamxFbGVtZW50O1xyXG4gICAgICAgIGhlamxFbGVtZW50Lm9wdHMgPSB0aGlzLm9wdGlvbnMuYmluZCh0aGlzKTtcclxuICAgICAgICBoZWpsRWxlbWVudC5vcHRpb25CaW5kZXIgPSB0aGlzLm9wdGlvbkJpbmRlci5iaW5kKHRoaXMpO1xyXG4gICAgICAgIGhlamxFbGVtZW50Lm9wdGlvbnNNYW5hZ2VyID0gdGhpcy5vcHRpb25zTWFuYWdlci5iaW5kKHRoaXMpO1xyXG4gICAgICAgIGhlamxFbGVtZW50LmNoZWNrRmlsbGVkID0gdGhpcy5jaGVja0ZpbGxlZC5iaW5kKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuZWxiaW5kZXIgPSBoZWpsRWxlbWVudC5iaW5kZXI7XHJcbiAgICAgICAgaGVqbEVsZW1lbnQuYmluZGVyID0gdGhpcy5iaW5kZXIuYmluZCh0aGlzKTtcclxuICAgIH1cclxuICAgIGJpbmRlcihjYilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmVsYmluZGVyLmJpbmQodGhpcy5oZWpsRWxlbWVudCkoY2IpO1xyXG4gICAgICAgIHZhciBvYmluZGVyID0gdGhpcy5oZWpsRWxlbWVudC5iaW5kRnVuYztcclxuICAgICAgICB0aGlzLmhlamxFbGVtZW50LmJpbmRGdW5jID0gKG1vZGVsLGVsKT0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdiAgPSBvYmluZGVyLmJpbmQodGhpcykobW9kZWwsZWwpO1xyXG4gICAgICAgICAgICBpZighQXJyYXkuaXNBcnJheSh2KSlcclxuICAgICAgICAgICAgICAgIHYgPSBbdl07XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnNlbE1hcCA9IHt9O1xyXG4gICAgICAgICAgICB2LmZvckVhY2godmk9PlxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzID0gdGhpcy5tYW5hZ2VyLm9wdGlvbkZvcktleSh2aSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYocyAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24ucHVzaChzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxNYXBbdmldID0gcztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHY7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmhlamxFbGVtZW50O1xyXG4gICAgfVxyXG4gICAgY2hlY2tGaWxsZWQoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdGlvbi5sZW5ndGggPiAwO1xyXG4gICAgfVxyXG4gICAgb3B0aW9ucyhvcHRpb25zQ2IpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zQ2IgPSBvcHRpb25zQ2I7XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyLm9wdGlvbnNDYWxsYmFjayhvcHRpb25zQ2IpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhlamxFbGVtZW50O1xyXG4gICAgfVxyXG4gICAgb3B0aW9uQmluZGVyKG9wdGlvbnNCaW5kZXIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRCaW5kZXIgPSBvcHRpb25zQmluZGVyO1xyXG4gICAgICAgIHRoaXMubWFuYWdlci5vcHRpb25CaW5kZXIob3B0aW9uc0JpbmRlcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaGVqbEVsZW1lbnQ7XHJcbiAgICB9XHJcbiAgICBvcHRpb25zTWFuYWdlcihtYW5hZ2VyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlciA9IG1hbmFnZXI7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvdyhpdClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vcHRCaW5kZXIuc2hvdyhpdCk7XHJcbiAgICB9XHJcbiAgICBsaXN0T3B0aW9ucygpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFuYWdlci5saXN0T3B0aW9ucygpO1xyXG4gICAgfVxyXG4gICAgaXNTZWxlY3RlZChpdClcclxuICAgIHtcclxuICAgICAgICB2YXIga2V5ID0gdGhpcy5vcHRCaW5kZXIua2V5KGl0KTtcclxuICAgICAgICB2YXIgcnYgPSB0aGlzLnNlbE1hcFtrZXldICE9IG51bGw7XHJcbiAgICBcclxuICAgICAgICByZXR1cm4gcnY7XHJcbiAgICB9XHJcbiAgICBhZGRTbGF2ZShvdGhlckxvdilcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNsYXZlcy5wdXNoKG90aGVyTG92KTtcclxuICAgIH1cclxuICAgIG1hc3RlckNoYW5nZWQobWFzdGVyTG92KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubWFuYWdlci5yZXNldChtYXN0ZXJMb3Yuc2VsZWN0aW9uKTtcclxuICAgICAgICB0aGlzLmhlamxFbGVtZW50LnJlYmluZCgpO1xyXG4gICAgfVxyXG4gICAgc2VsZWN0KGl0LHN0YXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHN0YXRlID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHN0YXRlID0gdHJ1ZTtcclxuICAgICBcclxuICAgICAgICBcclxuICAgICAgICB2YXIga2V5ID0gdGhpcy5vcHRCaW5kZXIua2V5KGl0KTtcclxuICAgICAgICBpZighdGhpcy5pc011bHRpc2VsZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBbaXRdOyAvLyBzaW5nbGUgdmFsdWUgc2VsZWN0XHJcbiAgICAgICAgICAgIHRoaXMuc2VsTWFwID0ge307XHJcbiAgICAgICAgICAgIHRoaXMuc2VsTWFwW2tleV0gPSBpdDtcclxuICAgICAgICAgICAgdGhpcy5oZWpsRWxlbWVudC51cGRhdGUoa2V5ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKHN0YXRlICYmIHRoaXMuc2VsTWFwW2tleV0gIT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgaWYoIXN0YXRlICYmIHRoaXMuc2VsTWFwW2tleV0gPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGlmKCFzdGF0ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuc2VsTWFwW2tleV07XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5zZWxlY3Rpb24uaW5kZXhPZihpdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IHRoaXMuc2VsZWN0aW9uLnNwbGljZShpZHgsMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbE1hcFtrZXldID0gaXQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbi5wdXNoKGl0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIHZhciBydiA9IFtdXHJcbiAgICAgICAgICAgIGZvcih2YXIgayBpbiB0aGlzLnNlbE1hcClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcnYucHVzaChrKTtcclxuICAgICAgICAgICAgfSAgICBcclxuICAgICAgICAgICAgdGhpcy5oZWpsRWxlbWVudC51cGRhdGUocnYpO1xyXG4gICAgICAgIH1cclxuICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2xhdmVzLmZvckVhY2goZGVwPT5kZXAubWFzdGVyQ2hhbmdlZCh0aGlzKSlcclxuICAgICAgICB0aGlzLmhlamxFbGVtZW50LnJlYmluZCgpO1xyXG4gICAgICAgIHRoaXMuaGVqbEVsZW1lbnQuY2hlY2tFcnJvckhpZ2xpZ2h0KCk7XHJcbiAgICB9XHJcbiAgIFxyXG4gICAgZm9yU2VsZWN0ZWRWYWx1ZShjYilcclxuICAgIHtcclxuICAgICAgICB0aGlzLnNlbGVjdGlvbi5mb3JFYWNoKGNiKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmNsYXNzIE9wdGlvbnNNYW5hZ2VyXHJcbntcclxuXHJcbiAgICBvcHRpb25CaW5kZXIoYmluZGVyKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9uQmluZGVyID0gYmluZGVyO1xyXG4gICAgfVxyXG4gICAgb3B0aW9uc0NhbGxiYWNrKG9wdGlvbnNDYilcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnNDYiA9IG9wdGlvbnNDYjtcclxuICAgIH1cclxuICAgIG9wdGlvbkZvcktleShrZXkpXHJcbiAgICB7XHJcbiAgICAgICAgaWYoIXRoaXMub3B0aW9uc01hcClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9uc01hcCA9IHt9XHJcbiAgICAgICAgICAgIHZhciBsaXN0ID0gdGhpcy5saXN0T3B0aW9ucygpO1xyXG4gICAgICAgICAgICBsaXN0LmZvckVhY2gob3B0PT5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNNYXBbdGhpcy5vcHRpb25CaW5kZXIua2V5KG9wdCldID0gb3B0O1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJ2ID0gdGhpcy5vcHRpb25zTWFwW2tleV07XHJcbiAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG5cclxuICAgIGxpc3RPcHRpb25zKClcclxuICAgIHtcclxuICAgICAgICBpZighdGhpcy5vcHRpb25zTGlzdClcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zTGlzdCA9IHRoaXMub3B0aW9uc0NiKHRoaXMpO1xyXG4gICAgICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnNMaXN0O1xyXG4gICAgfVxyXG5cclxuICAgIHJlc2V0KG1hc3RlclNlbGVjdGlvbilcclxuICAgIHtcclxuICAgICAgICB0aGlzLm1hc3RlclNlbGVjdGlvbiA9IG1hc3RlclNlbGVjdGlvbjtcclxuICAgICAgICB0aGlzLm9wdGlvbnNNYXAgPSBudWxsO1xyXG4gICAgICAgIHRoaXMub3B0aW9uc0xpc3QgPSBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5IZWpsTG92QmFzZSA9IEhlamxMb3ZCYXNlO1xyXG5tb2R1bGUuZXhwb3J0cy5PcHRpb25zTWFuYWdlciA9IE9wdGlvbnNNYW5hZ2VyOyIsImZ1bmN0aW9uIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZikge1xuICBpZiAoc2VsZiA9PT0gdm9pZCAwKSB7XG4gICAgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpO1xuICB9XG5cbiAgcmV0dXJuIHNlbGY7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX2Fzc2VydFRoaXNJbml0aWFsaXplZDsiLCJmdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7XG4gIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF9jbGFzc0NhbGxDaGVjazsiLCJmdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldO1xuICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtcbiAgICBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7XG4gICAgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTtcbiAgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpO1xuICByZXR1cm4gQ29uc3RydWN0b3I7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX2NyZWF0ZUNsYXNzOyIsImZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpIHtcbiAgaWYgKGtleSBpbiBvYmopIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHtcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIG9ialtrZXldID0gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gb2JqO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF9kZWZpbmVQcm9wZXJ0eTsiLCJmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2Yobykge1xuICBtb2R1bGUuZXhwb3J0cyA9IF9nZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5nZXRQcm90b3R5cGVPZiA6IGZ1bmN0aW9uIF9nZXRQcm90b3R5cGVPZihvKSB7XG4gICAgcmV0dXJuIG8uX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKTtcbiAgfTtcbiAgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfZ2V0UHJvdG90eXBlT2Y7IiwidmFyIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZShcIi4vc2V0UHJvdG90eXBlT2ZcIik7XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykge1xuICBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpO1xuICB9XG5cbiAgc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBzdWJDbGFzcyxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfVxuICB9KTtcbiAgaWYgKHN1cGVyQ2xhc3MpIHNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfaW5oZXJpdHM7IiwidmFyIGRlZmluZVByb3BlcnR5ID0gcmVxdWlyZShcIi4vZGVmaW5lUHJvcGVydHlcIik7XG5cbmZ1bmN0aW9uIF9vYmplY3RTcHJlYWQodGFyZ2V0KSB7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXSAhPSBudWxsID8gT2JqZWN0KGFyZ3VtZW50c1tpXSkgOiB7fTtcbiAgICB2YXIgb3duS2V5cyA9IE9iamVjdC5rZXlzKHNvdXJjZSk7XG5cbiAgICBpZiAodHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG93bktleXMgPSBvd25LZXlzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHNvdXJjZSkuZmlsdGVyKGZ1bmN0aW9uIChzeW0pIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc291cmNlLCBzeW0pLmVudW1lcmFibGU7XG4gICAgICB9KSk7XG4gICAgfVxuXG4gICAgb3duS2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCBzb3VyY2Vba2V5XSk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF9vYmplY3RTcHJlYWQ7IiwidmFyIF90eXBlb2YgPSByZXF1aXJlKFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy90eXBlb2ZcIik7XG5cbnZhciBhc3NlcnRUaGlzSW5pdGlhbGl6ZWQgPSByZXF1aXJlKFwiLi9hc3NlcnRUaGlzSW5pdGlhbGl6ZWRcIik7XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHtcbiAgaWYgKGNhbGwgJiYgKF90eXBlb2YoY2FsbCkgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikpIHtcbiAgICByZXR1cm4gY2FsbDtcbiAgfVxuXG4gIHJldHVybiBhc3NlcnRUaGlzSW5pdGlhbGl6ZWQoc2VsZik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm47IiwiZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBfc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24gX3NldFByb3RvdHlwZU9mKG8sIHApIHtcbiAgICBvLl9fcHJvdG9fXyA9IHA7XG4gICAgcmV0dXJuIG87XG4gIH07XG5cbiAgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfc2V0UHJvdG90eXBlT2Y7IiwiZnVuY3Rpb24gX3R5cGVvZihvYmopIHtcbiAgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiO1xuXG4gIGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIG9iajtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIG1vZHVsZS5leHBvcnRzID0gX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7XG4gICAgICByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIF90eXBlb2Yob2JqKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfdHlwZW9mOyIsInZhciBmZXRjaEFwaVxuaWYgKHR5cGVvZiBmZXRjaCA9PT0gJ2Z1bmN0aW9uJykge1xuICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsLmZldGNoKSB7XG4gICAgZmV0Y2hBcGkgPSBnbG9iYWwuZmV0Y2hcbiAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuZmV0Y2gpIHtcbiAgICBmZXRjaEFwaSA9IHdpbmRvdy5mZXRjaFxuICB9XG59XG5cbmlmICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCcgJiYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiB3aW5kb3cuZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSkge1xuICB2YXIgZiA9IGZldGNoQXBpIHx8IHJlcXVpcmUoJ25vZGUtZmV0Y2gnKVxuICBpZiAoZi5kZWZhdWx0KSBmID0gZi5kZWZhdWx0XG4gIGV4cG9ydHMuZGVmYXVsdCA9IGZcbiAgbW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzLmRlZmF1bHRcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gdm9pZCAwO1xuXG52YXIgX3V0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG5cbnZhciBfcmVxdWVzdCA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIi4vcmVxdWVzdC5qc1wiKSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH1cblxuZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSkgeyBpZiAoa2V5IGluIG9iaikgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHsgdmFsdWU6IHZhbHVlLCBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlIH0pOyB9IGVsc2UgeyBvYmpba2V5XSA9IHZhbHVlOyB9IHJldHVybiBvYmo7IH1cblxudmFyIGdldERlZmF1bHRzID0gZnVuY3Rpb24gZ2V0RGVmYXVsdHMoKSB7XG4gIHJldHVybiB7XG4gICAgbG9hZFBhdGg6ICcvbG9jYWxlcy97e2xuZ319L3t7bnN9fS5qc29uJyxcbiAgICBhZGRQYXRoOiAnL2xvY2FsZXMvYWRkL3t7bG5nfX0ve3tuc319JyxcbiAgICBhbGxvd011bHRpTG9hZGluZzogZmFsc2UsXG4gICAgcGFyc2U6IGZ1bmN0aW9uIHBhcnNlKGRhdGEpIHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGRhdGEpO1xuICAgIH0sXG4gICAgc3RyaW5naWZ5OiBKU09OLnN0cmluZ2lmeSxcbiAgICBwYXJzZVBheWxvYWQ6IGZ1bmN0aW9uIHBhcnNlUGF5bG9hZChuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSkge1xuICAgICAgcmV0dXJuIF9kZWZpbmVQcm9wZXJ0eSh7fSwga2V5LCBmYWxsYmFja1ZhbHVlIHx8ICcnKTtcbiAgICB9LFxuICAgIHJlcXVlc3Q6IF9yZXF1ZXN0LmRlZmF1bHQsXG4gICAgcmVsb2FkSW50ZXJ2YWw6IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gZmFsc2UgOiA2MCAqIDYwICogMTAwMCxcbiAgICBjdXN0b21IZWFkZXJzOiB7fSxcbiAgICBxdWVyeVN0cmluZ1BhcmFtczoge30sXG4gICAgY3Jvc3NEb21haW46IGZhbHNlLFxuICAgIHdpdGhDcmVkZW50aWFsczogZmFsc2UsXG4gICAgb3ZlcnJpZGVNaW1lVHlwZTogZmFsc2UsXG4gICAgcmVxdWVzdE9wdGlvbnM6IHtcbiAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgIGNyZWRlbnRpYWxzOiAnc2FtZS1vcmlnaW4nLFxuICAgICAgY2FjaGU6ICdkZWZhdWx0J1xuICAgIH1cbiAgfTtcbn07XG5cbnZhciBCYWNrZW5kID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBCYWNrZW5kKHNlcnZpY2VzKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIHZhciBhbGxPcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB7fTtcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBCYWNrZW5kKTtcblxuICAgIHRoaXMuc2VydmljZXMgPSBzZXJ2aWNlcztcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuYWxsT3B0aW9ucyA9IGFsbE9wdGlvbnM7XG4gICAgdGhpcy50eXBlID0gJ2JhY2tlbmQnO1xuICAgIHRoaXMuaW5pdChzZXJ2aWNlcywgb3B0aW9ucywgYWxsT3B0aW9ucyk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoQmFja2VuZCwgW3tcbiAgICBrZXk6IFwiaW5pdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpbml0KHNlcnZpY2VzKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgICB2YXIgYWxsT3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG4gICAgICB0aGlzLnNlcnZpY2VzID0gc2VydmljZXM7XG4gICAgICB0aGlzLm9wdGlvbnMgPSAoMCwgX3V0aWxzLmRlZmF1bHRzKShvcHRpb25zLCB0aGlzLm9wdGlvbnMgfHwge30sIGdldERlZmF1bHRzKCkpO1xuICAgICAgdGhpcy5hbGxPcHRpb25zID0gYWxsT3B0aW9ucztcblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZWxvYWRJbnRlcnZhbCkge1xuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLnJlbG9hZCgpO1xuICAgICAgICB9LCB0aGlzLm9wdGlvbnMucmVsb2FkSW50ZXJ2YWwpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZWFkTXVsdGlcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVhZE11bHRpKGxhbmd1YWdlcywgbmFtZXNwYWNlcywgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsb2FkUGF0aCA9IHRoaXMub3B0aW9ucy5sb2FkUGF0aDtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMubG9hZFBhdGggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbG9hZFBhdGggPSB0aGlzLm9wdGlvbnMubG9hZFBhdGgobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHVybCA9IHRoaXMuc2VydmljZXMuaW50ZXJwb2xhdG9yLmludGVycG9sYXRlKGxvYWRQYXRoLCB7XG4gICAgICAgIGxuZzogbGFuZ3VhZ2VzLmpvaW4oJysnKSxcbiAgICAgICAgbnM6IG5hbWVzcGFjZXMuam9pbignKycpXG4gICAgICB9KTtcbiAgICAgIHRoaXMubG9hZFVybCh1cmwsIGNhbGxiYWNrLCBsYW5ndWFnZXMsIG5hbWVzcGFjZXMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZWFkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlYWQobGFuZ3VhZ2UsIG5hbWVzcGFjZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsb2FkUGF0aCA9IHRoaXMub3B0aW9ucy5sb2FkUGF0aDtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMubG9hZFBhdGggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbG9hZFBhdGggPSB0aGlzLm9wdGlvbnMubG9hZFBhdGgoW2xhbmd1YWdlXSwgW25hbWVzcGFjZV0pO1xuICAgICAgfVxuXG4gICAgICB2YXIgdXJsID0gdGhpcy5zZXJ2aWNlcy5pbnRlcnBvbGF0b3IuaW50ZXJwb2xhdGUobG9hZFBhdGgsIHtcbiAgICAgICAgbG5nOiBsYW5ndWFnZSxcbiAgICAgICAgbnM6IG5hbWVzcGFjZVxuICAgICAgfSk7XG4gICAgICB0aGlzLmxvYWRVcmwodXJsLCBjYWxsYmFjaywgbGFuZ3VhZ2UsIG5hbWVzcGFjZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImxvYWRVcmxcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbG9hZFVybCh1cmwsIGNhbGxiYWNrLCBsYW5ndWFnZXMsIG5hbWVzcGFjZXMpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICB0aGlzLm9wdGlvbnMucmVxdWVzdCh0aGlzLm9wdGlvbnMsIHVybCwgdW5kZWZpbmVkLCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgaWYgKHJlcyAmJiAocmVzLnN0YXR1cyA+PSA1MDAgJiYgcmVzLnN0YXR1cyA8IDYwMCB8fCAhcmVzLnN0YXR1cykpIHJldHVybiBjYWxsYmFjaygnZmFpbGVkIGxvYWRpbmcgJyArIHVybCwgdHJ1ZSk7XG4gICAgICAgIGlmIChyZXMgJiYgcmVzLnN0YXR1cyA+PSA0MDAgJiYgcmVzLnN0YXR1cyA8IDUwMCkgcmV0dXJuIGNhbGxiYWNrKCdmYWlsZWQgbG9hZGluZyAnICsgdXJsLCBmYWxzZSk7XG4gICAgICAgIGlmICghcmVzICYmIGVyciAmJiBlcnIubWVzc2FnZSAmJiBlcnIubWVzc2FnZS5pbmRleE9mKCdGYWlsZWQgdG8gZmV0Y2gnKSA+IC0xKSByZXR1cm4gY2FsbGJhY2soJ2ZhaWxlZCBsb2FkaW5nICcgKyB1cmwsIHRydWUpO1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyLCBmYWxzZSk7XG4gICAgICAgIHZhciByZXQsIHBhcnNlRXJyO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXMuZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldCA9IF90aGlzMi5vcHRpb25zLnBhcnNlKHJlcy5kYXRhLCBsYW5ndWFnZXMsIG5hbWVzcGFjZXMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXQgPSByZXMuZGF0YTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBwYXJzZUVyciA9ICdmYWlsZWQgcGFyc2luZyAnICsgdXJsICsgJyB0byBqc29uJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXJzZUVycikgcmV0dXJuIGNhbGxiYWNrKHBhcnNlRXJyLCBmYWxzZSk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJldCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiY3JlYXRlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZShsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlKSB7XG4gICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYWRkUGF0aCkgcmV0dXJuO1xuICAgICAgaWYgKHR5cGVvZiBsYW5ndWFnZXMgPT09ICdzdHJpbmcnKSBsYW5ndWFnZXMgPSBbbGFuZ3VhZ2VzXTtcbiAgICAgIHZhciBwYXlsb2FkID0gdGhpcy5vcHRpb25zLnBhcnNlUGF5bG9hZChuYW1lc3BhY2UsIGtleSwgZmFsbGJhY2tWYWx1ZSk7XG4gICAgICBsYW5ndWFnZXMuZm9yRWFjaChmdW5jdGlvbiAobG5nKSB7XG4gICAgICAgIHZhciB1cmwgPSBfdGhpczMuc2VydmljZXMuaW50ZXJwb2xhdG9yLmludGVycG9sYXRlKF90aGlzMy5vcHRpb25zLmFkZFBhdGgsIHtcbiAgICAgICAgICBsbmc6IGxuZyxcbiAgICAgICAgICBuczogbmFtZXNwYWNlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIF90aGlzMy5vcHRpb25zLnJlcXVlc3QoX3RoaXMzLm9wdGlvbnMsIHVybCwgcGF5bG9hZCwgZnVuY3Rpb24gKGRhdGEsIHJlcykge30pO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbG9hZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZWxvYWQoKSB7XG4gICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuICAgICAgdmFyIF90aGlzJHNlcnZpY2VzID0gdGhpcy5zZXJ2aWNlcyxcbiAgICAgICAgICBiYWNrZW5kQ29ubmVjdG9yID0gX3RoaXMkc2VydmljZXMuYmFja2VuZENvbm5lY3RvcixcbiAgICAgICAgICBsYW5ndWFnZVV0aWxzID0gX3RoaXMkc2VydmljZXMubGFuZ3VhZ2VVdGlscyxcbiAgICAgICAgICBsb2dnZXIgPSBfdGhpcyRzZXJ2aWNlcy5sb2dnZXI7XG4gICAgICB2YXIgY3VycmVudExhbmd1YWdlID0gYmFja2VuZENvbm5lY3Rvci5sYW5ndWFnZTtcbiAgICAgIGlmIChjdXJyZW50TGFuZ3VhZ2UgJiYgY3VycmVudExhbmd1YWdlLnRvTG93ZXJDYXNlKCkgPT09ICdjaW1vZGUnKSByZXR1cm47XG4gICAgICB2YXIgdG9Mb2FkID0gW107XG5cbiAgICAgIHZhciBhcHBlbmQgPSBmdW5jdGlvbiBhcHBlbmQobG5nKSB7XG4gICAgICAgIHZhciBsbmdzID0gbGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkobG5nKTtcbiAgICAgICAgbG5ncy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgaWYgKHRvTG9hZC5pbmRleE9mKGwpIDwgMCkgdG9Mb2FkLnB1c2gobCk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgYXBwZW5kKGN1cnJlbnRMYW5ndWFnZSk7XG4gICAgICBpZiAodGhpcy5hbGxPcHRpb25zLnByZWxvYWQpIHRoaXMuYWxsT3B0aW9ucy5wcmVsb2FkLmZvckVhY2goZnVuY3Rpb24gKGwpIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZChsKTtcbiAgICAgIH0pO1xuICAgICAgdG9Mb2FkLmZvckVhY2goZnVuY3Rpb24gKGxuZykge1xuICAgICAgICBfdGhpczQuYWxsT3B0aW9ucy5ucy5mb3JFYWNoKGZ1bmN0aW9uIChucykge1xuICAgICAgICAgIGJhY2tlbmRDb25uZWN0b3IucmVhZChsbmcsIG5zLCAncmVhZCcsIG51bGwsIG51bGwsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIGxvZ2dlci53YXJuKFwibG9hZGluZyBuYW1lc3BhY2UgXCIuY29uY2F0KG5zLCBcIiBmb3IgbGFuZ3VhZ2UgXCIpLmNvbmNhdChsbmcsIFwiIGZhaWxlZFwiKSwgZXJyKTtcbiAgICAgICAgICAgIGlmICghZXJyICYmIGRhdGEpIGxvZ2dlci5sb2coXCJsb2FkZWQgbmFtZXNwYWNlIFwiLmNvbmNhdChucywgXCIgZm9yIGxhbmd1YWdlIFwiKS5jb25jYXQobG5nKSwgZGF0YSk7XG4gICAgICAgICAgICBiYWNrZW5kQ29ubmVjdG9yLmxvYWRlZChcIlwiLmNvbmNhdChsbmcsIFwifFwiKS5jb25jYXQobnMpLCBlcnIsIGRhdGEpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBCYWNrZW5kO1xufSgpO1xuXG5CYWNrZW5kLnR5cGUgPSAnYmFja2VuZCc7XG52YXIgX2RlZmF1bHQgPSBCYWNrZW5kO1xuZXhwb3J0cy5kZWZhdWx0ID0gX2RlZmF1bHQ7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMuZGVmYXVsdDsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZvaWQgMDtcblxudmFyIF91dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xuXG52YXIgZmV0Y2hOb2RlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQocmVxdWlyZShcIi4vZ2V0RmV0Y2guanNcIikpO1xuXG5mdW5jdGlvbiBfZ2V0UmVxdWlyZVdpbGRjYXJkQ2FjaGUoKSB7IGlmICh0eXBlb2YgV2Vha01hcCAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gbnVsbDsgdmFyIGNhY2hlID0gbmV3IFdlYWtNYXAoKTsgX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlID0gZnVuY3Rpb24gX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlKCkgeyByZXR1cm4gY2FjaGU7IH07IHJldHVybiBjYWNoZTsgfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGlmIChvYmogPT09IG51bGwgfHwgX3R5cGVvZihvYmopICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiBvYmogIT09IFwiZnVuY3Rpb25cIikgeyByZXR1cm4geyBkZWZhdWx0OiBvYmogfTsgfSB2YXIgY2FjaGUgPSBfZ2V0UmVxdWlyZVdpbGRjYXJkQ2FjaGUoKTsgaWYgKGNhY2hlICYmIGNhY2hlLmhhcyhvYmopKSB7IHJldHVybiBjYWNoZS5nZXQob2JqKTsgfSB2YXIgbmV3T2JqID0ge307IHZhciBoYXNQcm9wZXJ0eURlc2NyaXB0b3IgPSBPYmplY3QuZGVmaW5lUHJvcGVydHkgJiYgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyB2YXIgZGVzYyA9IGhhc1Byb3BlcnR5RGVzY3JpcHRvciA/IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpIDogbnVsbDsgaWYgKGRlc2MgJiYgKGRlc2MuZ2V0IHx8IGRlc2Muc2V0KSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkobmV3T2JqLCBrZXksIGRlc2MpOyB9IGVsc2UgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgaWYgKGNhY2hlKSB7IGNhY2hlLnNldChvYmosIG5ld09iaik7IH0gcmV0dXJuIG5ld09iajsgfVxuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbnZhciBmZXRjaEFwaTtcblxuaWYgKHR5cGVvZiBmZXRjaCA9PT0gJ2Z1bmN0aW9uJykge1xuICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsLmZldGNoKSB7XG4gICAgZmV0Y2hBcGkgPSBnbG9iYWwuZmV0Y2g7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmZldGNoKSB7XG4gICAgZmV0Y2hBcGkgPSB3aW5kb3cuZmV0Y2g7XG4gIH1cbn1cblxudmFyIFhtbEh0dHBSZXF1ZXN0QXBpO1xuXG5pZiAodHlwZW9mIFhNTEh0dHBSZXF1ZXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyAmJiBnbG9iYWwuWE1MSHR0cFJlcXVlc3QpIHtcbiAgICBYbWxIdHRwUmVxdWVzdEFwaSA9IGdsb2JhbC5YTUxIdHRwUmVxdWVzdDtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuWE1MSHR0cFJlcXVlc3QpIHtcbiAgICBYbWxIdHRwUmVxdWVzdEFwaSA9IHdpbmRvdy5YTUxIdHRwUmVxdWVzdDtcbiAgfVxufVxuXG52YXIgQWN0aXZlWE9iamVjdEFwaTtcblxuaWYgKHR5cGVvZiBBY3RpdmVYT2JqZWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyAmJiBnbG9iYWwuQWN0aXZlWE9iamVjdCkge1xuICAgIEFjdGl2ZVhPYmplY3RBcGkgPSBnbG9iYWwuQWN0aXZlWE9iamVjdDtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuQWN0aXZlWE9iamVjdCkge1xuICAgIEFjdGl2ZVhPYmplY3RBcGkgPSB3aW5kb3cuQWN0aXZlWE9iamVjdDtcbiAgfVxufVxuXG5pZiAoIWZldGNoQXBpICYmIGZldGNoTm9kZSAmJiAhWG1sSHR0cFJlcXVlc3RBcGkgJiYgIUFjdGl2ZVhPYmplY3RBcGkpIGZldGNoQXBpID0gZmV0Y2hOb2RlLmRlZmF1bHQgfHwgZmV0Y2hOb2RlO1xuaWYgKHR5cGVvZiBmZXRjaEFwaSAhPT0gJ2Z1bmN0aW9uJykgZmV0Y2hBcGkgPSB1bmRlZmluZWQ7XG5cbnZhciBhZGRRdWVyeVN0cmluZyA9IGZ1bmN0aW9uIGFkZFF1ZXJ5U3RyaW5nKHVybCwgcGFyYW1zKSB7XG4gIGlmIChwYXJhbXMgJiYgX3R5cGVvZihwYXJhbXMpID09PSAnb2JqZWN0Jykge1xuICAgIHZhciBxdWVyeVN0cmluZyA9ICcnO1xuXG4gICAgZm9yICh2YXIgcGFyYW1OYW1lIGluIHBhcmFtcykge1xuICAgICAgcXVlcnlTdHJpbmcgKz0gJyYnICsgZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtTmFtZSkgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQocGFyYW1zW3BhcmFtTmFtZV0pO1xuICAgIH1cblxuICAgIGlmICghcXVlcnlTdHJpbmcpIHJldHVybiB1cmw7XG4gICAgdXJsID0gdXJsICsgKHVybC5pbmRleE9mKCc/JykgIT09IC0xID8gJyYnIDogJz8nKSArIHF1ZXJ5U3RyaW5nLnNsaWNlKDEpO1xuICB9XG5cbiAgcmV0dXJuIHVybDtcbn07XG5cbnZhciByZXF1ZXN0V2l0aEZldGNoID0gZnVuY3Rpb24gcmVxdWVzdFdpdGhGZXRjaChvcHRpb25zLCB1cmwsIHBheWxvYWQsIGNhbGxiYWNrKSB7XG4gIGlmIChvcHRpb25zLnF1ZXJ5U3RyaW5nUGFyYW1zKSB7XG4gICAgdXJsID0gYWRkUXVlcnlTdHJpbmcodXJsLCBvcHRpb25zLnF1ZXJ5U3RyaW5nUGFyYW1zKTtcbiAgfVxuXG4gIHZhciBoZWFkZXJzID0gKDAsIF91dGlscy5kZWZhdWx0cykoe30sIHR5cGVvZiBvcHRpb25zLmN1c3RvbUhlYWRlcnMgPT09ICdmdW5jdGlvbicgPyBvcHRpb25zLmN1c3RvbUhlYWRlcnMoKSA6IG9wdGlvbnMuY3VzdG9tSGVhZGVycyk7XG4gIGlmIChwYXlsb2FkKSBoZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgZmV0Y2hBcGkodXJsLCAoMCwgX3V0aWxzLmRlZmF1bHRzKSh7XG4gICAgbWV0aG9kOiBwYXlsb2FkID8gJ1BPU1QnIDogJ0dFVCcsXG4gICAgYm9keTogcGF5bG9hZCA/IG9wdGlvbnMuc3RyaW5naWZ5KHBheWxvYWQpIDogdW5kZWZpbmVkLFxuICAgIGhlYWRlcnM6IGhlYWRlcnNcbiAgfSwgdHlwZW9mIG9wdGlvbnMucmVxdWVzdE9wdGlvbnMgPT09ICdmdW5jdGlvbicgPyBvcHRpb25zLnJlcXVlc3RPcHRpb25zKHBheWxvYWQpIDogb3B0aW9ucy5yZXF1ZXN0T3B0aW9ucykpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgaWYgKCFyZXNwb25zZS5vaykgcmV0dXJuIGNhbGxiYWNrKHJlc3BvbnNlLnN0YXR1c1RleHQgfHwgJ0Vycm9yJywge1xuICAgICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXNcbiAgICB9KTtcbiAgICByZXNwb25zZS50ZXh0KCkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgY2FsbGJhY2sobnVsbCwge1xuICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLnN0YXR1cyxcbiAgICAgICAgZGF0YTogZGF0YVxuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goY2FsbGJhY2spO1xuICB9KS5jYXRjaChjYWxsYmFjayk7XG59O1xuXG52YXIgcmVxdWVzdFdpdGhYbWxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3RXaXRoWG1sSHR0cFJlcXVlc3Qob3B0aW9ucywgdXJsLCBwYXlsb2FkLCBjYWxsYmFjaykge1xuICBpZiAocGF5bG9hZCAmJiBfdHlwZW9mKHBheWxvYWQpID09PSAnb2JqZWN0Jykge1xuICAgIHBheWxvYWQgPSBhZGRRdWVyeVN0cmluZygnJywgcGF5bG9hZCkuc2xpY2UoMSk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5xdWVyeVN0cmluZ1BhcmFtcykge1xuICAgIHVybCA9IGFkZFF1ZXJ5U3RyaW5nKHVybCwgb3B0aW9ucy5xdWVyeVN0cmluZ1BhcmFtcyk7XG4gIH1cblxuICB0cnkge1xuICAgIHZhciB4O1xuXG4gICAgaWYgKFhtbEh0dHBSZXF1ZXN0QXBpKSB7XG4gICAgICB4ID0gbmV3IFhtbEh0dHBSZXF1ZXN0QXBpKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggPSBuZXcgQWN0aXZlWE9iamVjdEFwaSgnTVNYTUwyLlhNTEhUVFAuMy4wJyk7XG4gICAgfVxuXG4gICAgeC5vcGVuKHBheWxvYWQgPyAnUE9TVCcgOiAnR0VUJywgdXJsLCAxKTtcblxuICAgIGlmICghb3B0aW9ucy5jcm9zc0RvbWFpbikge1xuICAgICAgeC5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XG4gICAgfVxuXG4gICAgeC53aXRoQ3JlZGVudGlhbHMgPSAhIW9wdGlvbnMud2l0aENyZWRlbnRpYWxzO1xuXG4gICAgaWYgKHBheWxvYWQpIHtcbiAgICAgIHguc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpO1xuICAgIH1cblxuICAgIGlmICh4Lm92ZXJyaWRlTWltZVR5cGUpIHtcbiAgICAgIHgub3ZlcnJpZGVNaW1lVHlwZSgnYXBwbGljYXRpb24vanNvbicpO1xuICAgIH1cblxuICAgIHZhciBoID0gb3B0aW9ucy5jdXN0b21IZWFkZXJzO1xuICAgIGggPSB0eXBlb2YgaCA9PT0gJ2Z1bmN0aW9uJyA/IGgoKSA6IGg7XG5cbiAgICBpZiAoaCkge1xuICAgICAgZm9yICh2YXIgaSBpbiBoKSB7XG4gICAgICAgIHguc2V0UmVxdWVzdEhlYWRlcihpLCBoW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB4Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHgucmVhZHlTdGF0ZSA+IDMgJiYgY2FsbGJhY2soeC5zdGF0dXMgPj0gNDAwID8geC5zdGF0dXNUZXh0IDogbnVsbCwge1xuICAgICAgICBzdGF0dXM6IHguc3RhdHVzLFxuICAgICAgICBkYXRhOiB4LnJlc3BvbnNlVGV4dFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHguc2VuZChwYXlsb2FkKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUgJiYgY29uc29sZS5sb2coZSk7XG4gIH1cbn07XG5cbnZhciByZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdChvcHRpb25zLCB1cmwsIHBheWxvYWQsIGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2YgcGF5bG9hZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gcGF5bG9hZDtcbiAgICBwYXlsb2FkID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbiAoKSB7fTtcblxuICBpZiAoZmV0Y2hBcGkpIHtcbiAgICByZXR1cm4gcmVxdWVzdFdpdGhGZXRjaChvcHRpb25zLCB1cmwsIHBheWxvYWQsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgWE1MSHR0cFJlcXVlc3QgPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIEFjdGl2ZVhPYmplY3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gcmVxdWVzdFdpdGhYbWxIdHRwUmVxdWVzdChvcHRpb25zLCB1cmwsIHBheWxvYWQsIGNhbGxiYWNrKTtcbiAgfVxufTtcblxudmFyIF9kZWZhdWx0ID0gcmVxdWVzdDtcbmV4cG9ydHMuZGVmYXVsdCA9IF9kZWZhdWx0O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzLmRlZmF1bHQ7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHRzID0gZGVmYXVsdHM7XG52YXIgYXJyID0gW107XG52YXIgZWFjaCA9IGFyci5mb3JFYWNoO1xudmFyIHNsaWNlID0gYXJyLnNsaWNlO1xuXG5mdW5jdGlvbiBkZWZhdWx0cyhvYmopIHtcbiAgZWFjaC5jYWxsKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24gKHNvdXJjZSkge1xuICAgIGlmIChzb3VyY2UpIHtcbiAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgIGlmIChvYmpbcHJvcF0gPT09IHVuZGVmaW5lZCkgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvYmo7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfaW50ZXJvcERlZmF1bHQgKGV4KSB7IHJldHVybiAoZXggJiYgKHR5cGVvZiBleCA9PT0gJ29iamVjdCcpICYmICdkZWZhdWx0JyBpbiBleCkgPyBleFsnZGVmYXVsdCddIDogZXg7IH1cblxudmFyIF90eXBlb2YgPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnQGJhYmVsL3J1bnRpbWUvaGVscGVycy90eXBlb2YnKSk7XG52YXIgX29iamVjdFNwcmVhZCA9IF9pbnRlcm9wRGVmYXVsdChyZXF1aXJlKCdAYmFiZWwvcnVudGltZS9oZWxwZXJzL29iamVjdFNwcmVhZCcpKTtcbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnQGJhYmVsL3J1bnRpbWUvaGVscGVycy9jbGFzc0NhbGxDaGVjaycpKTtcbnZhciBfY3JlYXRlQ2xhc3MgPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnQGJhYmVsL3J1bnRpbWUvaGVscGVycy9jcmVhdGVDbGFzcycpKTtcbnZhciBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybiA9IF9pbnRlcm9wRGVmYXVsdChyZXF1aXJlKCdAYmFiZWwvcnVudGltZS9oZWxwZXJzL3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4nKSk7XG52YXIgX2dldFByb3RvdHlwZU9mID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZ2V0UHJvdG90eXBlT2YnKSk7XG52YXIgX2Fzc2VydFRoaXNJbml0aWFsaXplZCA9IF9pbnRlcm9wRGVmYXVsdChyZXF1aXJlKCdAYmFiZWwvcnVudGltZS9oZWxwZXJzL2Fzc2VydFRoaXNJbml0aWFsaXplZCcpKTtcbnZhciBfaW5oZXJpdHMgPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnQGJhYmVsL3J1bnRpbWUvaGVscGVycy9pbmhlcml0cycpKTtcblxudmFyIGNvbnNvbGVMb2dnZXIgPSB7XG4gIHR5cGU6ICdsb2dnZXInLFxuICBsb2c6IGZ1bmN0aW9uIGxvZyhhcmdzKSB7XG4gICAgdGhpcy5vdXRwdXQoJ2xvZycsIGFyZ3MpO1xuICB9LFxuICB3YXJuOiBmdW5jdGlvbiB3YXJuKGFyZ3MpIHtcbiAgICB0aGlzLm91dHB1dCgnd2FybicsIGFyZ3MpO1xuICB9LFxuICBlcnJvcjogZnVuY3Rpb24gZXJyb3IoYXJncykge1xuICAgIHRoaXMub3V0cHV0KCdlcnJvcicsIGFyZ3MpO1xuICB9LFxuICBvdXRwdXQ6IGZ1bmN0aW9uIG91dHB1dCh0eXBlLCBhcmdzKSB7XG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZVt0eXBlXSkgY29uc29sZVt0eXBlXS5hcHBseShjb25zb2xlLCBhcmdzKTtcbiAgfVxufTtcblxudmFyIExvZ2dlciA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gTG9nZ2VyKGNvbmNyZXRlTG9nZ2VyKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExvZ2dlcik7XG5cbiAgICB0aGlzLmluaXQoY29uY3JldGVMb2dnZXIsIG9wdGlvbnMpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKExvZ2dlciwgW3tcbiAgICBrZXk6IFwiaW5pdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpbml0KGNvbmNyZXRlTG9nZ2VyKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgICB0aGlzLnByZWZpeCA9IG9wdGlvbnMucHJlZml4IHx8ICdpMThuZXh0Oic7XG4gICAgICB0aGlzLmxvZ2dlciA9IGNvbmNyZXRlTG9nZ2VyIHx8IGNvbnNvbGVMb2dnZXI7XG4gICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgdGhpcy5kZWJ1ZyA9IG9wdGlvbnMuZGVidWc7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInNldERlYnVnXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldERlYnVnKGJvb2wpIHtcbiAgICAgIHRoaXMuZGVidWcgPSBib29sO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsb2dcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbG9nKCkge1xuICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgIGFyZ3NbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmZvcndhcmQoYXJncywgJ2xvZycsICcnLCB0cnVlKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwid2FyblwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB3YXJuKCkge1xuICAgICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4yKSwgX2tleTIgPSAwOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgICAgIGFyZ3NbX2tleTJdID0gYXJndW1lbnRzW19rZXkyXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZm9yd2FyZChhcmdzLCAnd2FybicsICcnLCB0cnVlKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZXJyb3JcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZXJyb3IoKSB7XG4gICAgICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjMpLCBfa2V5MyA9IDA7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgICAgYXJnc1tfa2V5M10gPSBhcmd1bWVudHNbX2tleTNdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5mb3J3YXJkKGFyZ3MsICdlcnJvcicsICcnKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZGVwcmVjYXRlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRlcHJlY2F0ZSgpIHtcbiAgICAgIGZvciAodmFyIF9sZW40ID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuNCksIF9rZXk0ID0gMDsgX2tleTQgPCBfbGVuNDsgX2tleTQrKykge1xuICAgICAgICBhcmdzW19rZXk0XSA9IGFyZ3VtZW50c1tfa2V5NF07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmZvcndhcmQoYXJncywgJ3dhcm4nLCAnV0FSTklORyBERVBSRUNBVEVEOiAnLCB0cnVlKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZm9yd2FyZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBmb3J3YXJkKGFyZ3MsIGx2bCwgcHJlZml4LCBkZWJ1Z09ubHkpIHtcbiAgICAgIGlmIChkZWJ1Z09ubHkgJiYgIXRoaXMuZGVidWcpIHJldHVybiBudWxsO1xuICAgICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnc3RyaW5nJykgYXJnc1swXSA9IFwiXCIuY29uY2F0KHByZWZpeCkuY29uY2F0KHRoaXMucHJlZml4LCBcIiBcIikuY29uY2F0KGFyZ3NbMF0pO1xuICAgICAgcmV0dXJuIHRoaXMubG9nZ2VyW2x2bF0oYXJncyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGUobW9kdWxlTmFtZSkge1xuICAgICAgcmV0dXJuIG5ldyBMb2dnZXIodGhpcy5sb2dnZXIsIF9vYmplY3RTcHJlYWQoe30sIHtcbiAgICAgICAgcHJlZml4OiBcIlwiLmNvbmNhdCh0aGlzLnByZWZpeCwgXCI6XCIpLmNvbmNhdChtb2R1bGVOYW1lLCBcIjpcIilcbiAgICAgIH0sIHRoaXMub3B0aW9ucykpO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBMb2dnZXI7XG59KCk7XG5cbnZhciBiYXNlTG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuXG52YXIgRXZlbnRFbWl0dGVyID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEV2ZW50RW1pdHRlcik7XG5cbiAgICB0aGlzLm9ic2VydmVycyA9IHt9O1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEV2ZW50RW1pdHRlciwgW3tcbiAgICBrZXk6IFwib25cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gb24oZXZlbnRzLCBsaXN0ZW5lcikge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgZXZlbnRzLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgX3RoaXMub2JzZXJ2ZXJzW2V2ZW50XSA9IF90aGlzLm9ic2VydmVyc1tldmVudF0gfHwgW107XG5cbiAgICAgICAgX3RoaXMub2JzZXJ2ZXJzW2V2ZW50XS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIm9mZlwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvZmYoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgICBpZiAoIXRoaXMub2JzZXJ2ZXJzW2V2ZW50XSkgcmV0dXJuO1xuXG4gICAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLm9ic2VydmVyc1tldmVudF07XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5vYnNlcnZlcnNbZXZlbnRdID0gdGhpcy5vYnNlcnZlcnNbZXZlbnRdLmZpbHRlcihmdW5jdGlvbiAobCkge1xuICAgICAgICByZXR1cm4gbCAhPT0gbGlzdGVuZXI7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZW1pdFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBlbWl0KGV2ZW50KSB7XG4gICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5vYnNlcnZlcnNbZXZlbnRdKSB7XG4gICAgICAgIHZhciBjbG9uZWQgPSBbXS5jb25jYXQodGhpcy5vYnNlcnZlcnNbZXZlbnRdKTtcbiAgICAgICAgY2xvbmVkLmZvckVhY2goZnVuY3Rpb24gKG9ic2VydmVyKSB7XG4gICAgICAgICAgb2JzZXJ2ZXIuYXBwbHkodm9pZCAwLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9ic2VydmVyc1snKiddKSB7XG4gICAgICAgIHZhciBfY2xvbmVkID0gW10uY29uY2F0KHRoaXMub2JzZXJ2ZXJzWycqJ10pO1xuXG4gICAgICAgIF9jbG9uZWQuZm9yRWFjaChmdW5jdGlvbiAob2JzZXJ2ZXIpIHtcbiAgICAgICAgICBvYnNlcnZlci5hcHBseShvYnNlcnZlciwgW2V2ZW50XS5jb25jYXQoYXJncykpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gRXZlbnRFbWl0dGVyO1xufSgpO1xuXG5mdW5jdGlvbiBkZWZlcigpIHtcbiAgdmFyIHJlcztcbiAgdmFyIHJlajtcbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcmVzID0gcmVzb2x2ZTtcbiAgICByZWogPSByZWplY3Q7XG4gIH0pO1xuICBwcm9taXNlLnJlc29sdmUgPSByZXM7XG4gIHByb21pc2UucmVqZWN0ID0gcmVqO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cbmZ1bmN0aW9uIG1ha2VTdHJpbmcob2JqZWN0KSB7XG4gIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuICcnO1xuICByZXR1cm4gJycgKyBvYmplY3Q7XG59XG5mdW5jdGlvbiBjb3B5KGEsIHMsIHQpIHtcbiAgYS5mb3JFYWNoKGZ1bmN0aW9uIChtKSB7XG4gICAgaWYgKHNbbV0pIHRbbV0gPSBzW21dO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0TGFzdE9mUGF0aChvYmplY3QsIHBhdGgsIEVtcHR5KSB7XG4gIGZ1bmN0aW9uIGNsZWFuS2V5KGtleSkge1xuICAgIHJldHVybiBrZXkgJiYga2V5LmluZGV4T2YoJyMjIycpID4gLTEgPyBrZXkucmVwbGFjZSgvIyMjL2csICcuJykgOiBrZXk7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5Ob3RUcmF2ZXJzZURlZXBlcigpIHtcbiAgICByZXR1cm4gIW9iamVjdCB8fCB0eXBlb2Ygb2JqZWN0ID09PSAnc3RyaW5nJztcbiAgfVxuXG4gIHZhciBzdGFjayA9IHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJyA/IFtdLmNvbmNhdChwYXRoKSA6IHBhdGguc3BsaXQoJy4nKTtcblxuICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMSkge1xuICAgIGlmIChjYW5Ob3RUcmF2ZXJzZURlZXBlcigpKSByZXR1cm4ge307XG4gICAgdmFyIGtleSA9IGNsZWFuS2V5KHN0YWNrLnNoaWZ0KCkpO1xuICAgIGlmICghb2JqZWN0W2tleV0gJiYgRW1wdHkpIG9iamVjdFtrZXldID0gbmV3IEVtcHR5KCk7XG4gICAgb2JqZWN0ID0gb2JqZWN0W2tleV07XG4gIH1cblxuICBpZiAoY2FuTm90VHJhdmVyc2VEZWVwZXIoKSkgcmV0dXJuIHt9O1xuICByZXR1cm4ge1xuICAgIG9iajogb2JqZWN0LFxuICAgIGs6IGNsZWFuS2V5KHN0YWNrLnNoaWZ0KCkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNldFBhdGgob2JqZWN0LCBwYXRoLCBuZXdWYWx1ZSkge1xuICB2YXIgX2dldExhc3RPZlBhdGggPSBnZXRMYXN0T2ZQYXRoKG9iamVjdCwgcGF0aCwgT2JqZWN0KSxcbiAgICAgIG9iaiA9IF9nZXRMYXN0T2ZQYXRoLm9iaixcbiAgICAgIGsgPSBfZ2V0TGFzdE9mUGF0aC5rO1xuXG4gIG9ialtrXSA9IG5ld1ZhbHVlO1xufVxuZnVuY3Rpb24gcHVzaFBhdGgob2JqZWN0LCBwYXRoLCBuZXdWYWx1ZSwgY29uY2F0KSB7XG4gIHZhciBfZ2V0TGFzdE9mUGF0aDIgPSBnZXRMYXN0T2ZQYXRoKG9iamVjdCwgcGF0aCwgT2JqZWN0KSxcbiAgICAgIG9iaiA9IF9nZXRMYXN0T2ZQYXRoMi5vYmosXG4gICAgICBrID0gX2dldExhc3RPZlBhdGgyLms7XG5cbiAgb2JqW2tdID0gb2JqW2tdIHx8IFtdO1xuICBpZiAoY29uY2F0KSBvYmpba10gPSBvYmpba10uY29uY2F0KG5ld1ZhbHVlKTtcbiAgaWYgKCFjb25jYXQpIG9ialtrXS5wdXNoKG5ld1ZhbHVlKTtcbn1cbmZ1bmN0aW9uIGdldFBhdGgob2JqZWN0LCBwYXRoKSB7XG4gIHZhciBfZ2V0TGFzdE9mUGF0aDMgPSBnZXRMYXN0T2ZQYXRoKG9iamVjdCwgcGF0aCksXG4gICAgICBvYmogPSBfZ2V0TGFzdE9mUGF0aDMub2JqLFxuICAgICAgayA9IF9nZXRMYXN0T2ZQYXRoMy5rO1xuXG4gIGlmICghb2JqKSByZXR1cm4gdW5kZWZpbmVkO1xuICByZXR1cm4gb2JqW2tdO1xufVxuZnVuY3Rpb24gZ2V0UGF0aFdpdGhEZWZhdWx0cyhkYXRhLCBkZWZhdWx0RGF0YSwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IGdldFBhdGgoZGF0YSwga2V5KTtcblxuICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiBnZXRQYXRoKGRlZmF1bHREYXRhLCBrZXkpO1xufVxuZnVuY3Rpb24gZGVlcEV4dGVuZCh0YXJnZXQsIHNvdXJjZSwgb3ZlcndyaXRlKSB7XG4gIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgaWYgKHByb3AgIT09ICdfX3Byb3RvX18nICYmIHByb3AgIT09ICdjb25zdHJ1Y3RvcicpIHtcbiAgICAgIGlmIChwcm9wIGluIHRhcmdldCkge1xuICAgICAgICBpZiAodHlwZW9mIHRhcmdldFtwcm9wXSA9PT0gJ3N0cmluZycgfHwgdGFyZ2V0W3Byb3BdIGluc3RhbmNlb2YgU3RyaW5nIHx8IHR5cGVvZiBzb3VyY2VbcHJvcF0gPT09ICdzdHJpbmcnIHx8IHNvdXJjZVtwcm9wXSBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgIGlmIChvdmVyd3JpdGUpIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWVwRXh0ZW5kKHRhcmdldFtwcm9wXSwgc291cmNlW3Byb3BdLCBvdmVyd3JpdGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIHJlZ2V4RXNjYXBlKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1tcXC1cXFtcXF1cXC9cXHtcXH1cXChcXClcXCpcXCtcXD9cXC5cXFxcXFxeXFwkXFx8XS9nLCAnXFxcXCQmJyk7XG59XG52YXIgX2VudGl0eU1hcCA9IHtcbiAgJyYnOiAnJmFtcDsnLFxuICAnPCc6ICcmbHQ7JyxcbiAgJz4nOiAnJmd0OycsXG4gICdcIic6ICcmcXVvdDsnLFxuICBcIidcIjogJyYjMzk7JyxcbiAgJy8nOiAnJiN4MkY7J1xufTtcbmZ1bmN0aW9uIGVzY2FwZShkYXRhKSB7XG4gIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZGF0YS5yZXBsYWNlKC9bJjw+XCInXFwvXS9nLCBmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIF9lbnRpdHlNYXBbc107XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gZGF0YTtcbn1cbnZhciBpc0lFMTAgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubmF2aWdhdG9yICYmIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50ICYmIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ01TSUUnKSA+IC0xO1xuXG52YXIgUmVzb3VyY2VTdG9yZSA9IGZ1bmN0aW9uIChfRXZlbnRFbWl0dGVyKSB7XG4gIF9pbmhlcml0cyhSZXNvdXJjZVN0b3JlLCBfRXZlbnRFbWl0dGVyKTtcblxuICBmdW5jdGlvbiBSZXNvdXJjZVN0b3JlKGRhdGEpIHtcbiAgICB2YXIgX3RoaXM7XG5cbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge1xuICAgICAgbnM6IFsndHJhbnNsYXRpb24nXSxcbiAgICAgIGRlZmF1bHROUzogJ3RyYW5zbGF0aW9uJ1xuICAgIH07XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgUmVzb3VyY2VTdG9yZSk7XG5cbiAgICBfdGhpcyA9IF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIF9nZXRQcm90b3R5cGVPZihSZXNvdXJjZVN0b3JlKS5jYWxsKHRoaXMpKTtcblxuICAgIGlmIChpc0lFMTApIHtcbiAgICAgIEV2ZW50RW1pdHRlci5jYWxsKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKTtcbiAgICB9XG5cbiAgICBfdGhpcy5kYXRhID0gZGF0YSB8fCB7fTtcbiAgICBfdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgIGlmIChfdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBfdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9ICcuJztcbiAgICB9XG5cbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoUmVzb3VyY2VTdG9yZSwgW3tcbiAgICBrZXk6IFwiYWRkTmFtZXNwYWNlc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBhZGROYW1lc3BhY2VzKG5zKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm5zLmluZGV4T2YobnMpIDwgMCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMubnMucHVzaChucyk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbW92ZU5hbWVzcGFjZXNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVtb3ZlTmFtZXNwYWNlcyhucykge1xuICAgICAgdmFyIGluZGV4ID0gdGhpcy5vcHRpb25zLm5zLmluZGV4T2YobnMpO1xuXG4gICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICB0aGlzLm9wdGlvbnMubnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0UmVzb3VyY2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0UmVzb3VyY2UobG5nLCBucywga2V5KSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge307XG4gICAgICB2YXIga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICAgIHZhciBwYXRoID0gW2xuZywgbnNdO1xuICAgICAgaWYgKGtleSAmJiB0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykgcGF0aCA9IHBhdGguY29uY2F0KGtleSk7XG4gICAgICBpZiAoa2V5ICYmIHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSBwYXRoID0gcGF0aC5jb25jYXQoa2V5U2VwYXJhdG9yID8ga2V5LnNwbGl0KGtleVNlcGFyYXRvcikgOiBrZXkpO1xuXG4gICAgICBpZiAobG5nLmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgICAgIHBhdGggPSBsbmcuc3BsaXQoJy4nKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGdldFBhdGgodGhpcy5kYXRhLCBwYXRoKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiYWRkUmVzb3VyY2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkUmVzb3VyY2UobG5nLCBucywga2V5LCB2YWx1ZSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IHtcbiAgICAgICAgc2lsZW50OiBmYWxzZVxuICAgICAgfTtcbiAgICAgIHZhciBrZXlTZXBhcmF0b3IgPSB0aGlzLm9wdGlvbnMua2V5U2VwYXJhdG9yO1xuICAgICAgaWYgKGtleVNlcGFyYXRvciA9PT0gdW5kZWZpbmVkKSBrZXlTZXBhcmF0b3IgPSAnLic7XG4gICAgICB2YXIgcGF0aCA9IFtsbmcsIG5zXTtcbiAgICAgIGlmIChrZXkpIHBhdGggPSBwYXRoLmNvbmNhdChrZXlTZXBhcmF0b3IgPyBrZXkuc3BsaXQoa2V5U2VwYXJhdG9yKSA6IGtleSk7XG5cbiAgICAgIGlmIChsbmcuaW5kZXhPZignLicpID4gLTEpIHtcbiAgICAgICAgcGF0aCA9IGxuZy5zcGxpdCgnLicpO1xuICAgICAgICB2YWx1ZSA9IG5zO1xuICAgICAgICBucyA9IHBhdGhbMV07XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYWRkTmFtZXNwYWNlcyhucyk7XG4gICAgICBzZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCwgdmFsdWUpO1xuICAgICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy5lbWl0KCdhZGRlZCcsIGxuZywgbnMsIGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJhZGRSZXNvdXJjZXNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkUmVzb3VyY2VzKGxuZywgbnMsIHJlc291cmNlcykge1xuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IHtcbiAgICAgICAgc2lsZW50OiBmYWxzZVxuICAgICAgfTtcblxuICAgICAgZm9yICh2YXIgbSBpbiByZXNvdXJjZXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXNvdXJjZXNbbV0gPT09ICdzdHJpbmcnIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkocmVzb3VyY2VzW21dKSA9PT0gJ1tvYmplY3QgQXJyYXldJykgdGhpcy5hZGRSZXNvdXJjZShsbmcsIG5zLCBtLCByZXNvdXJjZXNbbV0sIHtcbiAgICAgICAgICBzaWxlbnQ6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHRoaXMuZW1pdCgnYWRkZWQnLCBsbmcsIG5zLCByZXNvdXJjZXMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJhZGRSZXNvdXJjZUJ1bmRsZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRSZXNvdXJjZUJ1bmRsZShsbmcsIG5zLCByZXNvdXJjZXMsIGRlZXAsIG92ZXJ3cml0ZSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gNSAmJiBhcmd1bWVudHNbNV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s1XSA6IHtcbiAgICAgICAgc2lsZW50OiBmYWxzZVxuICAgICAgfTtcbiAgICAgIHZhciBwYXRoID0gW2xuZywgbnNdO1xuXG4gICAgICBpZiAobG5nLmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgICAgIHBhdGggPSBsbmcuc3BsaXQoJy4nKTtcbiAgICAgICAgZGVlcCA9IHJlc291cmNlcztcbiAgICAgICAgcmVzb3VyY2VzID0gbnM7XG4gICAgICAgIG5zID0gcGF0aFsxXTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5hZGROYW1lc3BhY2VzKG5zKTtcbiAgICAgIHZhciBwYWNrID0gZ2V0UGF0aCh0aGlzLmRhdGEsIHBhdGgpIHx8IHt9O1xuXG4gICAgICBpZiAoZGVlcCkge1xuICAgICAgICBkZWVwRXh0ZW5kKHBhY2ssIHJlc291cmNlcywgb3ZlcndyaXRlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhY2sgPSBfb2JqZWN0U3ByZWFkKHt9LCBwYWNrLCByZXNvdXJjZXMpO1xuICAgICAgfVxuXG4gICAgICBzZXRQYXRoKHRoaXMuZGF0YSwgcGF0aCwgcGFjayk7XG4gICAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB0aGlzLmVtaXQoJ2FkZGVkJywgbG5nLCBucywgcmVzb3VyY2VzKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwicmVtb3ZlUmVzb3VyY2VCdW5kbGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVtb3ZlUmVzb3VyY2VCdW5kbGUobG5nLCBucykge1xuICAgICAgaWYgKHRoaXMuaGFzUmVzb3VyY2VCdW5kbGUobG5nLCBucykpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuZGF0YVtsbmddW25zXTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZW1vdmVOYW1lc3BhY2VzKG5zKTtcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlZCcsIGxuZywgbnMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJoYXNSZXNvdXJjZUJ1bmRsZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBoYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNvdXJjZShsbmcsIG5zKSAhPT0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRSZXNvdXJjZUJ1bmRsZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSB7XG4gICAgICBpZiAoIW5zKSBucyA9IHRoaXMub3B0aW9ucy5kZWZhdWx0TlM7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlBUEkgPT09ICd2MScpIHJldHVybiBfb2JqZWN0U3ByZWFkKHt9LCB7fSwgdGhpcy5nZXRSZXNvdXJjZShsbmcsIG5zKSk7XG4gICAgICByZXR1cm4gdGhpcy5nZXRSZXNvdXJjZShsbmcsIG5zKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0RGF0YUJ5TGFuZ3VhZ2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0RGF0YUJ5TGFuZ3VhZ2UobG5nKSB7XG4gICAgICByZXR1cm4gdGhpcy5kYXRhW2xuZ107XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInRvSlNPTlwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0b0pTT04oKSB7XG4gICAgICByZXR1cm4gdGhpcy5kYXRhO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBSZXNvdXJjZVN0b3JlO1xufShFdmVudEVtaXR0ZXIpO1xuXG52YXIgcG9zdFByb2Nlc3NvciA9IHtcbiAgcHJvY2Vzc29yczoge30sXG4gIGFkZFBvc3RQcm9jZXNzb3I6IGZ1bmN0aW9uIGFkZFBvc3RQcm9jZXNzb3IobW9kdWxlKSB7XG4gICAgdGhpcy5wcm9jZXNzb3JzW21vZHVsZS5uYW1lXSA9IG1vZHVsZTtcbiAgfSxcbiAgaGFuZGxlOiBmdW5jdGlvbiBoYW5kbGUocHJvY2Vzc29ycywgdmFsdWUsIGtleSwgb3B0aW9ucywgdHJhbnNsYXRvcikge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBwcm9jZXNzb3JzLmZvckVhY2goZnVuY3Rpb24gKHByb2Nlc3Nvcikge1xuICAgICAgaWYgKF90aGlzLnByb2Nlc3NvcnNbcHJvY2Vzc29yXSkgdmFsdWUgPSBfdGhpcy5wcm9jZXNzb3JzW3Byb2Nlc3Nvcl0ucHJvY2Vzcyh2YWx1ZSwga2V5LCBvcHRpb25zLCB0cmFuc2xhdG9yKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn07XG5cbnZhciBjaGVja2VkTG9hZGVkRm9yID0ge307XG5cbnZhciBUcmFuc2xhdG9yID0gZnVuY3Rpb24gKF9FdmVudEVtaXR0ZXIpIHtcbiAgX2luaGVyaXRzKFRyYW5zbGF0b3IsIF9FdmVudEVtaXR0ZXIpO1xuXG4gIGZ1bmN0aW9uIFRyYW5zbGF0b3Ioc2VydmljZXMpIHtcbiAgICB2YXIgX3RoaXM7XG5cbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgVHJhbnNsYXRvcik7XG5cbiAgICBfdGhpcyA9IF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIF9nZXRQcm90b3R5cGVPZihUcmFuc2xhdG9yKS5jYWxsKHRoaXMpKTtcblxuICAgIGlmIChpc0lFMTApIHtcbiAgICAgIEV2ZW50RW1pdHRlci5jYWxsKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKTtcbiAgICB9XG5cbiAgICBjb3B5KFsncmVzb3VyY2VTdG9yZScsICdsYW5ndWFnZVV0aWxzJywgJ3BsdXJhbFJlc29sdmVyJywgJ2ludGVycG9sYXRvcicsICdiYWNrZW5kQ29ubmVjdG9yJywgJ2kxOG5Gb3JtYXQnLCAndXRpbHMnXSwgc2VydmljZXMsIF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKTtcbiAgICBfdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgIGlmIChfdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBfdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvciA9ICcuJztcbiAgICB9XG5cbiAgICBfdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgndHJhbnNsYXRvcicpO1xuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhUcmFuc2xhdG9yLCBbe1xuICAgIGtleTogXCJjaGFuZ2VMYW5ndWFnZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjaGFuZ2VMYW5ndWFnZShsbmcpIHtcbiAgICAgIGlmIChsbmcpIHRoaXMubGFuZ3VhZ2UgPSBsbmc7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImV4aXN0c1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBleGlzdHMoa2V5KSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge1xuICAgICAgICBpbnRlcnBvbGF0aW9uOiB7fVxuICAgICAgfTtcbiAgICAgIHZhciByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZShrZXksIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIHJlc29sdmVkICYmIHJlc29sdmVkLnJlcyAhPT0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJleHRyYWN0RnJvbUtleVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBleHRyYWN0RnJvbUtleShrZXksIG9wdGlvbnMpIHtcbiAgICAgIHZhciBuc1NlcGFyYXRvciA9IG9wdGlvbnMubnNTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubnNTZXBhcmF0b3IgOiB0aGlzLm9wdGlvbnMubnNTZXBhcmF0b3I7XG4gICAgICBpZiAobnNTZXBhcmF0b3IgPT09IHVuZGVmaW5lZCkgbnNTZXBhcmF0b3IgPSAnOic7XG4gICAgICB2YXIga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcbiAgICAgIHZhciBuYW1lc3BhY2VzID0gb3B0aW9ucy5ucyB8fCB0aGlzLm9wdGlvbnMuZGVmYXVsdE5TO1xuXG4gICAgICBpZiAobnNTZXBhcmF0b3IgJiYga2V5LmluZGV4T2YobnNTZXBhcmF0b3IpID4gLTEpIHtcbiAgICAgICAgdmFyIG0gPSBrZXkubWF0Y2godGhpcy5pbnRlcnBvbGF0b3IubmVzdGluZ1JlZ2V4cCk7XG5cbiAgICAgICAgaWYgKG0gJiYgbS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgbmFtZXNwYWNlczogbmFtZXNwYWNlc1xuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGFydHMgPSBrZXkuc3BsaXQobnNTZXBhcmF0b3IpO1xuICAgICAgICBpZiAobnNTZXBhcmF0b3IgIT09IGtleVNlcGFyYXRvciB8fCBuc1NlcGFyYXRvciA9PT0ga2V5U2VwYXJhdG9yICYmIHRoaXMub3B0aW9ucy5ucy5pbmRleE9mKHBhcnRzWzBdKSA+IC0xKSBuYW1lc3BhY2VzID0gcGFydHMuc2hpZnQoKTtcbiAgICAgICAga2V5ID0gcGFydHMuam9pbihrZXlTZXBhcmF0b3IpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnKSBuYW1lc3BhY2VzID0gW25hbWVzcGFjZXNdO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIG5hbWVzcGFjZXM6IG5hbWVzcGFjZXNcbiAgICAgIH07XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInRyYW5zbGF0ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0cmFuc2xhdGUoa2V5cywgb3B0aW9ucywgbGFzdEtleSkge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgIGlmIChfdHlwZW9mKG9wdGlvbnMpICE9PSAnb2JqZWN0JyAmJiB0aGlzLm9wdGlvbnMub3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXIpIHtcbiAgICAgICAgb3B0aW9ucyA9IHRoaXMub3B0aW9ucy5vdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcihhcmd1bWVudHMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcbiAgICAgIGlmIChrZXlzID09PSB1bmRlZmluZWQgfHwga2V5cyA9PT0gbnVsbCkgcmV0dXJuICcnO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGtleXMpKSBrZXlzID0gW1N0cmluZyhrZXlzKV07XG4gICAgICB2YXIga2V5U2VwYXJhdG9yID0gb3B0aW9ucy5rZXlTZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMua2V5U2VwYXJhdG9yIDogdGhpcy5vcHRpb25zLmtleVNlcGFyYXRvcjtcblxuICAgICAgdmFyIF90aGlzJGV4dHJhY3RGcm9tS2V5ID0gdGhpcy5leHRyYWN0RnJvbUtleShrZXlzW2tleXMubGVuZ3RoIC0gMV0sIG9wdGlvbnMpLFxuICAgICAgICAgIGtleSA9IF90aGlzJGV4dHJhY3RGcm9tS2V5LmtleSxcbiAgICAgICAgICBuYW1lc3BhY2VzID0gX3RoaXMkZXh0cmFjdEZyb21LZXkubmFtZXNwYWNlcztcblxuICAgICAgdmFyIG5hbWVzcGFjZSA9IG5hbWVzcGFjZXNbbmFtZXNwYWNlcy5sZW5ndGggLSAxXTtcbiAgICAgIHZhciBsbmcgPSBvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlO1xuICAgICAgdmFyIGFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlID0gb3B0aW9ucy5hcHBlbmROYW1lc3BhY2VUb0NJTW9kZSB8fCB0aGlzLm9wdGlvbnMuYXBwZW5kTmFtZXNwYWNlVG9DSU1vZGU7XG5cbiAgICAgIGlmIChsbmcgJiYgbG5nLnRvTG93ZXJDYXNlKCkgPT09ICdjaW1vZGUnKSB7XG4gICAgICAgIGlmIChhcHBlbmROYW1lc3BhY2VUb0NJTW9kZSkge1xuICAgICAgICAgIHZhciBuc1NlcGFyYXRvciA9IG9wdGlvbnMubnNTZXBhcmF0b3IgfHwgdGhpcy5vcHRpb25zLm5zU2VwYXJhdG9yO1xuICAgICAgICAgIHJldHVybiBuYW1lc3BhY2UgKyBuc1NlcGFyYXRvciArIGtleTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBrZXk7XG4gICAgICB9XG5cbiAgICAgIHZhciByZXNvbHZlZCA9IHRoaXMucmVzb2x2ZShrZXlzLCBvcHRpb25zKTtcbiAgICAgIHZhciByZXMgPSByZXNvbHZlZCAmJiByZXNvbHZlZC5yZXM7XG4gICAgICB2YXIgcmVzVXNlZEtleSA9IHJlc29sdmVkICYmIHJlc29sdmVkLnVzZWRLZXkgfHwga2V5O1xuICAgICAgdmFyIHJlc0V4YWN0VXNlZEtleSA9IHJlc29sdmVkICYmIHJlc29sdmVkLmV4YWN0VXNlZEtleSB8fCBrZXk7XG4gICAgICB2YXIgcmVzVHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkocmVzKTtcbiAgICAgIHZhciBub09iamVjdCA9IFsnW29iamVjdCBOdW1iZXJdJywgJ1tvYmplY3QgRnVuY3Rpb25dJywgJ1tvYmplY3QgUmVnRXhwXSddO1xuICAgICAgdmFyIGpvaW5BcnJheXMgPSBvcHRpb25zLmpvaW5BcnJheXMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuam9pbkFycmF5cyA6IHRoaXMub3B0aW9ucy5qb2luQXJyYXlzO1xuICAgICAgdmFyIGhhbmRsZUFzT2JqZWN0SW5JMThuRm9ybWF0ID0gIXRoaXMuaTE4bkZvcm1hdCB8fCB0aGlzLmkxOG5Gb3JtYXQuaGFuZGxlQXNPYmplY3Q7XG4gICAgICB2YXIgaGFuZGxlQXNPYmplY3QgPSB0eXBlb2YgcmVzICE9PSAnc3RyaW5nJyAmJiB0eXBlb2YgcmVzICE9PSAnYm9vbGVhbicgJiYgdHlwZW9mIHJlcyAhPT0gJ251bWJlcic7XG5cbiAgICAgIGlmIChoYW5kbGVBc09iamVjdEluSTE4bkZvcm1hdCAmJiByZXMgJiYgaGFuZGxlQXNPYmplY3QgJiYgbm9PYmplY3QuaW5kZXhPZihyZXNUeXBlKSA8IDAgJiYgISh0eXBlb2Ygam9pbkFycmF5cyA9PT0gJ3N0cmluZycgJiYgcmVzVHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zLnJldHVybk9iamVjdHMgJiYgIXRoaXMub3B0aW9ucy5yZXR1cm5PYmplY3RzKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIud2FybignYWNjZXNzaW5nIGFuIG9iamVjdCAtIGJ1dCByZXR1cm5PYmplY3RzIG9wdGlvbnMgaXMgbm90IGVuYWJsZWQhJyk7XG4gICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5yZXR1cm5lZE9iamVjdEhhbmRsZXIgPyB0aGlzLm9wdGlvbnMucmV0dXJuZWRPYmplY3RIYW5kbGVyKHJlc1VzZWRLZXksIHJlcywgb3B0aW9ucykgOiBcImtleSAnXCIuY29uY2F0KGtleSwgXCIgKFwiKS5jb25jYXQodGhpcy5sYW5ndWFnZSwgXCIpJyByZXR1cm5lZCBhbiBvYmplY3QgaW5zdGVhZCBvZiBzdHJpbmcuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGtleVNlcGFyYXRvcikge1xuICAgICAgICAgIHZhciByZXNUeXBlSXNBcnJheSA9IHJlc1R5cGUgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgICAgICAgdmFyIGNvcHkkJDEgPSByZXNUeXBlSXNBcnJheSA/IFtdIDoge307XG4gICAgICAgICAgdmFyIG5ld0tleVRvVXNlID0gcmVzVHlwZUlzQXJyYXkgPyByZXNFeGFjdFVzZWRLZXkgOiByZXNVc2VkS2V5O1xuXG4gICAgICAgICAgZm9yICh2YXIgbSBpbiByZXMpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocmVzLCBtKSkge1xuICAgICAgICAgICAgICB2YXIgZGVlcEtleSA9IFwiXCIuY29uY2F0KG5ld0tleVRvVXNlKS5jb25jYXQoa2V5U2VwYXJhdG9yKS5jb25jYXQobSk7XG4gICAgICAgICAgICAgIGNvcHkkJDFbbV0gPSB0aGlzLnRyYW5zbGF0ZShkZWVwS2V5LCBfb2JqZWN0U3ByZWFkKHt9LCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgam9pbkFycmF5czogZmFsc2UsXG4gICAgICAgICAgICAgICAgbnM6IG5hbWVzcGFjZXNcbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICBpZiAoY29weSQkMVttXSA9PT0gZGVlcEtleSkgY29weSQkMVttXSA9IHJlc1ttXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXMgPSBjb3B5JCQxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGhhbmRsZUFzT2JqZWN0SW5JMThuRm9ybWF0ICYmIHR5cGVvZiBqb2luQXJyYXlzID09PSAnc3RyaW5nJyAmJiByZXNUeXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgIHJlcyA9IHJlcy5qb2luKGpvaW5BcnJheXMpO1xuICAgICAgICBpZiAocmVzKSByZXMgPSB0aGlzLmV4dGVuZFRyYW5zbGF0aW9uKHJlcywga2V5cywgb3B0aW9ucywgbGFzdEtleSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdXNlZERlZmF1bHQgPSBmYWxzZTtcbiAgICAgICAgdmFyIHVzZWRLZXkgPSBmYWxzZTtcblxuICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZExvb2t1cChyZXMpICYmIG9wdGlvbnMuZGVmYXVsdFZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB1c2VkRGVmYXVsdCA9IHRydWU7XG5cbiAgICAgICAgICBpZiAob3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2YXIgc3VmZml4ID0gdGhpcy5wbHVyYWxSZXNvbHZlci5nZXRTdWZmaXgobG5nLCBvcHRpb25zLmNvdW50KTtcbiAgICAgICAgICAgIHJlcyA9IG9wdGlvbnNbXCJkZWZhdWx0VmFsdWVcIi5jb25jYXQoc3VmZml4KV07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFyZXMpIHJlcyA9IG9wdGlvbnMuZGVmYXVsdFZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWRMb29rdXAocmVzKSkge1xuICAgICAgICAgIHVzZWRLZXkgPSB0cnVlO1xuICAgICAgICAgIHJlcyA9IGtleTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB1cGRhdGVNaXNzaW5nID0gb3B0aW9ucy5kZWZhdWx0VmFsdWUgJiYgb3B0aW9ucy5kZWZhdWx0VmFsdWUgIT09IHJlcyAmJiB0aGlzLm9wdGlvbnMudXBkYXRlTWlzc2luZztcblxuICAgICAgICBpZiAodXNlZEtleSB8fCB1c2VkRGVmYXVsdCB8fCB1cGRhdGVNaXNzaW5nKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIubG9nKHVwZGF0ZU1pc3NpbmcgPyAndXBkYXRlS2V5JyA6ICdtaXNzaW5nS2V5JywgbG5nLCBuYW1lc3BhY2UsIGtleSwgdXBkYXRlTWlzc2luZyA/IG9wdGlvbnMuZGVmYXVsdFZhbHVlIDogcmVzKTtcblxuICAgICAgICAgIGlmIChrZXlTZXBhcmF0b3IpIHtcbiAgICAgICAgICAgIHZhciBmayA9IHRoaXMucmVzb2x2ZShrZXksIF9vYmplY3RTcHJlYWQoe30sIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAga2V5U2VwYXJhdG9yOiBmYWxzZVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgaWYgKGZrICYmIGZrLnJlcykgdGhpcy5sb2dnZXIud2FybignU2VlbXMgdGhlIGxvYWRlZCB0cmFuc2xhdGlvbnMgd2VyZSBpbiBmbGF0IEpTT04gZm9ybWF0IGluc3RlYWQgb2YgbmVzdGVkLiBFaXRoZXIgc2V0IGtleVNlcGFyYXRvcjogZmFsc2Ugb24gaW5pdCBvciBtYWtlIHN1cmUgeW91ciB0cmFuc2xhdGlvbnMgYXJlIHB1Ymxpc2hlZCBpbiBuZXN0ZWQgZm9ybWF0LicpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBsbmdzID0gW107XG4gICAgICAgICAgdmFyIGZhbGxiYWNrTG5ncyA9IHRoaXMubGFuZ3VhZ2VVdGlscy5nZXRGYWxsYmFja0NvZGVzKHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZywgb3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZSk7XG5cbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNhdmVNaXNzaW5nVG8gPT09ICdmYWxsYmFjaycgJiYgZmFsbGJhY2tMbmdzICYmIGZhbGxiYWNrTG5nc1swXSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmYWxsYmFja0xuZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgbG5ncy5wdXNoKGZhbGxiYWNrTG5nc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuc2F2ZU1pc3NpbmdUbyA9PT0gJ2FsbCcpIHtcbiAgICAgICAgICAgIGxuZ3MgPSB0aGlzLmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KG9wdGlvbnMubG5nIHx8IHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsbmdzLnB1c2gob3B0aW9ucy5sbmcgfHwgdGhpcy5sYW5ndWFnZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHNlbmQgPSBmdW5jdGlvbiBzZW5kKGwsIGspIHtcbiAgICAgICAgICAgIGlmIChfdGhpczIub3B0aW9ucy5taXNzaW5nS2V5SGFuZGxlcikge1xuICAgICAgICAgICAgICBfdGhpczIub3B0aW9ucy5taXNzaW5nS2V5SGFuZGxlcihsLCBuYW1lc3BhY2UsIGssIHVwZGF0ZU1pc3NpbmcgPyBvcHRpb25zLmRlZmF1bHRWYWx1ZSA6IHJlcywgdXBkYXRlTWlzc2luZywgb3B0aW9ucyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKF90aGlzMi5iYWNrZW5kQ29ubmVjdG9yICYmIF90aGlzMi5iYWNrZW5kQ29ubmVjdG9yLnNhdmVNaXNzaW5nKSB7XG4gICAgICAgICAgICAgIF90aGlzMi5iYWNrZW5kQ29ubmVjdG9yLnNhdmVNaXNzaW5nKGwsIG5hbWVzcGFjZSwgaywgdXBkYXRlTWlzc2luZyA/IG9wdGlvbnMuZGVmYXVsdFZhbHVlIDogcmVzLCB1cGRhdGVNaXNzaW5nLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX3RoaXMyLmVtaXQoJ21pc3NpbmdLZXknLCBsLCBuYW1lc3BhY2UsIGssIHJlcyk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2F2ZU1pc3NpbmcpIHtcbiAgICAgICAgICAgIHZhciBuZWVkc1BsdXJhbEhhbmRsaW5nID0gb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zLmNvdW50ICE9PSAnc3RyaW5nJztcblxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYXZlTWlzc2luZ1BsdXJhbHMgJiYgbmVlZHNQbHVyYWxIYW5kbGluZykge1xuICAgICAgICAgICAgICBsbmdzLmZvckVhY2goZnVuY3Rpb24gKGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGx1cmFscyA9IF90aGlzMi5wbHVyYWxSZXNvbHZlci5nZXRQbHVyYWxGb3Jtc09mS2V5KGwsIGtleSk7XG5cbiAgICAgICAgICAgICAgICBwbHVyYWxzLmZvckVhY2goZnVuY3Rpb24gKHApIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBzZW5kKFtsXSwgcCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2VuZChsbmdzLCBrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJlcyA9IHRoaXMuZXh0ZW5kVHJhbnNsYXRpb24ocmVzLCBrZXlzLCBvcHRpb25zLCByZXNvbHZlZCwgbGFzdEtleSk7XG4gICAgICAgIGlmICh1c2VkS2V5ICYmIHJlcyA9PT0ga2V5ICYmIHRoaXMub3B0aW9ucy5hcHBlbmROYW1lc3BhY2VUb01pc3NpbmdLZXkpIHJlcyA9IFwiXCIuY29uY2F0KG5hbWVzcGFjZSwgXCI6XCIpLmNvbmNhdChrZXkpO1xuICAgICAgICBpZiAodXNlZEtleSAmJiB0aGlzLm9wdGlvbnMucGFyc2VNaXNzaW5nS2V5SGFuZGxlcikgcmVzID0gdGhpcy5vcHRpb25zLnBhcnNlTWlzc2luZ0tleUhhbmRsZXIocmVzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZXh0ZW5kVHJhbnNsYXRpb25cIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZXh0ZW5kVHJhbnNsYXRpb24ocmVzLCBrZXksIG9wdGlvbnMsIHJlc29sdmVkLCBsYXN0S2V5KSB7XG4gICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgaWYgKHRoaXMuaTE4bkZvcm1hdCAmJiB0aGlzLmkxOG5Gb3JtYXQucGFyc2UpIHtcbiAgICAgICAgcmVzID0gdGhpcy5pMThuRm9ybWF0LnBhcnNlKHJlcywgb3B0aW9ucywgcmVzb2x2ZWQudXNlZExuZywgcmVzb2x2ZWQudXNlZE5TLCByZXNvbHZlZC51c2VkS2V5LCB7XG4gICAgICAgICAgcmVzb2x2ZWQ6IHJlc29sdmVkXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmICghb3B0aW9ucy5za2lwSW50ZXJwb2xhdGlvbikge1xuICAgICAgICBpZiAob3B0aW9ucy5pbnRlcnBvbGF0aW9uKSB0aGlzLmludGVycG9sYXRvci5pbml0KF9vYmplY3RTcHJlYWQoe30sIG9wdGlvbnMsIHtcbiAgICAgICAgICBpbnRlcnBvbGF0aW9uOiBfb2JqZWN0U3ByZWFkKHt9LCB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbiwgb3B0aW9ucy5pbnRlcnBvbGF0aW9uKVxuICAgICAgICB9KSk7XG4gICAgICAgIHZhciBza2lwT25WYXJpYWJsZXMgPSBvcHRpb25zLmludGVycG9sYXRpb24gJiYgb3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcyB8fCB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5za2lwT25WYXJpYWJsZXM7XG4gICAgICAgIHZhciBuZXN0QmVmO1xuXG4gICAgICAgIGlmIChza2lwT25WYXJpYWJsZXMpIHtcbiAgICAgICAgICB2YXIgbmIgPSByZXMubWF0Y2godGhpcy5pbnRlcnBvbGF0b3IubmVzdGluZ1JlZ2V4cCk7XG4gICAgICAgICAgbmVzdEJlZiA9IG5iICYmIG5iLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkYXRhID0gb3B0aW9ucy5yZXBsYWNlICYmIHR5cGVvZiBvcHRpb25zLnJlcGxhY2UgIT09ICdzdHJpbmcnID8gb3B0aW9ucy5yZXBsYWNlIDogb3B0aW9ucztcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmRlZmF1bHRWYXJpYWJsZXMpIGRhdGEgPSBfb2JqZWN0U3ByZWFkKHt9LCB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzLCBkYXRhKTtcbiAgICAgICAgcmVzID0gdGhpcy5pbnRlcnBvbGF0b3IuaW50ZXJwb2xhdGUocmVzLCBkYXRhLCBvcHRpb25zLmxuZyB8fCB0aGlzLmxhbmd1YWdlLCBvcHRpb25zKTtcblxuICAgICAgICBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgICAgdmFyIG5hID0gcmVzLm1hdGNoKHRoaXMuaW50ZXJwb2xhdG9yLm5lc3RpbmdSZWdleHApO1xuICAgICAgICAgIHZhciBuZXN0QWZ0ID0gbmEgJiYgbmEubGVuZ3RoO1xuICAgICAgICAgIGlmIChuZXN0QmVmIDwgbmVzdEFmdCkgb3B0aW9ucy5uZXN0ID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5uZXN0ICE9PSBmYWxzZSkgcmVzID0gdGhpcy5pbnRlcnBvbGF0b3IubmVzdChyZXMsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgICAgIGFyZ3NbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGxhc3RLZXkgJiYgbGFzdEtleVswXSA9PT0gYXJnc1swXSAmJiAhb3B0aW9ucy5jb250ZXh0KSB7XG4gICAgICAgICAgICBfdGhpczMubG9nZ2VyLndhcm4oXCJJdCBzZWVtcyB5b3UgYXJlIG5lc3RpbmcgcmVjdXJzaXZlbHkga2V5OiBcIi5jb25jYXQoYXJnc1swXSwgXCIgaW4ga2V5OiBcIikuY29uY2F0KGtleVswXSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gX3RoaXMzLnRyYW5zbGF0ZS5hcHBseShfdGhpczMsIGFyZ3MuY29uY2F0KFtrZXldKSk7XG4gICAgICAgIH0sIG9wdGlvbnMpO1xuICAgICAgICBpZiAob3B0aW9ucy5pbnRlcnBvbGF0aW9uKSB0aGlzLmludGVycG9sYXRvci5yZXNldCgpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcG9zdFByb2Nlc3MgPSBvcHRpb25zLnBvc3RQcm9jZXNzIHx8IHRoaXMub3B0aW9ucy5wb3N0UHJvY2VzcztcbiAgICAgIHZhciBwb3N0UHJvY2Vzc29yTmFtZXMgPSB0eXBlb2YgcG9zdFByb2Nlc3MgPT09ICdzdHJpbmcnID8gW3Bvc3RQcm9jZXNzXSA6IHBvc3RQcm9jZXNzO1xuXG4gICAgICBpZiAocmVzICE9PSB1bmRlZmluZWQgJiYgcmVzICE9PSBudWxsICYmIHBvc3RQcm9jZXNzb3JOYW1lcyAmJiBwb3N0UHJvY2Vzc29yTmFtZXMubGVuZ3RoICYmIG9wdGlvbnMuYXBwbHlQb3N0UHJvY2Vzc29yICE9PSBmYWxzZSkge1xuICAgICAgICByZXMgPSBwb3N0UHJvY2Vzc29yLmhhbmRsZShwb3N0UHJvY2Vzc29yTmFtZXMsIHJlcywga2V5LCB0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zLnBvc3RQcm9jZXNzUGFzc1Jlc29sdmVkID8gX29iamVjdFNwcmVhZCh7XG4gICAgICAgICAgaTE4blJlc29sdmVkOiByZXNvbHZlZFxuICAgICAgICB9LCBvcHRpb25zKSA6IG9wdGlvbnMsIHRoaXMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJyZXNvbHZlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlc29sdmUoa2V5cykge1xuICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICAgIHZhciBmb3VuZDtcbiAgICAgIHZhciB1c2VkS2V5O1xuICAgICAgdmFyIGV4YWN0VXNlZEtleTtcbiAgICAgIHZhciB1c2VkTG5nO1xuICAgICAgdmFyIHVzZWROUztcbiAgICAgIGlmICh0eXBlb2Yga2V5cyA9PT0gJ3N0cmluZycpIGtleXMgPSBba2V5c107XG4gICAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgICAgaWYgKF90aGlzNC5pc1ZhbGlkTG9va3VwKGZvdW5kKSkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBleHRyYWN0ZWQgPSBfdGhpczQuZXh0cmFjdEZyb21LZXkoaywgb3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIGtleSA9IGV4dHJhY3RlZC5rZXk7XG4gICAgICAgIHVzZWRLZXkgPSBrZXk7XG4gICAgICAgIHZhciBuYW1lc3BhY2VzID0gZXh0cmFjdGVkLm5hbWVzcGFjZXM7XG4gICAgICAgIGlmIChfdGhpczQub3B0aW9ucy5mYWxsYmFja05TKSBuYW1lc3BhY2VzID0gbmFtZXNwYWNlcy5jb25jYXQoX3RoaXM0Lm9wdGlvbnMuZmFsbGJhY2tOUyk7XG4gICAgICAgIHZhciBuZWVkc1BsdXJhbEhhbmRsaW5nID0gb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zLmNvdW50ICE9PSAnc3RyaW5nJztcbiAgICAgICAgdmFyIG5lZWRzQ29udGV4dEhhbmRsaW5nID0gb3B0aW9ucy5jb250ZXh0ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMuY29udGV4dCA9PT0gJ3N0cmluZycgJiYgb3B0aW9ucy5jb250ZXh0ICE9PSAnJztcbiAgICAgICAgdmFyIGNvZGVzID0gb3B0aW9ucy5sbmdzID8gb3B0aW9ucy5sbmdzIDogX3RoaXM0Lmxhbmd1YWdlVXRpbHMudG9SZXNvbHZlSGllcmFyY2h5KG9wdGlvbnMubG5nIHx8IF90aGlzNC5sYW5ndWFnZSwgb3B0aW9ucy5mYWxsYmFja0xuZyk7XG4gICAgICAgIG5hbWVzcGFjZXMuZm9yRWFjaChmdW5jdGlvbiAobnMpIHtcbiAgICAgICAgICBpZiAoX3RoaXM0LmlzVmFsaWRMb29rdXAoZm91bmQpKSByZXR1cm47XG4gICAgICAgICAgdXNlZE5TID0gbnM7XG5cbiAgICAgICAgICBpZiAoIWNoZWNrZWRMb2FkZWRGb3JbXCJcIi5jb25jYXQoY29kZXNbMF0sIFwiLVwiKS5jb25jYXQobnMpXSAmJiBfdGhpczQudXRpbHMgJiYgX3RoaXM0LnV0aWxzLmhhc0xvYWRlZE5hbWVzcGFjZSAmJiAhX3RoaXM0LnV0aWxzLmhhc0xvYWRlZE5hbWVzcGFjZSh1c2VkTlMpKSB7XG4gICAgICAgICAgICBjaGVja2VkTG9hZGVkRm9yW1wiXCIuY29uY2F0KGNvZGVzWzBdLCBcIi1cIikuY29uY2F0KG5zKV0gPSB0cnVlO1xuXG4gICAgICAgICAgICBfdGhpczQubG9nZ2VyLndhcm4oXCJrZXkgXFxcIlwiLmNvbmNhdCh1c2VkS2V5LCBcIlxcXCIgZm9yIGxhbmd1YWdlcyBcXFwiXCIpLmNvbmNhdChjb2Rlcy5qb2luKCcsICcpLCBcIlxcXCIgd29uJ3QgZ2V0IHJlc29sdmVkIGFzIG5hbWVzcGFjZSBcXFwiXCIpLmNvbmNhdCh1c2VkTlMsIFwiXFxcIiB3YXMgbm90IHlldCBsb2FkZWRcIiksICdUaGlzIG1lYW5zIHNvbWV0aGluZyBJUyBXUk9ORyBpbiB5b3VyIHNldHVwLiBZb3UgYWNjZXNzIHRoZSB0IGZ1bmN0aW9uIGJlZm9yZSBpMThuZXh0LmluaXQgLyBpMThuZXh0LmxvYWROYW1lc3BhY2UgLyBpMThuZXh0LmNoYW5nZUxhbmd1YWdlIHdhcyBkb25lLiBXYWl0IGZvciB0aGUgY2FsbGJhY2sgb3IgUHJvbWlzZSB0byByZXNvbHZlIGJlZm9yZSBhY2Nlc3NpbmcgaXQhISEnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXM0LmlzVmFsaWRMb29rdXAoZm91bmQpKSByZXR1cm47XG4gICAgICAgICAgICB1c2VkTG5nID0gY29kZTtcbiAgICAgICAgICAgIHZhciBmaW5hbEtleSA9IGtleTtcbiAgICAgICAgICAgIHZhciBmaW5hbEtleXMgPSBbZmluYWxLZXldO1xuXG4gICAgICAgICAgICBpZiAoX3RoaXM0LmkxOG5Gb3JtYXQgJiYgX3RoaXM0LmkxOG5Gb3JtYXQuYWRkTG9va3VwS2V5cykge1xuICAgICAgICAgICAgICBfdGhpczQuaTE4bkZvcm1hdC5hZGRMb29rdXBLZXlzKGZpbmFsS2V5cywga2V5LCBjb2RlLCBucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB2YXIgcGx1cmFsU3VmZml4O1xuICAgICAgICAgICAgICBpZiAobmVlZHNQbHVyYWxIYW5kbGluZykgcGx1cmFsU3VmZml4ID0gX3RoaXM0LnBsdXJhbFJlc29sdmVyLmdldFN1ZmZpeChjb2RlLCBvcHRpb25zLmNvdW50KTtcbiAgICAgICAgICAgICAgaWYgKG5lZWRzUGx1cmFsSGFuZGxpbmcgJiYgbmVlZHNDb250ZXh0SGFuZGxpbmcpIGZpbmFsS2V5cy5wdXNoKGZpbmFsS2V5ICsgcGx1cmFsU3VmZml4KTtcbiAgICAgICAgICAgICAgaWYgKG5lZWRzQ29udGV4dEhhbmRsaW5nKSBmaW5hbEtleXMucHVzaChmaW5hbEtleSArPSBcIlwiLmNvbmNhdChfdGhpczQub3B0aW9ucy5jb250ZXh0U2VwYXJhdG9yKS5jb25jYXQob3B0aW9ucy5jb250ZXh0KSk7XG4gICAgICAgICAgICAgIGlmIChuZWVkc1BsdXJhbEhhbmRsaW5nKSBmaW5hbEtleXMucHVzaChmaW5hbEtleSArPSBwbHVyYWxTdWZmaXgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcG9zc2libGVLZXk7XG5cbiAgICAgICAgICAgIHdoaWxlIChwb3NzaWJsZUtleSA9IGZpbmFsS2V5cy5wb3AoKSkge1xuICAgICAgICAgICAgICBpZiAoIV90aGlzNC5pc1ZhbGlkTG9va3VwKGZvdW5kKSkge1xuICAgICAgICAgICAgICAgIGV4YWN0VXNlZEtleSA9IHBvc3NpYmxlS2V5O1xuICAgICAgICAgICAgICAgIGZvdW5kID0gX3RoaXM0LmdldFJlc291cmNlKGNvZGUsIG5zLCBwb3NzaWJsZUtleSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlczogZm91bmQsXG4gICAgICAgIHVzZWRLZXk6IHVzZWRLZXksXG4gICAgICAgIGV4YWN0VXNlZEtleTogZXhhY3RVc2VkS2V5LFxuICAgICAgICB1c2VkTG5nOiB1c2VkTG5nLFxuICAgICAgICB1c2VkTlM6IHVzZWROU1xuICAgICAgfTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaXNWYWxpZExvb2t1cFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpc1ZhbGlkTG9va3VwKHJlcykge1xuICAgICAgcmV0dXJuIHJlcyAhPT0gdW5kZWZpbmVkICYmICEoIXRoaXMub3B0aW9ucy5yZXR1cm5OdWxsICYmIHJlcyA9PT0gbnVsbCkgJiYgISghdGhpcy5vcHRpb25zLnJldHVybkVtcHR5U3RyaW5nICYmIHJlcyA9PT0gJycpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRSZXNvdXJjZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRSZXNvdXJjZShjb2RlLCBucywga2V5KSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge307XG4gICAgICBpZiAodGhpcy5pMThuRm9ybWF0ICYmIHRoaXMuaTE4bkZvcm1hdC5nZXRSZXNvdXJjZSkgcmV0dXJuIHRoaXMuaTE4bkZvcm1hdC5nZXRSZXNvdXJjZShjb2RlLCBucywga2V5LCBvcHRpb25zKTtcbiAgICAgIHJldHVybiB0aGlzLnJlc291cmNlU3RvcmUuZ2V0UmVzb3VyY2UoY29kZSwgbnMsIGtleSwgb3B0aW9ucyk7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIFRyYW5zbGF0b3I7XG59KEV2ZW50RW1pdHRlcik7XG5cbmZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG59XG5cbnZhciBMYW5ndWFnZVV0aWwgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIExhbmd1YWdlVXRpbChvcHRpb25zKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExhbmd1YWdlVXRpbCk7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMud2hpdGVsaXN0ID0gdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MgfHwgZmFsc2U7XG4gICAgdGhpcy5zdXBwb3J0ZWRMbmdzID0gdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MgfHwgZmFsc2U7XG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgnbGFuZ3VhZ2VVdGlscycpO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKExhbmd1YWdlVXRpbCwgW3tcbiAgICBrZXk6IFwiZ2V0U2NyaXB0UGFydEZyb21Db2RlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFNjcmlwdFBhcnRGcm9tQ29kZShjb2RlKSB7XG4gICAgICBpZiAoIWNvZGUgfHwgY29kZS5pbmRleE9mKCctJykgPCAwKSByZXR1cm4gbnVsbDtcbiAgICAgIHZhciBwID0gY29kZS5zcGxpdCgnLScpO1xuICAgICAgaWYgKHAubGVuZ3RoID09PSAyKSByZXR1cm4gbnVsbDtcbiAgICAgIHAucG9wKCk7XG4gICAgICBpZiAocFtwLmxlbmd0aCAtIDFdLnRvTG93ZXJDYXNlKCkgPT09ICd4JykgcmV0dXJuIG51bGw7XG4gICAgICByZXR1cm4gdGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUocC5qb2luKCctJykpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRMYW5ndWFnZVBhcnRGcm9tQ29kZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKSB7XG4gICAgICBpZiAoIWNvZGUgfHwgY29kZS5pbmRleE9mKCctJykgPCAwKSByZXR1cm4gY29kZTtcbiAgICAgIHZhciBwID0gY29kZS5zcGxpdCgnLScpO1xuICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKHBbMF0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJmb3JtYXRMYW5ndWFnZUNvZGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpIHtcbiAgICAgIGlmICh0eXBlb2YgY29kZSA9PT0gJ3N0cmluZycgJiYgY29kZS5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgICB2YXIgc3BlY2lhbENhc2VzID0gWydoYW5zJywgJ2hhbnQnLCAnbGF0bicsICdjeXJsJywgJ2NhbnMnLCAnbW9uZycsICdhcmFiJ107XG4gICAgICAgIHZhciBwID0gY29kZS5zcGxpdCgnLScpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubG93ZXJDYXNlTG5nKSB7XG4gICAgICAgICAgcCA9IHAubWFwKGZ1bmN0aW9uIChwYXJ0KSB7XG4gICAgICAgICAgICByZXR1cm4gcGFydC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHAubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgcFswXSA9IHBbMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBwWzFdID0gcFsxXS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgIGlmIChzcGVjaWFsQ2FzZXMuaW5kZXhPZihwWzFdLnRvTG93ZXJDYXNlKCkpID4gLTEpIHBbMV0gPSBjYXBpdGFsaXplKHBbMV0udG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIH0gZWxzZSBpZiAocC5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICBwWzBdID0gcFswXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIGlmIChwWzFdLmxlbmd0aCA9PT0gMikgcFsxXSA9IHBbMV0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgICBpZiAocFswXSAhPT0gJ3NnbicgJiYgcFsyXS5sZW5ndGggPT09IDIpIHBbMl0gPSBwWzJdLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgaWYgKHNwZWNpYWxDYXNlcy5pbmRleE9mKHBbMV0udG9Mb3dlckNhc2UoKSkgPiAtMSkgcFsxXSA9IGNhcGl0YWxpemUocFsxXS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgICBpZiAoc3BlY2lhbENhc2VzLmluZGV4T2YocFsyXS50b0xvd2VyQ2FzZSgpKSA+IC0xKSBwWzJdID0gY2FwaXRhbGl6ZShwWzJdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHAuam9pbignLScpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNsZWFuQ29kZSB8fCB0aGlzLm9wdGlvbnMubG93ZXJDYXNlTG5nID8gY29kZS50b0xvd2VyQ2FzZSgpIDogY29kZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaXNXaGl0ZWxpc3RlZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpc1doaXRlbGlzdGVkKGNvZGUpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmRlcHJlY2F0ZSgnbGFuZ3VhZ2VVdGlscy5pc1doaXRlbGlzdGVkJywgJ2Z1bmN0aW9uIFwiaXNXaGl0ZWxpc3RlZFwiIHdpbGwgYmUgcmVuYW1lZCB0byBcImlzU3VwcG9ydGVkQ29kZVwiIGluIHRoZSBuZXh0IG1ham9yIC0gcGxlYXNlIG1ha2Ugc3VyZSB0byByZW5hbWUgaXRcXCdzIHVzYWdlIGFzYXAuJyk7XG4gICAgICByZXR1cm4gdGhpcy5pc1N1cHBvcnRlZENvZGUoY29kZSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImlzU3VwcG9ydGVkQ29kZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpc1N1cHBvcnRlZENvZGUoY29kZSkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2FkID09PSAnbGFuZ3VhZ2VPbmx5JyB8fCB0aGlzLm9wdGlvbnMubm9uRXhwbGljaXRTdXBwb3J0ZWRMbmdzKSB7XG4gICAgICAgIGNvZGUgPSB0aGlzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gIXRoaXMuc3VwcG9ydGVkTG5ncyB8fCAhdGhpcy5zdXBwb3J0ZWRMbmdzLmxlbmd0aCB8fCB0aGlzLnN1cHBvcnRlZExuZ3MuaW5kZXhPZihjb2RlKSA+IC0xO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRCZXN0TWF0Y2hGcm9tQ29kZXNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QmVzdE1hdGNoRnJvbUNvZGVzKGNvZGVzKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICBpZiAoIWNvZGVzKSByZXR1cm4gbnVsbDtcbiAgICAgIHZhciBmb3VuZDtcbiAgICAgIGNvZGVzLmZvckVhY2goZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgICAgaWYgKGZvdW5kKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGNsZWFuZWRMbmcgPSBfdGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUoY29kZSk7XG5cbiAgICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLnN1cHBvcnRlZExuZ3MgfHwgX3RoaXMuaXNTdXBwb3J0ZWRDb2RlKGNsZWFuZWRMbmcpKSBmb3VuZCA9IGNsZWFuZWRMbmc7XG4gICAgICB9KTtcblxuICAgICAgaWYgKCFmb3VuZCAmJiB0aGlzLm9wdGlvbnMuc3VwcG9ydGVkTG5ncykge1xuICAgICAgICBjb2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICAgICAgaWYgKGZvdW5kKSByZXR1cm47XG5cbiAgICAgICAgICB2YXIgbG5nT25seSA9IF90aGlzLmdldExhbmd1YWdlUGFydEZyb21Db2RlKGNvZGUpO1xuXG4gICAgICAgICAgaWYgKF90aGlzLmlzU3VwcG9ydGVkQ29kZShsbmdPbmx5KSkgcmV0dXJuIGZvdW5kID0gbG5nT25seTtcbiAgICAgICAgICBmb3VuZCA9IF90aGlzLm9wdGlvbnMuc3VwcG9ydGVkTG5ncy5maW5kKGZ1bmN0aW9uIChzdXBwb3J0ZWRMbmcpIHtcbiAgICAgICAgICAgIGlmIChzdXBwb3J0ZWRMbmcuaW5kZXhPZihsbmdPbmx5KSA9PT0gMCkgcmV0dXJuIHN1cHBvcnRlZExuZztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghZm91bmQpIGZvdW5kID0gdGhpcy5nZXRGYWxsYmFja0NvZGVzKHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZylbMF07XG4gICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImdldEZhbGxiYWNrQ29kZXNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0RmFsbGJhY2tDb2RlcyhmYWxsYmFja3MsIGNvZGUpIHtcbiAgICAgIGlmICghZmFsbGJhY2tzKSByZXR1cm4gW107XG4gICAgICBpZiAodHlwZW9mIGZhbGxiYWNrcyA9PT0gJ2Z1bmN0aW9uJykgZmFsbGJhY2tzID0gZmFsbGJhY2tzKGNvZGUpO1xuICAgICAgaWYgKHR5cGVvZiBmYWxsYmFja3MgPT09ICdzdHJpbmcnKSBmYWxsYmFja3MgPSBbZmFsbGJhY2tzXTtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KGZhbGxiYWNrcykgPT09ICdbb2JqZWN0IEFycmF5XScpIHJldHVybiBmYWxsYmFja3M7XG4gICAgICBpZiAoIWNvZGUpIHJldHVybiBmYWxsYmFja3NbXCJkZWZhdWx0XCJdIHx8IFtdO1xuICAgICAgdmFyIGZvdW5kID0gZmFsbGJhY2tzW2NvZGVdO1xuICAgICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3NbdGhpcy5nZXRTY3JpcHRQYXJ0RnJvbUNvZGUoY29kZSldO1xuICAgICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3NbdGhpcy5mb3JtYXRMYW5ndWFnZUNvZGUoY29kZSldO1xuICAgICAgaWYgKCFmb3VuZCkgZm91bmQgPSBmYWxsYmFja3NbdGhpcy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKV07XG4gICAgICBpZiAoIWZvdW5kKSBmb3VuZCA9IGZhbGxiYWNrc1tcImRlZmF1bHRcIl07XG4gICAgICByZXR1cm4gZm91bmQgfHwgW107XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInRvUmVzb2x2ZUhpZXJhcmNoeVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0b1Jlc29sdmVIaWVyYXJjaHkoY29kZSwgZmFsbGJhY2tDb2RlKSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgdmFyIGZhbGxiYWNrQ29kZXMgPSB0aGlzLmdldEZhbGxiYWNrQ29kZXMoZmFsbGJhY2tDb2RlIHx8IHRoaXMub3B0aW9ucy5mYWxsYmFja0xuZyB8fCBbXSwgY29kZSk7XG4gICAgICB2YXIgY29kZXMgPSBbXTtcblxuICAgICAgdmFyIGFkZENvZGUgPSBmdW5jdGlvbiBhZGRDb2RlKGMpIHtcbiAgICAgICAgaWYgKCFjKSByZXR1cm47XG5cbiAgICAgICAgaWYgKF90aGlzMi5pc1N1cHBvcnRlZENvZGUoYykpIHtcbiAgICAgICAgICBjb2Rlcy5wdXNoKGMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF90aGlzMi5sb2dnZXIud2FybihcInJlamVjdGluZyBsYW5ndWFnZSBjb2RlIG5vdCBmb3VuZCBpbiBzdXBwb3J0ZWRMbmdzOiBcIi5jb25jYXQoYykpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAodHlwZW9mIGNvZGUgPT09ICdzdHJpbmcnICYmIGNvZGUuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2FkICE9PSAnbGFuZ3VhZ2VPbmx5JykgYWRkQ29kZSh0aGlzLmZvcm1hdExhbmd1YWdlQ29kZShjb2RlKSk7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9hZCAhPT0gJ2xhbmd1YWdlT25seScgJiYgdGhpcy5vcHRpb25zLmxvYWQgIT09ICdjdXJyZW50T25seScpIGFkZENvZGUodGhpcy5nZXRTY3JpcHRQYXJ0RnJvbUNvZGUoY29kZSkpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmxvYWQgIT09ICdjdXJyZW50T25seScpIGFkZENvZGUodGhpcy5nZXRMYW5ndWFnZVBhcnRGcm9tQ29kZShjb2RlKSk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICBhZGRDb2RlKHRoaXMuZm9ybWF0TGFuZ3VhZ2VDb2RlKGNvZGUpKTtcbiAgICAgIH1cblxuICAgICAgZmFsbGJhY2tDb2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChmYykge1xuICAgICAgICBpZiAoY29kZXMuaW5kZXhPZihmYykgPCAwKSBhZGRDb2RlKF90aGlzMi5mb3JtYXRMYW5ndWFnZUNvZGUoZmMpKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNvZGVzO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBMYW5ndWFnZVV0aWw7XG59KCk7XG5cbnZhciBzZXRzID0gW3tcbiAgbG5nczogWydhY2gnLCAnYWsnLCAnYW0nLCAnYXJuJywgJ2JyJywgJ2ZpbCcsICdndW4nLCAnbG4nLCAnbWZlJywgJ21nJywgJ21pJywgJ29jJywgJ3B0JywgJ3B0LUJSJywgJ3RnJywgJ3RpJywgJ3RyJywgJ3V6JywgJ3dhJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiAxXG59LCB7XG4gIGxuZ3M6IFsnYWYnLCAnYW4nLCAnYXN0JywgJ2F6JywgJ2JnJywgJ2JuJywgJ2NhJywgJ2RhJywgJ2RlJywgJ2RldicsICdlbCcsICdlbicsICdlbycsICdlcycsICdldCcsICdldScsICdmaScsICdmbycsICdmdXInLCAnZnknLCAnZ2wnLCAnZ3UnLCAnaGEnLCAnaGknLCAnaHUnLCAnaHknLCAnaWEnLCAnaXQnLCAna24nLCAna3UnLCAnbGInLCAnbWFpJywgJ21sJywgJ21uJywgJ21yJywgJ25haCcsICduYXAnLCAnbmInLCAnbmUnLCAnbmwnLCAnbm4nLCAnbm8nLCAnbnNvJywgJ3BhJywgJ3BhcCcsICdwbXMnLCAncHMnLCAncHQtUFQnLCAncm0nLCAnc2NvJywgJ3NlJywgJ3NpJywgJ3NvJywgJ3NvbicsICdzcScsICdzdicsICdzdycsICd0YScsICd0ZScsICd0aycsICd1cicsICd5byddLFxuICBucjogWzEsIDJdLFxuICBmYzogMlxufSwge1xuICBsbmdzOiBbJ2F5JywgJ2JvJywgJ2NnZycsICdmYScsICdodCcsICdpZCcsICdqYScsICdqYm8nLCAna2EnLCAna2snLCAna20nLCAna28nLCAna3knLCAnbG8nLCAnbXMnLCAnc2FoJywgJ3N1JywgJ3RoJywgJ3R0JywgJ3VnJywgJ3ZpJywgJ3dvJywgJ3poJ10sXG4gIG5yOiBbMV0sXG4gIGZjOiAzXG59LCB7XG4gIGxuZ3M6IFsnYmUnLCAnYnMnLCAnY25yJywgJ2R6JywgJ2hyJywgJ3J1JywgJ3NyJywgJ3VrJ10sXG4gIG5yOiBbMSwgMiwgNV0sXG4gIGZjOiA0XG59LCB7XG4gIGxuZ3M6IFsnYXInXSxcbiAgbnI6IFswLCAxLCAyLCAzLCAxMSwgMTAwXSxcbiAgZmM6IDVcbn0sIHtcbiAgbG5nczogWydjcycsICdzayddLFxuICBucjogWzEsIDIsIDVdLFxuICBmYzogNlxufSwge1xuICBsbmdzOiBbJ2NzYicsICdwbCddLFxuICBucjogWzEsIDIsIDVdLFxuICBmYzogN1xufSwge1xuICBsbmdzOiBbJ2N5J10sXG4gIG5yOiBbMSwgMiwgMywgOF0sXG4gIGZjOiA4XG59LCB7XG4gIGxuZ3M6IFsnZnInXSxcbiAgbnI6IFsxLCAyXSxcbiAgZmM6IDlcbn0sIHtcbiAgbG5nczogWydnYSddLFxuICBucjogWzEsIDIsIDMsIDcsIDExXSxcbiAgZmM6IDEwXG59LCB7XG4gIGxuZ3M6IFsnZ2QnXSxcbiAgbnI6IFsxLCAyLCAzLCAyMF0sXG4gIGZjOiAxMVxufSwge1xuICBsbmdzOiBbJ2lzJ10sXG4gIG5yOiBbMSwgMl0sXG4gIGZjOiAxMlxufSwge1xuICBsbmdzOiBbJ2p2J10sXG4gIG5yOiBbMCwgMV0sXG4gIGZjOiAxM1xufSwge1xuICBsbmdzOiBbJ2t3J10sXG4gIG5yOiBbMSwgMiwgMywgNF0sXG4gIGZjOiAxNFxufSwge1xuICBsbmdzOiBbJ2x0J10sXG4gIG5yOiBbMSwgMiwgMTBdLFxuICBmYzogMTVcbn0sIHtcbiAgbG5nczogWydsdiddLFxuICBucjogWzEsIDIsIDBdLFxuICBmYzogMTZcbn0sIHtcbiAgbG5nczogWydtayddLFxuICBucjogWzEsIDJdLFxuICBmYzogMTdcbn0sIHtcbiAgbG5nczogWydtbmsnXSxcbiAgbnI6IFswLCAxLCAyXSxcbiAgZmM6IDE4XG59LCB7XG4gIGxuZ3M6IFsnbXQnXSxcbiAgbnI6IFsxLCAyLCAxMSwgMjBdLFxuICBmYzogMTlcbn0sIHtcbiAgbG5nczogWydvciddLFxuICBucjogWzIsIDFdLFxuICBmYzogMlxufSwge1xuICBsbmdzOiBbJ3JvJ10sXG4gIG5yOiBbMSwgMiwgMjBdLFxuICBmYzogMjBcbn0sIHtcbiAgbG5nczogWydzbCddLFxuICBucjogWzUsIDEsIDIsIDNdLFxuICBmYzogMjFcbn0sIHtcbiAgbG5nczogWydoZScsICdpdyddLFxuICBucjogWzEsIDIsIDIwLCAyMV0sXG4gIGZjOiAyMlxufV07XG52YXIgX3J1bGVzUGx1cmFsc1R5cGVzID0ge1xuICAxOiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPiAxKTtcbiAgfSxcbiAgMjogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICE9IDEpO1xuICB9LFxuICAzOiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gMDtcbiAgfSxcbiAgNDogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICUgMTAgPT0gMSAmJiBuICUgMTAwICE9IDExID8gMCA6IG4gJSAxMCA+PSAyICYmIG4gJSAxMCA8PSA0ICYmIChuICUgMTAwIDwgMTAgfHwgbiAlIDEwMCA+PSAyMCkgPyAxIDogMik7XG4gIH0sXG4gIDU6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAwID8gMCA6IG4gPT0gMSA/IDEgOiBuID09IDIgPyAyIDogbiAlIDEwMCA+PSAzICYmIG4gJSAxMDAgPD0gMTAgPyAzIDogbiAlIDEwMCA+PSAxMSA/IDQgOiA1KTtcbiAgfSxcbiAgNjogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgPyAwIDogbiA+PSAyICYmIG4gPD0gNCA/IDEgOiAyKTtcbiAgfSxcbiAgNzogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgPyAwIDogbiAlIDEwID49IDIgJiYgbiAlIDEwIDw9IDQgJiYgKG4gJSAxMDAgPCAxMCB8fCBuICUgMTAwID49IDIwKSA/IDEgOiAyKTtcbiAgfSxcbiAgODogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgPyAwIDogbiA9PSAyID8gMSA6IG4gIT0gOCAmJiBuICE9IDExID8gMiA6IDMpO1xuICB9LFxuICA5OiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPj0gMik7XG4gIH0sXG4gIDEwOiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gPT0gMSA/IDAgOiBuID09IDIgPyAxIDogbiA8IDcgPyAyIDogbiA8IDExID8gMyA6IDQpO1xuICB9LFxuICAxMTogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgfHwgbiA9PSAxMSA/IDAgOiBuID09IDIgfHwgbiA9PSAxMiA/IDEgOiBuID4gMiAmJiBuIDwgMjAgPyAyIDogMyk7XG4gIH0sXG4gIDEyOiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gJSAxMCAhPSAxIHx8IG4gJSAxMDAgPT0gMTEpO1xuICB9LFxuICAxMzogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuICE9PSAwKTtcbiAgfSxcbiAgMTQ6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMiA/IDEgOiBuID09IDMgPyAyIDogMyk7XG4gIH0sXG4gIDE1OiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gJSAxMCA9PSAxICYmIG4gJSAxMDAgIT0gMTEgPyAwIDogbiAlIDEwID49IDIgJiYgKG4gJSAxMDAgPCAxMCB8fCBuICUgMTAwID49IDIwKSA/IDEgOiAyKTtcbiAgfSxcbiAgMTY6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiAlIDEwID09IDEgJiYgbiAlIDEwMCAhPSAxMSA/IDAgOiBuICE9PSAwID8gMSA6IDIpO1xuICB9LFxuICAxNzogZnVuY3Rpb24gXyhuKSB7XG4gICAgcmV0dXJuIE51bWJlcihuID09IDEgfHwgbiAlIDEwID09IDEgJiYgbiAlIDEwMCAhPSAxMSA/IDAgOiAxKTtcbiAgfSxcbiAgMTg6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAwID8gMCA6IG4gPT0gMSA/IDEgOiAyKTtcbiAgfSxcbiAgMTk6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMCB8fCBuICUgMTAwID4gMSAmJiBuICUgMTAwIDwgMTEgPyAxIDogbiAlIDEwMCA+IDEwICYmIG4gJSAxMDAgPCAyMCA/IDIgOiAzKTtcbiAgfSxcbiAgMjA6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMCB8fCBuICUgMTAwID4gMCAmJiBuICUgMTAwIDwgMjAgPyAxIDogMik7XG4gIH0sXG4gIDIxOiBmdW5jdGlvbiBfKG4pIHtcbiAgICByZXR1cm4gTnVtYmVyKG4gJSAxMDAgPT0gMSA/IDEgOiBuICUgMTAwID09IDIgPyAyIDogbiAlIDEwMCA9PSAzIHx8IG4gJSAxMDAgPT0gNCA/IDMgOiAwKTtcbiAgfSxcbiAgMjI6IGZ1bmN0aW9uIF8obikge1xuICAgIHJldHVybiBOdW1iZXIobiA9PSAxID8gMCA6IG4gPT0gMiA/IDEgOiAobiA8IDAgfHwgbiA+IDEwKSAmJiBuICUgMTAgPT0gMCA/IDIgOiAzKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlUnVsZXMoKSB7XG4gIHZhciBydWxlcyA9IHt9O1xuICBzZXRzLmZvckVhY2goZnVuY3Rpb24gKHNldCkge1xuICAgIHNldC5sbmdzLmZvckVhY2goZnVuY3Rpb24gKGwpIHtcbiAgICAgIHJ1bGVzW2xdID0ge1xuICAgICAgICBudW1iZXJzOiBzZXQubnIsXG4gICAgICAgIHBsdXJhbHM6IF9ydWxlc1BsdXJhbHNUeXBlc1tzZXQuZmNdXG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcbiAgcmV0dXJuIHJ1bGVzO1xufVxuXG52YXIgUGx1cmFsUmVzb2x2ZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIFBsdXJhbFJlc29sdmVyKGxhbmd1YWdlVXRpbHMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgUGx1cmFsUmVzb2x2ZXIpO1xuXG4gICAgdGhpcy5sYW5ndWFnZVV0aWxzID0gbGFuZ3VhZ2VVdGlscztcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMubG9nZ2VyID0gYmFzZUxvZ2dlci5jcmVhdGUoJ3BsdXJhbFJlc29sdmVyJyk7XG4gICAgdGhpcy5ydWxlcyA9IGNyZWF0ZVJ1bGVzKCk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoUGx1cmFsUmVzb2x2ZXIsIFt7XG4gICAga2V5OiBcImFkZFJ1bGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkUnVsZShsbmcsIG9iaikge1xuICAgICAgdGhpcy5ydWxlc1tsbmddID0gb2JqO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRSdWxlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFJ1bGUoY29kZSkge1xuICAgICAgcmV0dXJuIHRoaXMucnVsZXNbY29kZV0gfHwgdGhpcy5ydWxlc1t0aGlzLmxhbmd1YWdlVXRpbHMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUoY29kZSldO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJuZWVkc1BsdXJhbFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBuZWVkc1BsdXJhbChjb2RlKSB7XG4gICAgICB2YXIgcnVsZSA9IHRoaXMuZ2V0UnVsZShjb2RlKTtcbiAgICAgIHJldHVybiBydWxlICYmIHJ1bGUubnVtYmVycy5sZW5ndGggPiAxO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRQbHVyYWxGb3Jtc09mS2V5XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFBsdXJhbEZvcm1zT2ZLZXkoY29kZSwga2V5KSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICB2YXIgcmV0ID0gW107XG4gICAgICB2YXIgcnVsZSA9IHRoaXMuZ2V0UnVsZShjb2RlKTtcbiAgICAgIGlmICghcnVsZSkgcmV0dXJuIHJldDtcbiAgICAgIHJ1bGUubnVtYmVycy5mb3JFYWNoKGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHZhciBzdWZmaXggPSBfdGhpcy5nZXRTdWZmaXgoY29kZSwgbik7XG5cbiAgICAgICAgcmV0LnB1c2goXCJcIi5jb25jYXQoa2V5KS5jb25jYXQoc3VmZml4KSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImdldFN1ZmZpeFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRTdWZmaXgoY29kZSwgY291bnQpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICB2YXIgcnVsZSA9IHRoaXMuZ2V0UnVsZShjb2RlKTtcblxuICAgICAgaWYgKHJ1bGUpIHtcbiAgICAgICAgdmFyIGlkeCA9IHJ1bGUubm9BYnMgPyBydWxlLnBsdXJhbHMoY291bnQpIDogcnVsZS5wbHVyYWxzKE1hdGguYWJzKGNvdW50KSk7XG4gICAgICAgIHZhciBzdWZmaXggPSBydWxlLm51bWJlcnNbaWR4XTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNpbXBsaWZ5UGx1cmFsU3VmZml4ICYmIHJ1bGUubnVtYmVycy5sZW5ndGggPT09IDIgJiYgcnVsZS5udW1iZXJzWzBdID09PSAxKSB7XG4gICAgICAgICAgaWYgKHN1ZmZpeCA9PT0gMikge1xuICAgICAgICAgICAgc3VmZml4ID0gJ3BsdXJhbCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChzdWZmaXggPT09IDEpIHtcbiAgICAgICAgICAgIHN1ZmZpeCA9ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXR1cm5TdWZmaXggPSBmdW5jdGlvbiByZXR1cm5TdWZmaXgoKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzMi5vcHRpb25zLnByZXBlbmQgJiYgc3VmZml4LnRvU3RyaW5nKCkgPyBfdGhpczIub3B0aW9ucy5wcmVwZW5kICsgc3VmZml4LnRvU3RyaW5nKCkgOiBzdWZmaXgudG9TdHJpbmcoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNvbXBhdGliaWxpdHlKU09OID09PSAndjEnKSB7XG4gICAgICAgICAgaWYgKHN1ZmZpeCA9PT0gMSkgcmV0dXJuICcnO1xuICAgICAgICAgIGlmICh0eXBlb2Ygc3VmZml4ID09PSAnbnVtYmVyJykgcmV0dXJuIFwiX3BsdXJhbF9cIi5jb25jYXQoc3VmZml4LnRvU3RyaW5nKCkpO1xuICAgICAgICAgIHJldHVybiByZXR1cm5TdWZmaXgoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUpTT04gPT09ICd2MicpIHtcbiAgICAgICAgICByZXR1cm4gcmV0dXJuU3VmZml4KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnNpbXBsaWZ5UGx1cmFsU3VmZml4ICYmIHJ1bGUubnVtYmVycy5sZW5ndGggPT09IDIgJiYgcnVsZS5udW1iZXJzWzBdID09PSAxKSB7XG4gICAgICAgICAgcmV0dXJuIHJldHVyblN1ZmZpeCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5wcmVwZW5kICYmIGlkeC50b1N0cmluZygpID8gdGhpcy5vcHRpb25zLnByZXBlbmQgKyBpZHgudG9TdHJpbmcoKSA6IGlkeC50b1N0cmluZygpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmxvZ2dlci53YXJuKFwibm8gcGx1cmFsIHJ1bGUgZm91bmQgZm9yOiBcIi5jb25jYXQoY29kZSkpO1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBQbHVyYWxSZXNvbHZlcjtcbn0oKTtcblxudmFyIEludGVycG9sYXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gSW50ZXJwb2xhdG9yKCkge1xuICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBJbnRlcnBvbGF0b3IpO1xuXG4gICAgdGhpcy5sb2dnZXIgPSBiYXNlTG9nZ2VyLmNyZWF0ZSgnaW50ZXJwb2xhdG9yJyk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgIHRoaXMuZm9ybWF0ID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uICYmIG9wdGlvbnMuaW50ZXJwb2xhdGlvbi5mb3JtYXQgfHwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHRoaXMuaW5pdChvcHRpb25zKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhJbnRlcnBvbGF0b3IsIFt7XG4gICAga2V5OiBcImluaXRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICAgIGlmICghb3B0aW9ucy5pbnRlcnBvbGF0aW9uKSBvcHRpb25zLmludGVycG9sYXRpb24gPSB7XG4gICAgICAgIGVzY2FwZVZhbHVlOiB0cnVlXG4gICAgICB9O1xuICAgICAgdmFyIGlPcHRzID0gb3B0aW9ucy5pbnRlcnBvbGF0aW9uO1xuICAgICAgdGhpcy5lc2NhcGUgPSBpT3B0cy5lc2NhcGUgIT09IHVuZGVmaW5lZCA/IGlPcHRzLmVzY2FwZSA6IGVzY2FwZTtcbiAgICAgIHRoaXMuZXNjYXBlVmFsdWUgPSBpT3B0cy5lc2NhcGVWYWx1ZSAhPT0gdW5kZWZpbmVkID8gaU9wdHMuZXNjYXBlVmFsdWUgOiB0cnVlO1xuICAgICAgdGhpcy51c2VSYXdWYWx1ZVRvRXNjYXBlID0gaU9wdHMudXNlUmF3VmFsdWVUb0VzY2FwZSAhPT0gdW5kZWZpbmVkID8gaU9wdHMudXNlUmF3VmFsdWVUb0VzY2FwZSA6IGZhbHNlO1xuICAgICAgdGhpcy5wcmVmaXggPSBpT3B0cy5wcmVmaXggPyByZWdleEVzY2FwZShpT3B0cy5wcmVmaXgpIDogaU9wdHMucHJlZml4RXNjYXBlZCB8fCAne3snO1xuICAgICAgdGhpcy5zdWZmaXggPSBpT3B0cy5zdWZmaXggPyByZWdleEVzY2FwZShpT3B0cy5zdWZmaXgpIDogaU9wdHMuc3VmZml4RXNjYXBlZCB8fCAnfX0nO1xuICAgICAgdGhpcy5mb3JtYXRTZXBhcmF0b3IgPSBpT3B0cy5mb3JtYXRTZXBhcmF0b3IgPyBpT3B0cy5mb3JtYXRTZXBhcmF0b3IgOiBpT3B0cy5mb3JtYXRTZXBhcmF0b3IgfHwgJywnO1xuICAgICAgdGhpcy51bmVzY2FwZVByZWZpeCA9IGlPcHRzLnVuZXNjYXBlU3VmZml4ID8gJycgOiBpT3B0cy51bmVzY2FwZVByZWZpeCB8fCAnLSc7XG4gICAgICB0aGlzLnVuZXNjYXBlU3VmZml4ID0gdGhpcy51bmVzY2FwZVByZWZpeCA/ICcnIDogaU9wdHMudW5lc2NhcGVTdWZmaXggfHwgJyc7XG4gICAgICB0aGlzLm5lc3RpbmdQcmVmaXggPSBpT3B0cy5uZXN0aW5nUHJlZml4ID8gcmVnZXhFc2NhcGUoaU9wdHMubmVzdGluZ1ByZWZpeCkgOiBpT3B0cy5uZXN0aW5nUHJlZml4RXNjYXBlZCB8fCByZWdleEVzY2FwZSgnJHQoJyk7XG4gICAgICB0aGlzLm5lc3RpbmdTdWZmaXggPSBpT3B0cy5uZXN0aW5nU3VmZml4ID8gcmVnZXhFc2NhcGUoaU9wdHMubmVzdGluZ1N1ZmZpeCkgOiBpT3B0cy5uZXN0aW5nU3VmZml4RXNjYXBlZCB8fCByZWdleEVzY2FwZSgnKScpO1xuICAgICAgdGhpcy5uZXN0aW5nT3B0aW9uc1NlcGFyYXRvciA9IGlPcHRzLm5lc3RpbmdPcHRpb25zU2VwYXJhdG9yID8gaU9wdHMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3IgOiBpT3B0cy5uZXN0aW5nT3B0aW9uc1NlcGFyYXRvciB8fCAnLCc7XG4gICAgICB0aGlzLm1heFJlcGxhY2VzID0gaU9wdHMubWF4UmVwbGFjZXMgPyBpT3B0cy5tYXhSZXBsYWNlcyA6IDEwMDA7XG4gICAgICB0aGlzLmFsd2F5c0Zvcm1hdCA9IGlPcHRzLmFsd2F5c0Zvcm1hdCAhPT0gdW5kZWZpbmVkID8gaU9wdHMuYWx3YXlzRm9ybWF0IDogZmFsc2U7XG4gICAgICB0aGlzLnJlc2V0UmVnRXhwKCk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlc2V0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucykgdGhpcy5pbml0KHRoaXMub3B0aW9ucyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlc2V0UmVnRXhwXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlc2V0UmVnRXhwKCkge1xuICAgICAgdmFyIHJlZ2V4cFN0ciA9IFwiXCIuY29uY2F0KHRoaXMucHJlZml4LCBcIiguKz8pXCIpLmNvbmNhdCh0aGlzLnN1ZmZpeCk7XG4gICAgICB0aGlzLnJlZ2V4cCA9IG5ldyBSZWdFeHAocmVnZXhwU3RyLCAnZycpO1xuICAgICAgdmFyIHJlZ2V4cFVuZXNjYXBlU3RyID0gXCJcIi5jb25jYXQodGhpcy5wcmVmaXgpLmNvbmNhdCh0aGlzLnVuZXNjYXBlUHJlZml4LCBcIiguKz8pXCIpLmNvbmNhdCh0aGlzLnVuZXNjYXBlU3VmZml4KS5jb25jYXQodGhpcy5zdWZmaXgpO1xuICAgICAgdGhpcy5yZWdleHBVbmVzY2FwZSA9IG5ldyBSZWdFeHAocmVnZXhwVW5lc2NhcGVTdHIsICdnJyk7XG4gICAgICB2YXIgbmVzdGluZ1JlZ2V4cFN0ciA9IFwiXCIuY29uY2F0KHRoaXMubmVzdGluZ1ByZWZpeCwgXCIoLis/KVwiKS5jb25jYXQodGhpcy5uZXN0aW5nU3VmZml4KTtcbiAgICAgIHRoaXMubmVzdGluZ1JlZ2V4cCA9IG5ldyBSZWdFeHAobmVzdGluZ1JlZ2V4cFN0ciwgJ2cnKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaW50ZXJwb2xhdGVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gaW50ZXJwb2xhdGUoc3RyLCBkYXRhLCBsbmcsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgIHZhciBtYXRjaDtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIHZhciByZXBsYWNlcztcbiAgICAgIHZhciBkZWZhdWx0RGF0YSA9IHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbiAmJiB0aGlzLm9wdGlvbnMuaW50ZXJwb2xhdGlvbi5kZWZhdWx0VmFyaWFibGVzIHx8IHt9O1xuXG4gICAgICBmdW5jdGlvbiByZWdleFNhZmUodmFsKSB7XG4gICAgICAgIHJldHVybiB2YWwucmVwbGFjZSgvXFwkL2csICckJCQkJyk7XG4gICAgICB9XG5cbiAgICAgIHZhciBoYW5kbGVGb3JtYXQgPSBmdW5jdGlvbiBoYW5kbGVGb3JtYXQoa2V5KSB7XG4gICAgICAgIGlmIChrZXkuaW5kZXhPZihfdGhpcy5mb3JtYXRTZXBhcmF0b3IpIDwgMCkge1xuICAgICAgICAgIHZhciBwYXRoID0gZ2V0UGF0aFdpdGhEZWZhdWx0cyhkYXRhLCBkZWZhdWx0RGF0YSwga2V5KTtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuYWx3YXlzRm9ybWF0ID8gX3RoaXMuZm9ybWF0KHBhdGgsIHVuZGVmaW5lZCwgbG5nKSA6IHBhdGg7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcCA9IGtleS5zcGxpdChfdGhpcy5mb3JtYXRTZXBhcmF0b3IpO1xuICAgICAgICB2YXIgayA9IHAuc2hpZnQoKS50cmltKCk7XG4gICAgICAgIHZhciBmID0gcC5qb2luKF90aGlzLmZvcm1hdFNlcGFyYXRvcikudHJpbSgpO1xuICAgICAgICByZXR1cm4gX3RoaXMuZm9ybWF0KGdldFBhdGhXaXRoRGVmYXVsdHMoZGF0YSwgZGVmYXVsdERhdGEsIGspLCBmLCBsbmcsIG9wdGlvbnMpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5yZXNldFJlZ0V4cCgpO1xuICAgICAgdmFyIG1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlciA9IG9wdGlvbnMgJiYgb3B0aW9ucy5taXNzaW5nSW50ZXJwb2xhdGlvbkhhbmRsZXIgfHwgdGhpcy5vcHRpb25zLm1pc3NpbmdJbnRlcnBvbGF0aW9uSGFuZGxlcjtcbiAgICAgIHZhciBza2lwT25WYXJpYWJsZXMgPSBvcHRpb25zICYmIG9wdGlvbnMuaW50ZXJwb2xhdGlvbiAmJiBvcHRpb25zLmludGVycG9sYXRpb24uc2tpcE9uVmFyaWFibGVzIHx8IHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLnNraXBPblZhcmlhYmxlcztcbiAgICAgIHZhciB0b2RvcyA9IFt7XG4gICAgICAgIHJlZ2V4OiB0aGlzLnJlZ2V4cFVuZXNjYXBlLFxuICAgICAgICBzYWZlVmFsdWU6IGZ1bmN0aW9uIHNhZmVWYWx1ZSh2YWwpIHtcbiAgICAgICAgICByZXR1cm4gcmVnZXhTYWZlKHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH0sIHtcbiAgICAgICAgcmVnZXg6IHRoaXMucmVnZXhwLFxuICAgICAgICBzYWZlVmFsdWU6IGZ1bmN0aW9uIHNhZmVWYWx1ZSh2YWwpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuZXNjYXBlVmFsdWUgPyByZWdleFNhZmUoX3RoaXMuZXNjYXBlKHZhbCkpIDogcmVnZXhTYWZlKHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1dO1xuICAgICAgdG9kb3MuZm9yRWFjaChmdW5jdGlvbiAodG9kbykge1xuICAgICAgICByZXBsYWNlcyA9IDA7XG5cbiAgICAgICAgd2hpbGUgKG1hdGNoID0gdG9kby5yZWdleC5leGVjKHN0cikpIHtcbiAgICAgICAgICB2YWx1ZSA9IGhhbmRsZUZvcm1hdChtYXRjaFsxXS50cmltKCkpO1xuXG4gICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHZhciB0ZW1wID0gbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyKHN0ciwgbWF0Y2gsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICB2YWx1ZSA9IHR5cGVvZiB0ZW1wID09PSAnc3RyaW5nJyA/IHRlbXAgOiAnJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2tpcE9uVmFyaWFibGVzKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gbWF0Y2hbMF07XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX3RoaXMubG9nZ2VyLndhcm4oXCJtaXNzZWQgdG8gcGFzcyBpbiB2YXJpYWJsZSBcIi5jb25jYXQobWF0Y2hbMV0sIFwiIGZvciBpbnRlcnBvbGF0aW5nIFwiKS5jb25jYXQoc3RyKSk7XG5cbiAgICAgICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgJiYgIV90aGlzLnVzZVJhd1ZhbHVlVG9Fc2NhcGUpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbWFrZVN0cmluZyh2YWx1ZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UobWF0Y2hbMF0sIHRvZG8uc2FmZVZhbHVlKHZhbHVlKSk7XG4gICAgICAgICAgdG9kby5yZWdleC5sYXN0SW5kZXggPSAwO1xuICAgICAgICAgIHJlcGxhY2VzKys7XG5cbiAgICAgICAgICBpZiAocmVwbGFjZXMgPj0gX3RoaXMubWF4UmVwbGFjZXMpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJuZXN0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG5lc3Qoc3RyLCBmYykge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB7fTtcbiAgICAgIHZhciBtYXRjaDtcbiAgICAgIHZhciB2YWx1ZTtcblxuICAgICAgdmFyIGNsb25lZE9wdGlvbnMgPSBfb2JqZWN0U3ByZWFkKHt9LCBvcHRpb25zKTtcblxuICAgICAgY2xvbmVkT3B0aW9ucy5hcHBseVBvc3RQcm9jZXNzb3IgPSBmYWxzZTtcbiAgICAgIGRlbGV0ZSBjbG9uZWRPcHRpb25zLmRlZmF1bHRWYWx1ZTtcblxuICAgICAgZnVuY3Rpb24gaGFuZGxlSGFzT3B0aW9ucyhrZXksIGluaGVyaXRlZE9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHNlcCA9IHRoaXMubmVzdGluZ09wdGlvbnNTZXBhcmF0b3I7XG4gICAgICAgIGlmIChrZXkuaW5kZXhPZihzZXApIDwgMCkgcmV0dXJuIGtleTtcbiAgICAgICAgdmFyIGMgPSBrZXkuc3BsaXQobmV3IFJlZ0V4cChcIlwiLmNvbmNhdChzZXAsIFwiWyBdKntcIikpKTtcbiAgICAgICAgdmFyIG9wdGlvbnNTdHJpbmcgPSBcIntcIi5jb25jYXQoY1sxXSk7XG4gICAgICAgIGtleSA9IGNbMF07XG4gICAgICAgIG9wdGlvbnNTdHJpbmcgPSB0aGlzLmludGVycG9sYXRlKG9wdGlvbnNTdHJpbmcsIGNsb25lZE9wdGlvbnMpO1xuICAgICAgICBvcHRpb25zU3RyaW5nID0gb3B0aW9uc1N0cmluZy5yZXBsYWNlKC8nL2csICdcIicpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY2xvbmVkT3B0aW9ucyA9IEpTT04ucGFyc2Uob3B0aW9uc1N0cmluZyk7XG4gICAgICAgICAgaWYgKGluaGVyaXRlZE9wdGlvbnMpIGNsb25lZE9wdGlvbnMgPSBfb2JqZWN0U3ByZWFkKHt9LCBpbmhlcml0ZWRPcHRpb25zLCBjbG9uZWRPcHRpb25zKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm4oXCJmYWlsZWQgcGFyc2luZyBvcHRpb25zIHN0cmluZyBpbiBuZXN0aW5nIGZvciBrZXkgXCIuY29uY2F0KGtleSksIGUpO1xuICAgICAgICAgIHJldHVybiBcIlwiLmNvbmNhdChrZXkpLmNvbmNhdChzZXApLmNvbmNhdChvcHRpb25zU3RyaW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSBjbG9uZWRPcHRpb25zLmRlZmF1bHRWYWx1ZTtcbiAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgIH1cblxuICAgICAgd2hpbGUgKG1hdGNoID0gdGhpcy5uZXN0aW5nUmVnZXhwLmV4ZWMoc3RyKSkge1xuICAgICAgICB2YXIgZm9ybWF0dGVycyA9IFtdO1xuICAgICAgICB2YXIgZG9SZWR1Y2UgPSBmYWxzZTtcblxuICAgICAgICBpZiAobWF0Y2hbMF0uaW5jbHVkZXModGhpcy5mb3JtYXRTZXBhcmF0b3IpICYmICEvey4qfS8udGVzdChtYXRjaFsxXSkpIHtcbiAgICAgICAgICB2YXIgciA9IG1hdGNoWzFdLnNwbGl0KHRoaXMuZm9ybWF0U2VwYXJhdG9yKS5tYXAoZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBlbGVtLnRyaW0oKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBtYXRjaFsxXSA9IHIuc2hpZnQoKTtcbiAgICAgICAgICBmb3JtYXR0ZXJzID0gcjtcbiAgICAgICAgICBkb1JlZHVjZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YWx1ZSA9IGZjKGhhbmRsZUhhc09wdGlvbnMuY2FsbCh0aGlzLCBtYXRjaFsxXS50cmltKCksIGNsb25lZE9wdGlvbnMpLCBjbG9uZWRPcHRpb25zKTtcbiAgICAgICAgaWYgKHZhbHVlICYmIG1hdGNoWzBdID09PSBzdHIgJiYgdHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykgcmV0dXJuIHZhbHVlO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykgdmFsdWUgPSBtYWtlU3RyaW5nKHZhbHVlKTtcblxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIud2FybihcIm1pc3NlZCB0byByZXNvbHZlIFwiLmNvbmNhdChtYXRjaFsxXSwgXCIgZm9yIG5lc3RpbmcgXCIpLmNvbmNhdChzdHIpKTtcbiAgICAgICAgICB2YWx1ZSA9ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvUmVkdWNlKSB7XG4gICAgICAgICAgdmFsdWUgPSBmb3JtYXR0ZXJzLnJlZHVjZShmdW5jdGlvbiAodiwgZikge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzMi5mb3JtYXQodiwgZiwgb3B0aW9ucy5sbmcsIG9wdGlvbnMpO1xuICAgICAgICAgIH0sIHZhbHVlLnRyaW0oKSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZShtYXRjaFswXSwgdmFsdWUpO1xuICAgICAgICB0aGlzLnJlZ2V4cC5sYXN0SW5kZXggPSAwO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBJbnRlcnBvbGF0b3I7XG59KCk7XG5cbmZ1bmN0aW9uIHJlbW92ZShhcnIsIHdoYXQpIHtcbiAgdmFyIGZvdW5kID0gYXJyLmluZGV4T2Yod2hhdCk7XG5cbiAgd2hpbGUgKGZvdW5kICE9PSAtMSkge1xuICAgIGFyci5zcGxpY2UoZm91bmQsIDEpO1xuICAgIGZvdW5kID0gYXJyLmluZGV4T2Yod2hhdCk7XG4gIH1cbn1cblxudmFyIENvbm5lY3RvciA9IGZ1bmN0aW9uIChfRXZlbnRFbWl0dGVyKSB7XG4gIF9pbmhlcml0cyhDb25uZWN0b3IsIF9FdmVudEVtaXR0ZXIpO1xuXG4gIGZ1bmN0aW9uIENvbm5lY3RvcihiYWNrZW5kLCBzdG9yZSwgc2VydmljZXMpIHtcbiAgICB2YXIgX3RoaXM7XG5cbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDoge307XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQ29ubmVjdG9yKTtcblxuICAgIF90aGlzID0gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgX2dldFByb3RvdHlwZU9mKENvbm5lY3RvcikuY2FsbCh0aGlzKSk7XG5cbiAgICBpZiAoaXNJRTEwKSB7XG4gICAgICBFdmVudEVtaXR0ZXIuY2FsbChfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSk7XG4gICAgfVxuXG4gICAgX3RoaXMuYmFja2VuZCA9IGJhY2tlbmQ7XG4gICAgX3RoaXMuc3RvcmUgPSBzdG9yZTtcbiAgICBfdGhpcy5zZXJ2aWNlcyA9IHNlcnZpY2VzO1xuICAgIF90aGlzLmxhbmd1YWdlVXRpbHMgPSBzZXJ2aWNlcy5sYW5ndWFnZVV0aWxzO1xuICAgIF90aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIF90aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXIuY3JlYXRlKCdiYWNrZW5kQ29ubmVjdG9yJyk7XG4gICAgX3RoaXMuc3RhdGUgPSB7fTtcbiAgICBfdGhpcy5xdWV1ZSA9IFtdO1xuXG4gICAgaWYgKF90aGlzLmJhY2tlbmQgJiYgX3RoaXMuYmFja2VuZC5pbml0KSB7XG4gICAgICBfdGhpcy5iYWNrZW5kLmluaXQoc2VydmljZXMsIG9wdGlvbnMuYmFja2VuZCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKENvbm5lY3RvciwgW3tcbiAgICBrZXk6IFwicXVldWVMb2FkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHF1ZXVlTG9hZChsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgdmFyIHRvTG9hZCA9IFtdO1xuICAgICAgdmFyIHBlbmRpbmcgPSBbXTtcbiAgICAgIHZhciB0b0xvYWRMYW5ndWFnZXMgPSBbXTtcbiAgICAgIHZhciB0b0xvYWROYW1lc3BhY2VzID0gW107XG4gICAgICBsYW5ndWFnZXMuZm9yRWFjaChmdW5jdGlvbiAobG5nKSB7XG4gICAgICAgIHZhciBoYXNBbGxOYW1lc3BhY2VzID0gdHJ1ZTtcbiAgICAgICAgbmFtZXNwYWNlcy5mb3JFYWNoKGZ1bmN0aW9uIChucykge1xuICAgICAgICAgIHZhciBuYW1lID0gXCJcIi5jb25jYXQobG5nLCBcInxcIikuY29uY2F0KG5zKTtcblxuICAgICAgICAgIGlmICghb3B0aW9ucy5yZWxvYWQgJiYgX3RoaXMyLnN0b3JlLmhhc1Jlc291cmNlQnVuZGxlKGxuZywgbnMpKSB7XG4gICAgICAgICAgICBfdGhpczIuc3RhdGVbbmFtZV0gPSAyO1xuICAgICAgICAgIH0gZWxzZSBpZiAoX3RoaXMyLnN0YXRlW25hbWVdIDwgMCkgOyBlbHNlIGlmIChfdGhpczIuc3RhdGVbbmFtZV0gPT09IDEpIHtcbiAgICAgICAgICAgIGlmIChwZW5kaW5nLmluZGV4T2YobmFtZSkgPCAwKSBwZW5kaW5nLnB1c2gobmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF90aGlzMi5zdGF0ZVtuYW1lXSA9IDE7XG4gICAgICAgICAgICBoYXNBbGxOYW1lc3BhY2VzID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAocGVuZGluZy5pbmRleE9mKG5hbWUpIDwgMCkgcGVuZGluZy5wdXNoKG5hbWUpO1xuICAgICAgICAgICAgaWYgKHRvTG9hZC5pbmRleE9mKG5hbWUpIDwgMCkgdG9Mb2FkLnB1c2gobmFtZSk7XG4gICAgICAgICAgICBpZiAodG9Mb2FkTmFtZXNwYWNlcy5pbmRleE9mKG5zKSA8IDApIHRvTG9hZE5hbWVzcGFjZXMucHVzaChucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFoYXNBbGxOYW1lc3BhY2VzKSB0b0xvYWRMYW5ndWFnZXMucHVzaChsbmcpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmICh0b0xvYWQubGVuZ3RoIHx8IHBlbmRpbmcubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMucXVldWUucHVzaCh7XG4gICAgICAgICAgcGVuZGluZzogcGVuZGluZyxcbiAgICAgICAgICBsb2FkZWQ6IHt9LFxuICAgICAgICAgIGVycm9yczogW10sXG4gICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0b0xvYWQ6IHRvTG9hZCxcbiAgICAgICAgcGVuZGluZzogcGVuZGluZyxcbiAgICAgICAgdG9Mb2FkTGFuZ3VhZ2VzOiB0b0xvYWRMYW5ndWFnZXMsXG4gICAgICAgIHRvTG9hZE5hbWVzcGFjZXM6IHRvTG9hZE5hbWVzcGFjZXNcbiAgICAgIH07XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImxvYWRlZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBsb2FkZWQobmFtZSwgZXJyLCBkYXRhKSB7XG4gICAgICB2YXIgcyA9IG5hbWUuc3BsaXQoJ3wnKTtcbiAgICAgIHZhciBsbmcgPSBzWzBdO1xuICAgICAgdmFyIG5zID0gc1sxXTtcbiAgICAgIGlmIChlcnIpIHRoaXMuZW1pdCgnZmFpbGVkTG9hZGluZycsIGxuZywgbnMsIGVycik7XG5cbiAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgIHRoaXMuc3RvcmUuYWRkUmVzb3VyY2VCdW5kbGUobG5nLCBucywgZGF0YSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhdGVbbmFtZV0gPSBlcnIgPyAtMSA6IDI7XG4gICAgICB2YXIgbG9hZGVkID0ge307XG4gICAgICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24gKHEpIHtcbiAgICAgICAgcHVzaFBhdGgocS5sb2FkZWQsIFtsbmddLCBucyk7XG4gICAgICAgIHJlbW92ZShxLnBlbmRpbmcsIG5hbWUpO1xuICAgICAgICBpZiAoZXJyKSBxLmVycm9ycy5wdXNoKGVycik7XG5cbiAgICAgICAgaWYgKHEucGVuZGluZy5sZW5ndGggPT09IDAgJiYgIXEuZG9uZSkge1xuICAgICAgICAgIE9iamVjdC5rZXlzKHEubG9hZGVkKS5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgICBpZiAoIWxvYWRlZFtsXSkgbG9hZGVkW2xdID0gW107XG5cbiAgICAgICAgICAgIGlmIChxLmxvYWRlZFtsXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcS5sb2FkZWRbbF0uZm9yRWFjaChmdW5jdGlvbiAobnMpIHtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkW2xdLmluZGV4T2YobnMpIDwgMCkgbG9hZGVkW2xdLnB1c2gobnMpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBxLmRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKHEuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgcS5jYWxsYmFjayhxLmVycm9ycyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEuY2FsbGJhY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5lbWl0KCdsb2FkZWQnLCBsb2FkZWQpO1xuICAgICAgdGhpcy5xdWV1ZSA9IHRoaXMucXVldWUuZmlsdGVyKGZ1bmN0aW9uIChxKSB7XG4gICAgICAgIHJldHVybiAhcS5kb25lO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlYWRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVhZChsbmcsIG5zLCBmY05hbWUpIHtcbiAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICB2YXIgdHJpZWQgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IDA7XG4gICAgICB2YXIgd2FpdCA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIGFyZ3VtZW50c1s0XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzRdIDogMzUwO1xuICAgICAgdmFyIGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgPyBhcmd1bWVudHNbNV0gOiB1bmRlZmluZWQ7XG4gICAgICBpZiAoIWxuZy5sZW5ndGgpIHJldHVybiBjYWxsYmFjayhudWxsLCB7fSk7XG4gICAgICByZXR1cm4gdGhpcy5iYWNrZW5kW2ZjTmFtZV0obG5nLCBucywgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICBpZiAoZXJyICYmIGRhdGEgJiYgdHJpZWQgPCA1KSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpczMucmVhZC5jYWxsKF90aGlzMywgbG5nLCBucywgZmNOYW1lLCB0cmllZCArIDEsIHdhaXQgKiAyLCBjYWxsYmFjayk7XG4gICAgICAgICAgfSwgd2FpdCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2soZXJyLCBkYXRhKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJwcmVwYXJlTG9hZGluZ1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwcmVwYXJlTG9hZGluZyhsYW5ndWFnZXMsIG5hbWVzcGFjZXMpIHtcbiAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG4gICAgICB2YXIgY2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoID4gMyA/IGFyZ3VtZW50c1szXSA6IHVuZGVmaW5lZDtcblxuICAgICAgaWYgKCF0aGlzLmJhY2tlbmQpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybignTm8gYmFja2VuZCB3YXMgYWRkZWQgdmlhIGkxOG5leHQudXNlLiBXaWxsIG5vdCBsb2FkIHJlc291cmNlcy4nKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgbGFuZ3VhZ2VzID09PSAnc3RyaW5nJykgbGFuZ3VhZ2VzID0gdGhpcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShsYW5ndWFnZXMpO1xuICAgICAgaWYgKHR5cGVvZiBuYW1lc3BhY2VzID09PSAnc3RyaW5nJykgbmFtZXNwYWNlcyA9IFtuYW1lc3BhY2VzXTtcbiAgICAgIHZhciB0b0xvYWQgPSB0aGlzLnF1ZXVlTG9hZChsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIG9wdGlvbnMsIGNhbGxiYWNrKTtcblxuICAgICAgaWYgKCF0b0xvYWQudG9Mb2FkLmxlbmd0aCkge1xuICAgICAgICBpZiAoIXRvTG9hZC5wZW5kaW5nLmxlbmd0aCkgY2FsbGJhY2soKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIHRvTG9hZC50b0xvYWQuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBfdGhpczQubG9hZE9uZShuYW1lKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsb2FkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBjYWxsYmFjaykge1xuICAgICAgdGhpcy5wcmVwYXJlTG9hZGluZyhsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIHt9LCBjYWxsYmFjayk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbG9hZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZWxvYWQobGFuZ3VhZ2VzLCBuYW1lc3BhY2VzLCBjYWxsYmFjaykge1xuICAgICAgdGhpcy5wcmVwYXJlTG9hZGluZyhsYW5ndWFnZXMsIG5hbWVzcGFjZXMsIHtcbiAgICAgICAgcmVsb2FkOiB0cnVlXG4gICAgICB9LCBjYWxsYmFjayk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImxvYWRPbmVcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gbG9hZE9uZShuYW1lKSB7XG4gICAgICB2YXIgX3RoaXM1ID0gdGhpcztcblxuICAgICAgdmFyIHByZWZpeCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogJyc7XG4gICAgICB2YXIgcyA9IG5hbWUuc3BsaXQoJ3wnKTtcbiAgICAgIHZhciBsbmcgPSBzWzBdO1xuICAgICAgdmFyIG5zID0gc1sxXTtcbiAgICAgIHRoaXMucmVhZChsbmcsIG5zLCAncmVhZCcsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICAgIGlmIChlcnIpIF90aGlzNS5sb2dnZXIud2FybihcIlwiLmNvbmNhdChwcmVmaXgsIFwibG9hZGluZyBuYW1lc3BhY2UgXCIpLmNvbmNhdChucywgXCIgZm9yIGxhbmd1YWdlIFwiKS5jb25jYXQobG5nLCBcIiBmYWlsZWRcIiksIGVycik7XG4gICAgICAgIGlmICghZXJyICYmIGRhdGEpIF90aGlzNS5sb2dnZXIubG9nKFwiXCIuY29uY2F0KHByZWZpeCwgXCJsb2FkZWQgbmFtZXNwYWNlIFwiKS5jb25jYXQobnMsIFwiIGZvciBsYW5ndWFnZSBcIikuY29uY2F0KGxuZyksIGRhdGEpO1xuXG4gICAgICAgIF90aGlzNS5sb2FkZWQobmFtZSwgZXJyLCBkYXRhKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzYXZlTWlzc2luZ1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzYXZlTWlzc2luZyhsYW5ndWFnZXMsIG5hbWVzcGFjZSwga2V5LCBmYWxsYmFja1ZhbHVlLCBpc1VwZGF0ZSkge1xuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gNSAmJiBhcmd1bWVudHNbNV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s1XSA6IHt9O1xuXG4gICAgICBpZiAodGhpcy5zZXJ2aWNlcy51dGlscyAmJiB0aGlzLnNlcnZpY2VzLnV0aWxzLmhhc0xvYWRlZE5hbWVzcGFjZSAmJiAhdGhpcy5zZXJ2aWNlcy51dGlscy5oYXNMb2FkZWROYW1lc3BhY2UobmFtZXNwYWNlKSkge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKFwiZGlkIG5vdCBzYXZlIGtleSBcXFwiXCIuY29uY2F0KGtleSwgXCJcXFwiIGFzIHRoZSBuYW1lc3BhY2UgXFxcIlwiKS5jb25jYXQobmFtZXNwYWNlLCBcIlxcXCIgd2FzIG5vdCB5ZXQgbG9hZGVkXCIpLCAnVGhpcyBtZWFucyBzb21ldGhpbmcgSVMgV1JPTkcgaW4geW91ciBzZXR1cC4gWW91IGFjY2VzcyB0aGUgdCBmdW5jdGlvbiBiZWZvcmUgaTE4bmV4dC5pbml0IC8gaTE4bmV4dC5sb2FkTmFtZXNwYWNlIC8gaTE4bmV4dC5jaGFuZ2VMYW5ndWFnZSB3YXMgZG9uZS4gV2FpdCBmb3IgdGhlIGNhbGxiYWNrIG9yIFByb21pc2UgdG8gcmVzb2x2ZSBiZWZvcmUgYWNjZXNzaW5nIGl0ISEhJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkIHx8IGtleSA9PT0gbnVsbCB8fCBrZXkgPT09ICcnKSByZXR1cm47XG5cbiAgICAgIGlmICh0aGlzLmJhY2tlbmQgJiYgdGhpcy5iYWNrZW5kLmNyZWF0ZSkge1xuICAgICAgICB0aGlzLmJhY2tlbmQuY3JlYXRlKGxhbmd1YWdlcywgbmFtZXNwYWNlLCBrZXksIGZhbGxiYWNrVmFsdWUsIG51bGwsIF9vYmplY3RTcHJlYWQoe30sIG9wdGlvbnMsIHtcbiAgICAgICAgICBpc1VwZGF0ZTogaXNVcGRhdGVcbiAgICAgICAgfSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWxhbmd1YWdlcyB8fCAhbGFuZ3VhZ2VzWzBdKSByZXR1cm47XG4gICAgICB0aGlzLnN0b3JlLmFkZFJlc291cmNlKGxhbmd1YWdlc1swXSwgbmFtZXNwYWNlLCBrZXksIGZhbGxiYWNrVmFsdWUpO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBDb25uZWN0b3I7XG59KEV2ZW50RW1pdHRlcik7XG5cbmZ1bmN0aW9uIGdldCgpIHtcbiAgcmV0dXJuIHtcbiAgICBkZWJ1ZzogZmFsc2UsXG4gICAgaW5pdEltbWVkaWF0ZTogdHJ1ZSxcbiAgICBuczogWyd0cmFuc2xhdGlvbiddLFxuICAgIGRlZmF1bHROUzogWyd0cmFuc2xhdGlvbiddLFxuICAgIGZhbGxiYWNrTG5nOiBbJ2RldiddLFxuICAgIGZhbGxiYWNrTlM6IGZhbHNlLFxuICAgIHdoaXRlbGlzdDogZmFsc2UsXG4gICAgbm9uRXhwbGljaXRXaGl0ZWxpc3Q6IGZhbHNlLFxuICAgIHN1cHBvcnRlZExuZ3M6IGZhbHNlLFxuICAgIG5vbkV4cGxpY2l0U3VwcG9ydGVkTG5nczogZmFsc2UsXG4gICAgbG9hZDogJ2FsbCcsXG4gICAgcHJlbG9hZDogZmFsc2UsXG4gICAgc2ltcGxpZnlQbHVyYWxTdWZmaXg6IHRydWUsXG4gICAga2V5U2VwYXJhdG9yOiAnLicsXG4gICAgbnNTZXBhcmF0b3I6ICc6JyxcbiAgICBwbHVyYWxTZXBhcmF0b3I6ICdfJyxcbiAgICBjb250ZXh0U2VwYXJhdG9yOiAnXycsXG4gICAgcGFydGlhbEJ1bmRsZWRMYW5ndWFnZXM6IGZhbHNlLFxuICAgIHNhdmVNaXNzaW5nOiBmYWxzZSxcbiAgICB1cGRhdGVNaXNzaW5nOiBmYWxzZSxcbiAgICBzYXZlTWlzc2luZ1RvOiAnZmFsbGJhY2snLFxuICAgIHNhdmVNaXNzaW5nUGx1cmFsczogdHJ1ZSxcbiAgICBtaXNzaW5nS2V5SGFuZGxlcjogZmFsc2UsXG4gICAgbWlzc2luZ0ludGVycG9sYXRpb25IYW5kbGVyOiBmYWxzZSxcbiAgICBwb3N0UHJvY2VzczogZmFsc2UsXG4gICAgcG9zdFByb2Nlc3NQYXNzUmVzb2x2ZWQ6IGZhbHNlLFxuICAgIHJldHVybk51bGw6IHRydWUsXG4gICAgcmV0dXJuRW1wdHlTdHJpbmc6IHRydWUsXG4gICAgcmV0dXJuT2JqZWN0czogZmFsc2UsXG4gICAgam9pbkFycmF5czogZmFsc2UsXG4gICAgcmV0dXJuZWRPYmplY3RIYW5kbGVyOiBmYWxzZSxcbiAgICBwYXJzZU1pc3NpbmdLZXlIYW5kbGVyOiBmYWxzZSxcbiAgICBhcHBlbmROYW1lc3BhY2VUb01pc3NpbmdLZXk6IGZhbHNlLFxuICAgIGFwcGVuZE5hbWVzcGFjZVRvQ0lNb2RlOiBmYWxzZSxcbiAgICBvdmVybG9hZFRyYW5zbGF0aW9uT3B0aW9uSGFuZGxlcjogZnVuY3Rpb24gaGFuZGxlKGFyZ3MpIHtcbiAgICAgIHZhciByZXQgPSB7fTtcbiAgICAgIGlmIChfdHlwZW9mKGFyZ3NbMV0pID09PSAnb2JqZWN0JykgcmV0ID0gYXJnc1sxXTtcbiAgICAgIGlmICh0eXBlb2YgYXJnc1sxXSA9PT0gJ3N0cmluZycpIHJldC5kZWZhdWx0VmFsdWUgPSBhcmdzWzFdO1xuICAgICAgaWYgKHR5cGVvZiBhcmdzWzJdID09PSAnc3RyaW5nJykgcmV0LnREZXNjcmlwdGlvbiA9IGFyZ3NbMl07XG5cbiAgICAgIGlmIChfdHlwZW9mKGFyZ3NbMl0pID09PSAnb2JqZWN0JyB8fCBfdHlwZW9mKGFyZ3NbM10pID09PSAnb2JqZWN0Jykge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGFyZ3NbM10gfHwgYXJnc1syXTtcbiAgICAgICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgcmV0W2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmV0O1xuICAgIH0sXG4gICAgaW50ZXJwb2xhdGlvbjoge1xuICAgICAgZXNjYXBlVmFsdWU6IHRydWUsXG4gICAgICBmb3JtYXQ6IGZ1bmN0aW9uIGZvcm1hdCh2YWx1ZSwgX2Zvcm1hdCwgbG5nLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH0sXG4gICAgICBwcmVmaXg6ICd7eycsXG4gICAgICBzdWZmaXg6ICd9fScsXG4gICAgICBmb3JtYXRTZXBhcmF0b3I6ICcsJyxcbiAgICAgIHVuZXNjYXBlUHJlZml4OiAnLScsXG4gICAgICBuZXN0aW5nUHJlZml4OiAnJHQoJyxcbiAgICAgIG5lc3RpbmdTdWZmaXg6ICcpJyxcbiAgICAgIG5lc3RpbmdPcHRpb25zU2VwYXJhdG9yOiAnLCcsXG4gICAgICBtYXhSZXBsYWNlczogMTAwMCxcbiAgICAgIHNraXBPblZhcmlhYmxlczogZmFsc2VcbiAgICB9XG4gIH07XG59XG5mdW5jdGlvbiB0cmFuc2Zvcm1PcHRpb25zKG9wdGlvbnMpIHtcbiAgaWYgKHR5cGVvZiBvcHRpb25zLm5zID09PSAnc3RyaW5nJykgb3B0aW9ucy5ucyA9IFtvcHRpb25zLm5zXTtcbiAgaWYgKHR5cGVvZiBvcHRpb25zLmZhbGxiYWNrTG5nID09PSAnc3RyaW5nJykgb3B0aW9ucy5mYWxsYmFja0xuZyA9IFtvcHRpb25zLmZhbGxiYWNrTG5nXTtcbiAgaWYgKHR5cGVvZiBvcHRpb25zLmZhbGxiYWNrTlMgPT09ICdzdHJpbmcnKSBvcHRpb25zLmZhbGxiYWNrTlMgPSBbb3B0aW9ucy5mYWxsYmFja05TXTtcblxuICBpZiAob3B0aW9ucy53aGl0ZWxpc3QpIHtcbiAgICBpZiAob3B0aW9ucy53aGl0ZWxpc3QgJiYgb3B0aW9ucy53aGl0ZWxpc3QuaW5kZXhPZignY2ltb2RlJykgPCAwKSB7XG4gICAgICBvcHRpb25zLndoaXRlbGlzdCA9IG9wdGlvbnMud2hpdGVsaXN0LmNvbmNhdChbJ2NpbW9kZSddKTtcbiAgICB9XG5cbiAgICBvcHRpb25zLnN1cHBvcnRlZExuZ3MgPSBvcHRpb25zLndoaXRlbGlzdDtcbiAgfVxuXG4gIGlmIChvcHRpb25zLm5vbkV4cGxpY2l0V2hpdGVsaXN0KSB7XG4gICAgb3B0aW9ucy5ub25FeHBsaWNpdFN1cHBvcnRlZExuZ3MgPSBvcHRpb25zLm5vbkV4cGxpY2l0V2hpdGVsaXN0O1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuc3VwcG9ydGVkTG5ncyAmJiBvcHRpb25zLnN1cHBvcnRlZExuZ3MuaW5kZXhPZignY2ltb2RlJykgPCAwKSB7XG4gICAgb3B0aW9ucy5zdXBwb3J0ZWRMbmdzID0gb3B0aW9ucy5zdXBwb3J0ZWRMbmdzLmNvbmNhdChbJ2NpbW9kZSddKTtcbiAgfVxuXG4gIHJldHVybiBvcHRpb25zO1xufVxuXG5mdW5jdGlvbiBub29wKCkge31cblxudmFyIEkxOG4gPSBmdW5jdGlvbiAoX0V2ZW50RW1pdHRlcikge1xuICBfaW5oZXJpdHMoSTE4biwgX0V2ZW50RW1pdHRlcik7XG5cbiAgZnVuY3Rpb24gSTE4bigpIHtcbiAgICB2YXIgX3RoaXM7XG5cbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgdmFyIGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSTE4bik7XG5cbiAgICBfdGhpcyA9IF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIF9nZXRQcm90b3R5cGVPZihJMThuKS5jYWxsKHRoaXMpKTtcblxuICAgIGlmIChpc0lFMTApIHtcbiAgICAgIEV2ZW50RW1pdHRlci5jYWxsKF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQoX3RoaXMpKTtcbiAgICB9XG5cbiAgICBfdGhpcy5vcHRpb25zID0gdHJhbnNmb3JtT3B0aW9ucyhvcHRpb25zKTtcbiAgICBfdGhpcy5zZXJ2aWNlcyA9IHt9O1xuICAgIF90aGlzLmxvZ2dlciA9IGJhc2VMb2dnZXI7XG4gICAgX3RoaXMubW9kdWxlcyA9IHtcbiAgICAgIGV4dGVybmFsOiBbXVxuICAgIH07XG5cbiAgICBpZiAoY2FsbGJhY2sgJiYgIV90aGlzLmlzSW5pdGlhbGl6ZWQgJiYgIW9wdGlvbnMuaXNDbG9uZSkge1xuICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLmluaXRJbW1lZGlhdGUpIHtcbiAgICAgICAgX3RoaXMuaW5pdChvcHRpb25zLCBjYWxsYmFjayk7XG5cbiAgICAgICAgcmV0dXJuIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKF90aGlzLCBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKF90aGlzKSk7XG4gICAgICB9XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBfdGhpcy5pbml0KG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgIH0sIDApO1xuICAgIH1cblxuICAgIHJldHVybiBfdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhJMThuLCBbe1xuICAgIGtleTogXCJpbml0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgICAgdmFyIGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG5cbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMud2hpdGVsaXN0ICYmICFvcHRpb25zLnN1cHBvcnRlZExuZ3MpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVwcmVjYXRlKCd3aGl0ZWxpc3QnLCAnb3B0aW9uIFwid2hpdGVsaXN0XCIgd2lsbCBiZSByZW5hbWVkIHRvIFwic3VwcG9ydGVkTG5nc1wiIGluIHRoZSBuZXh0IG1ham9yIC0gcGxlYXNlIG1ha2Ugc3VyZSB0byByZW5hbWUgdGhpcyBvcHRpb24gYXNhcC4nKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMubm9uRXhwbGljaXRXaGl0ZWxpc3QgJiYgIW9wdGlvbnMubm9uRXhwbGljaXRTdXBwb3J0ZWRMbmdzKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmRlcHJlY2F0ZSgnd2hpdGVsaXN0JywgJ29wdGlvbnMgXCJub25FeHBsaWNpdFdoaXRlbGlzdFwiIHdpbGwgYmUgcmVuYW1lZCB0byBcIm5vbkV4cGxpY2l0U3VwcG9ydGVkTG5nc1wiIGluIHRoZSBuZXh0IG1ham9yIC0gcGxlYXNlIG1ha2Ugc3VyZSB0byByZW5hbWUgdGhpcyBvcHRpb24gYXNhcC4nKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5vcHRpb25zID0gX29iamVjdFNwcmVhZCh7fSwgZ2V0KCksIHRoaXMub3B0aW9ucywgdHJhbnNmb3JtT3B0aW9ucyhvcHRpb25zKSk7XG4gICAgICB0aGlzLmZvcm1hdCA9IHRoaXMub3B0aW9ucy5pbnRlcnBvbGF0aW9uLmZvcm1hdDtcbiAgICAgIGlmICghY2FsbGJhY2spIGNhbGxiYWNrID0gbm9vcDtcblxuICAgICAgZnVuY3Rpb24gY3JlYXRlQ2xhc3NPbkRlbWFuZChDbGFzc09yT2JqZWN0KSB7XG4gICAgICAgIGlmICghQ2xhc3NPck9iamVjdCkgcmV0dXJuIG51bGw7XG4gICAgICAgIGlmICh0eXBlb2YgQ2xhc3NPck9iamVjdCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIG5ldyBDbGFzc09yT2JqZWN0KCk7XG4gICAgICAgIHJldHVybiBDbGFzc09yT2JqZWN0O1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5pc0Nsb25lKSB7XG4gICAgICAgIGlmICh0aGlzLm1vZHVsZXMubG9nZ2VyKSB7XG4gICAgICAgICAgYmFzZUxvZ2dlci5pbml0KGNyZWF0ZUNsYXNzT25EZW1hbmQodGhpcy5tb2R1bGVzLmxvZ2dlciksIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYmFzZUxvZ2dlci5pbml0KG51bGwsIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbHUgPSBuZXcgTGFuZ3VhZ2VVdGlsKHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHRoaXMuc3RvcmUgPSBuZXcgUmVzb3VyY2VTdG9yZSh0aGlzLm9wdGlvbnMucmVzb3VyY2VzLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB2YXIgcyA9IHRoaXMuc2VydmljZXM7XG4gICAgICAgIHMubG9nZ2VyID0gYmFzZUxvZ2dlcjtcbiAgICAgICAgcy5yZXNvdXJjZVN0b3JlID0gdGhpcy5zdG9yZTtcbiAgICAgICAgcy5sYW5ndWFnZVV0aWxzID0gbHU7XG4gICAgICAgIHMucGx1cmFsUmVzb2x2ZXIgPSBuZXcgUGx1cmFsUmVzb2x2ZXIobHUsIHtcbiAgICAgICAgICBwcmVwZW5kOiB0aGlzLm9wdGlvbnMucGx1cmFsU2VwYXJhdG9yLFxuICAgICAgICAgIGNvbXBhdGliaWxpdHlKU09OOiB0aGlzLm9wdGlvbnMuY29tcGF0aWJpbGl0eUpTT04sXG4gICAgICAgICAgc2ltcGxpZnlQbHVyYWxTdWZmaXg6IHRoaXMub3B0aW9ucy5zaW1wbGlmeVBsdXJhbFN1ZmZpeFxuICAgICAgICB9KTtcbiAgICAgICAgcy5pbnRlcnBvbGF0b3IgPSBuZXcgSW50ZXJwb2xhdG9yKHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHMudXRpbHMgPSB7XG4gICAgICAgICAgaGFzTG9hZGVkTmFtZXNwYWNlOiB0aGlzLmhhc0xvYWRlZE5hbWVzcGFjZS5iaW5kKHRoaXMpXG4gICAgICAgIH07XG4gICAgICAgIHMuYmFja2VuZENvbm5lY3RvciA9IG5ldyBDb25uZWN0b3IoY3JlYXRlQ2xhc3NPbkRlbWFuZCh0aGlzLm1vZHVsZXMuYmFja2VuZCksIHMucmVzb3VyY2VTdG9yZSwgcywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgcy5iYWNrZW5kQ29ubmVjdG9yLm9uKCcqJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgX3RoaXMyLmVtaXQuYXBwbHkoX3RoaXMyLCBbZXZlbnRdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLm1vZHVsZXMubGFuZ3VhZ2VEZXRlY3Rvcikge1xuICAgICAgICAgIHMubGFuZ3VhZ2VEZXRlY3RvciA9IGNyZWF0ZUNsYXNzT25EZW1hbmQodGhpcy5tb2R1bGVzLmxhbmd1YWdlRGV0ZWN0b3IpO1xuICAgICAgICAgIHMubGFuZ3VhZ2VEZXRlY3Rvci5pbml0KHMsIHRoaXMub3B0aW9ucy5kZXRlY3Rpb24sIHRoaXMub3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5tb2R1bGVzLmkxOG5Gb3JtYXQpIHtcbiAgICAgICAgICBzLmkxOG5Gb3JtYXQgPSBjcmVhdGVDbGFzc09uRGVtYW5kKHRoaXMubW9kdWxlcy5pMThuRm9ybWF0KTtcbiAgICAgICAgICBpZiAocy5pMThuRm9ybWF0LmluaXQpIHMuaTE4bkZvcm1hdC5pbml0KHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50cmFuc2xhdG9yID0gbmV3IFRyYW5zbGF0b3IodGhpcy5zZXJ2aWNlcywgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgdGhpcy50cmFuc2xhdG9yLm9uKCcqJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4yID4gMSA/IF9sZW4yIC0gMSA6IDApLCBfa2V5MiA9IDE7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgICAgICAgIGFyZ3NbX2tleTIgLSAxXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgX3RoaXMyLmVtaXQuYXBwbHkoX3RoaXMyLCBbZXZlbnRdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm1vZHVsZXMuZXh0ZXJuYWwuZm9yRWFjaChmdW5jdGlvbiAobSkge1xuICAgICAgICAgIGlmIChtLmluaXQpIG0uaW5pdChfdGhpczIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IgJiYgIXRoaXMub3B0aW9ucy5sbmcpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybignaW5pdDogbm8gbGFuZ3VhZ2VEZXRlY3RvciBpcyB1c2VkIGFuZCBubyBsbmcgaXMgZGVmaW5lZCcpO1xuICAgICAgfVxuXG4gICAgICB2YXIgc3RvcmVBcGkgPSBbJ2dldFJlc291cmNlJywgJ2hhc1Jlc291cmNlQnVuZGxlJywgJ2dldFJlc291cmNlQnVuZGxlJywgJ2dldERhdGFCeUxhbmd1YWdlJ107XG4gICAgICBzdG9yZUFwaS5mb3JFYWNoKGZ1bmN0aW9uIChmY05hbWUpIHtcbiAgICAgICAgX3RoaXMyW2ZjTmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIF90aGlzMiRzdG9yZTtcblxuICAgICAgICAgIHJldHVybiAoX3RoaXMyJHN0b3JlID0gX3RoaXMyLnN0b3JlKVtmY05hbWVdLmFwcGx5KF90aGlzMiRzdG9yZSwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgICAgdmFyIHN0b3JlQXBpQ2hhaW5lZCA9IFsnYWRkUmVzb3VyY2UnLCAnYWRkUmVzb3VyY2VzJywgJ2FkZFJlc291cmNlQnVuZGxlJywgJ3JlbW92ZVJlc291cmNlQnVuZGxlJ107XG4gICAgICBzdG9yZUFwaUNoYWluZWQuZm9yRWFjaChmdW5jdGlvbiAoZmNOYW1lKSB7XG4gICAgICAgIF90aGlzMltmY05hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBfdGhpczIkc3RvcmUyO1xuXG4gICAgICAgICAgKF90aGlzMiRzdG9yZTIgPSBfdGhpczIuc3RvcmUpW2ZjTmFtZV0uYXBwbHkoX3RoaXMyJHN0b3JlMiwgYXJndW1lbnRzKTtcblxuICAgICAgICAgIHJldHVybiBfdGhpczI7XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG5cbiAgICAgIHZhciBsb2FkID0gZnVuY3Rpb24gbG9hZCgpIHtcbiAgICAgICAgX3RoaXMyLmNoYW5nZUxhbmd1YWdlKF90aGlzMi5vcHRpb25zLmxuZywgZnVuY3Rpb24gKGVyciwgdCkge1xuICAgICAgICAgIF90aGlzMi5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoIV90aGlzMi5vcHRpb25zLmlzQ2xvbmUpIF90aGlzMi5sb2dnZXIubG9nKCdpbml0aWFsaXplZCcsIF90aGlzMi5vcHRpb25zKTtcblxuICAgICAgICAgIF90aGlzMi5lbWl0KCdpbml0aWFsaXplZCcsIF90aGlzMi5vcHRpb25zKTtcblxuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodCk7XG4gICAgICAgICAgY2FsbGJhY2soZXJyLCB0KTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnJlc291cmNlcyB8fCAhdGhpcy5vcHRpb25zLmluaXRJbW1lZGlhdGUpIHtcbiAgICAgICAgbG9hZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dChsb2FkLCAwKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsb2FkUmVzb3VyY2VzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGxvYWRSZXNvdXJjZXMobGFuZ3VhZ2UpIHtcbiAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICB2YXIgY2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IG5vb3A7XG4gICAgICB2YXIgdXNlZENhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICB2YXIgdXNlZExuZyA9IHR5cGVvZiBsYW5ndWFnZSA9PT0gJ3N0cmluZycgPyBsYW5ndWFnZSA6IHRoaXMubGFuZ3VhZ2U7XG4gICAgICBpZiAodHlwZW9mIGxhbmd1YWdlID09PSAnZnVuY3Rpb24nKSB1c2VkQ2FsbGJhY2sgPSBsYW5ndWFnZTtcblxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMucmVzb3VyY2VzIHx8IHRoaXMub3B0aW9ucy5wYXJ0aWFsQnVuZGxlZExhbmd1YWdlcykge1xuICAgICAgICBpZiAodXNlZExuZyAmJiB1c2VkTG5nLnRvTG93ZXJDYXNlKCkgPT09ICdjaW1vZGUnKSByZXR1cm4gdXNlZENhbGxiYWNrKCk7XG4gICAgICAgIHZhciB0b0xvYWQgPSBbXTtcblxuICAgICAgICB2YXIgYXBwZW5kID0gZnVuY3Rpb24gYXBwZW5kKGxuZykge1xuICAgICAgICAgIGlmICghbG5nKSByZXR1cm47XG5cbiAgICAgICAgICB2YXIgbG5ncyA9IF90aGlzMy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLnRvUmVzb2x2ZUhpZXJhcmNoeShsbmcpO1xuXG4gICAgICAgICAgbG5ncy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgICBpZiAodG9Mb2FkLmluZGV4T2YobCkgPCAwKSB0b0xvYWQucHVzaChsKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIXVzZWRMbmcpIHtcbiAgICAgICAgICB2YXIgZmFsbGJhY2tzID0gdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZVV0aWxzLmdldEZhbGxiYWNrQ29kZXModGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nKTtcbiAgICAgICAgICBmYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICAgICAgcmV0dXJuIGFwcGVuZChsKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhcHBlbmQodXNlZExuZyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnByZWxvYWQpIHtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMucHJlbG9hZC5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgICByZXR1cm4gYXBwZW5kKGwpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXJ2aWNlcy5iYWNrZW5kQ29ubmVjdG9yLmxvYWQodG9Mb2FkLCB0aGlzLm9wdGlvbnMubnMsIHVzZWRDYWxsYmFjayk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1c2VkQ2FsbGJhY2sobnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInJlbG9hZFJlc291cmNlc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZWxvYWRSZXNvdXJjZXMobG5ncywgbnMsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgaWYgKCFsbmdzKSBsbmdzID0gdGhpcy5sYW5ndWFnZXM7XG4gICAgICBpZiAoIW5zKSBucyA9IHRoaXMub3B0aW9ucy5ucztcbiAgICAgIGlmICghY2FsbGJhY2spIGNhbGxiYWNrID0gbm9vcDtcbiAgICAgIHRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5yZWxvYWQobG5ncywgbnMsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZGVmZXJyZWQ7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcInVzZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB1c2UobW9kdWxlKSB7XG4gICAgICBpZiAoIW1vZHVsZSkgdGhyb3cgbmV3IEVycm9yKCdZb3UgYXJlIHBhc3NpbmcgYW4gdW5kZWZpbmVkIG1vZHVsZSEgUGxlYXNlIGNoZWNrIHRoZSBvYmplY3QgeW91IGFyZSBwYXNzaW5nIHRvIGkxOG5leHQudXNlKCknKTtcbiAgICAgIGlmICghbW9kdWxlLnR5cGUpIHRocm93IG5ldyBFcnJvcignWW91IGFyZSBwYXNzaW5nIGEgd3JvbmcgbW9kdWxlISBQbGVhc2UgY2hlY2sgdGhlIG9iamVjdCB5b3UgYXJlIHBhc3NpbmcgdG8gaTE4bmV4dC51c2UoKScpO1xuXG4gICAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdiYWNrZW5kJykge1xuICAgICAgICB0aGlzLm1vZHVsZXMuYmFja2VuZCA9IG1vZHVsZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG1vZHVsZS50eXBlID09PSAnbG9nZ2VyJyB8fCBtb2R1bGUubG9nICYmIG1vZHVsZS53YXJuICYmIG1vZHVsZS5lcnJvcikge1xuICAgICAgICB0aGlzLm1vZHVsZXMubG9nZ2VyID0gbW9kdWxlO1xuICAgICAgfVxuXG4gICAgICBpZiAobW9kdWxlLnR5cGUgPT09ICdsYW5ndWFnZURldGVjdG9yJykge1xuICAgICAgICB0aGlzLm1vZHVsZXMubGFuZ3VhZ2VEZXRlY3RvciA9IG1vZHVsZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG1vZHVsZS50eXBlID09PSAnaTE4bkZvcm1hdCcpIHtcbiAgICAgICAgdGhpcy5tb2R1bGVzLmkxOG5Gb3JtYXQgPSBtb2R1bGU7XG4gICAgICB9XG5cbiAgICAgIGlmIChtb2R1bGUudHlwZSA9PT0gJ3Bvc3RQcm9jZXNzb3InKSB7XG4gICAgICAgIHBvc3RQcm9jZXNzb3IuYWRkUG9zdFByb2Nlc3Nvcihtb2R1bGUpO1xuICAgICAgfVxuXG4gICAgICBpZiAobW9kdWxlLnR5cGUgPT09ICczcmRQYXJ0eScpIHtcbiAgICAgICAgdGhpcy5tb2R1bGVzLmV4dGVybmFsLnB1c2gobW9kdWxlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNoYW5nZUxhbmd1YWdlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNoYW5nZUxhbmd1YWdlKGxuZywgY2FsbGJhY2spIHtcbiAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgICB0aGlzLmlzTGFuZ3VhZ2VDaGFuZ2luZ1RvID0gbG5nO1xuICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgIHRoaXMuZW1pdCgnbGFuZ3VhZ2VDaGFuZ2luZycsIGxuZyk7XG5cbiAgICAgIHZhciBkb25lID0gZnVuY3Rpb24gZG9uZShlcnIsIGwpIHtcbiAgICAgICAgaWYgKGwpIHtcbiAgICAgICAgICBfdGhpczQubGFuZ3VhZ2UgPSBsO1xuICAgICAgICAgIF90aGlzNC5sYW5ndWFnZXMgPSBfdGhpczQuc2VydmljZXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkobCk7XG5cbiAgICAgICAgICBfdGhpczQudHJhbnNsYXRvci5jaGFuZ2VMYW5ndWFnZShsKTtcblxuICAgICAgICAgIF90aGlzNC5pc0xhbmd1YWdlQ2hhbmdpbmdUbyA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgIF90aGlzNC5lbWl0KCdsYW5ndWFnZUNoYW5nZWQnLCBsKTtcblxuICAgICAgICAgIF90aGlzNC5sb2dnZXIubG9nKCdsYW5ndWFnZUNoYW5nZWQnLCBsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfdGhpczQuaXNMYW5ndWFnZUNoYW5naW5nVG8gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXM0LnQuYXBwbHkoX3RoaXM0LCBhcmd1bWVudHMpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXM0LnQuYXBwbHkoX3RoaXM0LCBhcmd1bWVudHMpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBzZXRMbmcgPSBmdW5jdGlvbiBzZXRMbmcobG5ncykge1xuICAgICAgICB2YXIgbCA9IHR5cGVvZiBsbmdzID09PSAnc3RyaW5nJyA/IGxuZ3MgOiBfdGhpczQuc2VydmljZXMubGFuZ3VhZ2VVdGlscy5nZXRCZXN0TWF0Y2hGcm9tQ29kZXMobG5ncyk7XG5cbiAgICAgICAgaWYgKGwpIHtcbiAgICAgICAgICBpZiAoIV90aGlzNC5sYW5ndWFnZSkge1xuICAgICAgICAgICAgX3RoaXM0Lmxhbmd1YWdlID0gbDtcbiAgICAgICAgICAgIF90aGlzNC5sYW5ndWFnZXMgPSBfdGhpczQuc2VydmljZXMubGFuZ3VhZ2VVdGlscy50b1Jlc29sdmVIaWVyYXJjaHkobCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFfdGhpczQudHJhbnNsYXRvci5sYW5ndWFnZSkgX3RoaXM0LnRyYW5zbGF0b3IuY2hhbmdlTGFuZ3VhZ2UobCk7XG4gICAgICAgICAgaWYgKF90aGlzNC5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yKSBfdGhpczQuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5jYWNoZVVzZXJMYW5ndWFnZShsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF90aGlzNC5sb2FkUmVzb3VyY2VzKGwsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICBkb25lKGVyciwgbCk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgaWYgKCFsbmcgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yICYmICF0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuYXN5bmMpIHtcbiAgICAgICAgc2V0TG5nKHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5kZXRlY3QoKSk7XG4gICAgICB9IGVsc2UgaWYgKCFsbmcgJiYgdGhpcy5zZXJ2aWNlcy5sYW5ndWFnZURldGVjdG9yICYmIHRoaXMuc2VydmljZXMubGFuZ3VhZ2VEZXRlY3Rvci5hc3luYykge1xuICAgICAgICB0aGlzLnNlcnZpY2VzLmxhbmd1YWdlRGV0ZWN0b3IuZGV0ZWN0KHNldExuZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRMbmcobG5nKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRlZmVycmVkO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJnZXRGaXhlZFRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Rml4ZWRUKGxuZywgbnMpIHtcbiAgICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG4gICAgICB2YXIgZml4ZWRUID0gZnVuY3Rpb24gZml4ZWRUKGtleSwgb3B0cykge1xuICAgICAgICB2YXIgb3B0aW9ucztcblxuICAgICAgICBpZiAoX3R5cGVvZihvcHRzKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIHJlc3QgPSBuZXcgQXJyYXkoX2xlbjMgPiAyID8gX2xlbjMgLSAyIDogMCksIF9rZXkzID0gMjsgX2tleTMgPCBfbGVuMzsgX2tleTMrKykge1xuICAgICAgICAgICAgcmVzdFtfa2V5MyAtIDJdID0gYXJndW1lbnRzW19rZXkzXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvcHRpb25zID0gX3RoaXM1Lm9wdGlvbnMub3ZlcmxvYWRUcmFuc2xhdGlvbk9wdGlvbkhhbmRsZXIoW2tleSwgb3B0c10uY29uY2F0KHJlc3QpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvcHRpb25zID0gX29iamVjdFNwcmVhZCh7fSwgb3B0cyk7XG4gICAgICAgIH1cblxuICAgICAgICBvcHRpb25zLmxuZyA9IG9wdGlvbnMubG5nIHx8IGZpeGVkVC5sbmc7XG4gICAgICAgIG9wdGlvbnMubG5ncyA9IG9wdGlvbnMubG5ncyB8fCBmaXhlZFQubG5ncztcbiAgICAgICAgb3B0aW9ucy5ucyA9IG9wdGlvbnMubnMgfHwgZml4ZWRULm5zO1xuICAgICAgICByZXR1cm4gX3RoaXM1LnQoa2V5LCBvcHRpb25zKTtcbiAgICAgIH07XG5cbiAgICAgIGlmICh0eXBlb2YgbG5nID09PSAnc3RyaW5nJykge1xuICAgICAgICBmaXhlZFQubG5nID0gbG5nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZml4ZWRULmxuZ3MgPSBsbmc7XG4gICAgICB9XG5cbiAgICAgIGZpeGVkVC5ucyA9IG5zO1xuICAgICAgcmV0dXJuIGZpeGVkVDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwidFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0KCkge1xuICAgICAgdmFyIF90aGlzJHRyYW5zbGF0b3I7XG5cbiAgICAgIHJldHVybiB0aGlzLnRyYW5zbGF0b3IgJiYgKF90aGlzJHRyYW5zbGF0b3IgPSB0aGlzLnRyYW5zbGF0b3IpLnRyYW5zbGF0ZS5hcHBseShfdGhpcyR0cmFuc2xhdG9yLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJleGlzdHNcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gZXhpc3RzKCkge1xuICAgICAgdmFyIF90aGlzJHRyYW5zbGF0b3IyO1xuXG4gICAgICByZXR1cm4gdGhpcy50cmFuc2xhdG9yICYmIChfdGhpcyR0cmFuc2xhdG9yMiA9IHRoaXMudHJhbnNsYXRvcikuZXhpc3RzLmFwcGx5KF90aGlzJHRyYW5zbGF0b3IyLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJzZXREZWZhdWx0TmFtZXNwYWNlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldERlZmF1bHROYW1lc3BhY2UobnMpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5kZWZhdWx0TlMgPSBucztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiaGFzTG9hZGVkTmFtZXNwYWNlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGhhc0xvYWRlZE5hbWVzcGFjZShucykge1xuICAgICAgdmFyIF90aGlzNiA9IHRoaXM7XG5cbiAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcblxuICAgICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybignaGFzTG9hZGVkTmFtZXNwYWNlOiBpMThuZXh0IHdhcyBub3QgaW5pdGlhbGl6ZWQnLCB0aGlzLmxhbmd1YWdlcyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmxhbmd1YWdlcyB8fCAhdGhpcy5sYW5ndWFnZXMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ2hhc0xvYWRlZE5hbWVzcGFjZTogaTE4bi5sYW5ndWFnZXMgd2VyZSB1bmRlZmluZWQgb3IgZW1wdHknLCB0aGlzLmxhbmd1YWdlcyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgdmFyIGxuZyA9IHRoaXMubGFuZ3VhZ2VzWzBdO1xuICAgICAgdmFyIGZhbGxiYWNrTG5nID0gdGhpcy5vcHRpb25zID8gdGhpcy5vcHRpb25zLmZhbGxiYWNrTG5nIDogZmFsc2U7XG4gICAgICB2YXIgbGFzdExuZyA9IHRoaXMubGFuZ3VhZ2VzW3RoaXMubGFuZ3VhZ2VzLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKGxuZy50b0xvd2VyQ2FzZSgpID09PSAnY2ltb2RlJykgcmV0dXJuIHRydWU7XG5cbiAgICAgIHZhciBsb2FkTm90UGVuZGluZyA9IGZ1bmN0aW9uIGxvYWROb3RQZW5kaW5nKGwsIG4pIHtcbiAgICAgICAgdmFyIGxvYWRTdGF0ZSA9IF90aGlzNi5zZXJ2aWNlcy5iYWNrZW5kQ29ubmVjdG9yLnN0YXRlW1wiXCIuY29uY2F0KGwsIFwifFwiKS5jb25jYXQobildO1xuXG4gICAgICAgIHJldHVybiBsb2FkU3RhdGUgPT09IC0xIHx8IGxvYWRTdGF0ZSA9PT0gMjtcbiAgICAgIH07XG5cbiAgICAgIGlmIChvcHRpb25zLnByZWNoZWNrKSB7XG4gICAgICAgIHZhciBwcmVSZXN1bHQgPSBvcHRpb25zLnByZWNoZWNrKHRoaXMsIGxvYWROb3RQZW5kaW5nKTtcbiAgICAgICAgaWYgKHByZVJlc3VsdCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJlUmVzdWx0O1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5oYXNSZXNvdXJjZUJ1bmRsZShsbmcsIG5zKSkgcmV0dXJuIHRydWU7XG4gICAgICBpZiAoIXRoaXMuc2VydmljZXMuYmFja2VuZENvbm5lY3Rvci5iYWNrZW5kKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmIChsb2FkTm90UGVuZGluZyhsbmcsIG5zKSAmJiAoIWZhbGxiYWNrTG5nIHx8IGxvYWROb3RQZW5kaW5nKGxhc3RMbmcsIG5zKSkpIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJsb2FkTmFtZXNwYWNlc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBsb2FkTmFtZXNwYWNlcyhucywgY2FsbGJhY2spIHtcbiAgICAgIHZhciBfdGhpczcgPSB0aGlzO1xuXG4gICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuXG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5ucykge1xuICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgbnMgPT09ICdzdHJpbmcnKSBucyA9IFtuc107XG4gICAgICBucy5mb3JFYWNoKGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIGlmIChfdGhpczcub3B0aW9ucy5ucy5pbmRleE9mKG4pIDwgMCkgX3RoaXM3Lm9wdGlvbnMubnMucHVzaChuKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5sb2FkUmVzb3VyY2VzKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGVycik7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBkZWZlcnJlZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwibG9hZExhbmd1YWdlc1wiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2VzKGxuZ3MsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgaWYgKHR5cGVvZiBsbmdzID09PSAnc3RyaW5nJykgbG5ncyA9IFtsbmdzXTtcbiAgICAgIHZhciBwcmVsb2FkZWQgPSB0aGlzLm9wdGlvbnMucHJlbG9hZCB8fCBbXTtcbiAgICAgIHZhciBuZXdMbmdzID0gbG5ncy5maWx0ZXIoZnVuY3Rpb24gKGxuZykge1xuICAgICAgICByZXR1cm4gcHJlbG9hZGVkLmluZGV4T2YobG5nKSA8IDA7XG4gICAgICB9KTtcblxuICAgICAgaWYgKCFuZXdMbmdzLmxlbmd0aCkge1xuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5vcHRpb25zLnByZWxvYWQgPSBwcmVsb2FkZWQuY29uY2F0KG5ld0xuZ3MpO1xuICAgICAgdGhpcy5sb2FkUmVzb3VyY2VzKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGVycik7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBkZWZlcnJlZDtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6IFwiZGlyXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRpcihsbmcpIHtcbiAgICAgIGlmICghbG5nKSBsbmcgPSB0aGlzLmxhbmd1YWdlcyAmJiB0aGlzLmxhbmd1YWdlcy5sZW5ndGggPiAwID8gdGhpcy5sYW5ndWFnZXNbMF0gOiB0aGlzLmxhbmd1YWdlO1xuICAgICAgaWYgKCFsbmcpIHJldHVybiAncnRsJztcbiAgICAgIHZhciBydGxMbmdzID0gWydhcicsICdzaHUnLCAnc3FyJywgJ3NzaCcsICd4YWEnLCAneWhkJywgJ3l1ZCcsICdhYW8nLCAnYWJoJywgJ2FidicsICdhY20nLCAnYWNxJywgJ2FjdycsICdhY3gnLCAnYWN5JywgJ2FkZicsICdhZHMnLCAnYWViJywgJ2FlYycsICdhZmInLCAnYWpwJywgJ2FwYycsICdhcGQnLCAnYXJiJywgJ2FycScsICdhcnMnLCAnYXJ5JywgJ2FyeicsICdhdXonLCAnYXZsJywgJ2F5aCcsICdheWwnLCAnYXluJywgJ2F5cCcsICdiYnonLCAncGdhJywgJ2hlJywgJ2l3JywgJ3BzJywgJ3BidCcsICdwYnUnLCAncHN0JywgJ3BycCcsICdwcmQnLCAndWcnLCAndXInLCAneWRkJywgJ3lkcycsICd5aWgnLCAnamknLCAneWknLCAnaGJvJywgJ21lbicsICd4bW4nLCAnZmEnLCAnanByJywgJ3BlbycsICdwZXMnLCAncHJzJywgJ2R2JywgJ3NhbSddO1xuICAgICAgcmV0dXJuIHJ0bExuZ3MuaW5kZXhPZih0aGlzLnNlcnZpY2VzLmxhbmd1YWdlVXRpbHMuZ2V0TGFuZ3VhZ2VQYXJ0RnJvbUNvZGUobG5nKSkgPj0gMCA/ICdydGwnIDogJ2x0cic7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNyZWF0ZUluc3RhbmNlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZUluc3RhbmNlKCkge1xuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgICAgdmFyIGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWQ7XG4gICAgICByZXR1cm4gbmV3IEkxOG4ob3B0aW9ucywgY2FsbGJhY2spO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJjbG9uZUluc3RhbmNlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsb25lSW5zdGFuY2UoKSB7XG4gICAgICB2YXIgX3RoaXM4ID0gdGhpcztcblxuICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgICAgdmFyIGNhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBub29wO1xuXG4gICAgICB2YXIgbWVyZ2VkT3B0aW9ucyA9IF9vYmplY3RTcHJlYWQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucywge1xuICAgICAgICBpc0Nsb25lOiB0cnVlXG4gICAgICB9KTtcblxuICAgICAgdmFyIGNsb25lID0gbmV3IEkxOG4obWVyZ2VkT3B0aW9ucyk7XG4gICAgICB2YXIgbWVtYmVyc1RvQ29weSA9IFsnc3RvcmUnLCAnc2VydmljZXMnLCAnbGFuZ3VhZ2UnXTtcbiAgICAgIG1lbWJlcnNUb0NvcHkuZm9yRWFjaChmdW5jdGlvbiAobSkge1xuICAgICAgICBjbG9uZVttXSA9IF90aGlzOFttXTtcbiAgICAgIH0pO1xuICAgICAgY2xvbmUuc2VydmljZXMgPSBfb2JqZWN0U3ByZWFkKHt9LCB0aGlzLnNlcnZpY2VzKTtcbiAgICAgIGNsb25lLnNlcnZpY2VzLnV0aWxzID0ge1xuICAgICAgICBoYXNMb2FkZWROYW1lc3BhY2U6IGNsb25lLmhhc0xvYWRlZE5hbWVzcGFjZS5iaW5kKGNsb25lKVxuICAgICAgfTtcbiAgICAgIGNsb25lLnRyYW5zbGF0b3IgPSBuZXcgVHJhbnNsYXRvcihjbG9uZS5zZXJ2aWNlcywgY2xvbmUub3B0aW9ucyk7XG4gICAgICBjbG9uZS50cmFuc2xhdG9yLm9uKCcqJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGZvciAodmFyIF9sZW40ID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuNCA+IDEgPyBfbGVuNCAtIDEgOiAwKSwgX2tleTQgPSAxOyBfa2V5NCA8IF9sZW40OyBfa2V5NCsrKSB7XG4gICAgICAgICAgYXJnc1tfa2V5NCAtIDFdID0gYXJndW1lbnRzW19rZXk0XTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNsb25lLmVtaXQuYXBwbHkoY2xvbmUsIFtldmVudF0uY29uY2F0KGFyZ3MpKTtcbiAgICAgIH0pO1xuICAgICAgY2xvbmUuaW5pdChtZXJnZWRPcHRpb25zLCBjYWxsYmFjayk7XG4gICAgICBjbG9uZS50cmFuc2xhdG9yLm9wdGlvbnMgPSBjbG9uZS5vcHRpb25zO1xuICAgICAgY2xvbmUudHJhbnNsYXRvci5iYWNrZW5kQ29ubmVjdG9yLnNlcnZpY2VzLnV0aWxzID0ge1xuICAgICAgICBoYXNMb2FkZWROYW1lc3BhY2U6IGNsb25lLmhhc0xvYWRlZE5hbWVzcGFjZS5iaW5kKGNsb25lKVxuICAgICAgfTtcbiAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gSTE4bjtcbn0oRXZlbnRFbWl0dGVyKTtcblxudmFyIGkxOG5leHQgPSBuZXcgSTE4bigpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGkxOG5leHQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gcmVmOiBodHRwczovL2dpdGh1Yi5jb20vdGMzOS9wcm9wb3NhbC1nbG9iYWxcbnZhciBnZXRHbG9iYWwgPSBmdW5jdGlvbiAoKSB7XG5cdC8vIHRoZSBvbmx5IHJlbGlhYmxlIG1lYW5zIHRvIGdldCB0aGUgZ2xvYmFsIG9iamVjdCBpc1xuXHQvLyBgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKWBcblx0Ly8gSG93ZXZlciwgdGhpcyBjYXVzZXMgQ1NQIHZpb2xhdGlvbnMgaW4gQ2hyb21lIGFwcHMuXG5cdGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHsgcmV0dXJuIHNlbGY7IH1cblx0aWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7IHJldHVybiB3aW5kb3c7IH1cblx0aWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7IHJldHVybiBnbG9iYWw7IH1cblx0dGhyb3cgbmV3IEVycm9yKCd1bmFibGUgdG8gbG9jYXRlIGdsb2JhbCBvYmplY3QnKTtcbn1cblxudmFyIGdsb2JhbCA9IGdldEdsb2JhbCgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBnbG9iYWwuZmV0Y2g7XG5cbi8vIE5lZWRlZCBmb3IgVHlwZVNjcmlwdCBhbmQgV2VicGFjay5cbmlmIChnbG9iYWwuZmV0Y2gpIHtcblx0ZXhwb3J0cy5kZWZhdWx0ID0gZ2xvYmFsLmZldGNoLmJpbmQoZ2xvYmFsKTtcbn1cblxuZXhwb3J0cy5IZWFkZXJzID0gZ2xvYmFsLkhlYWRlcnM7XG5leHBvcnRzLlJlcXVlc3QgPSBnbG9iYWwuUmVxdWVzdDtcbmV4cG9ydHMuUmVzcG9uc2UgPSBnbG9iYWwuUmVzcG9uc2U7IiwidmFyIHtIZWpsRWxlbWVudCB9ID0gcmVxdWlyZSgnLi9oZWpsRWxlbWVudCcpO1xyXG5cclxuXHJcbmNsYXNzIEhlamxBcHAgZXh0ZW5kcyBIZWpsRWxlbWVudFxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihpZCxvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKGlkLFwiRElWXCIsb3B0aW9ucyk7XHJcbiAgICAgICAgdGhpcy53aW5TdGFjayA9IFtdO1xyXG4gICAgICAgIHRoaXMuZGlhbG9nUGFuZSA9IERJVihcImRpYWxvZ1BhbmVcIikudmlzaWJsZSgobSxlbCk9PmVsLmNoaWxkcmVuLmxlbmd0aCA+IDApO1xyXG4gICAgICAgIHRoaXMucHJvZ3JlcyA9IERJVihcInByb2dyZXNcIikuc3RhY2soXHJcbiAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgIFNQQU4oKS5jbGFzcyhbXCJmYVwiLFwiZmEtM3hcIixcImZhLXNwaW5cIixcImZhLXNwaW5uZXJcIl0pLFxyXG4gICAgICAgICAgICAgICAgSDEoKS50ZXh0QmluZGVyKCgpPT50aGlzLnByb2dyZXNzVGV4dClcclxuICAgICAgICAgICAgXSkudmlzaWJsZSgoKT0+dGhpcy5wcm9ncmVzc1RleHQgIT0gbnVsbCk7IFxyXG4gICAgICAgIHRoaXMuY2xhc3MoJ3BsYWluQXBwJykuc3RhY2soW3RoaXMucHJvZ3Jlc10pO1xyXG4gICAgICAgIHRoaXMuaGlkZVByb2dyZXNzKCk7XHJcbiAgICAgICAgdGhpcy5jbG9zZURpYWxvZygpO1xyXG4gICAgfVxyXG4gICAgc2hvd1Byb2dyZXNzKHRleHQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wcm9ncmVzc1RleHQgPSB0ZXh0O1xyXG4gICAgICAgIHRoaXMucHJvZ3Jlcy5yZWJpbmQoKTtcclxuXHJcbiAgICB9XHJcbiAgICBoaWRlUHJvZ3Jlc3MoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuc2hvd1Byb2dyZXNzKG51bGwpO1xyXG4gICAgfVxyXG4gICAgY29udGVudChjbnQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jb250ZW50RWwgPSBjbnQ7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVDaGlsZHJlbigpO1xyXG4gICAgICAgIHRoaXMuc3RhY2tVcCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgc3RhY2tVcCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5zdGFjayhbdGhpcy5wcm9ncmVzLHRoaXMuZGlhbG9nUGFuZSx0aGlzLmNvbnRlbnRFbF0pXHJcbiAgICB9XHJcbiAgICBzaG93RGlhbG9nKGhlbClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9kaWFsb2dFbCA9IGhlbDtcclxuICAgICAgICB0aGlzLl9kaWFsb2dFbC5jbG9zZSA9IHRoaXMuY2xvc2VEaWFsb2cuYmluZCh0aGlzKTtcclxuICAgICAgICB0aGlzLmRpYWxvZ1BhbmUuc3RhY2soW2hlbF0pO1xyXG4gICAgICAgIHRoaXMuZGlhbG9nUGFuZS5iaW5kKHt9KTtcclxuICAgICAgICBpZih0aGlzLmNvbnRlbnRFbCAhPSBudWxsICYmIHRoaXMuY29udGVudEVsLm9uQ2xvc2UpXHJcbiAgICAgICAgICAgICAgdGhpcy5jb250ZW50RWwub25DbG9zZSh0aGlzKTtcclxuICBcclxuICBcclxuICAgICAgICBpZih0aGlzLl9kaWFsb2dFbC5vblNob3cpXHJcbiAgICAgICAgICAgICBUUllDKHRoaXMuX2RpYWxvZ0VsLm9uU2hvdyk7XHJcblxyXG4gICAgfVxyXG4gICAgY2xvc2VEaWFsb2cocmVzdW1lQ29udGVudClcclxuICAgIHtcclxuICAgICAgICBpZighcmVzdW1lQ29udGVudClcclxuICAgICAgICAgICAgcmVzdW1lQ29udGVudCA9IHRydWU7XHJcbiAgICAgICAgaWYodGhpcy5fZGlhbG9nRWwgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICBpZih0aGlzLl9kaWFsb2dFbC5vbkNsb3NlKVxyXG4gICAgICAgICAgICBUUllDKHRoaXMuX2RpYWxvZ0VsLm9uQ2xvc2UpO1xyXG4gICAgICAgIHRoaXMuX2RpYWxvZ0VsID0gbnVsbDtcclxuICAgICAgICB0aGlzLmRpYWxvZ1BhbmUucmVtb3ZlQ2hpbGRyZW4oKTtcclxuICAgICAgICB0aGlzLmRpYWxvZ1BhbmUuYmluZCh7fSk7XHJcbiAgICAgICAgaWYocmVzdW1lQ29udGVudCAmJiB0aGlzLmNvbnRlbnRFbCAhPSBudWxsICYmIHRoaXMuY29udGVudEVsLm9uUmVzdW1lKVxyXG4gICAgICAgICAgIFRSWUMoKCk9PnRoaXMuY29udGVudEVsLm9uUmVzdW1lKHRoaXMpKTtcclxuICAgIH1cclxuICAgIHBlZWsoKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMud2luU3RhY2subGVuZ3RoID09IDApXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIHJldHVybiB0aGlzLndpblN0YWNrW3RoaXMud2luU3RhY2subGVuZ3RoLTFdO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBDbG9zZXMgIHZpZXdzIG9uIHN0YWNrLCBvbmx5IDx1cFRvPiBsb3dlc3Qgdmlld3MgYXJlIGtlcHRcclxuICAgICAqIEBwYXJhbSB7aW50fSB1cFRvIFxyXG4gICAgICovXHJcbiAgICB1bndpbmQodXBUbylcclxuICAgIHtcclxuICAgICAgICB2YXIgdG9jbG9zZSA9IFtdXHJcbiAgICAgICAgaWYodGhpcy53aW5TdGFjay5sZW5ndGggPD0gIHVwVG8tMSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciBsZW4gPSB0aGlzLndpblN0YWNrLmxlbmd0aDtcclxuICAgICAgICBmb3IodmFyIGkgPSBsZW4rMTsgaSA+IHVwVG87IGktLSApXHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgXHJcbiAgICB9XHJcbiAgICBzaG93KGVsLG5vT25TaG93LHQpXHJcbiAgICB7XHJcbiAgICAgICAgaWYoIWVsKVxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiSEVKTDogQ2Fubm90IHNob3cgbnVsbC91bmRlZmluZWQgZWxlbWVudFwiKTtcclxuICAgICAgICBpZih0aGlzLmNvbnRlbnRFbClcclxuICAgICAgICAgICAgdGhpcy53aW5TdGFjay5wdXNoKHtjb250ZW50OiB0aGlzLmNvbnRlbnRFbH0pO1xyXG4gICAgICAgIHRoaXMuY29udGVudChlbCk7XHJcbiAgICAgICAgaWYoIW5vT25TaG93ICYmIHRoaXMuY29udGVudEVsLm9uU2hvdylcclxuICAgICAgICAgICAgVFJZQygoKT0+dGhpcy5jb250ZW50RWwub25TaG93KHRoaXMpKTtcclxuICAgICAgICBlbC5jbG9zZSA9IHRoaXMuY2xvc2UuYmluZCh0aGlzKTtcclxuICAgIH1cclxuIFxyXG4gICAgY2xvc2UoKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMud2luU3RhY2subGVuZ3RoID09IDApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB2YXIgcmVjID0gdGhpcy53aW5TdGFjay5wb3AoKTtcclxuICAgICAgICB0aGlzLmNsb3NlRGlhbG9nKGZhbHNlKTtcclxuICAgICAgICB0aGlzLmRvT25DbG9zZSgpO1xyXG4gICAgICAgIHRoaXMuY29udGVudEVsID0gbnVsbDtcclxuICAgICAgICB0aGlzLnNob3cocmVjLmNvbnRlbnQsdHJ1ZSAvKm5vIG9uU2hvdyovKTtcclxuICAgICAgICBpZihyZWMuY29udGVudC5vblJlc3VtZSlcclxuICAgICAgICAgIFRSWUMoKCk9PnJlYy5jb250ZW50Lm9uUmVzdW1lKHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBkb09uQ2xvc2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY29udGVudEVsICE9IG51bGwgJiYgdGhpcy5jb250ZW50RWwub25DbG9zZSlcclxuICAgICAgICAgICAgdGhpcy5jb250ZW50RWwub25DbG9zZSh0aGlzKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIEFQUChpZCxvcHRpb25zKVxyXG57XHJcbiAgICByZXR1cm4gbmV3IEhlamxBcHAoaWQsb3B0aW9ucyk7XHJcbn1cclxuXHJcbmlmKCF3aW5kb3cubm9IZWpsR2xvYmFscylcclxue1xyXG4gICAgd2luZG93LkFQUCA9IEFQUFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5IZWpsQXBwID0gSGVqbEFwcDtcclxubW9kdWxlLmV4cG9ydHMuQVBQID0gQVBQO1xyXG4iLCJjb25zdCB7SGVqbExvdkJhc2V9ID0gcmVxdWlyZShcIi4vbG92YmFzZVwiKTtcclxuZnVuY3Rpb24gY3JlYXRlUmFkaW8oaWQsb3B0aW9ucylcclxue1xyXG4gICAgdmFyIGxvdmJhc2UgPSBuZXcgSGVqbExvdkJhc2UocmFkaW8pO1xyXG5cclxuICAgIHZhciByYWRpbyA9IERJVihpZCkuZGVmYXVsdChcIlwiKS5jbGFzcyhbJ2J1dHRvbkFyZWEnLCdyYWRpbyddKS5zdGFjayhbXHJcbiAgICAgICAgRElWKCkuY29sbGVjdGlvbigoKT0+bG92YmFzZS5saXN0T3B0aW9ucygpLGNyZWF0ZUl0ZW1WaWV3KV0pO1xyXG4gICAgbG92YmFzZS5hdHRhY2gocmFkaW8pO1xyXG5cclxuICAgIGZ1bmN0aW9uIGNyZWF0ZUl0ZW1WaWV3KGl0KVxyXG4gICAge1xyXG4gICAgICAgIHZhciBydiA9IEJVVFRPTihsb3ZiYXNlLnNob3coaXQpLCgpPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICBsb3ZiYXNlLnNlbGVjdChpdCk7XHJcbiAgICAgICAgIFxyXG4gICAgICAgIH0pLmJpbmRlcigocyk9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcnYuYnVpbGQoKS5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgIGlmKGxvdmJhc2UuaXNTZWxlY3RlZChpdCkpXHJcbiAgICAgICAgICAgICAgICAgcnYuYnVpbGQoKS5jbGFzc0xpc3QuYWRkKFwic2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBzO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgIHJldHVybiBydjtcclxuICAgIH1cclxuICAgIFxyXG4gICBcclxuICAgIHJldHVybiByYWRpbztcclxufVxyXG53aW5kb3cuUkFESU8gPSBjcmVhdGVSYWRpbztcclxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVSYWRpbzsiLCIvKipcclxuICogcmVzdWx0IG9mIEZvcm0vVXNlciBpbnB1dCB2YWxpZGF0aW9uXHJcbiAqL1xyXG5jbGFzcyBIZWpsVmFsaWRhdGlvblByb3RvY29sXHJcbntcclxuICAgIGNvbnN0cnVjdG9yKClcclxuICAgIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7SGVqbFZhbGlkYXRpb25NZXNzYWdlfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSBbXVxyXG4gICAgICAgIHRoaXMuZXJyb3JzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIG5ldyB2YWxpZGF0aW9uIG1lc3NhZ2UgdG8gcmVzdWx0XHJcbiAgICAgKiBAcGFyYW0ge0hlamxWYWxpZGF0aW9uTWVzc2FnZX0gaGVqbFZhbGlkYXRpb25NZXNzYWdlIFxyXG4gICAgICovXHJcbiAgICBhZGRNZXNzYWdlKG1lc3NhZ2UpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xyXG4gICAgICAgIGlmKG1lc3NhZ2UuaXNFcnJvcilcclxuICAgICAgICAgICAgdGhpcy5lcnJvcnMucHVzaChtZXNzYWdlKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59ICB0cnVlIHdoZW4gcHJvdG9jb2wgY29udGFpbnMgZXJyb3IgbWVzc2FnZXNcclxuICAgICAqL1xyXG4gICAgaGFzRXJyb3JzKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lcnJvcnMubGVuZ3RoID4gMDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMgbmV3IGVycm9yIGludG8gdGhlIHByb3RvY29sXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBcclxuICAgICAqL1xyXG4gICAgYWRkRXJyb3IoZmllbGRMYWJlbCxtZXNzYWdlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuYWRkTWVzc2FnZShuZXcgSGVqbFZhbGlkYXRpb25FcnJvcihmaWVsZExhYmVsLG1lc3NhZ2UpKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNvbnZlcnQgcHJvdG9jb2wgdG8gc3RyaW5nXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBkaXNwbGF5UHJvdG9jb2woKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBydiA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5tZXNzYWdlcy5mb3JFYWNoKG09PlxyXG4gICAgICAgICAgICBydiArPSBtLmRpc3BsYXlNZXNzYWdlKCkrXCJcXG5cIik7XHJcbiAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY29udmVydCBwcm90b2NvbCBlcnJvcnMgdG8gc3RyaW5nLCBubyBmaWVsZCBuYW1lcywgbGV2ZWxzXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBkaXNwbGF5RXJyb3JzKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcnYgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuZXJyb3JzLmZvckVhY2gobT0+XHJcbiAgICAgICAgICAgIHJ2ICs9IG0ubWVzc2FnZStcIlxcblwiKTtcclxuICAgICAgICByZXR1cm4gcnY7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIG1lcmdlcyBtZXNzYWdlcyBvZiBnaXZlbiBwcm90b2NvbCB0byB0aGlzIG9uZSBcclxuICAgICAqIFRoaXMgaXMgc3VwcG9ydCBmb3IgaGllYXJjaGljYWwgc3VidmFsaWRhdGlvbnNcclxuICAgICAqIEBwYXJhbSB7SGVqbFZhbGlkYXRpb25Qcm90b2NvbH0gcHJvdG9jb2wgXHJcbiAgICAgKi9cclxuICAgIG1lcmdlKHByb3RvY29sKVxyXG4gICAge1xyXG4gICAgICAgIHByb3RvY29sLm1lc3NhZ2VzLmZvckVhY2gobT0+XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTWVzc2FnZShtKSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2socHJlbWlzZSxtZXNzYWdlKVxyXG4gICAge1xyXG4gICAgICAgIGlmKCFwcmVtaXNlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYodHlwZW9mIG1lc3NhZ2UgPT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBuZXcgSGVqbFZhbGlkYXRpb25FcnJvcihudWxsLG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZE1lc3NhZ2UobWVzc2FnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBIZWpsVmFsaWRhdGlvbk1lc3NhZ2Vcclxue1xyXG4gICAgY29uc3RydWN0b3IobGV2ZWwsbGV2ZWxEZXNjLGZpZWxkTmFtZSxtZXNzYWdlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubGV2ZWwgPSBsZXZlbDtcclxuICAgICAgICB0aGlzLmxldmVsRGVzYyA9IGxldmVsRGVzYztcclxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xyXG4gICAgICAgIHRoaXMuaXNFcnJvciA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaXNXYXJuaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5pc05vdGUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmZpZWxkTmFtZSA9IGZpZWxkTmFtZTtcclxuICAgIH1cclxuICAgIGRpc3BsYXlNZXNzYWdlKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gVCh0aGlzLmxldmVsRGVzYykrXCI6IFwiKyh0aGlzLmZpZWxkTmFtZSA/IChUKHRoaXMuZmllbGROYW1lKStcIiAtIFwiKTpcIlwiKStUKHRoaXMubWVzc2FnZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEhlamxWYWxpZGF0aW9uRXJyb3IgZXh0ZW5kcyBIZWpsVmFsaWRhdGlvbk1lc3NhZ2Vcclxue1xyXG4gICAgY29uc3RydWN0b3IoZmllbGROYW1lLG1lc3NhZ2UpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoXCJFXCIsXCJDaHliYVwiLGZpZWxkTmFtZSxtZXNzYWdlKTtcclxuICAgICAgICB0aGlzLmlzRXJyb3IgPSB0cnVlOyAgIFxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBIZWpsVmFsaWRhdGlvbldhcm5pbmcgZXh0ZW5kcyBIZWpsVmFsaWRhdGlvbk1lc3NhZ2Vcclxue1xyXG4gICAgY29uc3RydWN0b3IoZmllbGROYW1lLG1lc3NhZ2UpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoXCJXXCIsXCJWYXJvdsOhbsOtXCIsZmllbGROYW1lLG1lc3NhZ2UpO1xyXG4gICAgICAgIHRoaXMuaXNXYXJuaW5nID0gdHJ1ZTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgSGVqbFZhbGlkYXRpb25Ob3RlIGV4dGVuZHMgSGVqbFZhbGlkYXRpb25NZXNzYWdlXHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGZpZWxkTmFtZSxtZXNzYWdlKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKFwiTlwiLFwiUG96bsOhbWthXCIsZmllbGROYW1lLG1lc3NhZ2UpO1xyXG4gICAgICAgIHRoaXMuaXNOb3RlID0gdHJ1ZTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IEhlamxWYWxpZGF0aW9uUHJvdG9jb2wsIEhlamxWYWxpZGF0aW9uTWVzc2FnZSxIZWpsVmFsaWRhdGlvbldhcm5pbmcsSGVqbFZhbGlkYXRpb25Ob3RlfSIsIlxyXG5cclxuXHJcbnZhciBodHRwR2V0Q2FjaGUgPSB7fVxyXG5cclxuLyoqXHJcbiAqIEBjYWxsYmFjayBsb2FkQ2FsbGJhY2tcclxuICogQHBhcmFtIHtTdHJpbmd9IGxvYWRlZFRleHQgbG9hZGVkIGRhdGEgYXMgdGV4dFxyXG4gKi9cclxuLyoqXHJcbiAqIFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsIHVybCBvZiBodHRwIHJlc291cmNlICBmaWxlIHRvIGJlIGxvYWRlZFxyXG4gKiBAcGFyYW0ge2xvYWRDYWxsYmFja30gY2FsbGJhY2sgXHJcbiAqL1xyXG52YXIgaHR0cEdldCA9IGZ1bmN0aW9uKHVybCxjYWxsYmFjayx0cnlDYWNoZSxvcHRpb25zKVxyXG57XHJcbiAgdHJ5XHJcbntcclxuICBpZih0cnlDYWNoZSlcclxuICB7XHJcbiAgICBpZihodHRwR2V0Q2FjaGUuaGFzT3duUHJvcGVydHkodXJsKSlcclxuICAgICAge1xyXG4gICAgICAgIHZhciBydiA9IGh0dHBHZXRDYWNoZVt1cmxdO1xyXG4gICAgICAgIGNhbGxiYWNrKHJ2KTtcclxuICAgICAgICByZXR1cm4gO1xyXG4gICAgICB9XHJcbiAgfVxyXG5cclxuICAgICAgdmFyIHhociA9IGNyZWF0ZUNPUlNSZXF1ZXN0KChvcHRpb25zICE9IG51bGwgJiYgb3B0aW9ucy5tZXRob2QpID8gb3B0aW9ucy5tZXRob2QgOiBcIkdFVFwiLHVybCk7XHJcbiAgICAgIGlmKG9wdGlvbnMgJiYgb3B0aW9ucy5oZWFkZXJzKVxyXG4gICAgICB7XHJcbiAgICAgICAgZm9yKHZhciBoZWFkZXIgaW4gb3B0aW9ucy5oZWFkZXJzKVxyXG4gICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLG9wdGlvbnMuaGVhZGVyc1toZWFkZXJdKTtcclxuICAgICAgfVxyXG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09IDQpXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgaWYoeGhyLnN0YXR1cyA9PSAyMDApXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYodHJ5Q2FjaGUpXHJcbiAgICAgICAgICAgICAgICAgICAgaHR0cEdldENhY2hlW3VybF0gPSB4aHIucmVzcG9uc2VUZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soeGhyLnJlc3BvbnNlVGV4dCx4aHIpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLHhocik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgfTtcclxuXHJcbiAgICBcclxuICAgICAgeGhyLnRpbWVvdXQgPSAzMDAwMDtcclxuICAgICAgeGhyLnNlbmQoKG9wdGlvbnMgIT0gbnVsbCAmJiBvcHRpb25zLmRhdGEpID8gb3B0aW9ucy5kYXRhIDpudWxsKTtcclxuICAgIH1cclxuICAgIGNhdGNoKGVycm9yKVxyXG4gICAge1xyXG5cclxuICAgICAgY29uc29sZS5sb2coZXJyb3Iuc3RhY2spO1xyXG4gICAgICBjYWxsYmFjayhudWxsLG51bGwsZXJyb3IpO1xyXG4gICAgfVxyXG4gICBcclxuIH1cclxuZnVuY3Rpb24gZG9IdHRwUmVxdWVzdCh1cmwsb3B0aW9ucylcclxue1xyXG4gIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KT0+XHJcbiAge1xyXG4gICAgaHR0cEdldCh1cmwsZnVuY3Rpb24oZGF0YSx4aHIsZXhjZXB0aW9uKVxyXG4gICAge1xyXG4gICAgICBpZihkYXRhICE9IG51bGwpXHJcbiAgICAgICAgcmVzb2x2ZShkYXRhKTtcclxuICAgICAgZWxzZVxyXG4gICAgICB7XHJcbiAgICAgICAgaWYoZXhjZXB0aW9uKVxyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcImRvSHR0cFJlcXVlc3QgZm9yIFwiK3VybCtcImZhaWxlZCB3aXRoIGV4Y2VwdGlvblwiLGV4Y2VwdGlvbik7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihcImRvSHR0cFJlcXVlc3QgZm9yIFwiK3VybCtcIiBmYWlsZWQsIHN0YXR1cz1cIix4aHIuc3RhdHVzKTtcclxuICAgICAgICByZWplY3QoeyB4aHI6eGhyLGV4Y2VwdGlvbjpleGNlcHRpb259KTsgIFxyXG4gICAgICB9XHJcbiAgICB9LGZhbHNlLG9wdGlvbnMpO1xyXG4gIH0pXHJcbiAgcmV0dXJuIHByb21pc2U7XHJcbn1cclxuICBmdW5jdGlvbiByZW5kZXJVcmxUZW1wbGF0ZSh1cmwsbW9kZWwpXHJcbiAge1xyXG4gICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLHJlamVjdClcclxuICAgIHsgIGh0dHBHZXQodXJsLGZ1bmN0aW9uKGRhdGEscnEpXHJcbiAgICAgIHtcclxuICAgICAgICBpZihkYXRhID09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcmVqZWN0KHJxKTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJ2ID0gZGF0YS5yZW5kZXJUZW1wbGF0ZShtb2RlbCk7XHJcbiAgICAgICAgcmVzb2x2ZShydik7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcHJvbWlzZTtcclxuIH1cclxuXHJcbiBmdW5jdGlvbiBjcmVhdGVDT1JTUmVxdWVzdChtZXRob2QsIHVybCkge1xyXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgaWYgKFwid2l0aENyZWRlbnRpYWxzXCIgaW4geGhyKSB7XHJcbiAgXHJcbiAgICAgIC8vIENoZWNrIGlmIHRoZSBYTUxIdHRwUmVxdWVzdCBvYmplY3QgaGFzIGEgXCJ3aXRoQ3JlZGVudGlhbHNcIiBwcm9wZXJ0eS5cclxuICAgICAgLy8gXCJ3aXRoQ3JlZGVudGlhbHNcIiBvbmx5IGV4aXN0cyBvbiBYTUxIVFRQUmVxdWVzdDIgb2JqZWN0cy5cclxuICAgICAgeGhyLm9wZW4obWV0aG9kLCB1cmwsIHRydWUpO1xyXG4gIFxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgWERvbWFpblJlcXVlc3QgIT0gXCJ1bmRlZmluZWRcIikge1xyXG4gIFxyXG4gICAgICAvLyBPdGhlcndpc2UsIGNoZWNrIGlmIFhEb21haW5SZXF1ZXN0LlxyXG4gICAgICAvLyBYRG9tYWluUmVxdWVzdCBvbmx5IGV4aXN0cyBpbiBJRSwgYW5kIGlzIElFJ3Mgd2F5IG9mIG1ha2luZyBDT1JTIHJlcXVlc3RzLlxyXG4gICAgICB4aHIgPSBuZXcgWERvbWFpblJlcXVlc3QoKTtcclxuICAgICAgeGhyLm9wZW4obWV0aG9kLCB1cmwpO1xyXG4gIFxyXG4gICAgfSBlbHNlIHtcclxuICBcclxuICAgICAgLy8gT3RoZXJ3aXNlLCBDT1JTIGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIuXHJcbiAgICAgIHhociA9IG51bGw7XHJcbiAgXHJcbiAgICB9XHJcbiAgICByZXR1cm4geGhyO1xyXG4gIH1cclxuXHJcbiAgd2luZG93Lmh0dHBHZXQgPSBodHRwR2V0O1xyXG4gIHdpbmRvdy5kb0h0dHBSZXF1ZXN0ID0gZG9IdHRwUmVxdWVzdDtcclxuICBtb2R1bGUuZXhwb3J0cy5odHRwR2V0ID0gaHR0cEdldDtcclxuICBtb2R1bGUuZXhwb3J0cy5kb0h0dHBSZXF1ZXN0ID0gZG9IdHRwUmVxdWVzdDtcclxuIiwiXHJcbmNsYXNzIERhdGFTdG9yZVxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIGlmKG9wdGlvbnMgPT0gbnVsbClcclxuICAgICAgICAgICAgb3B0aW9ucyAgPSB7IH1cclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5maWxlcyA9IHt9O1xyXG4gICAgfVxyXG4gICAgYWRkRGF0YUZpbGUoZmlsZU5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYodGhpcy5maWxlc1tmaWxlTmFtZV0gPT0gbnVsbClcclxuICAgICAgICAgICAgdGhpcy5maWxlc1tmaWxlTmFtZV0gPSB0aGlzLm5ld0RhdGFGaWxlKGZpbGVOYW1lKTtcclxuXHJcbiAgICAgICAgdmFyIHJ2ID0gdGhpcy5maWxlc1tmaWxlTmFtZV07XHJcbiAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG4gICAgYWRkRG9jdW1lbnRGaWxlKGZpbGVuYW1lKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBydiA9IHRoaXMuYWRkRGF0YUZpbGUoZmlsZW5hbWUpO1xyXG4gICAgICAgIHJ2LnNldERvY3VtZW50TW9kZSgpO1xyXG4gICAgICAgIHJldHVybiBydjtcclxuICAgIH1cclxuXHJcbiAgICBnZXREb2N1bWVudFRyYW5zZm9ybWVyKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZW1wdHlUcmFuc2Zvcm1lcjtcclxuICAgIH1cclxufVxyXG5cclxuRGF0YVN0b3JlLl9zdG9yZVR5cGVzID0ge31cclxuRGF0YVN0b3JlLmNyZWF0ZSA9IGZ1bmN0aW9uKHN0b3JlVHlwZSxvcHRpb25zKVxyXG57XHJcbiAgICB2YXIgY29uc3RydWN0b3IgPSBEYXRhU3RvcmUuX3N0b3JlVHlwZXNbc3RvcmVUeXBlXTtcclxuICAgIGlmKGNvbnN0cnVjdG9yID09IG51bGwpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgcnYgPSBjb25zdHJ1Y3RvcihvcHRpb25zKTtcclxuICAgIHJldHVybiBydjtcclxufVxyXG5cclxuY2xhc3MgRGF0YUZpbGVcclxue1xyXG4gICAgY29uc3RydWN0b3IoZGF0YVN0b3JlLGZpbGVOYW1lKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuZmlsZU5hbWUgPSBmaWxlTmFtZTtcclxuICAgICAgICB0aGlzLnRyYW5zZm9ybWVyID0gZW1wdHlUcmFuc2Zvcm1lcjtcclxuICAgIH1cclxuXHJcbiAgICBzZXREb2N1bWVudE1vZGUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMudHJhbnNmb3JtZXIgPSB0aGlzLmRhdGFTdG9yZS5nZXREb2N1bWVudFRyYW5zZm9ybWVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbGlzdChvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgXHJcbiAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCB0aGlzLmxpc3RJbnRlcm5hbChvcHRpb25zKVxyXG4gICAgICAgIHZhciBydiA9IGF3YWl0IHRoaXMudHJhbnNmb3JtZXIudHJhbnNmb3JtUmVzdWx0KGRhdGEpO1xyXG4gICAgICAgIHJldHVybiBydjtcclxuICAgIH1cclxuICAgIGFzeW5jIGZpbmRCeUlkKGlkKVxyXG4gICAge1xyXG4gICAgIFxyXG4gICAgICAgIHZhciBkYXRhID0gYXdhaXQgdGhpcy5maW5kQnlJZEludGVybmFsKGlkKVxyXG4gICAgICAgIHZhciBydiA9IGF3YWl0IHRoaXMudHJhbnNmb3JtZXIudHJhbnNmb3JtUmVzdWx0KGRhdGEpO1xyXG4gICAgICAgIHJldHVybiBydjtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBzYXZlKGRhdGEsaWQpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHBheWxvYWQgPSB0aGlzLnRyYW5zZm9ybWVyLnRyYW5zZm9ybUlucHV0KGRhdGEpO1xyXG4gICAgICBcclxuICAgICAgICAgXHJcbiAgICAgICAgaWYoaWQgPT0gbnVsbClcclxuICAgICAgICAgICAgaWQgPSB0aGlzLnRyYW5zZm9ybWVyLmV4dHJhY3RJZChkYXRhKTtcclxuICAgICAgIFxyXG4gICAgICAgIHZhciByZXNkYXRhID0gYXdhaXQgdGhpcy5zYXZlSW50ZXJuYWwocGF5bG9hZCxpZCk7XHJcbiAgICAgICAgIHZhciBydiA9IHRoaXMudHJhbnNmb3JtZXIudHJhbnNmb3JtUmVzdWx0KHJlc2RhdGEpO1xyXG4gICAgICAgICBpZih0aGlzLnRyYW5zZm9ybWVyLnVwZGF0ZUFmdGVyU2F2ZSlcclxuICAgICAgICAgICAgdGhpcy50cmFuc2Zvcm1lci51cGRhdGVBZnRlclNhdmUoZGF0YSxydik7XHJcbiAgICAgICAgcmV0dXJuIHJ2O1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuXHJcbmNvbnN0IGVtcHR5VHJhbnNmb3JtZXIgPSBcclxue1xyXG4gICAgZXh0cmFjdElkOiAoZGF0YSk9PlxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfSxcclxuICAgIHRyYW5zZm9ybVJlc3VsdDogKGRhdGEpPT5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgIH0sXHJcbiAgICB0cmFuc2Zvcm1JbnB1dDogKGRhdGEpPT5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgIH1cclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5EYXRhU3RvcmUgPSBEYXRhU3RvcmU7XHJcbm1vZHVsZS5leHBvcnRzLkRhdGFGaWxlID0gRGF0YUZpbGU7XHJcbm1vZHVsZS5leHBvcnRzLmZpbGVzID0ge307XHJcbm1vZHVsZS5leHBvcnRzLnN0b3JlcyA9IHt9O1xyXG5cclxucmVxdWlyZShcIi4vZGF0YXN0b3JlUmVzdFwiKTtcclxuXHJcbmNvbnN0IHsgZGF0YUZpbGVzIH0gPSByZXF1aXJlKCcuLi8uLi8uLi9hcHAvZGF0YWZpbGVzJyk7XHJcbmZvcih2YXIgc2tleSBpbiBkYXRhRmlsZXMpXHJcbntcclxuICAgIHZhciBzdG9yZSAgPSBkYXRhRmlsZXNbc2tleV07XHJcbiAgICB2YXIgaW5zdCA9IERhdGFTdG9yZS5jcmVhdGUoc3RvcmUudHlwZSxzdG9yZS5vcHRpb25zKTtcclxuICAgIG1vZHVsZS5leHBvcnRzLnN0b3Jlc1tza2V5XSA9IGluc3Q7XHJcblxyXG4gICAgZm9yKHZhciBrZXkgaW4gc3RvcmUuZmlsZXMpXHJcbiAgICB7XHJcbiAgICAgICAgIHZhciBmaWxlID0gc3RvcmUuZmlsZXNba2V5XTtcclxuICAgICAgICAgdmFyIGZpbnN0ID0gZmlsZS50eXBlID09PSAnZG9jdW1lbnQnXHJcbiAgICAgICAgICAgID8gaW5zdC5hZGREb2N1bWVudEZpbGUoa2V5LGZpbGUpXHJcbiAgICAgICAgICAgIDogaW5zdC5hZGREYXRhRmlsZShrZXksZmlsZSlcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cy5maWxlc1trZXldID0gZmluc3Q7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4iLCJjb25zdCB7IERhdGFTdG9yZSxEYXRhRmlsZSB9ID0gcmVxdWlyZSgnLi9kYXRhc3RvcmUnKVxyXG5jb25zdCB7IGRvSHR0cFJlcXVlc3QgfSA9IHJlcXVpcmUoJy4uL2h0dHBoZWxwZXInKVxyXG5cclxuY2xhc3MgRGF0YVN0b3JlUmVzdCBleHRlbmRzIERhdGFTdG9yZVxyXG57XHJcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIGlmKG9wdGlvbnMgPT0gbnVsbClcclxuICAgICAgICAgICAgb3B0aW9ucyAgPSB7XHJcbiAgICAgICAgICAgICAgICB1cmxCYXNlOlwiYXBpXCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICBzdXBlcihvcHRpb25zKVxyXG4gICAgfVxyXG4gIFxyXG4gICAgZ2V0RG9jdW1lbnRUcmFuc2Zvcm1lcigpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGpzb25Eb2N1bWVudFJlc3RUcmFuc2Zvcm1lcjtcclxuICAgIH1cclxuICAgIGdldFVybEJhc2UoKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHRoaXMub3B0aW9ucy51cmxCYXNlID09IG51bGwpXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy51cmxCYXNlID0gXCJhcGlcIlxyXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMudXJsQmFzZTtcclxuICAgIH1cclxuXHJcbiAgICBuZXdEYXRhRmlsZShmaWxlTmFtZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IERhdGFGaWxlUmVzdCh0aGlzLGZpbGVOYW1lKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmNsYXNzIERhdGFGaWxlUmVzdCBleHRlbmRzIERhdGFGaWxlXHJcbntcclxuICAgIGNvbnN0cnVjdG9yKGRhdGFTdG9yZSxmaWxlTmFtZSlcclxuICAgIHtcclxuICAgICAgIHN1cGVyKGRhdGFTdG9yZSxmaWxlTmFtZSlcclxuICAgIH1cclxuICAgIFxyXG4gICBnZXREb2N1bWVudFRyYW5mb3JtZXIoKVxyXG4gICB7XHJcbiAgICAgICByZXR1cm4ganNvbkRvY3VtZW50UmVzdFRyYW5zZm9ybWVyO1xyXG4gICB9XHJcbiAgICBnZXRVcmxCYXNlKGlkKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmRhdGFTdG9yZS5nZXRVcmxCYXNlKCkrXCIvXCIrdGhpcy5maWxlTmFtZTsgIFxyXG4gICAgICAgIGlmKGlkICE9IG51bGwpXHJcbiAgICAgICAgICAgIHVybCArPSBcIi9cIitpZDtcclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBhc3luYyBsaXN0SW50ZXJuYWwob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRVcmxCYXNlKCk7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGRvSHR0cFJlcXVlc3QodXJsKTtcclxuICAgIH1cclxuICAgIGFzeW5jIGZpbmRCeUlkSW50ZXJuYWwoaWQpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0VXJsQmFzZShpZCk7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGRvSHR0cFJlcXVlc3QodXJsKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBzYXZlSW50ZXJuYWwoZGF0YSxpZClcclxuICAgIHtcclxuICAgICAgIFxyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldFVybEJhc2UoaWQpO1xyXG4gICAgICAgIHZhciByZXNkYXRhID0gYXdhaXQgZG9IdHRwUmVxdWVzdCh1cmwsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZDppZCA9PSBudWxsID8gXCJQT1NUXCI6XCJQVVRcIixcclxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6dGhpcy50cmFuc2Zvcm1lci5jb250ZW50VHlwZShkYXRhKX1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICByZXR1cm4gcmVzZGF0YTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmNvbnN0IGpzb25Eb2N1bWVudFJlc3RUcmFuc2Zvcm1lciA9IFxyXG57XHJcbiAgICBleHRyYWN0SWQ6IChkb2MpPT5cclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZG9jLl9pZDtcclxuICAgIH0sXHJcbiAgICB0cmFuc2Zvcm1SZXN1bHQ6IChkYXRhKT0+XHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJ2ID0gSlNPTi5wYXJzZShkYXRhKTtcclxuICAgICAgICByZXR1cm4gcnY7XHJcbiAgICB9LFxyXG4gICAgdHJhbnNmb3JtSW5wdXQ6IChkYXRhKT0+XHJcbiAgICB7XHJcbiAgICAgICAgaWYodHlwZW9mIGRhdGEgPT0gXCJvYmplY3RcIilcclxuICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZGF0YSxudWxsLDIpO1xyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfSxcclxuICAgIGNvbnRlbnRUeXBlOihkYXRhKT0+XHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICB9LFxyXG4gICAgdXBkYXRlQWZ0ZXJTYXZlKGRhdGEscnYpXHJcbiAgICB7XHJcbiAgICAgICAgaWYoZGF0YS5faWQgPT0gbnVsbClcclxuICAgICAgICAgICAgZGF0YS5faWQgPSBydi5pZDtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbkRhdGFTdG9yZS5yZXN0QXBpID0gZnVuY3Rpb24ob3B0aW9ucylcclxue1xyXG4gICAgcmV0dXJuIG5ldyBEYXRhU3RvcmVSZXN0KG9wdGlvbnMpO1xyXG59XHJcbkRhdGFTdG9yZS5fc3RvcmVUeXBlc1tcInJlc3RcIl0gPSBEYXRhU3RvcmUucmVzdEFwaTtcclxuXHJcbm1vZHVsZS5leHBvcnRzLkRhdGFTdG9yZVJlc3QgPSBEYXRhU3RvcmVSZXN0O1xyXG5tb2R1bGUuZXhwb3J0cy5EYXRhRmlsZVJlc3QgPSBEYXRhRmlsZVJlc3Q7Il19
