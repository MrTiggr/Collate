//
// Setup how the page looks.
//
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
          handlePosition: 300, leftMin: 200, rightMin: 300,
          leftChildViews: [
            
            // List of account and search area
            
          ],
          rightChildViews: [
            
            // List of transactions for account + other info
            
          ]
        },
    ] }
).attachTo(window, '1000 1000');

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