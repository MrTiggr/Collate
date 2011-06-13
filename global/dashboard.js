/*
 * Name:            Collate.Global.Dashboard
 * Author:          James Rhodes
 * License:         MIT License
 *
 * Description:
 *  The global dashboard that shows information about all of the accounts
 *  the user has set up.
 *
 */

Collate.Global.Dashboard = Class.create(Collate.Global, {

    // <summary>
    // Initializes the dashboard.
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
                    target: Backend.Pages["EditAccount"],
                    page: null
                }
            ];
    },
    
    // <summary>
    // Requests the UKI UI to show in the main area.
    // </summary>
    // <param name="attach">Call this function with the generated UKI before modifying elements.</param>
    getUI: function(attach, uiid)
    {
        this.uiid = uiid;
        
        // Perform the initial setup.
        attach(uki(
            { view: 'Box', rect: '0 0 1000 1000', anchors: 'top left right width', childViews: [
        
                { view: 'Label', rect: '208 70 600 0', anchors: 'top', text: 'Welcome to Collate!', style: { fontSize: '20px' } },
        
                // Main area
                { view: 'Box', rect: '200 100 600 307', anchors: 'top', id: this.uiid + '-BorderBox', childViews: [
                    { view: 'Label', rect: '10 10 580 280', anchors: 'left top', multiline: true, id: this.uiid + '-Status', text: '' },
                    { view: 'Label', rect: '10 80 580 14', anchors: 'left top', text: 'About Collate', style: { fontSize: '14px', fontWeight: 'bold' } },
                    { view: 'Label', rect: '10 100 580 20', anchors: 'left top', text: 'Collate v' + Collate.Version + ' © James Rhodes 2011.  Licensed under an MIT license.' },
                    
                    { view: 'Label', rect: '10 140 580 14', anchors: 'left top', text: 'About Plugins', style: { fontSize: '14px', fontWeight: 'bold' } },
                    { view: 'Label', rect: '10 160 580 20', anchors: 'left top', text: 'Local Server:' },
                    { view: 'Label', rect: '150 160 580 20', anchors: 'left top', text: '© James Rhodes 2011' },
                    { view: 'Label', rect: '10 180 580 20', anchors: 'left top', text: 'MtGox:' },
                    { view: 'Label', rect: '150 180 580 20', anchors: 'left top', text: '© Matt Hiddle 2011' },
                    { view: 'Label', rect: '10 200 580 20', anchors: 'left top', text: 'OzCoin:' },
                    { view: 'Label', rect: '150 200 580 20', anchors: 'left top', text: '© James Rhodes 2011' },
                    
                    { view: 'Label', rect: '10 240 580 14', anchors: 'left top', text: 'Donate', style: { fontSize: '14px', fontWeight: 'bold' } },
                    { view: 'Label', rect: '10 260 580 20', anchors: 'left top', text: 'James Rhodes' },
                    { view: 'Label', rect: '150 260 580 20', anchors: 'left top', text: '1BxvwaEueWBqFB9nZUev2JxnJeRSbG5oeh' },
                    { view: 'Label', rect: '10 280 580 20', anchors: 'left top', text: 'Matt Hiddle' },
                    { view: 'Label', rect: '150 280 580 20', anchors: 'left top', text: '13AbNrFuNt95oDBboKscYtqGEynRP5Bvsh' }

                ] }
                
            ] }
        ));
        
        // Now modify and attach events to the elements.
        uki('#' + this.uiid + '-BorderBox').dom().style.border = 'solid 1px #CCC';
        uki('#' + this.uiid + '-BorderBox').dom().style.borderRadius = '15px';
        
        // Update the status information.
        if (Collate.Backend.Accounts.length == 0)
            uki('#' + this.uiid + '-Status').text("You don't appear to have any accounts set up.  To get started with Collate, click the \"New Account\" button at the top of the page.");
        else
            uki('#' + this.uiid + '-Status').text("You have " + Collate.Backend.Accounts.length + " accounts set up.");
    }
    
});