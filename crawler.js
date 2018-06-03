import cheerio from 'cheerio';
import csvWriterStream from 'csv-write-stream';
import fs from 'fs';

class Crawler {

  constructor(concurrency) {
    this.concurrency      = concurrency;
    this.liveConnections  = 0;
    this.url_visited      = {};
    this.writer           = csvWriterStream();
    this.writer.pipe(fs.createWriteStream('logs.csv'));
  }

  updateLiveConnections(i) {
    this.liveConnections += i;
    console.log("Num Connections: ", this.liveConnections);
  }

  fetchNewURLs(body) {
    let $ = cheerio.load(body);

    let links = [];
    $("a[href^='/']").each(function() {
      links.push("http://www.medium.com/" + $(this).attr('href'));
    });

    $("a[href^='http']").each(function() {
      if($(this).attr('href').indexOf("medium.com") > -1){
        links.push($(this).attr('href'));
      }
    });

    $("a[href^='https']").each(function() {
      if($(this).attr('href').indexOf("medium.com") > -1){
        links.push($(this).attr('href'));
      }
    });

    return links;
  }
}

export default Crawler;
