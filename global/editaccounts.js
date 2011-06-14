/*
 * Name:            Collate.Global.EditAccounts
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  The global edit accounts page that allows the user to edit and delete accounts.
 *
 */

Collate.Global.EditAccounts = Class.create(Collate.Global, {

    // <summary>
    // Initializes the edit accounts page.
    // </summary>
    initialize: function()
    {
    },
    
    // <summary>
    // Requests a list of toolbar items to show at the top of the screen while
    // this account is in the active window.
    // </summary>
    getToolbar: function()
    {
        // Return the relevant toolbar items for the dashboard.
        var n = 0; for (var i in Collate.Backend.Accounts) n += 1;
        if (n > 0)
            return [
                    {
                        text: "New Account",
                        width: 121,
                        target: Backend.Pages["NewAccount"],
                        page: null
                    },
                    {
                        text: "Edit Accounts",
                        width: 122,
                        target: Backend.Pages["EditAccounts"],
                        page: null
                    }
                ];
        else
            return [
                    {
                        text: "New Account",
                        width: 121,
                        target: Backend.Pages["NewAccount"],
                        page: null
                    }
                ];
    },
    
    // <summary>
    // Sets up the UI for the parameters.
    // </summary>
    setupParameters: function(account)
    {
        // Clear existing options.
        uki('#' + this.uiid + '-Options').dom().innerHTML = "";
        
        // Set up the parameters required.
        var parameters = account.__proto__.constructor.Parameters;
        var y = -24 * parameters.length;
        var views = [];
        for (var i = 0; i < parameters.length; i += 1)
        {
            var p = parameters[i];
            views[views.length] = { view: 'Label', rect: '0 ' + (241 + y) + ' 300 22', anchors: 'left top', text: p.text + ":" };
            switch (p.type)
            {
                case "Text":
                    views[views.length] = { view: 'TextField', rect: '100 ' + (241 + y) + ' 200 22', anchors: 'left top', id: this.uiid + "-Parameters-" + p.name, placeholder: p.default, value: account.settings[p.name] };
                    break;
                default:
                    break;
            }
            y += 24;
        }
        uki(views).attachTo(uki('#' + this.uiid + '-Options').dom(), '580 280');
    },
    
    // <summary>
    // Updates an account with the specified type, name and parameters.
    // </summary>
    updateAccount: function(acc, name, parameters)
    {
        // Update the account details in local storage.
        var s = Backend.Storage.getRawItem("global-accounts");
        for (var i = 0; i < s.length; i += 1)
        {
            if (s[i].name == name)
                s[i].parameters = parameters;
        }
        Backend.Storage.setRawItem("global-accounts", s);
        
        // Disconnect the existing account.
        Backend.Accounts[name].disconnect();
        
        // Create the instance of the account.
        Backend.Accounts[name] = new acc.__proto__.constructor(name, parameters);
        Backend.Accounts[name].connect();
        
        // Regenerate the account sidebar.
        Backend.getFrontend().refreshSidebar();
        
        uki('#' + this.uiid + '-Update').text("Updated!");
        window.setTimeout(function()
        {
            uki('#' + this.uiid + '-Update').text("Update");
        }, 500);
    },
    
    // <summary>
    // Deletes an account with the specified name.
    // </summary>
    deleteAccount: function(name)
    {
        // Delete the account details to local storage.
        var s = Backend.Storage.getRawItem("global-accounts");
        var id = null;
        for (var i = 0; i < s.length; i += 1)
            if (s[i].name == name)
            {
                id = i;
                break;
            }
        s = s.slice(0,id).concat(s.slice(id+1));
        Backend.Storage.setRawItem("global-accounts", s);
        
        // Disconnect the existing account.
        Backend.Accounts[name].disconnect();
        
        // Erase the account forever!
        delete Backend.Accounts[name];
        
        // Regenerate the account sidebar.
        Backend.getFrontend().refreshSidebar();
        
        // Check to see if there are no accounts left.
        var n = 0; for (var i in Collate.Backend.Accounts) n += 1;
        if (n == 0)
        {
            // We want to change the page to the default page since there
            // are no more accounts to edit.
            Backend.getFrontend().clearUI();
            Backend.getFrontend().loadUI(Backend.Pages["Dashboard"], "Dashboard", null);
            return;
        }
        
        // Redetermine the available options for the UI.
        var opts = [];
        for (var i in Backend.Accounts)
            opts[opts.length] = { value: Backend.Accounts[i], text: Backend.Accounts[i].name };
        uki('#' + this.uiid + '-AccountNames').options(opts);
        uki('#' + this.uiid + '-AccountNames').selectedIndex(0);
        uki('#' + this.uiid + '-AccountNames').trigger('change');
    },
    
    // <summary>
    // Requests the UKI UI to show in the main area.
    // </summary>
    // <param name="attach">Call this function with the generated UKI before modifying elements.</param>
    getUI: function(attach)
    {
        // Determine options.
        var opts = [];
        for (var i in Backend.Accounts)
            opts[opts.length] = { value: Backend.Accounts[i], text: Backend.Accounts[i].name };
        
        // Perform the initial setup.
        attach(uki(
            { view: 'Box', rect: '0 0 1000 1000', anchors: 'top left right width', childViews: [
        
                { view: 'Label', rect: '208 70 600 0', anchors: 'top', text: 'Edit Accounts', style: { fontSize: '20px' } },
        
                // Main area
                { view: 'Box', rect: '200 100 600 300', anchors: 'top', id: this.uiid + '-BorderBox', childViews: [
                    { view: 'Label', rect: '10 10 300 22', anchors: 'left top', text: 'What account do you want to edit?' },
                    { view: 'Select', rect: '320 10 270 22', anchors: 'left top', id: this.uiid + '-AccountNames', rowHeight: 22, options: opts },
                    { view: 'Box', rect: '0 42 600 0', anchors: 'top', id: this.uiid + '-BorderLine1', childViews: [ ] },
                    
                    { view: 'Label', rect: '10 52 580 280', anchors: 'left top', id: this.uiid + '-AccountDesc', multiline: true, html: opts[0].value.__proto__.constructor.Description },
                    { view: 'Box', rect: '10 50 580 280', anchors: 'bottom', id: this.uiid + '-Options', childViews: [ ] },
                    { view: 'Button', rect: '490 265 100 24', anchors: 'bottom right', id: this.uiid + '-Update', text: 'Update' },
                    { view: 'Button', rect: '10 309 100 24', anchors: 'top left', id: this.uiid + '-Delete', html: '<span style="color:#C00;">Delete</span>' },
                ] }
                
            ] }
        ));
        
        // Now modify and attach events to the elements.
        var me = this;
        uki('#' + this.uiid + '-BorderBox').dom().style.border = 'solid 1px #CCC';
        uki('#' + this.uiid + '-BorderBox').dom().style.borderRadius = '15px';
        uki('#' + this.uiid + '-BorderLine1').dom().style.border = 'none';
        uki('#' + this.uiid + '-BorderLine1').dom().style.borderTop = 'solid 1px #CCC';
        uki('#' + this.uiid + '-AccountNames').bind('change', function ()
        {
            var value = uki('#' + me.uiid + '-AccountNames').value();
            uki('#' + me.uiid + '-AccountDesc').html(value.__proto__.constructor.Description);
            
            me.setupParameters(value);
        });
        uki('#' + this.uiid + '-Update').bind('click', function ()
        {
            var value = uki('#' + me.uiid + '-AccountNames').value();
            
            // Get parameter values.
            var params = {};
            for (var i = 0; i < value.__proto__.constructor.Parameters.length; i += 1)
            {
                params[value.__proto__.constructor.Parameters[i].name] = uki("#" + me.uiid + "-Parameters-" + value.__proto__.constructor.Parameters[i].name).value();
            }
            
            me.updateAccount(value, value.name, params);
        });
        uki('#' + this.uiid + '-Delete').bind('click', function ()
        {
            var value = uki('#' + me.uiid + '-AccountNames').value();
            me.deleteAccount(value.name);
        });
        this.setupParameters(opts[0].value);
    }
    
});