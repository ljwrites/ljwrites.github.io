var postURL = "https://www.dreamwidth.org/update.bml?event=";
var curURL = window.location.href;

// get the currently selected text (no longer used in boost)
function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

// updated, get currently selected html
function getSelectionHtml() {
    var html = "";
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    } else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().htmlText;
        }
    }
    return html;
}

// check if it's locked. this checks for a different element now because the previous one inexplicably failed weirdly for a few people. ¯\_(ツ)_/¯
function isLocked() {
    return document.getElementsByClassName("security-protected").length > 0;
}

function confirmBoost() {
    var doPost = !isLocked();
    if (!doPost) {
        doPost = confirm("Post is access-locked. Continue?");
    }
    return doPost;
}

function getUserName(subDomain,siteName,folderURL,subFolderURL,subSubFolderURL) {

    // arrays of sites known to DW for the user tag
    // sites where subdomains are user names, dw style
    var subDomainUserNames = [
        "dreamwidth.org", //user.dreamwidth.org
        "deadjournal.com", //user.deadjournal.com
        "insanejournal.com", //user.insanejournal.com
        "livejournal.com", //user.livejournal.com
        "tumblr.com", //user.tumblr.com
        "wordpress.com", //user.wordpress.com
        "blogger.com" //user.blogspot.* SPECIAL CASE FOR COUNTRY-SPECIFIC TLDs
        ];

    // sites where user names are extracted from on-page links (may overlap with folderUserNames, depending on page type)
    var linkUserNames = [
        "archiveofourown.org", //<a rel="author" href="/users/username/pseuds/pseudonym">
        "fanfiction.net", //<a class='xcontrast_txt' href='/u/[numstring]/User-Name'>User Name</a>
        "medium.com", //<a class="ds-link ds-link--styleSubtle ui-captionStrong u-inlineBlock link link--darken link--darker" href="https://medium.com/@username" data-action="show-user-card" data-action-value="4f7002092ec" data-action-type="hover" data-user-id="4f7002092ec" dir="auto">
        ];

    // sites where user names are in folders
    var folderUserNames = [
        "deviantart.com", //www.deviantart.com/username/
        "facebook.com", //www.facebook.com/username/
        "github.com", //gist.github.com/username
        "instagram.com", //www.instagram.com/username
        "medium.com", //https://medium.com/@username/title
        "pinboard.in", //https://pinboard.in/u:username/b:boardid
        "plurk.com" //https://www.plurk.com/username
        ];
    
    // sites where user names are in subfolders
    var subFolderUserNames = [    
        "archiveofourown.org", // https://archiveofourown.org/users/username/etc/etc
        "fanfiction.net", // https://www.fanfiction.net/u/userid/username
        "journalfen.com", //journalfen.com/users/username
        "last.fm", //https://www.last.fm/user/username/etc/etc/
        "lj.rossia.org" //http://lj.rossia.org/community/comm/ , http://lj.rossia.org/users/username/
        ];
     
     // sites recognized by dw but where script is unusable
        //"pinterest.com", //pinterest.* SPECIAL CASE FOR COUNTRY-SPECIFIC TLDs <a href="/username/"><div data-test-id="creator-profile-name">
        //"pinterest.com", //https://www.pinterest.com/username (if folder is not 'pin')
        //"ravelry.com" //<a href="https://www.ravelry.com/designers/user-name"> 
        //"ravelry.com", //https://www.ravelry.com/designers/username
        //"twitter.com", //www.twitter.com/username/etc
    // username cannot be retrieved
        //"youtube.com" //no easy way to retrieve username, actually not sure what username is...
     
     // other recognized sites are omitted due to being defunct
    
    // match against sites known to Dreamwidth to insert the 'site' attribute of the user tag, if one can be identified
     
     // first, easiest case--sites where subdomains are user names
     if (subDomain != 'lj' && siteName != 'rossia.org') //check if it's worth running the loop
     {  
         if (siteName.includes('blogspot.co')) {
             return subDomain;
         }
         
         var i = 0;
         var knownSites = subDomainUserNames;
         
         while (i<knownSites.length) {

             if (siteName==knownSites[i]) {
                 if (subDomain ==  '' || subDomain == 'www')
                 {// if it's one of the sites that have subdomain usernames but there's no username, stop
                     return;
                 }
                 else {
                     return subDomain;
                 }
             }
             i++;
         }
     }
     
     // second, parse out links for user names  

     if (siteName == "archiveofourown.org") {
         if (Boolean(folderURL) && folderURL=='users' && Boolean(subFolderURL)) { //if on user page
            return subFolderURL;
         } else { //if on story page
             try {
                 var authorURL = document.querySelector('a[rel="author"]').getAttribute('href');
             } catch(err) {
                 return;
             }
             var authorURLSplit = authorURL.substr(1).split('/');
             if(authorURLSplit[0] == "users" && authorURLSplit[1].length >= 1) {
                 return authorURLSplit[1];
             }
         }
     } else if (siteName=="fanfiction.net") {
         if (Boolean(folderURL) && folderURL == 'u' && Boolean(subSubFolderURL)) { // user page
             return subSubFolderURL;
         } else {
             try {
                 var authorURL = document.querySelector('a[href~="/u/"]').getAttribute('href');
             }
             catch(err) {
                 return;
             }
             var authorURLSplit = authorURL.substr(1).split('/');
             if(authorURLSplit[0] == "u" && authorURLSplit[2].length > 0) {
                 return authorURLSplit[2];
             }
         }
     } else if (siteName=="medium.com") {
         if(Boolean(folderURL) && folderURL.charAt(0)=='@') { // user page, or article under user URL
             return folderURL.substr(1);
         } else { // parse author link
             try {
                 var authorURL = document.querySelector('a[href~="medium.com/@"]').getAttribute('href');
             } catch(err) {
                 return;
             }
             return authorURL.substr(authorURL.indexOf('@')+1);
         }
     }
    
     // another simple case, where the first folder name is the username
     var i = 0;
     var knownSites = folderUserNames;
     while (i<knownSites.length) {
         if (siteName == knownSites[i] && Boolean(folderURL)) {
             return folderURL;
         }
         i++;
     }
     
    // if still no userName, try for a subfolder name
    // AO3, FFN, Ravelry.com are treated as branches of the link usernames above
    
    if (siteName=="journalfen.com") {
        if (Boolean(folderURL) && folderURL=='users' && Boolean(subFolderURL)) {
            return subFolderURL;
        }
    }
    if (siteName=="last.fm") {
        if(Boolean(folderURL) && folderURL=='user' && Boolean(subFolderURL)) {
            return subFolderURL;
        }
    }
    if (subDomain=="lj" && siteName=="rossia.org" && Boolean (folderURL) && Boolean(subFolderURL)) {
        if(folderURL=='community' || folderURL=='users') {
            return subFolderURL;
        }
    }
    
    return;        
}

// set up the post
function boost() {
    var selectedText = getSelectionHtml();
    var subjectText;

    // parsing url to break down into components for later processing
    
    // strip the https:// protocol string from the url
    var strippedURL = curURL.substr(curURL.indexOf('/')+2);
    
    // debug
    //alert(strippedURL);
    
    // split the stripped URL string by slashes
    // first part is server and domain name  
    var serverDomain = strippedURL.split('/')[0];
    var folderURL = strippedURL.split('/')[1]; //what's the error handling like for blank elements?
    var subFolderURL = strippedURL.split('/')[2];
    var subSubFolderURL = strippedURL.split('/')[3];
    
    //split the server and domain name parts by periods
    var serverDomainParts = serverDomain.split('.');
    
    //if array serverDomainParts has only one element, it's not a valid URL and the script should be aborted
    if (serverDomainParts.length <= 1)
    {return; }
    
    // if array serverDomainParts has two elements, give empty string for subdomain
    // siteName is top & second level domain
    else if (serverDomainParts.length == 2){
        var subDomain = '';
        var siteName = serverDomainParts[0] + '.' + serverDomainParts[1];
    }
     
    //if array serverDomainParts has three or (generally for non-U.S. domain names like co.uk) more elements, 
    //first element is subdomain, siteName is top & second level domain
    
    else if (serverDomainParts.length >=3){
        var subDomain = serverDomainParts[0];
        var siteName = serverDomainParts[1] + '.' + serverDomainParts[2];
    }
  
    // title of current post
    var curTitle = document.title;
    
    if (siteName=="dreamwidth.org")
    {curTitle = curTitle.substr(curTitle.lastIndexOf(' | ')+3);}

    // build up the content of signal boost optionally using selected text as an excerpt
    // Removed <p> formatting and starting with a blank string
    var linkText = ""; 
     
    var userName = getUserName(subDomain,siteName,folderURL,subFolderURL,subSubFolderURL);
   
    // commented out alternate 'From' text in case of no username
    //if(!userName)
        //{linkText = linkText + 'From <strong><a href="http://' + subDomain + (subDomain=='')?'':'.' + siteName + '">' + subDomain + (subDomain=='')?'':'.' + siteName + '</a>:</strong> ';}

    if (Boolean(userName) && userName.length > 0) {
        // clean up some sites' usernames
         if (userName.charAt(0) == '@') { // for Medium usernames; redundant
             var userName = userName.substr(1);
         } else if (userName.substr(0,2) == 'u:') { // pinboard.in
             var userName = userName.substr(2);
         }

         var userTagSiteAttribute = siteName;

         //exceptions for BlogSpot & Pinterest
         if (siteName.includes('blogspot.co')) {
             var siteName = 'blogspot.com';
             var userTagSiteAttribute = 'blogger.com';
         } else if (siteName.includes('pinterest.co')) {
             var siteName = 'pinterest.com';
             var userTagSiteAttribute = 'pinterest.com';
         }
     
     //if you have a username, add user tag
        var linkText = linkText + '<user name="' + userName + '" site=' + userTagSiteAttribute + '> posted: ';
    }
     
    //builds rest of boost
    linkText = linkText + '<strong><a href="' + curURL + '">' + curTitle + '</a></strong>';
    linkText = linkText ;
    if (selectedText.length > 0) {
        linkText = linkText + "\n<blockquote> " + selectedText + "</blockquote>";
        }
    
    // got rid of <p> formatting

    // checks if you are signalboosting a SignalBoost and prevents dangerous vortices from forming
    if (!curTitle.includes("Signal Boost: ")){
        subjectText = "Signal Boost: " + curTitle;}
    else {subjectText = curTitle;}

    postURL = postURL + encodeURIComponent(linkText) + "&subject=" + encodeURIComponent(subjectText);

    window.location = postURL;
}

if (confirmBoost()) {
    boost();
}
