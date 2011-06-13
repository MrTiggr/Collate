/*
 * Name:            Collate.Global
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  Defines the base class for global pages.
 *
 */

Collate.Global = Class.create({

    // <summary>
    // Initializes the base class (this doesn't do anything).
    // </summary>
    initialize: function()
    {
        // Nothing to do.
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
    // Requests the UKI UI to show in the main area.
    // </summary>
    // <param name="attach">Call this function with the generated UKI before modifying elements.</param>
    getUI: function(attach, uiid)
    {
        // There's no UI as this isn't a proper class.
        return null;
    }
    
});