//
// Setup variables.
//
Collate.UI = {
        Data: {
            Global: {}
        }
    };
Collate.Globals = {};
Collate.User = {
        Accounts: {}
    };

//
// Initalize all of the already defined accounts.
//
var s = Collate.Storage.getRawItem("global-accounts");
if (s != null)
    for (var i = 0; i < s.length; i += 1)
        Collate.User.Accounts[s[i].name] = new Collate.Account[s[i]["type"]](s[i].name, s[i].parameters);

//
// Setup the global instances.
//
Collate.Globals["Dashboard"] = new Collate.Global.Dashboard();
Collate.Globals["NewAccount"] = new Collate.Global.NewAccount();

//
// Define the structures for the sidebar.
//
Collate.UI.Data.Global.AllAccounts = [
    { data: 'Dashboard' },
    { data: 'Transactions sent' },
    { data: 'Transactions received' },
    { data: 'Blocks generated' }
];

function GenerateAccountSidebar()
{
    Collate.UI.Data.Global.IndividualWallets = [];
    for (var i in Collate.User.Accounts)
    {
        var items = Collate.User.Accounts[i].getMenu();
        var d = [];    
        for (var a in items)
        {
            var e = items[a];
            if (typeof(e) == "string")
                d[d.length] = { data: { toString: function() { return this.value; }, value: e, page: e, account: Collate.User.Accounts[i] } };
        }
        Collate.UI.Data.Global.IndividualWallets[Collate.UI.Data.Global.IndividualWallets.length] = {
            data: { toString: function() { return this.value; }, value: i, page: null, account: Collate.User.Accounts[i] },
            children: d,
            __opened: true
        }
    }
}

function ReassignAccountSidebar()
{
    uki("#TreeView-IndividualWallets").data(Collate.UI.Data.Global.IndividualWallets);
}

//
// Generate the account sidebar.
//
GenerateAccountSidebar();

//
// Setup how the page looks.
//
var treeStyle = {fontSize: '11px', lineHeight: '11px', cursor: 'default'};
uki(
    // Outer box (whole page)
    { view: 'Box', rect: '0 0 1000 1000', anchors: 'top left right width', childViews: [
        
        // Top panel area
        { view: 'Box', rect: '0 0 1000 44', anchors: 'top left right width', background: 'theme(panel)', childViews: [
        
            // Toolbar buttons
            { view: 'Button', rect: '10 10 121 24', anchors: 'left top', id: 'Tools-NewAccount', text: 'New Account'},
            
        ] },
        
        // Horizontally split area
        { view: 'HSplitPane', rect: '0 45 1000 956', anchors: 'top left right width bottom height',
          handleWidth: 1, handlePosition: 229, leftMin: 150, rightMin: 400,
          leftPane: { background: "#D0D7E2", childViews: [
            
            // List of account and search area
            { view: 'Label', rect: '0 4 170 20', anchors: 'left top', id: 'Label-AllAccounts', text: 'ALL ACCOUNTS'},
            { view: 'uki.more.view.TreeList', rect: '0 30 229 100', anchors: 'left top bottom', id: 'TreeView-AllAccounts', data: Collate.UI.Data.Global.AllAccounts, rowHeight: 20, style: treeStyle },
            { view: 'Label', rect: '0 114 170 20', anchors: 'left top', id: 'Label-IndividualWallets', text: 'INDIVIDUAL ACCOUNTS'},
            { view: 'uki.more.view.TreeList', rect: '0 140 229 100', anchors: 'left top bottom', id: 'TreeView-IndividualWallets', data: Collate.UI.Data.Global.IndividualWallets, rowHeight: 20, style: treeStyle }
            
          ] },
          rightChildViews: [
            
            // List of transactions for account + other info
            { view: 'Box', rect: '0 0 770 956', anchors: 'top left right width bottom height', id: 'MainArea' }
            
          ]
        },
    ] }
).attachTo(window, '1000 1000');

//
// Set up label styles.
//
function InitalizeLabel(id)
{
    uki(id).dom().firstChild.style.fontFamily = "'Lucida Grande', Arial, Helvetica, sans-serif";
    uki(id).dom().firstChild.style.fontSize = '11px';
    uki(id).dom().firstChild.style.webkitUserSelect = 'none';
    uki(id).dom().firstChild.style.color = 'rgb(113, 129, 147)';
    uki(id).dom().firstChild.style.cursor = 'none';
    uki(id).dom().firstChild.style.fontWeight = 'bold';
    uki(id).dom().firstChild.style.textShadow = 'rgba(255, 255, 255, 0.796875) 0px 1px 0px';
    uki(id).dom().firstChild.style.left = '9px';
    uki(id).dom().firstChild.style.top = '5px';
    uki(id).dom().firstChild.style.right = '0px';
    uki(id).dom().firstChild.style.lineHeight = '13px';
}
function UnselectAll(id)
{
    uki(id).background('#D0D7E2');
}
InitalizeLabel('#Label-AllAccounts');
InitalizeLabel('#Label-IndividualWallets');
uki('#TreeView-AllAccounts').background('#D0D7E2');
uki('#TreeView-AllAccounts').bind('mousedown', function()
{
    uki('#TreeView-IndividualWallets').selectedIndexes([]);
});
uki('#TreeView-IndividualWallets').background('#D0D7E2');
uki('#TreeView-IndividualWallets').bind('mousedown', function()
{
    uki('#TreeView-AllAccounts').selectedIndexes([]);
});
uki('#TreeView-AllAccounts').selectedIndex(0);

//
// Define our function for handling UI loading.
//
function ClearUI()
{
    var area = uki('#MainArea');
    area.dom().innerHTML = "";
}
function LoadUI(obj, page)
{
    var area = uki('#MainArea');
    if (obj == null)
    {
        area.dom().innerHTML = "<h2>This page is invalid.</h2>";
        return;
    }
    var wasAttached = false;
    var attach = function(uu)
    {
        uu.attachTo(area.dom(), '1000 1000');
        wasAttached = true;
    };
    var result = null;
    result = obj.getUI(attach, page);
    if (!wasAttached)
        area.dom().innerHTML = "<h2>This page is invalid.</h2>";
}

//
// Attach event handlers for sidebar items.
//
uki('#TreeView-AllAccounts').bind('mouseup', function()
{
    var index = uki('#TreeView-AllAccounts').selectedRow().data;
    ClearUI();
    switch (index)
    {
        case "Dashboard":
            // Notice that we send the object across, not the result
            // of getUI.
            LoadUI(Collate.Globals[index], null);
            break;
        default:
            LoadUI(null);
            break;
    }
});
uki('#TreeView-IndividualWallets').bind('mouseup', function()
{
    var data = uki('#TreeView-IndividualWallets').selectedRow().data;
    ClearUI();
    LoadUI(data.account, data.page);
});

//
// Attach event handlers.
//
uki('#Tools-NewAccount').bind('click', function() {
    ClearUI();
    LoadUI(Collate.Globals["NewAccount"], null);
});

//
// Now load the dashboard.
//
ClearUI();
LoadUI(Collate.Globals["Dashboard"], null);
