/*
 * Name:            Collate.Account.MtGox
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  Defines the class for connecting to the MtGox exchange.
 *
 */

const MTGOX_STATE_GETBALANCE = 0;
const MTGOX_STATE_GETORDERS = 1;

Collate.Account.MtGox = Class.create(Collate.Account, {

    // <summary>
    // Initializes an MtGox-based account; a connection to the MtGox website.
    // </summary>
    // <param name="name">The name of this account as it appears in Collate.</param>
    // <param name="parameters">The custom settings applicable to this account.</param>
    initialize: function(name, parameters)
    {
        this.name = name;
        this.uiid = null;
        
        // It is okay to copy the parameters array like this; see rpc.js for
        // a full explaination to the importance of "this.settings".
        this.settings = parameters;
        
        this.connected = false;
        this.state = null;
        this.cachedBalance = null;
        this.cachedOrders = null;
        this.hasError = false;
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
            url:"https://mtgox.com/code/",
            request: [ 
                { // MTGOX_STATE_GETBALANCE
                    page: "getFunds.php"
                },
                { // MTGOX_STATE_GETORDERS
                    page: "getOrders.php"
                } ]
            };
        
        // We are now connected (the onRequest won't fire correctly unless
        // we set this to true first).
        this.connected = true;
        
        // Call the callback with the xhr set to null; this will indicate that
        // we're just going to start a request rather than handling an existing
        // one.
        this.onRequest(null, MTGOX_STATE_GETBALANCE);
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
    onRequest: function($super, xhr, state)
    {
        // See if we have disconnected and don't need to do anything.
        if (!this.connected)
            return;
        
        // Handle the XMLHttpRequest if there is one.
        if (xhr != null)
        {
            this.hasError = false;
            if (xhr.status != 200 || xhr.responseText == "" || JSON.parse(xhr.responseText)["error"] != null)
            {
                // Some kind of error.
                this.hasError = true;
                if (uki)
                {
                    // Update the sidebar.
                    this.updateSidebar();
                            
                    // Generate wallet dashboard.
                    this.generateWalletDashboard();
                }
            }
            else
            {
                switch (state)
                {
                    case MTGOX_STATE_GETBALANCE:
                        this.cachedBalance = parseFloat("" + JSON.parse(xhr.responseText)["btcs"]);
                        
                        // Cause the backend to refresh the total balance.
                        Backend.refreshBalance();
                        
                        // Skip the next part if we can't update the UI.
                        if (!uki) break;
                        
                        // Generate wallet dashboard.
                        this.generateWalletDashboard();
                        
                        // Update the sidebar.
                        this.updateSidebar();
                        
                        break;
                    case MTGOX_STATE_GETORDERS:
                        this.cachedOrders = JSON.parse(xhr.responseText)["orders"];
                        
                        // Skip the next part if we can't update the UI.
                        if (!uki) break;
                        
                        // Generate list of transactions.
                        this.generateOrderList();
                        
                        // Update the sidebar.
                        this.updateSidebar();
                        
                        break;
                }
            }
        }
        
        // Increment the state.
        state += 1;
        if (state == this.state.request.length)
            state = 0;
        
        // (Re)start a new XMLHttpRequest.
        var call = new XMLHttpRequest();
        var params = "name=" + encodeURIComponent(this.settings.username) + "&pass=" + encodeURIComponent(this.settings.password);
        var me = this;
        call.open("POST", this.state.url + this.state.request[state].page);
        call.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        call.onreadystatechange = function() 
        {
            if (call.readyState == 4)
                me.onRequest(call, state);
        };
        if (this.cachedBalance == null)
            call.send(params);
        else
        {
            window.setTimeout(function ()
            {
                call.send(params);
            }, 1000 * 60 /* check every minute */);
        }
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
        this.cachedBalance = null;
        this.cachedOrders = null;
        this.hasError = false;
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
        if (this.cachedBalance == null)
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
                    text: "Visit MtGox",
                    width: 100,
                    onClick: function()
                    {
                        window.open("https://mtgox.com/");
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
        return ["Open Orders"];
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
                
            case "Open Orders":
                // Create open orders table.
                attach(uki(
                    { view: 'Table', rect: '0 0 1000 1000', minSize: '0 200', id: this.uiid + '-Orders',
                      anchors: 'left top right bottom', multiselect: true, rowHeight: 21, style: {fontSize: '12px',
                      lineHeight: '14px'}, columns: [
                        { view: 'table.Column', label: 'Type', width: 130 },
                        { view: 'table.NumberColumn', label: 'Amount', width: 130 },
                        { view: 'table.NumberColumn', label: 'Price', width: 130 },
                        { view: 'table.Column', label: 'Status', width: 130 },
                        { view: 'table.Column', label: 'When Placed', width: 130 },
                    ] }
                ));
                
                // Generate list of transactions.
                this.generateOrderList();
                
                break;
                
            default:
                return null;
        }
        
        // Update the sidebar.
        this.updateSidebar();
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
        else if (hrs == 12) { hrs = 12; ampm = "pm"; }
        else { hrs -= 12; ampm = "pm"; }
        
        // Return the constructed string.
        return d.getDate() + "/" +
               padl("0", 2, d.getMonth()) + "/" +
               d.getFullYear() + " " +
               padl(" ", 2, hrs) + ":" +
               padl("0", 2, d.getMinutes()) + ampm;
    },
    
    // <summary>
    // Regenerates the wallet information for the dashboard.
    // </summary>
    generateWalletDashboard: function($super)
    {
        if (!uki) return;
        
        if (this.hasError)
        {
            uki('#' + this.uiid + '-Dashboard-Status').html("The plugin was unable to connect to the MtGox server.  Ensure that the username and password are correct.  You can edit this account by clicking on the main dashboard and selecting 'Edit Accounts'.");
            uki('#' + this.uiid + '-Dashboard-Balance').html("&#x0E3F _.__");
        }
        else if (this.cachedBalance != null)
        {
            uki('#' + this.uiid + '-Dashboard-Status').html("The plugin is correctly configured to interact with the MtGox server.");
            uki('#' + this.uiid + '-Dashboard-Balance').html("&#x0E3F " + this.cachedBalance.toFixed(2));
        }
        else
        {
            uki('#' + this.uiid + '-Dashboard-Status').text("Loading information...");
            uki('#' + this.uiid + '-Dashboard-Balance').html("&#x0E3F _.__");
        }
    },
    
    // <summary>
    // Regenerates the open orders for the table.
    // </summary>
    generateOrderList: function($super)
    {
        if (!uki) return;
        
        var table = uki('#' + this.uiid + '-Orders');
        if (table == null || this.cachedOrders == null) return;
        var opts = [];
        var selectedIndex = table.selectedIndex();
        var previousLength = table.data().length;
        for (var i = 0; i < this.cachedOrders.length; i += 1)
        {
            var p = this.cachedOrders[i];
            var type = "Unknown";
            switch (p["type"])
            {
                case 1:
                    type = "Selling";
                    break;
                case 2:
                    type = "Buying";
                    break;
            }
            
            opts[opts.length] = [
                type,
                parseFloat(p["amount"]).toFixed(4) + " " + p["item"],
                parseFloat(p["price"]).toFixed(4) + " " + p["currency"],
                p["real_status"].charAt(0).toUpperCase() + p["real_status"].slice(1),
                this.formatDate(p["date"])
            ];
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
        if (this.cachedBalance == null) return null;
        return parseFloat(this.cachedBalance);
    }
    
});

// <summary>
// The account type name (to be shown in the New Account wizard).
// </summary>
Collate.Account.MtGox.Name = "MtGox (Trading)";

// <summary>
// The account type description (to be shown in the New Account wizard).
// </summary>
Collate.Account.MtGox.Description = "<i>Connects to the MtGox server with the specified username and password.</i><br/><br/>Allows you to perform and set trades through the Collate interface on the MtGox exchange.  This plugin also provides analytical and realtime tools to evaluate the market as it changes.";

// <summary>
// The account parameter list.
// </summary>
Collate.Account.MtGox.Parameters = [
    { type: 'Text', name: 'username', text: 'Username', default: 'user' },
    { type: 'Password', name: 'password', text: 'Password', default: 'pass' },
];