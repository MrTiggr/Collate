/*
 * Name:            Collate.Account
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  Defines the base class for a BitCoin account, whether it be connected
 *  via RPC or uses a custom API to another website.
 *
 */

Collate.Account = Class.create({

    // <summary>
    // Initializes the base class (this doesn't do anything).
    // </summary>
    // <param name="name">The name of this account as it appears in Collate.</param>
    // <param name="parameters">The custom settings applicable to this account.</param>
    initialize: function(name, parameters)
    {
        // Nothing to do.
    },
    
    // <summary>
    // Connects the base class to it's appropriate service.  It
    // is assumed that the instance already has it's information
    // for connection when it was initalized.
    // </summary>
    connect: function()
    {
        // We can't connect because this is just the abstract
        // base class.
        return false;
    },
    
    // <summary>
    // Disconnects from the appropriate service.  This should not
    // throw away the connection information, but rather be ready
    // to connect again at whim.
    // </summary>
    disconnect: function()
    {
        return true;
    },
    
    // <summary>
    // Requests a list of toolbar items to show at the top of the screen while
    // this account is in the active window.
    // </summary>
    getToolbar: function()
    {
        // There's no toolbar items as this isn't a proper class.
        return null;
    },
    
    // <summary>
    // Requests a list of subitems to show in the sidebar, or null
    // if the top-level item will be used.  In the later case, null
    // will be passed to getUI instead of one of the strings in the array.
    // </summary>
    getMenu: function()
    {
        // There's no menu items as this isn't a proper class.
        return null;
    },
    
    // <summary>
    // Requests the UKI UI to show in the main area.  You should probably
    // create this the first time it is requested, and cache it for all
    // times after that.
    // </summary>
    // <param name="attach">Call this function with the generated UKI before modifying elements.</param>
    // <param name="uiid">A unique ID which should precede any DOM or UKI elements created or referenced.  Store it for later use.</param>
    // <param name="page">One of the menu items, or null.</param>
    getUI: function(attach, uiid, page)
    {
        // There's no UI as this isn't a proper class.
        return null;
    },
    
    // <summary>
    // Returns the current balance of the account.
    // </summary>
    getBalance: function()
    {
        // There is no balance because this isn't a proper class.
        return null;
    }
    
});