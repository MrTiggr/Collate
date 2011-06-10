/*
 * Name:            Collate.Account.RPC
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  Defines the base class for a BitCoin account, whether it be connected
 *  via RPC or uses a custom API to another website.
 *
 */

Collate.Account.RPC = Class.create(Collate.Account, {

    // <summary>
    // Initalizes an RPC-based account, such as a connection to a local or remote
    // BitCoin server.
    // </summary>
    initialize: function(rpcHost, rpcPort, rpcUser, rpcPassword)
    {
        this.settings = {
            host: rpcHost,
            port: rpcPort,
            username: rpcUser,
            password: rpcPassword
            };
        this.connected = false;
        this.state = null;
        this.cachedBalance = null;
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
            url:"http://" + this.settings.host + ":" + this.settings.port + "/",
            request: {
                jsonrpc: 1.0,
                id: 1,
                method: "getbalance",
                params: []
                }
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
    // Callback function for handling the XMLHttpRequest events.
    // </summary>
    onRequest: function($super, xhr)
    {
        // See if we have disconnected and don't need to do anything.
        if (!this.connected)
            return;
        
        // Handle the XMLHttpRequest if there is one.
        if (xhr != null)
        {
            this.cachedBalance = JSON.parse(xhr.responseText)["result"];
        }
        
        // (Re)start a new XMLHttpRequest.
        var call = new XMLHttpRequest();
        var ref = this;
        call.open("POST", this.state.url, true, this.settings.username, this.settings.password);
        call.onreadystatechange = function() 
        {
            if (call.readyState == 4)
                ref.onRequest(call);
        };
        call.send(JSON.stringify(this.state.request));
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
        this.cachedBalance = null;
        return true;
    },
    
    // <summary>
    // Returns the current balance of the account.
    // </summary>
    getBalance: function($super)
    {
        // If this returns null, it means there's no value yet.
        return this.cachedBalance;
    }
    
});