/*
 * Name:            Collate.Global.NewAccount
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  The global new account page that allows the user to create a new account.
 *
 */

Collate.Global.NewAccount = Class.create(Collate.Global, {

    // <summary>
    // Initalizes the new account page.
    // </summary>
    initialize: function()
    {
    },
    
    // <summary>
    // Requests the UKI UI to show in the main area.
    // </summary>
    // <param name="attach">Call this function with the generated UKI before modifying elements.</param>
    getUI: function(attach)
    {
        // Determine options.
        var opts = [];
        for (var i in Collate.Account)
        {
            if (Collate.Account[i] != null && typeof(Collate.Account[i]) == "function" && Collate.Account[i].Name != undefined)
                opts[opts.length] = { value: Collate.Account[i], text: Collate.Account[i].Name };
        }
        
        // Perform the initial setup.
        attach(uki(
            { view: 'Box', rect: '0 0 1000 1000', anchors: 'top left right width', childViews: [
        
                { view: 'Label', rect: '208 70 600 0', anchors: 'top', text: 'New Account Wizard', style: { fontSize: '20px' } },
        
                // Main area
                { view: 'Box', rect: '200 100 600 300', anchors: 'top', id: 'NewAccount-BorderBox', childViews: [
                    { view: 'Label', rect: '10 10 300 22', anchors: 'left top', text: 'What kind of account do you want to add?' },
                    { view: 'Select', rect: '320 10 270 22', anchors: 'left top', id: 'NewAccount-AccountType', rowHeight: 22, options: opts },
                    { view: 'Box', rect: '0 40 600 0', anchors: 'top', id: 'NewAccount-BorderLine1', childViews: [ ] },
                    
                    { view: 'Label', rect: '10 50 580 280', anchors: 'left top', id: 'NewAccount-AccountDesc', multiline: true, html: opts[0].value.Description },
                ] }
                
            ] }
        ));
        
        // Now modify and attach events to the elements.
        uki('#NewAccount-BorderBox').dom().style.border = 'solid 1px #CCC';
        uki('#NewAccount-BorderBox').dom().style.borderRadius = '15px';
        uki('#NewAccount-BorderLine1').dom().style.border = 'none';
        uki('#NewAccount-BorderLine1').dom().style.borderTop = 'solid 1px #CCC';
        uki('#NewAccount-AccountType').bind('click', function ()
        {
            var value = uki('#NewAccount-AccountType').value;
            uki('#NewAccount-AccountDesc').html(value.Description);
        });
    }
    
});