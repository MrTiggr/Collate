/*
 * Name:              Collate.Account.BTCGuild
 * Author:            James Rhodes
 * Author(modified):  Rob McFadzean
 * License:           MIT License
 *
 * Description:
 *  The class for connecting to and retrieving stats from the BTCGuild pooled mining effort.
 *
 */

Collate.Account.BTCGuild = Class.create(Collate.Account, {

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
        this.totalHashRate = 0.00;
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
            url:"https://www.btcguild.com/api.php?api_key=" + this.settings.apiKey
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
            
            // Make sure we reset the total hashrate...
            this.totalHashRate = 0.00;
            for (worker in this.cachedInfo["workers"]) {
                this.totalHashRate = this.totalHashRate + this.cachedInfo["workers"][worker]["hash_rate"];
            }

            // Only access the UI if it actually exists.
            if (uki)
            {
                // Generate dashboard.
                this.generateDashboard();
                
                // Update the sidebar.
                this.updateSidebar();
                
                // Cause the backend to refresh the total balance.
                Backend.refreshBalance();
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
        if (this.cachedInfo != null && this.cachedInfo["user"] == null)
        {
            Backend.getFrontend().setPageStatus(this, null, "ERROR");
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", null);
            return;
        }
        
        // Set the balance in the sidebar.
        if (this.cachedInfo == null || parseFloat(this.totalHashRate) == 0)
            Backend.getFrontend().setPageStatus(this, null, null);
        else
            Backend.getFrontend().setPageStatus(this, null, "&#x0E3F " + this.cachedInfo["user"]["confirmed_rewards"]);
        
        // Set mining information in the sidebar.
        if (this.cachedInfo == null || parseFloat(this.totalHashRate) == 0)
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", null);
        else if (parseFloat(this.totalHashRate) >= 1000)
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", (parseFloat(this.totalHashRate) / 1000).toFixed(2) + " Gh/s");
        else
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", parseFloat(this.totalHashRate).toFixed(2) + " Mh/s");
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
                    text: "Visit BTCGuild",
                    width: 100,
                    onClick: function()
                    {
                        window.open("https://btcguild.com/");
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
            if (this.cachedInfo["user"] == null)
            {
                // Invalid API key.
                uki('#' + this.uiid + '-Mining-HashRate').html("");
                uki('#' + this.uiid + '-Mining-Status').html("The API key you specified is not valid.  You can edit this account by clicking on the main dashboard and selecting 'Edit Accounts'.");                return;
                return;
            }

            var text = "You are currently contributing " + this.convertHash(this.totalHashRate) + " to the pool.<br/>";
            text += "<hr /><strong>Your rewards</strong>";
            text += "<br />Total previous payouts: &#x0E3F " + this.cachedInfo["user"]["payouts"];
            text += "<br />Confirmed rewards: &#x0E3F " + this.cachedInfo["user"]["confirmed_rewards"];
            text += "<br />Unconfirmed rewards: &#x0E3F " + this.cachedInfo["user"]["unconfirmed_rewards"];
            text += "<br />Estimated rewards: &#x0E3F " + this.cachedInfo["user"]["estimated_rewards"];

            text += "<hr /><strong>BTCGuild Info</strong>:";
            text += "<br />Total hashrate: " + this.convertHash(this.cachedInfo["pool"]["hash_rate"]);
            text += "<br />Total active workers: " + this.cachedInfo["pool"]["active_workers"];
            text += "<br />Round time: " + this.cachedInfo["pool"]["round_time"];

            text += "<hr />The above statistics are updated every 10 minutes.";
            uki('#' + this.uiid + '-Mining-HashRate').html(this.convertHash(this.totalHashRate));
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
        if (this.cachedInfo == null) return null;
        return this.cachedInfo["confirmed_rewards"];
    },

    // <summary>
    // Returns a nicer (formated) hash including the suffix MHash or GHash
    // </summary>
    convertHash: function($super,hash_rate)
    {
        decimalPlace = 2;

        if (hash_rate >= 1000) {
            return (parseFloat(hash_rate)/1000).toFixed(decimalPlace) + " GHash/s";
        } else {
            return parseFloat(hash_rate).toFixed(decimalPlace) + " MHash/s";
        }
    }
    
});

// <summary>
// The account type name (to be shown in the New Account wizard).
// </summary>
Collate.Account.BTCGuild.Name = "BTC Guild (Mining Pool)";

// <summary>
// The account type description (to be shown in the New Account wizard).
// </summary>
Collate.Account.BTCGuild.Description = "<i>0% Fee Bitcoin Mining Pool.</i><br /><br />BTCGuild is a pooled mining effort with a 0% fee. You can, however, donate a percentile of your efforts for a variety of perks.<br /><br />BTCGuild has several different interconnected pool locations ensuring the best latency and performance for your location.<hr />Your API key can be found <a href='https://www.btcguild.com/my_api.php'>here</a>.";

// <summary>
// The account parameter list.
// </summary>
Collate.Account.BTCGuild.Parameters = [
    { type: 'Text', name: 'apiKey', text: 'API Key', default: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }
];