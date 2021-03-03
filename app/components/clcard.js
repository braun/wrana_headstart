
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