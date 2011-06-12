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

Collate.Account.RPC = Class.create(Collate.Account, {

    // <summary>
    // Initalizes an RPC-based account, such as a connection to a local or remote
    // BitCoin server.
    // </summary>
    initialize: function(parameters)
    {
        this.settings = {
            host: parameters.host || "localhost",
            port: parameters.port || "8332",
            username: parameters.username || "user",
            password: parameters.password || "pass"
            };
        this.connected = false;
        this.state = null;
        this.cachedBalance = null;
        this.cachedTransactions = null;
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
            request: {
                jsonrpc: 1.0,
                id: 1,
                method: "listtransactions",
                params: []
                }
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
            this.cachedTransactions = JSON.parse(xhr.responseText)["result"].reverse();
            this.cachedBalance = 0;
            for (var i = 0; i < this.cachedTransactions.length; i += 1)
                this.cachedBalance += this.cachedTransactions[i]["amount"];
            
            // Generate list of transactions.
            this.generateTransactionList();
        }
        
        // (Re)start a new XMLHttpRequest.
        var call = new XMLHttpRequest();
        var ref = this;
        call.open("POST", this.state.url, true, this.settings.username, this.settings.password);
        call.onreadystatechange = function() 
        {
            if (call.readyState == 4)
                ref.onRequest(call);
        };
        call.send(JSON.stringify(this.state.request));
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
        this.cachedTransactions = null;
        return true;
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
    getUI: function(attach, page)
    {
        if (!this.connected)
            this.connect();
        
        switch (page)
        {
            case null:
            case "Transactions":
                // Create transactions table.
                attach(uki(
                    { view: 'Table', rect: '0 0 1000 1000', minSize: '0 200', id: 'Table-Transactions',
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
                
            default:
                return null;
        }
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
        var table = uki('#Table-Transactions');
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