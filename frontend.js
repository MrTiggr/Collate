//
// Setup variables.
//
Collate.UI = {
        Data: {
            Global: {}
        }
    };
Collate.User = {
        Accounts: {}
    };

//
// Setup some initial accounts.
//
Collate.User.Accounts["Local Bitcoin Server"] = new Collate.Account.RPC("localhost", 9001, "jrhodes", "pass");
Collate.User.Accounts["Local Bitcoin Server"].connect();

//
// Define the structures for the sidebar.
//
Collate.UI.Data.Global.AllAccounts = [
    { data: 'Dashboard' },
    { data: 'Transactions sent' },
    { data: 'Transactions received' },
    { data: 'Blocks generated' }
];
Collate.UI.Data.Global.IndividualWallets = [
];
for (var i in Collate.User.Accounts)
{
    var items = Collate.User.Accounts[i].getMenu();
    var d = [];    
    for (var a in items)
    {
        if (typeof(items[a]) == "string")
            d[d.length] = { data: items[a] };
    }
    Collate.UI.Data.Global.IndividualWallets[Collate.UI.Data.Global.IndividualWallets.length] = {
        data: i,
        children: d,
        __opened: true
    }
}


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
            { view: 'Button', rect: '10 10 170 24', anchors: 'left top', id: 'Tools-GetAccountBalance', text: 'Get Account Balance'},
            
        ] },
        
        // Horizontally split area
        { view: 'HSplitPane', rect: '0 45 1000 9956', anchors: 'top left right width bottom height',
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

//'position: absolute; z-index: 100; font-size: 11px; -webkit-user-select: none; cursor: default; color: rgb(113, 129, 147); left: 0px; top: 0px; right: 0px; height: 20px; font-weight: bold; text-shadow: rgba(255, 255, 255, 0.796875) 0px 1px 0px;'

//
// Attach event handlers.
//
uki('#Tools-GetAccountBalance').bind('click', function() {
    
    // TODO: These event handlers should strictly just call
    //       functions in prototype-based classes.
    var acc = new Collate.Account.RPC("localhost", 9001, "jrhodes", "pass");
    acc.connect();

    var check = function()
    {
        if (acc.getBalance() == null)
            window.setTimeout(check, 100);
        else
        {
            alert(acc.getBalance());
            acc.disconnect();
        }
    }

    window.setTimeout(check, 100);
    
});