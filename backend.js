/*
 * Name:            Collate.Backend
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  Defines the class for managing accounts and other information
 *  seperate from the frontend UI.
 *
 */

window.uki = false;

Collate.Backend = Class.create({

    // Static variables.
    Tab: null,
    Storage: null,
    Accounts: {},
    Pages: {},

    // <summary>
    // Initializes the backend system.
    // </summary>
    initialize: function()
    {
        // Register the basic event handlers.
        var me = this;
        chrome.browserAction.onClicked.addListener(function() { me.onActionClicked(); });
        chrome.tabs.onRemoved.addListener(function(tabId) { me.onTabRemoved(tabId); });
        
        // Set the default text.
        chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
        chrome.browserAction.setBadgeText({ text: "..." });
        
        // Start the storage system.
        this.Storage = new Collate.Backend.Storage();
        
        // Initalize the global pages.
        this.Pages["Dashboard"] = new Collate.Global.Dashboard();
        this.Pages["NewAccount"] = new Collate.Global.NewAccount();
        
        // Start the account management system.
        this.AccountManager = new Collate.Backend.AccountManager(this);
        
        // Make the static variables public.
        Collate.Backend.Accounts = Collate.Backend.prototype.Accounts;
        Collate.Backend.Storage = Collate.Backend.prototype.Storage;
        Collate.Backend.Pages = Collate.Backend.prototype.Pages;
    },
    
    // <summary>
    // This function is called by the frontend once it has finished initalizing; it
    // is used to signal to the accounts that they should update their sidebar status.
    // </summary>
    onFrontendLoad: function()
    {
        // We want to request that all of the accounts set
        // their sidebar statuses.
        for (var i in this.Accounts)
            this.Accounts[i].onFrontendLoad();
    },
    
    // <summary>
    // Gets a UI element by ID.  This function is mapped to the uki global when the
    // UI is available, otherwise uki is false.  This allows constructs
    // such as:
    //
    // if (uki)
    //   uki("#SomeElement").text(...);
    // </summary>
    getUIElement: function(data)
    {
        var frontend = chrome.extension.getViews({ type: "tab" })[0];
        //var context = frontend.uki._ids;
        return frontend.uki(data);
    },
    
    // <summary>
    // Returns a reference to the Frontend object on which functions
    // can be called.
    // </summary>
    getFrontend: function()
    {
        return chrome.extension.getViews({ type: "tab" })[0].Frontend;
    },
    
    // <summary>
    // Associates the uki function with this.getUIElement.  To be called by the
    // frontend once loaded.
    // </summary>
    setUIBinder: function()
    {
        window.uki = this.getUIElement;
    },
    
    // <summary>
    // Callback function for handling when the browser action is clicked by
    // the user.
    // </summary>
    onActionClicked: function()
    {
        // Check to see if the tab already exists; if it does, switch to it.
        var me = this;
        if (this.Tab != null)
            chrome.tabs.update(this.Tab.id, {selected: true, pinned: true});
        else
            // ... otherwise create the new tab.
            chrome.tabs.create({url: "frontend.html", selected: true, pinned: true}, function(tab) { me.onTabCreated(tab); });
    },
    
    // <summary>
    // Callback function for handling when our tab has been created.
    // </summary>
    onTabCreated: function(tab)
    {
        this.Tab = tab;
    },
    
    // <summary>
    // Callback function for handling when a tab is closed in the browser (but we
    // only care whether our browser tab is closed).
    // </summary>
    onTabRemoved: function(tabId, removeInfo)
    {
        if (this.Tab == null) return;
        if (tabId == this.Tab.id)
        {
            this.Tab = null;
            window.uki = false;
        }
    },
    
    // <summary>
    // Callback function that is used by the frontend to request a list of items
    // that should be shown under a particular section.  Supported sections are
    // "All Accounts" and "Individual Accounts"
    // </summary>
    getSidebarSection: function(section)
    {
        switch (section)
        {
            case "All Accounts":
                var items = [];
                items[items.length] = { data: 'Dashboard' };
                return items;
            case "Individual Wallets":
                var items = [];
                for (var i in this.Accounts)
                {
                    var subitems = this.Accounts[i].getMenu();
                    var d = [];
                    for (var a in subitems)
                    {
                        var e = subitems[a];
                        if (typeof(e) == "string")
                            d[d.length] = { data: { toString: function() { return this.value + this.status; }, value: e, status: "", page: e, account: this.Accounts[i] } };
                    }
                    items[items.length] = {
                        data: { toString: function() { return this.value + this.status; }, value: i, status: "", page: null, account: this.Accounts[i] },
                        children: d,
                        __opened: true
                    }
                }
                return items;
            default:
                return null;
        }
    },
    
    // <summary>
    // Causes the total balance of all accounts to be recalculated for the browser
    // action icon and the main UI.
    // </summary>
    refreshBalance: function()
    {
        var total = 0;
        for (var i in this.Accounts)
            total += this.Accounts[i].getBalance();
        total = Math.round(total * 100000000) / 100000000; // Fix rounding errors.
        chrome.browserAction.setBadgeBackgroundColor({ color: [0, 127, 0, 255] });
        if (total >= 0     && total < 10)     chrome.browserAction.setBadgeText({ text: total.toFixed(2) });
        if (total >= 10    && total < 100)    chrome.browserAction.setBadgeText({ text: total.toFixed(1) });
        if (total >= 100   && total < 1000)   chrome.browserAction.setBadgeText({ text: total.toFixed(0) });
        if (total >= 1000  && total < 10000)  chrome.browserAction.setBadgeText({ text: (total / 1000).toFixed(1) + "k" });
        if (total >= 10000)                   chrome.browserAction.setBadgeText({ text: (total / 1000).toFixed(0) + "k" });
    }
    
});