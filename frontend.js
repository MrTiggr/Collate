/*
 * Name:            Collate.Frontend
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  Defines the class for managing the frontend UI.
 *
 */

Collate.Frontend = Class.create({

    // Static variables.
    Backend: null,

    // <summary>
    // Initializes the backend system.
    // </summary>
    initialize: function(backend)
    {
        // Set the backend reference.
        this.Backend = backend;
        
        // Build the frontend UI.
        this.constructUI();
        this.initializeSidebar();
        
        // Set the uki reference.
        this.Backend.setUIBinder();
        
        // Load the dashboard.
        this.clearUI();
        this.loadUI(this.Backend.Pages["Dashboard"], "Dashboard", null);
    },
    
    // <summary>
    // Fires events on the backend that require the window.Frontend variable
    // set in order to operate properly (such as onFrontendLoad).
    // </summary>
    signal: function()
    {
        // Fire the onFrontendLoad event.
        this.Backend.onFrontendLoad();
    },
    
    // <summary>
    // Constructs the page UI.
    // </summary>
    constructUI: function()
    {
        var secondListOffset = 50;
        var treeStyle = {fontSize: '11px', lineHeight: '11px', cursor: 'default'};
        uki(
            // Outer box (whole page)
            { view: 'Box', rect: '0 0 1000 1000', anchors: 'top left right width', childViews: [
                
                // Top panel area
                { view: 'Box', rect: '0 0 1000 44', anchors: 'top left right width', background: 'theme(panel)', id: 'ToolsArea', childViews: [
                    
                ] },
                
                // Horizontally split area
                { view: 'HSplitPane', rect: '0 45 1000 956', anchors: 'top left right width bottom height',
                  handleWidth: 1, handlePosition: 229, leftMin: 229, fixed: true, rightMin: 600,
                  leftPane: { background: "#D0D7E2", childViews: [
                    
                    // List of account and search area
                    { view: 'Label', rect: '0 4 170 20', anchors: 'left top', id: 'Label-AllAccounts', text: 'ALL ACCOUNTS'},
                    { view: 'uki.more.view.TreeList', rect: '0 30 229 100', anchors: 'left top bottom', id: 'TreeView-AllAccounts', data: this.Backend.getSidebarSection("All Accounts"), rowHeight: 20, style: treeStyle },
                    { view: 'Label', rect: '0 ' + (secondListOffset + 4) + ' 170 20', anchors: 'left top', id: 'Label-IndividualWallets', text: 'INDIVIDUAL ACCOUNTS'},
                    { view: 'uki.more.view.TreeList', rect: '0 ' + (secondListOffset + 30) + ' 229 100', anchors: 'left top bottom', id: 'TreeView-IndividualWallets', data: this.Backend.getSidebarSection("Individual Wallets"), rowHeight: 20, style: treeStyle }
                    
                  ] },
                  rightChildViews: [
                    
                    // List of transactions for account + other info
                    { view: 'Box', rect: '0 0 770 956', anchors: 'top left right width bottom height', id: 'MainArea' }
                    
                  ]
                },
            ] }
        ).attachTo(window, '1000 1000');
    },
    
    
/* #############################################
#                                              #
#              Sidebar management.             #
#                                              #
############################################# */
    
    
    // <summary>
    // Initializes the sidebar and it's event handlers.
    // </summary>
    initializeSidebar: function()
    {
        this.styleSidebarSection('AllAccounts');
        this.styleSidebarSection('IndividualWallets');
        
        var me = this;
        uki('#TreeView-AllAccounts').bind('mousedown', function () { me.onAllAccountsMouseDown(); });
        uki('#TreeView-AllAccounts').bind('mouseup', function () { me.onAllAccountsMouseUp(); });
        uki('#TreeView-IndividualWallets').bind('mousedown', function () { me.onIndividualAccountsMouseDown(); });
        uki('#TreeView-IndividualWallets').bind('mouseup', function () { me.onIndividualAccountsMouseUp(); });
        uki('#TreeView-AllAccounts').selectedIndex(0);
    },
    
    // <summary>
    // Callback function for when the mouse is released over the
    // "All Accounts" section of the UI.
    // </summary>
    onAllAccountsMouseDown: function()
    {
        uki('#TreeView-IndividualWallets').selectedIndexes([]);
    },
    
    // <summary>
    // Callback function for when the mouse is pressed down the
    // "All Accounts" section of the UI.
    // </summary>
    onAllAccountsMouseUp: function()
    {
        if (uki('#TreeView-AllAccounts').selectedRow() == null) return;
        var index = uki('#TreeView-AllAccounts').selectedRow().data;
        this.clearUI();
        switch (index)
        {
            case "Dashboard":
                // Notice that we send the object across, not the result
                // of getUI.
                this.loadUI(this.Backend.Pages[index], index, null);
                break;
            default:
                break;
        }
    },
    
    // <summary>
    // Callback function for when the mouse is pressed down the
    // "Individual Accounts" section of the UI.
    // </summary>
    onIndividualAccountsMouseDown: function()
    {
        uki('#TreeView-AllAccounts').selectedIndexes([]);
    },
    
    // <summary>
    // Callback function for when the mouse is released over the
    // "Individual Accounts" section of the UI.
    // </summary>
    onIndividualAccountsMouseUp: function()
    {
        if (uki('#TreeView-IndividualWallets').selectedRow() == null) return;
        var data = uki('#TreeView-IndividualWallets').selectedRow().data;
        this.clearUI();
        this.loadUI(data.account, data.account.name, data.page);
    },
    
    // <summary>
    // Refreshes the "Individual Wallets" section of the sidebar.
    // </summary>
    refreshSidebar: function()
    {
        uki("#TreeView-IndividualWallets").data(this.Backend.getSidebarSection("Individual Wallets"));
    },
    
    // <summary>
    // Sets up the UI style for the sidebar section headers.
    // </summary>
    styleSidebarSection: function(id)
    {
        uki("#Label-" + id).dom().firstChild.style.fontFamily = "'Lucida Grande', Arial, Helvetica, sans-serif";
        uki("#Label-" + id).dom().firstChild.style.fontSize = '11px';
        uki("#Label-" + id).dom().firstChild.style.webkitUserSelect = 'none';
        uki("#Label-" + id).dom().firstChild.style.color = 'rgb(113, 129, 147)';
        uki("#Label-" + id).dom().firstChild.style.cursor = 'none';
        uki("#Label-" + id).dom().firstChild.style.fontWeight = 'bold';
        uki("#Label-" + id).dom().firstChild.style.textShadow = 'rgba(255, 255, 255, 0.796875) 0px 1px 0px';
        uki("#Label-" + id).dom().firstChild.style.left = '9px';
        uki("#Label-" + id).dom().firstChild.style.top = '5px';
        uki("#Label-" + id).dom().firstChild.style.right = '0px';
        uki("#Label-" + id).dom().firstChild.style.lineHeight = '13px';
        uki("#TreeView-" + id).background('#D0D7E2');
    },
    
    
/* #############################################
#                                              #
#          Page and status management.         #
#                                              #
############################################# */
    
    
    // <summary>
    // Locates a reference to the text element in the sidebar for a particular page.
    // </summary>
    getPageReference: function(searchIn, account, page)
    {
        for (var i = 0; i < searchIn.length; i += 1)
        {
            var v = searchIn[i];
            
            // Check the object itself.
            if (v.data.account == account)
            {
                if (v.data.page == page)
                    return v.data;
                
                if (v.children != null)
                    return this.getPageReference(v.children, account, page);
            }
        }
        
        return null;
    },
    
    // <summary>
    // Sets the status for a particular page.
    // </summary>
    setPageStatus: function(account, page, value)
    {
        var v = this.getPageReference(uki("#TreeView-IndividualWallets").data(), account, page);
        if (v != null)
        {
            if (value == null)
                v.status = "";
            else
                v.status = "<div class='treeList-unread' style='display: block;'>" + value + "</div>";
        }
        var s = uki("#TreeView-IndividualWallets").selectedIndex();
        uki("#TreeView-IndividualWallets").data(uki("#TreeView-IndividualWallets").data());
        uki("#TreeView-IndividualWallets").selectedIndex(s);
    },
    
    
/* #############################################
#                                              #
#         UI handling (the main area).         #
#                                              #
############################################# */
    
    
    // <summary>
    // Clears the main UI area.
    // </summary>
    clearUI: function()
    {
        var area = uki('#MainArea');
        area.dom().innerHTML = "";
    },
    
    // <summary>
    // Loads a specified page into the main UI area.
    // </summary>
    loadUI: function(obj, name, page)
    {
        var area = uki('#MainArea');
        if (obj == null)
        {
            area.dom().innerHTML = "<h2>This page is invalid.</h2>";
            return;
        }
        var wasAttached = false;
        var attach = function(uu)
        {
            uu.attachTo(area.dom(), '1000 1000');
            wasAttached = true;
        };
        var result = null;
        var hash = this.generateUIID(name, page);
        result = obj.getUI(attach, hash, page);
        if (!wasAttached)
            area.dom().innerHTML = "<h2>This page is invalid.</h2>";
        
        // Request the toolbar.
        this.initializeToolbar(obj);
    },
    
    // <summary>
    // Generates a unique identifier for elements on a given page.
    // </summary>
    generateUIID: function(name, page)
    {
        if (page == null)
            return hex_sha1(name + "#");
        else
            return hex_sha1(name + "|" + page);
    },
    
    
/* #############################################
#                                              #
#              Toolbar handling.               #
#                                              #
############################################# */

    
    // <summary>
    // Initializes the toolbar's event handlers.
    // </summary>
    initializeToolbar: function(obj)
    {
        var toolbar = uki('#ToolsArea');
        var data = obj.getToolbar();
        
        // Clear all the existing child views.
        var children = toolbar.dom().getElementsByClassName("uki-view-Button");
        var n = children.length;
        for (var i = 0; i < n; i += 1)
            children[0].remove();
        
        // Create all of the buttons.
        var x = 10;
        for (var i = 0; i < data.length; i += 1)
        {
            var button = uki({ view: 'Button', rect: x + ' 10 ' + data[i].width + ' 24', anchors: 'left top' }).attachTo(toolbar.dom());
            var me = this;
            button[0].data = data[i];
            button.text(data[i].text);
            if (data[i].onClick == null)
            {
                button.bind('click', function()
                {
                    me.clearUI();
                    me.loadUI(this.data.target, this.data.text, this.data.page);
                });
            }
            else
                button.bind('click', data[i].onClick);
            
            x += 130;
        }
    }
    
});
