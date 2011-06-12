/*
 * Name:            Collate.Storage
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  Manages storing settings for plugins and global information using
 *  the browser's localStorage.
 *
 */

Collate.Storage = Class.create({

    // <summary>
    // Initalizes the class.
    // </summary>
    initialize: function()
    {
    },
    
    // <summary>
    // Retrieves a copy of the value with the specified key in
    // the local storage. Note that it is a COPY not a REFERENCE;
    // you need to use setRawItem to save any changes back to
    // the local storage.
    // </summary>
    getRawItem: function(key)
    {
        var val = localStorage.getItem(key);
        if (val == null || val == "")
            return null;
        else
            return JSON.parse(val);
    },
    
    // <summary>
    // Sets the value for the specified key.
    // </summary>
    setRawItem: function(key, value)
    {
        localStorage.setItem(key, JSON.stringify(value));
    }
    
});
Collate.Storage = new Collate.Storage();