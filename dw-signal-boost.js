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

// set up the post
function boost() {
    var selectedText = getSelectionHtml();
    var subjectText;

    // name of user who posted and domain of website
    var curName = curURL.substr(0, curURL.indexOf('.'));
    curName = curName.substr(curName.lastIndexOf('/')+1);
    var siteName = curURL.substr(curName.length+8+Boolean(location.protocol == 'https:'));
    siteName = siteName.substr(0, siteName.indexOf('/'));
    
    // title of current post
    var curTitle = document.title;
    
    if (siteName=="dreamwidth.org")
    {curTitle = curTitle.substr(curTitle.lastIndexOf(' | ')+3);}

    // build up the content of signal boost optionally using selected text as an excerpt
    // Fork note: Removed <p> formatting
    var linkText = "";
    
    //array of sites known to DW for the user tag
    var knownSites = [
        "dreamwidth.org",
        "archiveofourown.org",
        "blogger.com",
        "deadjournal.com",
        "delicious.com",
        "deviantart.com",
        "diigo.com",
        "etsy.com",
        "facebook.com",
        "fanfiction.net",
        "github.com",
        "imzy.com",
        "insanejournal.com",
        "instagram.com",
        "journalfen.com",
        "last.fm",
        "livejournal.com",
        "lj.rossia.org",
        "medium.com",
        "pinboard.in",
        "pinterest.com",
        "plurk.com",
        "ravelry.com",
        "twitter.com",
        "tumblr.com",
        "wordpress.com",
        "youtube.com"
        ];
    
    //match against sites known to Dreamwidth to insert the 'site' attribute of the user tag
    var i=0;
    var j=0;
    for(i=0; i<knownSites.length;i++) {
        if (siteName==knownSites[i]){
            linkText = linkText + '<user name="' + curName + '" site=' + knownSites[i] + '> posted: ';
            j++;
            break;
        }
    }
    
    //if matches none of the known sites, go to "from" link text
    if (j==0)
        {linkText = linkText + 'From <strong><a href="http://' + curName + '.' + siteName + '">' + curName + '.' + siteName + '</a>:</strong> ';}
    
    //builds rest of boost
    linkText = linkText + '<strong><a href="' + curURL + '">' + curTitle + '</a></strong>';
    linkText = linkText ;
    if (selectedText.length > 0) {
        linkText = linkText + "\n<blockquote> " + selectedText + "</blockquote>";
        }
    
    //Fork: got rid of <p> formatting

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
