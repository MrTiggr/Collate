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
    // Initalizes the base class (this doesn't do anything).
    // </summary>
    initialize: function()
    {
        // Nothing to do.
    },
    
    // <summary>
    // Requests the UKI UI to show in the main area.
    // </summary>
    // <param name="attach">Call this function with the generated UKI before modifying elements.</param>
    getUI: function(attach)
    {
        // There's no UI as this isn't a proper class.
        return null;
    }
    
});