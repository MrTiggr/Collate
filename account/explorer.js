/*
 * Name:            Collate.Account.Explorer
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  Defines the class for connecting to the Block Explorer for a
 *  safe way to view your transactions without running the BitCoin
 *  server.
 *
 */

Collate.Account.Explorer = Class.create(Collate.Account, {

    // <summary>
    // Initializes a block explorer-based account, allowing the user to view their
    // estimated balance without running the server.
    // </summary>
    // <param name="name">The name of this account as it appears in Collate.</param>
    // <param name="parameters">The custom settings applicable to this account.</param>
    initialize: function(name, parameters)
    {
        this.name = name;
        this.uiid = null;
        
        // Copy the parameters to the settings variable.
        this.settings = {
            address: parameters.address || "1Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            };
        
        this.connected = false;
        this.state = null;
        this.cachedInfo = null;
        this.cachedBalance = null;
        this.cachedTransactions = null;
        this.hasError = false;
    },
    
    // <summary>
    // Connects to the Block Explorer.
    // </summary>
    connect: function($super)
    {
        // Check to see if we are already connected.
        if (this.connected)
            return true;
        
        // Construct the URL.
        this.state = {
            url:"http://blockexplorer.com/q/mytransactions/" + this.settings.address,
            };
        
        // We are now connected (the onRequest won't fire correctly unless
        // we set this to true first).
        this.connected = true;
        
        // Call the callback with the xhr set to null; this will indicate that
        // we're just going to start a request rather than handling an existing
        // one.
        this.onRequest(null);
        return true;
    },
    
    // <summary>
    // Callback for when the frontend has loaded and is ready to accept
    // requests to set statuses on the sidebar.  
    // </summary>
    onFrontendLoad: function()
    {
        // Update the sidebar.
        this.updateSidebar();
    },
    
    // <summary>
    // Callback function for handling the XMLHttpRequest events.
    // </summary>
    onRequest: function($super, xhr)
    {
        // See if we have disconnected and don't need to do anything.
        if (!this.connected)
            return;
        
        // Handle the XMLHttpRequest if there is one.
        if (xhr != null)
        {
            this.hasError = false;
            if (xhr.status != 200 || xhr.responseText == "" || xhr.responseText.substring(0, 5) == "ERROR" || JSON.parse(xhr.responseText)["error"] != null)
            {
                // Some kind of error.
                this.hasError = true;
                if (uki)
                {
                    // Update the sidebar.
                    this.updateSidebar();
                            
                    // Generate wallet dashboard.
                    this.generateWalletDashboard();
                    
                    // Generate list of transactions.
                    this.generateTransactionList();
                }
            }
            else
            {
                this.cachedInfo = JSON.parse(xhr.responseText);
                
                // Calculate the balance and the transactions in the account
                // as the raw information isn't easily usable.
                this.cachedBalance = 0;
                this.cachedTransactions = [];
                for (var id in this.cachedInfo)
                {
                    var a = this.cachedInfo[id];
                    
                    // Check to see whether this is a sent or received transaction.
                    if (a["in"][0]["address"] == this.settings.address)
                    {
                        // Calculate the total amount of coins transferred
                        // based on the ["out"] section.
                        var bT = 0;
                        for (var i = 0; i < a["out"].length; i += 1)
                            bT += parseFloat(a["out"][i]["value"]);
                        
                        // Check to see whether we have the fee information cached,
                        // or whether we have to go find it.
                        var fT = Backend.Storage.getRawItem("FeeCache-" + a["in"][0]["prev_out"]["hash"] + "-" + a["hash"]);
                        if (fT == null)
                        {
                            // We need to calculate the fee which involves making
                            // a request; add an "unknown" transaction amount to
                            // the transaction list, which we can update later.
                            this.cachedBalance -= bT;
                            this.cachedTransactions[this.cachedTransactions.length] = {
                                time: this.formatDate(a["time"]),
                                description: a["in"][0]["address"],
                                debit: "...",
                                credit: null
                            }
                            
                            // Create the XHR in it's own context so that the values
                            // b and i don't change as we evaluate the rest of the
                            // transactions.
                            var me = this;
                            var ctx = function(b, i, n, pr, cc)
                            {
                                var subcall = new XMLHttpRequest();
                                subcall.open("GET", "http://blockexplorer.com/rawtx/" + pr, true);
                                subcall.onreadystatechange = function() 
                                {
                                    if (subcall.readyState == 4)
                                    {
                                        // Get the fee information.
                                        var fI = JSON.parse(subcall.responseText);
                                        
                                        // Calculate fee.
                                        var fA = fI["out"][n]["value"] - b;
                                        
                                        // Complete the adjustment and update the actual
                                        // cached transaction information.
                                        me.cachedBalance -= fA;
                                        me.cachedTransactions[i]["debit"] = (b + fA).toFixed(2);
                                        
                                        // Save the information to the cache.
                                        Backend.Storage.setRawItem(cc, fA);
                                        
                                        // Cause the backend to refresh the total balance.
                                        Backend.refreshBalance();
                                        
                                        // Skip the next part if we can't update the UI.
                                        if (uki)
                                        {
                                            // Update the sidebar.
                                            me.updateSidebar();
                                            
                                            // Generate wallet dashboard.
                                            me.generateWalletDashboard();
                                            
                                            // Generate list of transactions.
                                            me.generateTransactionList();
                                        }
                                    }
                                };
                                subcall.send();
                            };
                            ctx(bT, this.cachedTransactions.length, a["in"][0]["prev_out"]["n"], a["in"][0]["prev_out"]["hash"], "FeeCache-" + a["in"][0]["prev_out"]["hash"] + "-" + a["hash"]);
                        }
                        else
                        {
                            // We already know the fee so we can add it right now.
                            this.cachedBalance -= (bT + fT);
                            this.cachedTransactions[this.cachedTransactions.length] = {
                                time: this.formatDate(a["time"]),
                                description: a["in"][0]["address"],
                                debit: (bT + fT).toFixed(2),
                                credit: null
                            }
                        }
                    }
                    else if (a["in"][0]["address"] == undefined)
                    {
                        // Find the amount of coins generated to this
                        // account (possibly transaction fees?).
                        var bT = 0;
                        for (var i = 0; i < a["out"].length; i += 1)
                            if (a["out"][i]["address"] == this.settings.address)
                                bT += parseFloat(a["out"][i]["value"]);
                        
                        // Create a transaction log for this receiving operation
                        // and add the amount to the cached balance.
                        this.cachedBalance += bT;
                        this.cachedTransactions[this.cachedTransactions.length] = {
                            time: this.formatDate(a["time"]),
                            description: "Generation",
                            debit: null,
                            credit: bT.toFixed(2)
                        }
                    }
                    else
                    {
                        // Find the amount of coins transferred to this
                        // account.
                        var bT = 0;
                        for (var i = 0; i < a["out"].length; i += 1)
                            if (a["out"][i]["address"] == this.settings.address)
                                bT += parseFloat(a["out"][i]["value"]);
                        
                        // Create a transaction log for this receiving operation
                        // and add the amount to the cached balance.
                        this.cachedBalance += bT;
                        this.cachedTransactions[this.cachedTransactions.length] = {
                            time: this.formatDate(a["time"]),
                            description: a["in"][0]["address"],
                            debit: null,
                            credit: bT.toFixed(2)
                        }
                    }
                }
                
                // Reverse the transaction list so that it's in the correct order.
                this.cachedTransactions = this.cachedTransactions.reverse();
                
                // Cause the backend to refresh the total balance.
                Backend.refreshBalance();
                
                // Skip the next part if we can't update the UI.
                if (uki)
                {
                    // Update the sidebar.
                    this.updateSidebar();
                    
                    // Generate wallet dashboard.
                    this.generateWalletDashboard();
                    
                    // Generate list of transactions.
                    this.generateTransactionList();
                }
            }
        }
        
        // (Re)start a new XMLHttpRequest.
        var call = new XMLHttpRequest();
        var me = this;
        call.open("GET", this.state.url, true);
        call.onreadystatechange = function() 
        {
            if (call.readyState == 4)
                me.onRequest(call);
        };
        if (this.cachedInfo == null)
            window.setTimeout(function ()
            {
                call.send();
            }, 1000);
        else
            window.setTimeout(function ()
            {
                call.send();
            }, 1000 * 60);
    },
    
    // <summary>
    // Disconnects from the appropriate service.  This should not
    // throw away the connection information, but rather be ready
    // to connect again at whim.
    // </summary>
    disconnect: function($super)
    {
        this.connected = false;
        this.state = null;
        this.cachedInfo = null;
        this.cachedBalance = null;
        this.cachedTransactions = null;
        return true;
    },
    
    // <summary>
    // Update all the sidebar statistics.
    // </summary>
    updateSidebar: function()
    {
        // Check to see if we should show "Error" in the sidebar.
        if (this.hasError)
        {
            Backend.getFrontend().setPageStatus(this, null, "ERROR");
            return;
        }
        
        // Set the balance in the sidebar.
        if (this.cachedInfo == null)
            Backend.getFrontend().setPageStatus(this, null, null);
        else
            Backend.getFrontend().setPageStatus(this, null, "&#x0E3F " + this.cachedBalance.toFixed(2));
    },
    
    // <summary>
    // Requests a list of toolbar items to show at the top of the screen while
    // this account is in the active window.
    // </summary>
    getToolbar: function()
    {
        // Return the relevant toolbar items for the dashboard.
        return [
                {
                    text: "Visit Block Explorer",
                    width: 149,
                    onClick: function()
                    {
                        window.open("http://blockexplorer.com/");
                    }
                }
            ];
    },
    
    // <summary>
    // Requests a list of subitems to show in the sidebar, or null
    // if the top-level item will be used.  In the later case, null
    // will be passed to getUI instead of one of the strings in the array.
    // </summary>
    getMenu: function()
    {
        // Return menu items.
        return ["Transactions"];
    },
    
    // <summary>
    // Requests the UKI UI to show in the main area.  You should probably
    // create this the first time it is requested, and cache it for all
    // times after that.
    // </summary>
    // <param name="attach">Call this function with the generated UKI before modifying elements.</param>
    // <param name="page">One of the menu items, or null.</param>
    getUI: function(attach, uiid, page)
    {
        if (!this.connected)
            this.connect();
        this.uiid = uiid;
        
        switch (page)
        {
            case null:
                // Create the wallet view.
                attach(uki(
                    { view: 'Box', rect: '0 0 1000 1000', anchors: 'top left right width', childViews: [
                
                        { view: 'Label', rect: '208 70 600 0', anchors: 'top', text: this.name, style: { fontSize: '20px' } },
                        { view: 'Label', rect: '208 70 580 0', anchors: 'top', id: this.uiid + '-Dashboard-Balance', textSelectable: true, html: '&#x0E3F _.__', style: { fontSize: '20px', textAlign: 'right' } },
                
                        // Main area
                        { view: 'Box', rect: '200 100 600 300', anchors: 'top', id: this.uiid + '-Dashboard-BorderBox', childViews: [
                            { view: 'Label', rect: '10 10 580 280', anchors: 'left top', id: this.uiid + '-Dashboard-Status', textSelectable: true, multiline: true,  text: 'Loading information...' },
                        ] }
                        
                    ] }
                ));
                
                // Now modify and attach events to the elements.
                uki('#' + this.uiid + '-Dashboard-BorderBox').dom().style.border = 'solid 1px #CCC';
                uki('#' + this.uiid + '-Dashboard-BorderBox').dom().style.borderRadius = '15px';
                uki('#' + this.uiid + '-Dashboard-Status').dom().style.lineHeight = '20px';
                
                // Generate wallet dashboard.
                this.generateWalletDashboard();
                
                break;
                
            case "Transactions":
                // Create transactions table.
                attach(uki(
                    { view: 'Table', rect: '0 0 1000 1000', minSize: '0 200', id: this.uiid + '-Transactions',
                      anchors: 'left top right bottom', multiselect: true, rowHeight: 21, style: {fontSize: '12px',
                      lineHeight: '14px'}, columns: [
                        { view: 'table.Column', label: 'Date', width: 130 },
                        { view: 'table.Column', label: 'Description', resizable: true, width: 500 },
                        { view: 'table.NumberColumn', label: 'Debit', resizable: true, minWidth: 100, width: 120 },
                        { view: 'table.NumberColumn', label: 'Credit', resizable: true, minWidth: 100, width: 120 },
                    ] }
                ));
                
                // Generate list of transactions.
                this.generateTransactionList();
                
                break;
                
            default:
                return null;
        }
        
        // Update the sidebar.
        this.updateSidebar();
    },
    
    formatDate: function($super, date)
    {
        // Converts the Block Explorer date format into
        // one that we display on the UI.
        var day = date.substring(8, 10);
        var month = date.substring(5, 7);
        var year = date.substring(0, 4);
        
        var hour = date.substring(11, 13);
        var minute = date.substring(14, 16);
        var second = date.substring(17, 19);
        
        // Temporary padding function.
        var padl = function(padString, length, str)
        {
            str = "" + str;
            while (str.length < length) str = padString + str;
            return str;
        }
        
        // Work out how to represent hours and other date elements.
        var ampm = "am";
        if (hour == 0) { hour = 12; ampm = "am"; }
        else if (hour > 0 && hour < 12) { hour += 0; ampm = "am"; }
        else { hour -= 12; ampm = "pm"; }
        
        // Return the constructed string.
        return day + "/" +
               month + "/" +
               year + " " +
               hour + ":" +
               minute + ampm;
    },
    
    // <summary>
    // Regenerates the wallet information for the dashboard.
    // </summary>
    generateWalletDashboard: function($super)
    {
        if (!uki) return;
        
        if (this.hasError)
        {
            uki('#' + this.uiid + '-Dashboard-Status').html("The plugin was unable to connect to the <a href='http://blockexplorer.com' target='_blank'>Block Explorer</a>.  This usually indicates the website is down for maintainance or could otherwise not be contacted.<br/><br/>It's also possible that you provided an invalid BitCoin address when creating the account; you can edit this account by clicking on the main dashboard and selecting 'Edit Accounts'.");
            uki('#' + this.uiid + '-Dashboard-Balance').html("&#x0E3F _.__");
        }
        else if (this.cachedInfo != null)
        {
            var text = "This wallet information is retrieved using the <a href='http://www.blockexplorer.com/' target='_blank'>Block Explorer</a> and hence carries a delay of up to two minutes.";
            
            uki('#' + this.uiid + '-Dashboard-Status').html(text);
            uki('#' + this.uiid + '-Dashboard-Balance').html("&#x0E3F " + this.cachedBalance.toFixed(2));
        }
        else
        {
            uki('#' + this.uiid + '-Dashboard-Status').text("Loading information...");
            uki('#' + this.uiid + '-Dashboard-Balance').html("&#x0E3F _.__");
        }
    },
    
    // <summary>
    // Regenerates the transaction list for the table.
    // </summary>
    generateTransactionList: function($super)
    {
        if (!uki) return;
        
        var table = uki('#' + this.uiid + '-Transactions');
        if (table == null || this.cachedTransactions == null) return;
        var opts = [];
        var selectedIndex = table.selectedIndex();
        var previousLength = table.data().length;
        for (var i = 0; i < this.cachedTransactions.length; i += 1)
        {
            var p = this.cachedTransactions[i];
            opts[opts.length] = [ p["time"], p["description"], p["debit"], p["credit"] ];
        }
        table.data(opts);
        if (selectedIndex != -1)
            table.selectedIndex(selectedIndex + (table.data().length - previousLength));
    },
    
    // <summary>
    // Returns the current balance of the account.
    // </summary>
    getBalance: function($super)
    {
        // If this returns null, it means there's no value yet.
        return this.cachedBalance;
    }
    
});

// <summary>
// The account type name (to be shown in the New Account wizard).
// </summary>
Collate.Account.Explorer.Name = "Block Explorer (Wallet)";

// <summary>
// The account type description (to be shown in the New Account wizard).
// </summary>
Collate.Account.Explorer.Description = "<i>Connects to the block explorer to show you transactions to and from your account in a secure manner.</i><br/><br/>Using the block explorer is the recommended method of monitoring the transactions to and from your account; you do not need to have the BitCoin server running and hence can leave your BitCoin wallet encrypted on your computer.";

// <summary>
// The account parameter list.
// </summary>
Collate.Account.Explorer.Parameters = [
    { type: 'Text', name: 'address', text: 'Address', default: '1Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }
];