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
        if (this.connected)
            return true;
        
        this.state = {
            url:"https://www.btcguild.com/api.php?api_key=" + this.settings.apiKey
            };
        
        this.connected = true;

        this.onRequest(null);
        return true;
    },
    
    // <summary>
    // Callback for when the frontend has loaded and is ready to accept
    // requests to set statuses on the sidebar.  
    // </summary>
    onFrontendLoad: function() {
        this.updateSidebar();
    },
    
    // <summary>
    // Callback function for handling the XMLHttpRequest events.
    // </summary>
    onRequest: function($super, xhr) {
        if (!this.connected)
            return;
        
        if (xhr != null && xhr.responseText != "") {
            this.cachedInfo = JSON.parse(xhr.responseText);
            this.totalHashRate = 0.00;
            for (worker in this.cachedInfo["workers"]) {
                this.totalHashRate = this.totalHashRate + this.cachedInfo["workers"][worker]["hash_rate"];
            }

            if (uki) {
                this.generateWorkerDashboard();
                
                this.generateRewardDashboard();

                this.generateBTCGuildInfoDashboard();

                this.updateSidebar();
                
                Backend.refreshBalance();
            }
        }

        var call = new XMLHttpRequest();
        var me = this;
        call.open("GET", this.state.url);
        call.onreadystatechange = function() {
            if (call.readyState == 4)
                me.onRequest(call);
        };
        if (this.cachedInfo == null) {
            call.send();
        } else {
            window.setTimeout(function () {
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
    updateSidebar: function() {
        if (this.cachedInfo == null) {
            Backend.getFrontend().setPageStatus(this, null, "ERROR");
            Backend.getFrontend().setPageStatus(this, "Worker status", null);
            return;
        }
        
        if (this.cachedInfo == null || parseFloat(this.totalHashRate) == 0)
            Backend.getFrontend().setPageStatus(this, null, null);
        else
            Backend.getFrontend().setPageStatus(this, null, "&#x0E3F " + parseFloat(this.cachedInfo["user"]["confirmed_rewards"]).toFixed(4));
        
        if (this.cachedInfo == null || parseFloat(this.totalHashRate) == 0)
            Backend.getFrontend().setPageStatus(this, "Worker status", null);
        else if (parseFloat(this.totalHashRate) >= 1000)
            Backend.getFrontend().setPageStatus(this, "Worker status", (parseFloat(this.totalHashRate) / 1000).toFixed(2) + " Gh/s");
        else
            Backend.getFrontend().setPageStatus(this, "Worker status", parseFloat(this.totalHashRate).toFixed(2) + " Mh/s");
    },
    
    // <summary>
    // Requests a list of toolbar items to show at the top of the screen while
    // this account is in the active window.
    // </summary>
    getToolbar: function() {
        return [
                {
                    text: "Visit BTCGuild",
                    width: 100,
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
    getMenu: function() {
        return ["Worker status", "BTCGuild Stats and Info", "Your Rewards"];
    },
    
    // <summary>
    // Requests the UKI UI to show in the main area.  You should probably
    // create this the first time it is requested, and cache it for all
    // times after that.
    // </summary>
    // <param name="attach">Call this function with the generated UKI before modifying elements.</param>
    // <param name="page">One of the menu items, or null.</param>
    getUI: function(attach, uiid, page)  {
        if (!this.connected)
            this.connect();
        this.uiid = uiid;
        
        switch (page)  {
            case null:
            case "Worker status":
                attach(uki(
                    { view: 'Table', rect: '0 0 1000 1000', anchors: 'top left right width', id: this.uiid + '-WorkerStatus', style: {fontSize: '12px', lineHeight: '14px'}, columns: [
                        { view: 'table.NumberColumn', label: 'ID', width: 40, sort: 'ASC' },
                        { view: 'table.Column', label: 'Worker Name', resizable: true, minWidth: 150, width: 220 },
                        { view: 'table.Column', label: 'Hash Rate', resizable: true, width: 150 },
                        { view: 'table.NumberColumn', label: 'Round Shares', resizable: true, width: 70 },
                        { view: 'table.NumberColumn', label: 'Round Stales', resizable: true, width: 70 },
                        { view: 'table.NumberColumn', label: 'Total Shares', resizable: true, width: 70 },
                        { view: 'table.NumberColumn', label: 'Total Stales', resizable: true, width: 70 },
                        { view: 'table.NumberColumn', label: 'Last Share', resizable: true, width: 70 },
                        { view: 'table.NumberColumn', label: 'Blocks found', resizable: true, width: 70 }
                    ] }
                ));
                this.generateWorkerDashboard();
                break;
            
            case "Your Rewards":
                attach(uki(
                    { view: 'Box', rect: '0 0 1000 1000', anchors: 'top left right width', childViews: [
                
                        { view: 'Label', rect: '208 70 600 0', anchors: 'top', text: this.name, style: { fontSize: '20px' } },                
                        { view: 'Box', rect: '200 100 600 300', anchors: 'top', id: this.uiid + '-Rewards-BorderBox', childViews: [
                            { view: 'Label', rect: '10 10 580 280', anchors: 'left top', id: this.uiid + '-Rewards-Info', textSelectable: true, multiline: true,  text: 'Loading information...' }
                        ] }
                        
                    ] }
                ));
                
                var me = this;
                uki('#' + this.uiid + '-Rewards-BorderBox').dom().style.border = 'solid 1px #CCC';
                uki('#' + this.uiid + '-Rewards-BorderBox').dom().style.borderRadius = '15px';
                uki('#' + this.uiid + '-Rewards-Info').dom().style.lineHeight = '20px';
                
                this.generateRewardDashboard();
                break;

            case "BTCGuild Stats and Info":
                attach(uki(
                    { view: 'Box', rect: '0 0 1000 1000', anchors: 'top left right width', childViews: [
                
                        { view: 'Label', rect: '208 70 600 0', anchors: 'top', text: this.name, style: { fontSize: '20px' } },                
                        { view: 'Box', rect: '200 100 600 300', anchors: 'top', id: this.uiid + '-BTCGuildStats-BorderBox', childViews: [
                            { view: 'Label', rect: '10 10 580 280', anchors: 'left top', id: this.uiid + '-BTCGuildStats-Info', textSelectable: true, multiline: true,  text: 'Loading information...' }
                        ] }
                        
                    ] }
                ));
                
                var me = this;
                uki('#' + this.uiid + '-BTCGuildStats-BorderBox').dom().style.border = 'solid 1px #CCC';
                uki('#' + this.uiid + '-BTCGuildStats-BorderBox').dom().style.borderRadius = '15px';
                uki('#' + this.uiid + '-BTCGuildStats-Info').dom().style.lineHeight = '20px';
                
                this.generateBTCGuildInfoDashboard();
                break;
               
            default:
                return null;
        }
        
        this.updateSidebar();
    },
    
    // <summary>
    // Regenerates the information for the dashboard.
    // </summary>
    generateRewardDashboard: function($super)
    {
        if (!uki) return;
        
        if (this.cachedInfo != null) {
            if (this.cachedInfo["user"]["unconfirmed_rewards"] == null) {
                uki('#' + this.uiid + '-Rewards-Info').html("The API key you specified is not valid.  You can edit this account by clicking on the main dashboard and selecting 'Edit Accounts'.");                return;
                return;
            }

            var text = "<strong>Your rewards</strong>";
            text += "<br />Total previous payouts: &#x0E3F " + this.cachedInfo["user"]["payouts"];
            text += "<br />Confirmed rewards: &#x0E3F " + this.cachedInfo["user"]["confirmed_rewards"];
            text += "<br />Unconfirmed rewards: &#x0E3F " + this.cachedInfo["user"]["unconfirmed_rewards"];
            text += "<br />Estimated rewards: &#x0E3F " + this.cachedInfo["user"]["estimated_rewards"];

            uki('#' + this.uiid + '-Rewards-Info').html(text);
        } else {
            uki('#' + this.uiid + '-Rewards-Info').text("Loading information...");
        }
    },
    
    // <summary>
    // Returns the current balance of the account.
    // </summary>
    getBalance: function($super) {
        if (this.cachedInfo == null) return null;
        return this.cachedInfo["confirmed_rewards"];
    },

    // <summary>
    // Returns the a whole heap of information about BTCGuild.
    // </summary>
    generateBTCGuildInfoDashboard: function($super) {
        if (!uki) return;
        
        if (this.cachedInfo != null) {
            if (this.cachedInfo["user"]["unconfirmed_rewards"] == null) {
                // Invalid API key.
                uki('#' + this.uiid + '-BTCGuildStats-Info').html("The API key you specified is not valid.  You can edit this account by clicking on the main dashboard and selecting 'Edit Accounts'.");                return;
                return;
            }
            var text = "<strong>Basic BTCGuild Stats and Information</strong>:";
            text += "<br />Total Hash Rate: " + this.convertHash(this.cachedInfo["pool"]["hash_rate"]);
            text += "<br />US West: " + this.convertHash(this.cachedInfo["pool"]["uswest_speed"]);
            text += "<br />US East: " + this.convertHash(this.cachedInfo["pool"]["useast_speed"]);
            text += "<br />US Central: " + this.convertHash(this.cachedInfo["pool"]["uscentral_speed"]);
            text += "<br />Nederlands: " + this.convertHash(this.cachedInfo["pool"]["nl_speed"]);
            text += "<br />United Kingdom: " + this.convertHash(this.cachedInfo["pool"]["uk_speed"]);

            text += "<hr />Active Workers: " + this.cachedInfo["pool"]["hash_rate"];
            text += "<br />Round Time: " + this.cachedInfo["pool"]["round_time"];
            text += "<br />Round Shares: " + this.cachedInfo["pool"]["round_shares"];

            uki('#' + this.uiid + '-BTCGuildStats-Info').html(text);
        } else {
            uki('#' + this.uiid + '-BTCGuildStats-Info').text("Loading information...");
        }
    },
    
     // <summary>
    // Purdy little table with your worker info.
    // </summary>   
    generateWorkerDashboard: function($super) {
        if (!uki) return;

        var table = uki('#' + this.uiid + '-WorkerStatus');
        if (table == null || this.cachedInfo["workers"] == null) return;
        var opts = [];
        for (worker in this.cachedInfo["workers"]) {
            opts[opts.length] = [ worker,
                this.cachedInfo["workers"][worker]["worker_name"],
                this.convertHash(this.cachedInfo["workers"][worker]["hash_rate"]), 
                this.cachedInfo["workers"][worker]["round_shares"],
                this.cachedInfo["workers"][worker]["round_stales"],
                this.cachedInfo["workers"][worker]["total_shares"],
                this.cachedInfo["workers"][worker]["total_stales"],
                this.cachedInfo["workers"][worker]["last_share"],
                this.cachedInfo["workers"][worker]["blocks_found"] ];
        }
        table.data(opts);
    },
    
    // <summary>
    // Returns a nicer (formated) hash including the suffix MHash or GHash
    // </summary>
    convertHash: function($super,hash_rate) {
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
    { type: 'Text', name: 'apiKey', text: 'API Key', default: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }
];