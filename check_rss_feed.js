// Native fetch is available in recent Node versions

const id = "835599320"; // TikTok
const pageUrl = "https://itunes.apple.com/us/rss/customerreviews/page=1/id=" + id + "/sortby=mostrecent/json";

console.log("Fetching: " + pageUrl);

fetch(pageUrl)
    .then(res => res.json())
    .then(body => {
        const feed = body.feed;
        // console.log("Feed keys:", Object.keys(feed));
        
        // Check for potential metadata
        // console.log("Feed Title:", JSON.stringify(feed.title, null, 2));
        // console.log("Feed Icon?", JSON.stringify(feed.icon, null, 2)); // Often available as 'icon'
        // console.log("Feed Author:", JSON.stringify(feed.author, null, 2));
        
        // Dump the whole feed object minus entries to see what we have
        const feedMeta = {...feed};
        delete feedMeta.entry; // Remove big entries array
        console.log("Feed Metadata:\n", JSON.stringify(feedMeta, null, 2));


    })
    .catch(err => console.error(err));
