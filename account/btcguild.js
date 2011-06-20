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
    // Initializes a BTCGuild account.
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
        this.cachedRate = 0.00;
        this.hasError = false;
    },
    
    // <summary>
    // Connects to the BTCGuild sever.
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
        this.updateSidebar();
    },
    
    // <summary>
    // Callback function for handling the XMLHttpRequest events.
    // </summary>
    onRequest: function($super, xhr)
    {
        if (!this.connected)
            return;
        
        if (xhr != null)
        {
            this.hasError = false;
            if (xhr.status != 200 || xhr.responseText == "")
            {
                // Some kind of error.
                this.hasError = true;
                if (uki)
                {
                    // Update the sidebar.
                    this.updateSidebar();
                    
                    // Generate dashboard.
                    this.generateDashboard();
                    
                    // Generate worker dashboard.
                    this.generateWorkerDashboard();
                    
                    // Generate global info dashboard.
                    this.generateGlobalInfoDashboard();
                }
            }
            else
            {
                // Store the relevant information and calculate
                // the total contributing hashrate.
                this.cachedInfo = JSON.parse(xhr.responseText);
                this.cachedRate = 0;
                for (worker in this.cachedInfo["workers"])
                    this.cachedRate = this.cachedRate + this.cachedInfo["workers"][worker]["hash_rate"];
                
                // Cause the backend to refresh the total balance.
                Backend.refreshBalance();
                
                // Skip the next part if we can't update the UI.
                if (uki)
                {
                    // Update the sidebar.
                    this.updateSidebar();
                    
                    // Generate dashboard.
                    this.generateDashboard();
                    
                    // Generate worker dashboard.
                    this.generateWorkerDashboard();
                    
                    // Generate global info dashboard.
                    this.generateGlobalInfoDashboard();
                }
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
    disconnect: function($super) {
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
        if (this.hasError)
        {
            Backend.getFrontend().setPageStatus(this, null, "ERROR");
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", null);
            return;
        }
        
        // Set the balance in the sidebar.
        if (this.cachedInfo == null)
            Backend.getFrontend().setPageStatus(this, null, null);
        else
            Backend.getFrontend().setPageStatus(this, null, "&#x0E3F " + parseFloat(this.cachedInfo["user"]["confirmed_rewards"]).toFixed(2));
        
        // Set mining information in the sidebar.
        if (this.cachedInfo == null || !this.cachedInfo["generate"])
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", null);
        else
            Backend.getFrontend().setPageStatus(this, "Mining (Generation)", (this.cachedRate / 1024 / 1024).toFixed(2) + " Mh/s");
    },
    
    // <summary>
    // Requests a list of toolbar items to show at the top of the screen while
    // this account is in the active window.
    // </summary>
    getToolbar: function()
    {
        return [
                {
                    text: "Visit BTCGuild",
                    width: 115,
                    onClick: function() {
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
        return ["Mining (Generation)", "Individual Workers", "Global Pool"];
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
                            { view: 'Label', rect: '10 10 580 280', anchors: 'left top', id: this.uiid + '-Mining-Status', textSelectable: true, multiline: true,  text: 'Loading information...' },
                        ] }
                        
                    ] }
                ));
                
                // Now modify and attach events to the elements.
                uki('#' + this.uiid + '-Mining-BorderBox').dom().style.border = 'solid 1px #CCC';
                uki('#' + this.uiid + '-Mining-BorderBox').dom().style.borderRadius = '15px';
                uki('#' + this.uiid + '-Mining-Status').dom().style.lineHeight = '20px';
                
                // Generate dashboard.
                this.generateDashboard();
                
                break;
                
            case "Individual Workers":
                // Create the workers view.
                attach(uki(
                    { view: 'Table', rect: '0 0 1000 1000', minSize: '0 200', id: this.uiid + '-WorkerStatus',
                      anchors: 'left top right bottom', multiselect: true, rowHeight: 21, style: {fontSize: '12px',
                      lineHeight: '14px'}, columns: [
                        { view: 'table.Column', label: 'Worker Name', resizable: true, minWidth: 150, width: 220 },
                        { view: 'table.Column', label: 'Hash Rate', resizable: true, width: 150 },
                        { view: 'table.NumberColumn', label: 'Round Shares', resizable: true, width: 90 },
                        { view: 'table.NumberColumn', label: 'Round Stales', resizable: true, width: 90 },
                        { view: 'table.NumberColumn', label: 'Total Shares', resizable: true, width: 90 },
                        { view: 'table.NumberColumn', label: 'Total Stales', resizable: true, width: 90 },
                        { view: 'table.NumberColumn', label: 'Last Share', resizable: true, width: 90 },
                        { view: 'table.NumberColumn', label: 'Blocks Found', resizable: true, width: 90 }
                    ] }
                ));
                
                // Generate the worker dashboard.
                this.generateWorkerDashboard();
                
                break;

            case "Global Pool":
                // Create the global information dashboard.
                attach(uki(
                    { view: 'Box', rect: '0 0 1000 1000', anchors: 'top left right width', childViews: [
                
                        { view: 'Label', rect: '208 70 600 0', anchors: 'top', text: this.name + " (Globally)", style: { fontSize: '20px' } },
                        { view: 'Label', rect: '208 70 580 0', anchors: 'top', id: this.uiid + '-GlobalInfo-HashRate', textSelectable: true, html: '_ Mhashes/sec', style: { fontSize: '20px', textAlign: 'right' } },
                
                        // Main area
                        { view: 'Box', rect: '200 100 600 300', anchors: 'top', id: this.uiid + '-GlobalInfo-BorderBox', childViews: [
                            { view: 'Label', rect: '10 10 580 280', anchors: 'left top', id: this.uiid + '-GlobalInfo-Status', textSelectable: true, multiline: true,  text: 'Loading information...' },
                        ] }
                        
                    ] }
                ));
                
                // Now modify and attach events to the elements.
                uki('#' + this.uiid + '-GlobalInfo-BorderBox').dom().style.border = 'solid 1px #CCC';
                uki('#' + this.uiid + '-GlobalInfo-BorderBox').dom().style.borderRadius = '15px';
                uki('#' + this.uiid + '-GlobalInfo-Status').dom().style.lineHeight = '20px';
                
                // Generate global information dashboard.
                this.generateGlobalInfoDashboard();
                
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
            if (this.cachedInfo["user"]["unconfirmed_rewards"] == null)
            {
                // Invalid API key.
                uki('#' + this.uiid + '-Mining-HashRate').html("");
                uki('#' + this.uiid + '-Mining-Status').html("The API key you specified is not valid.  You can edit this account by clicking on the main dashboard and selecting 'Edit Accounts'.");
                return;
            }
            
            var text = "You are currently contributing " + this.formatHash(this.cachedRate, true) + " to the pool.<br/>";
            text += "<br/>";
            text += "You have currently earnt &#x0E3F " + parseFloat(this.cachedInfo["user"]["confirmed_rewards"]).toFixed(2) + " through mining with BTCGuild.  You can withdraw coins via the <a href='https://btcguild.com/' target='_blank'>BTCGuild website</a>.<br/>";
            text += "<br/>";
            text += "You have &#x0E3F " + parseFloat(this.cachedInfo["user"]["unconfirmed_rewards"]).toFixed(2) + " in unconfirmed rewards, with an estimated &#x0E3F " + parseFloat(this.cachedInfo["user"]["estimated_rewards"]).toFixed(2) + " to be earnt when the next block is found.<br/>";
            text += "<br/>";
            text += "You have previously had &#x0E3F " + parseFloat(this.cachedInfo["user"]["payouts"]).toFixed(2) + " paid out.";
            uki('#' + this.uiid + '-Mining-HashRate').html(this.formatHash(this.cachedRate));
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
        if (this.cachedInfo == null) return null;
        return this.cachedInfo["user"]["confirmed_rewards"];
    },

    // <summary>
    // Regenerates information about the global state of the pool.
    // </summary>
    generateGlobalInfoDashboard: function($super)
    {
        if (!uki) return;
        
        if (this.cachedInfo != null)
        {
            if (this.cachedInfo["user"]["unconfirmed_rewards"] == null)
            {
                // Invalid API key.
                uki('#' + this.uiid + '-Global-Status').html("The API key you specified is not valid.  You can edit this account by clicking on the main dashboard and selecting 'Edit Accounts'.");
                return;
            }
            
            var text = "<strong>Basic BTCGuild Stats and Information</strong>:";
            text += "<br />Total Hash Rate: " + this.formatHash(this.cachedInfo["pool"]["hash_rate"]);
            text += "<br />US West: " + this.formatHash(this.cachedInfo["pool"]["uswest_speed"]);
            text += "<br />US East: " + this.formatHash(this.cachedInfo["pool"]["useast_speed"]);
            text += "<br />US Central: " + this.formatHash(this.cachedInfo["pool"]["uscentral_speed"]);
            text += "<br />Nederlands: " + this.formatHash(this.cachedInfo["pool"]["nl_speed"]);
            text += "<br />United Kingdom: " + this.formatHash(this.cachedInfo["pool"]["uk_speed"]);

            text += "<hr />Active Workers: " + this.cachedInfo["pool"]["hash_rate"];
            text += "<br />Round Time: " + this.cachedInfo["pool"]["round_time"];
            text += "<br />Round Shares: " + this.cachedInfo["pool"]["round_shares"];

            uki('#' + this.uiid + '-GlobalInfo-HashRate').html(this.formatHash(this.cachedInfo["pool"]["hash_rate"]));
            uki('#' + this.uiid + '-GlobalInfo-Status').html(text);
        }
        else
        {
            uki('#' + this.uiid + '-GlobalInfo-Status').text("Loading information...");
            uki('#' + this.uiid + '-GlobalInfo-HashRate').html("_ Mhashes/sec");
        }
    },
    
    // <summary>
    // Regenerates the information for the worker dashboard.
    // </summary>   
    generateWorkerDashboard: function($super)
    {
        if (!uki) return;
        
        if (this.cachedInfo != null)
        {
            var table = uki('#' + this.uiid + '-WorkerStatus');
            if (table == null || this.cachedInfo["workers"] == null) return;
            var opts = [];
            for (worker in this.cachedInfo["workers"])
            {
                opts[opts.length] = [
                    this.cachedInfo["workers"][worker]["worker_name"],
                    this.formatHash(this.cachedInfo["workers"][worker]["hash_rate"], true), 
                    this.cachedInfo["workers"][worker]["round_shares"],
                    this.cachedInfo["workers"][worker]["round_stales"],
                    this.cachedInfo["workers"][worker]["total_shares"],
                    this.cachedInfo["workers"][worker]["total_stales"],
                    this.cachedInfo["workers"][worker]["last_share"],
                    this.cachedInfo["workers"][worker]["blocks_found"]
                ];
            }
            table.data(opts);
        }
        else
            table.data([]);
    },
    
    // <summary>
    // Returns a formatted version of the # hash/s string with the appropriate suffix.
    // </summary>
    // <param name="rate">The hash rate.</param>
    // <param name="small">Whether to output in small format (Mh/s) or long format (Mhashes/sec).</param>
    formatHash: function($super, rate, small)
    {
        if (small == false || small == null)
        {
            if (rate >= 0       && rate < 1000)       return parseFloat(rate).toFixed(2) + " Mhashes/sec";
            if (rate >= 1000    && rate < 1048576)    return parseFloat(rate / 1024).toFixed(2) + " Ghashes/sec";
            if (rate >= 1048576 && rate < 1073741824) return parseFloat(rate / 1024 / 1024).toFixed(2) + " Thashes/sec";
        }
        else
        {
            if (rate >= 0       && rate < 1000)       return parseFloat(rate).toFixed(2) + " Mh/s";
            if (rate >= 1000    && rate < 1048576)    return parseFloat(rate / 1024).toFixed(2) + " Gh/s";
            if (rate >= 1048576 && rate < 1073741824) return parseFloat(rate / 1024 / 1024).toFixed(2) + " Th/s";
        }
    }
    
});

// <summary>
// The account type name (to be shown in the New Account wizard).
// </summary>
Collate.Account.BTCGuild.Name = "BTCGuild (Mining Pool)";

// <summary>
// The account type description (to be shown in the New Account wizard).
// </summary>
Collate.Account.BTCGuild.Description = "<i>Connects to the BTCGuild mining pool and shows information about your account.</i><br /><br />Retrieves information from the BTCGuild servers about your account information, such as the current contributing hashrate, individual worker status, global pool information and current earnings.  This plugin does not perform any BitCoin mining of it's own.<br/><br/>Your API key can be found under 'API Settings' at the <a href='https://www.btcguild.com/' target='_blank'>BTCGuild website</a>.";

// <summary>
// The account parameter list.
// </summary>
Collate.Account.BTCGuild.Parameters = [
    { type: 'Text', name: 'apiKey', text: 'API Key', default: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }
];