const cheerio = require('cheerio');
const request = require('request');
//const striptags = require('striptags');
const _ = require('lodash');
const S = require('string')
const fs = require('fs');

const Crawler = require("simplecrawler");

console.log('here');

var crawler = Crawler("http://www.afterth.at");

//configure
crawler.interval = 5000; // Ten seconds
crawler.maxConcurrency = 3;
crawler.maxDepth = 3;
crawler.downloadUnsupported=false;
crawler.supportedMimeTypes = [/html/i, /plain/i];
crawler.scanSubdomains=true;

//events
//FOR DEBUGGING, EMIT EVENTS FROM EVENT QUEUE

// var originalEmit = crawler.emit;
// crawler.emit = function(evtName, queueItem) {
//     crawler.queue.countItems({ fetched: true }, function(err, completeCount) {
//         if (err) {
//             throw err;
//         }
//
//         crawler.queue.getLength(function(err, length) {
//             if (err) {
//                 throw err;
//             }
//
//             console.log("fetched %d of %d — %d open requests, %d open listeners",
//                 completeCount,
//                 length,
//                 crawler._openRequests.length,
//                 crawler._openListeners);
//         });
//     });
//
//     console.log(evtName, queueItem ? queueItem.url ? queueItem.url : queueItem : null);
//     originalEmit.apply(crawler, arguments);
// };


crawler.discoverResources = function(buffer, queueItem) {
    var $ = cheerio.load(buffer.toString("utf8"));
    return $("a[href]").map(function () {

      var href = $(this).attr("href").trim();
      var n = href.indexOf('#');
      if(n > -1){
        var parts = href.split('#');
        href = parts[0].trim();
      }

      if( href !== '#' && href !== '' && !_.includes(href, '.jpg') && !_.includes(href, '.png') && !_.includes(href, '.gif') && !_.includes(href, '.svg') && !_.includes(href, '.pdf')){
        fs.appendFile(__dirname+'/results/'+queueItem.host+'.links.txt', $(this).attr("href")+',', (err) => {
          if (err) throw err;
          console.log('The "data to append" was appended to file!');
        });
        return href;
      }
    }).get();
};

//events

crawler.on("fetchstart", function (queueItem, requestOptions) {
  console.log('fetch started:', queueItem.url);
});

crawler.on("complete", function(){
  console.log('crawler complete with domain: ', this.host);
});

crawler.on("fetchcomplete", function (queueItem, responseBuffer, response) {

    console.log('fetched!', queueItem.url);
    console.log("It was a resource of type %s", response.headers['content-type']);

    var $ = cheerio.load(responseBuffer.toString("utf8"));

    //get the page title
    var title = $('title').text();
    console.log('page title:', title);

    //pull all the links
    //looking for all specialty media links
    var socialLinks = [];

    $("a[href]").map(function () {
      var hrefLink = $(this).attr('href');

      //substrings to check against for social media links
      var subs = {
        facebook: "facebook.com",
        twitter: "twitter.com",
        instagram: "instagram.com",
        linkedin: "linkedin.com",
        googlePlus: "plus.google.com",
        rss: "type=rss",
        atom: "type=atom",
        rss: "ninjarsssyndicator"
      }

      if(hrefLink && hrefLink != '') {
        for(var propt in subs){
          var sub = subs[propt];
          //console.log(hrefLink + ' vs ' + sub);
          if(hrefLink.includes(sub)){
            socialLinks.push({
                href : hrefLink,
                type: propt,
                host: queueItem.host,
                sourceUrl: queueItem.url
            });
          }
        }
      }

    })

    if(socialLinks.length > 0) {console.log(JSON.stringify(socialLinks, undefined, 2));}


    //var bodyString = responseBuffer.toString();
    //console.log(bodyString);
    //console.log("Fetched", queueItem.url, responseBuffer.toString());


});



crawler.start();
