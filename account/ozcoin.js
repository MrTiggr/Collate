/*
 * Name:            Collate.Account.OzCoin
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  Defines the class for connecting to the OzCoin mining pool.
 *
 */

Collate.Account.OzCoin = Class.create(Collate.Account, {

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
        
        // It is okay to copy the parameters array like this; see rpc.js for
        // a full explaination to the importance of "this.settings".
        this.settings = parameters;
        
        this.connected = false;
        this.state = null;
        this.cachedInfo = null;
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
            url:"https://ozco.in/api.php?api_key=" + this.settings.apiKey
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
        if (xhr != null && xhr.responseText != "")
        {
            this.cachedInfo = JSON.parse(xhr.responseText);
            
            // Cause the backend to refresh the total balance.
            Backend.refreshBalance();
            
            // Only access the UI if it actually exists.
            if (uki)
            {
                // Generate dashboard.
                this.generateDashboard();
                
                // Update the sidebar.
                this.updateSidebar();
            }
        }
        
        // (Re)start a new XMLHttpRequest.
        var call = new XMLHttpRequest();
        var me = this;
        call.open("GET", this.state.url);
        call.onreadystatechange = function() 
        {
            if (call.readyState == 4)
                me.onRequest(call);
        };
        if (this.cachedInfo == null)
            call.send();
        else
        {
            window.setTimeout(function ()
            {
                call.send();
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
        this.cachedInfo = null;
        return true;
    },
    
    // <summary>
    // Update all the sidebar statistics.
    // </summary>
    updateSidebar: function()
    {
        // Check to see if we should show "Error" in the sidebar.
        if (this.cachedInfo != null && this.cachedInfo["hashrate"] == null)
        {
            Backend.getFrontend().setPageStatus(this, null, "ERROR");
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", null);
            return;
        }
        
        // Set the balance in the sidebar.
        if (this.cachedInfo == null || parseFloat(this.cachedInfo["hashrate"]) == 0)
            Backend.getFrontend().setPageStatus(this, null, null);
        else
            Backend.getFrontend().setPageStatus(this, null, "&#x0E3F " + parseFloat(this.cachedInfo["confirmed_rewards"]).toFixed(2));
        
        // Set mining information in the sidebar.
        if (this.cachedInfo == null || parseFloat(this.cachedInfo["hashrate"]) == 0)
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", null);
        else if (parseFloat(this.cachedInfo["hashrate"]) >= 1000)
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", (parseFloat(this.cachedInfo["hashrate"]) / 1000).toFixed(2) + " Gh/s");
        else
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", parseFloat(this.cachedInfo["hashrate"]).toFixed(2) + " Mh/s");
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
                    text: "Visit OzCoin",
                    width: 100,
                    onClick: function()
                    {
                        window.open("https://ozco.in/");
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
        return ["Mining (Generation)"];
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
            case "Mining (Generation)":
                // Create the status dashboard.
                attach(uki(
                    { view: 'Box', rect: '0 0 1000 1000', anchors: 'top left right width', childViews: [
                
                        { view: 'Label', rect: '208 70 600 0', anchors: 'top', text: this.name, style: { fontSize: '20px' } },
                        { view: 'Label', rect: '208 70 580 0', anchors: 'top', id: this.uiid + '-Mining-HashRate', textSelectable: true, html: '_ Mhashes/sec', style: { fontSize: '20px', textAlign: 'right' } },
                
                        // Main area
                        { view: 'Box', rect: '200 100 600 300', anchors: 'top', id: this.uiid + '-Mining-BorderBox', childViews: [
                            { view: 'Label', rect: '10 10 580 280', anchors: 'left top', id: this.uiid + '-Mining-Status', textSelectable: true, multiline: true,  text: 'Loading information...' }
                        ] }
                        
                    ] }
                ));
                
                // Now modify and attach events to the elements.
                var me = this;
                uki('#' + this.uiid + '-Mining-BorderBox').dom().style.border = 'solid 1px #CCC';
                uki('#' + this.uiid + '-Mining-BorderBox').dom().style.borderRadius = '15px';
                uki('#' + this.uiid + '-Mining-Status').dom().style.lineHeight = '20px';
                
                // Generate dashboard.
                this.generateDashboard();
                
                break;
               
            default:
                return null;
        }
        
        // Update the sidebar.
        this.updateSidebar();
    },
    
    // <summary>
    // Regenerates the information for the dashboard.
    // </summary>
    generateDashboard: function($super)
    {
        if (!uki) return;
        
        if (this.cachedInfo != null)
        {
            if (this.cachedInfo["hashrate"] == null)
            {
                // Invalid API key.
                uki('#' + this.uiid + '-Mining-HashRate').html("");
                uki('#' + this.uiid + '-Mining-Status').html("The API key you specified is not valid.  You can edit this account by clicking on the main dashboard and selecting 'Edit Accounts'.");
                return;
            }
            
            var text = "You are currently contributing " + parseFloat(this.cachedInfo["hashrate"]).toFixed(2) + " Mh/s to the pool.<br/>";
            text += "<br/>";
            text += "You have currently earnt &#x0E3F " + parseFloat(this.cachedInfo["confirmed_rewards"]).toFixed(2) + " through mining with OzCoin, excluding payouts.  You can withdraw coins via the <a href='http://ozco.in/'>OzCoin website</a>.<br/>";
            text += "<br/>";
            text += "The above statistics are updated every 10 minutes.";
            uki('#' + this.uiid + '-Mining-HashRate').html(parseFloat(this.cachedInfo["hashrate"]).toFixed(2) + " Mhashes/sec");
            uki('#' + this.uiid + '-Mining-Status').html(text);
        }
        else
        {
            uki('#' + this.uiid + '-Mining-HashRate').html("_ Mhashes/sec");
            uki('#' + this.uiid + '-Mining-Status').text("Loading information...");
        }
    },
    
    // <summary>
    // Returns the current balance of the account.
    // </summary>
    getBalance: function($super)
    {
        // If this returns null, it means there's no value yet.
        if (this.cachedInfo == null) return null;
        return this.cachedInfo["confirmed_rewards"];
    }
    
});

// <summary>
// The account type name (to be shown in the New Account wizard).
// </summary>
Collate.Account.OzCoin.Name = "OzCoin (Mining Pool)";

// <summary>
// The account type description (to be shown in the New Account wizard).
// </summary>
Collate.Account.OzCoin.Description = "<i>Connects to the OzCoin mining pool and shows information about your account.</i><br/><br/>Retrieves information from the OzCoin servers about your account information, such as the current contributing hashrate and your current earnings.  This plugin does not perform any BitCoin mining of it's own.<br/><br/>Your API key can be found under 'Account Settings' at the <a href='http://ozco.in/'>OzCoin website</a>.";

// <summary>
// The account parameter list.
// </summary>
Collate.Account.OzCoin.Parameters = [
    { type: 'Text', name: 'apiKey', text: 'API Key', default: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }
];