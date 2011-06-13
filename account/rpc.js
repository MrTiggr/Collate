/*
 * Name:            Collate.Account.RPC
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  Defines the class for connecting to a pure BitCoin server over
 *  the JSON-RPC service it provides.
 *
 */

const RPC_STATE_GETINFO = 0;
const RPC_STATE_LISTTRANSACTIONS = 1;

Collate.Account.RPC = Class.create(Collate.Account, {

    // <summary>
    // Initializes an RPC-based account, such as a connection to a local or remote
    // BitCoin server.
    // </summary>
    // <param name="name">The name of this account as it appears in Collate.</param>
    // <param name="parameters">The custom settings applicable to this account.</param>
    initialize: function(name, parameters)
    {
        this.name = name;
        this.uiid = null;
        this.settings = {
            host: parameters.host || "localhost",
            port: parameters.port || "8332",
            username: parameters.username || "user",
            password: parameters.password || "pass"
            };
        this.connected = false;
        this.state = null;
        this.cachedInfo = null;
        this.cachedBalance = null;
        this.cachedTransactions = null;
        this.miningChanging = false;
    },
    
    // <summary>
    // Connects to the RPC-based server.
    // </summary>
    connect: function($super)
    {
        // Check to see if we are already connected.
        if (this.connected)
            return true;
        
        // Construct the URL.
        this.state = {
            url:"http://" + this.settings.host + ":" + this.settings.port + "/",
            request: [ 
                {  // RPC_STATE_GETINFO
                    jsonrpc: 1.0,
                    id: 1,
                    method: "getinfo",
                    params: []
                },
                { // RPC_STATE_LISTTRANSACTIONS
                    jsonrpc: 1.0,
                    id: 1,
                    method: "listtransactions",
                    params: []
                } ]
            };
        
        // We are now connected (the onRequest won't fire correctly unless
        // we set this to true first).
        this.connected = true;
        
        // Call the callback with the xhr set to null; this will indicate that
        // we're just going to start a request rather than handling an existing
        // one.
        this.onRequest(null, RPC_STATE_LISTTRANSACTIONS);
        return true;
    },
    
    // <summary>
    // Callback function for handling the XMLHttpRequest events.
    // </summary>
    onRequest: function($super, xhr, state)
    {
        // See if we have disconnected and don't need to do anything.
        if (!this.connected)
            return;
        
        // Handle the XMLHttpRequest if there is one.
        if (xhr != null && xhr.responseText != "")
        {
            switch (state)
            {
                case RPC_STATE_LISTTRANSACTIONS:
                    this.cachedTransactions = JSON.parse(xhr.responseText)["result"].reverse();
                    this.cachedBalance = 0;
                    for (var i = 0; i < this.cachedTransactions.length; i += 1)
                        this.cachedBalance += this.cachedTransactions[i]["amount"];
                    
                    // Skip the next part if we can't update the UI.
                    if (!uki) break;
                    
                    // Generate list of transactions.
                    this.generateTransactionList();
                    break;
                case RPC_STATE_GETINFO:
                    this.cachedInfo = JSON.parse(xhr.responseText)["result"];
                    
                    // Skip the next part if we can't update the UI.
                    if (!uki) break;
                    
                    // Generate wallet dashboard.
                    this.generateWalletDashboard();
                    
                    // Generate mining dashboard.
                    this.generateMiningDashboard();
                    
                    // Set the balance in the sidebar.
                    if (this.cachedInfo == null)
                        Backend.getFrontend().setPageStatus(this, null, null);
                    else
                        Backend.getFrontend().setPageStatus(this, null, "&#x0E3F " + this.cachedInfo["balance"].toFixed(2));
                    
                    // Set the mining information in the sidebar.
                    if (this.cachedInfo == null || !this.cachedInfo["generate"])
                        Backend.getFrontend().setPageStatus(this, "Mining (Generation)", null);
                    else
                        Backend.getFrontend().setPageStatus(this, "Mining (Generation)", (this.cachedInfo["hashespersec"] / 1024 / 1024).toFixed(2) + " Mh/s");
                    
                    break;
            }
        }
        
        // Increment the state.
        state += 1;
        if (state == this.state.request.length)
            state = 0;
        
        // (Re)start a new XMLHttpRequest.
        var call = new XMLHttpRequest();
        var me = this;
        call.open("POST", this.state.url, true, this.settings.username, this.settings.password);
        call.onreadystatechange = function() 
        {
            if (call.readyState == 4)
                me.onRequest(call, state);
        };
        call.send(JSON.stringify(this.state.request[state]));
    },
    
    // <summary>
    // Sends a command to the server indicating whether or not it
    // should be generating coins.
    // </summary>
    toggleGenerate: function(generate)
    {
        var call = new XMLHttpRequest();
        var me = this;
        call.open("POST", this.state.url, true, this.settings.username, this.settings.password);
        call.onreadystatechange = function() 
        {
            // Turn off the mining changing state.
            me.miningChanging = false;
        };
        call.send(JSON.stringify(
            { // RPC_STATE_SETGENERATE
                jsonrpc: 1.0,
                id: 1,
                method: "setgenerate",
                params: [generate]
            }
        ));
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
    // Requests a list of toolbar items to show at the top of the screen while
    // this account is in the active window.
    // </summary>
    getToolbar: function()
    {
        // Return the relevant toolbar items for the dashboard.
        return [
                {
                    text: "Send Coins",
                    width: 100,
                    target: this,
                    page: "Send Coins"
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
        return ["Transactions", "Mining (Generation)"];
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
                        { view: 'Label', rect: '208 70 580 0', anchors: 'top', id: this.uiid + '-Dashboard-Balance', html: '&#x0E3F _.__', style: { fontSize: '20px', textAlign: 'right' } },
                
                        // Main area
                        { view: 'Box', rect: '200 100 600 300', anchors: 'top', id: this.uiid + '-Dashboard-BorderBox', childViews: [
                            { view: 'Label', rect: '10 10 580 280', anchors: 'left top', id: this.uiid + '-Dashboard-Status', multiline: true,  text: 'Loading information...' },
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
                        { view: 'table.Column', label: 'Status', width: 130 },
                        { view: 'table.Column', label: 'Date', width: 130 },
                        { view: 'table.Column', label: 'Description', resizable: true, width: 500 },
                        { view: 'table.NumberColumn', label: 'Debit', resizable: true, minWidth: 100, width: 120 },
                        { view: 'table.NumberColumn', label: 'Credit', resizable: true, minWidth: 100, width: 120 },
                    ] }
                ));
                
                // Generate list of transactions.
                this.generateTransactionList();
                
                break;
                
            case "Mining (Generation)":
                // Create the mining generation.
                attach(uki(
                    { view: 'Box', rect: '0 0 1000 1000', anchors: 'top left right width', childViews: [
                
                        { view: 'Label', rect: '208 70 600 0', anchors: 'top', text: this.name + " (Mining)", style: { fontSize: '20px' } },
                        { view: 'Label', rect: '208 70 580 0', anchors: 'top', id: this.uiid + '-Mining-HashRate', html: '_ Mhashes/sec', style: { fontSize: '20px', textAlign: 'right' } },
                
                        // Main area
                        { view: 'Box', rect: '200 100 600 300', anchors: 'top', id: this.uiid + '-Mining-BorderBox', childViews: [
                            { view: 'Label', rect: '10 10 580 280', anchors: 'left top', id: this.uiid + '-Mining-Status', multiline: true,  text: 'Loading information...' },
                            { view: 'Button', rect: '490 265 100 24', anchors: 'bottom right', id: this.uiid + '-Mining-Toggle', text: '...' },
                        ] }
                        
                    ] }
                ));
                
                // Now modify and attach events to the elements.
                var me = this;
                uki('#' + this.uiid + '-Mining-BorderBox').dom().style.border = 'solid 1px #CCC';
                uki('#' + this.uiid + '-Mining-BorderBox').dom().style.borderRadius = '15px';
                uki('#' + this.uiid + '-Mining-Status').dom().style.lineHeight = '20px';
                uki('#' + this.uiid + '-Mining-Toggle').bind('click', function()
                {
                    if (me.cachedInfo == null) return;
                    me.miningChanging = true;
                    Backend.getFrontend().setPageStatus(this, "Mining (Generation)", "...");
                    
                    me.toggleGenerate(!me.cachedInfo["generate"]);
                });
                
                // Generate mining dashboard.
                this.generateMiningDashboard();
                
                break;
                
            default:
                return null;
        }
        
        // Set the balance in the sidebar.
        if (this.cachedInfo == null)
            Backend.getFrontend().setPageStatus(this, null, null);
        else
            Backend.getFrontend().setPageStatus(this, null, "&#x0E3F " + this.cachedInfo["balance"].toFixed(2));
        
        // Set the mining information in the sidebar.
        if (this.cachedInfo == null || !this.cachedInfo["generate"])
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", null);
        else
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", (this.cachedInfo["hashespersec"] / 1024 / 1024).toFixed(2) + " Mh/s");
    },
    
    formatDate: function($super, date)
    {
        // Temporary padding function.
        var padl = function(padString, length, str)
        {
            str = "" + str;
            while (str.length < length) str = padString + str;
            return str;
        }
        
        // Work out how to represent hours and other date elements.
        var d = new Date(date * 1000);
        var hrs = d.getHours();
        var ampm = "am";
        if (hrs == 0) { hrs = 12; ampm = "am"; }
        else if (hrs > 0 && hrs < 12) { hrs += 0; ampm = "am"; }
        else { hrs -= 12; ampm = "pm"; }
        
        // Return the constructed string.
        return d.getDate() + "/" +
               padl("0", 2, d.getMonth()) + "/" +
               d.getFullYear() + " " +
               padl(" ", 2, hrs) + ":" +
               padl("0", 2, d.getMinutes()) + ampm;
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
            var ds = this.formatDate(p["time"]);
            if (p["amount"] < 0)
                opts[opts.length] = [ p["confirmations"] + " confirmations", ds, p["address"], (-p["amount"] - p["fee"]).toFixed(2), null ];
            else
                opts[opts.length] = [ p["confirmations"] + " confirmations", ds, p["address"], null, p["amount"].toFixed(2) ];
        }
        table.data(opts);
        if (selectedIndex != -1)
            table.selectedIndex(selectedIndex + (table.data().length - previousLength));
    },
    
    // <summary>
    // Regenerates the wallet information for the dashboard.
    // </summary>
    generateWalletDashboard: function($super)
    {
        if (!uki) return;
        
        if (this.cachedInfo != null)
        {
            var verString = "" + this.cachedInfo["version"];
            var text = "Version: " + verString[0] + "." + verString[1] + verString[2] + "<br/>";
            text += "Blocks: " + this.cachedInfo["blocks"] + "<br/>";
            text += "Connections: " + this.cachedInfo["connections"] + "<br/>";
            uki('#' + this.uiid + '-Dashboard-Status').html(text);
            uki('#' + this.uiid + '-Dashboard-Balance').html("&#x0E3F " + this.cachedInfo["balance"].toFixed(2));
        }
        else
        {
            uki('#' + this.uiid + '-Dashboard-Status').text("Loading information...");
            uki('#' + this.uiid + '-Dashboard-Balance').html("&#x0E3F _.__");
        }
    },
    
    // <summary>
    // Regenerates the mining information for the dashboard.
    // </summary>
    generateMiningDashboard: function($super)
    {
        if (!uki) return;
        
        if (this.cachedInfo != null)
        {
            var text = null;
            if (this.cachedInfo["generate"])
            {
                text  = "This server is mining for blocks using the CPU.<br/>";
                text += "<br/>";
                //text += "At a difficulty of " + this.cachedInfo["difficulty"].toFixed(2) + ", it is estimated that it will take</br>";
                //text += "<strong>106 days, 4 hours, 23 minutes</strong><br/>";
                //text += "before this miner finds a block.<br/>";
                //text += "<br/>";
                text += "You can stop mining by clicking the 'Stop Mining' button below.";
                uki('#' + this.uiid + '-Mining-HashRate').html((this.cachedInfo["hashespersec"] / 1024 / 1024).toFixed(2) + " Mhashes/sec");
                uki('#' + this.uiid + '-Mining-Toggle').text('Stop Mining');
                uki('#' + this.uiid + '-Mining-Toggle').visible(true);
            }
            else if (this.miningChanging)
            {
                text = "This server is currently changing the mining status.  This can take up to a minute.";
                uki('#' + this.uiid + '-Mining-HashRate').html("");
                uki('#' + this.uiid + '-Mining-Toggle').visible(false);
            }
            else
            {
                text = "This server is currently not mining.  You can start mining by clicking the 'Start Mining' button below.";
                uki('#' + this.uiid + '-Mining-HashRate').html("");
                uki('#' + this.uiid + '-Mining-Toggle').text('Start Mining');
                uki('#' + this.uiid + '-Mining-Toggle').visible(true);
            }
            uki('#' + this.uiid + '-Mining-Status').html(text);
        }
        else
        {
            uki('#' + this.uiid + '-Mining-Status').text("Loading information...");
            uki('#' + this.uiid + '-Mining-HashRate').html("_ Mhashes/sec");
            uki('#' + this.uiid + '-Mining-Toggle').text('...');
        }
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
Collate.Account.RPC.Name = "Local Server (RPC)";

// <summary>
// The account type description (to be shown in the New Account wizard).
// </summary>
Collate.Account.RPC.Description = "<i>Connects to a BitCoin server running on your local machine via RPC.</i><br/><br/>If you are running the BitCoin client on your machine and want to be able to send BitCoins and view transactions from within your browser, this is the account type to select.  Please ensure that you do not have two Local Server Accounts connecting to the same BitCoin client, or the available BitCoin balance will be incorrect.";

// <summary>
// The account parameter list.
// </summary>
Collate.Account.RPC.Parameters = [
    { type: 'Text', name: 'host', text: 'Hostname', default: 'localhost' },
    { type: 'Text', name: 'port', text: 'Port', default: '8332' },
    { type: 'Text', name: 'username', text: 'Username', default: 'user' },
    { type: 'Text', name: 'password', text: 'Password', default: 'pass' },
];