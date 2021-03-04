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


