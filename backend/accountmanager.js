/*
 * Name:            Collate.Accounts
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  Manages the BitCoin accounts, ensuring they are connected and
 *  operational.
 *
 */

Collate.Backend.AccountManager = Class.create({

    // <summary>
    // Initializes the class.
    // </summary>
    initialize: function(parent)
    {
        this.Parent = parent;
        this.Storage = parent.Storage;
        this.Accounts = parent.Accounts;
        
        // Load all of the accounts that exist.
        var s = this.Storage.getRawItem("global-accounts");
        if (s != null)
            for (var i = 0; i < s.length; i += 1)
                this.Accounts[s[i].name] = new Collate.Account[s[i]["type"]](s[i].name, s[i].parameters);
        
        // Now ask all of them to connect.
        for (var i in this.Accounts)
            this.Accounts[i].connect();
    }
    
});