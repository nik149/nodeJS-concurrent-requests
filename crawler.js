import cheerio from 'cheerio';
import csvWriterStream from 'csv-write-stream';
import fs from 'fs';

class Crawler {

  constructor(concurrency) {
    this.concurrency      = concurrency;
    this.live_connections  = 0;
    this.url_visited      = {};
    this.writer           = csvWriterStream();
    this.current_queue     = {};
    this.current_message   = '';
    this.writer.pipe(fs.createWriteStream('logs.csv'));
  }

  updateLiveConnections(i) {
    this.live_connections += i;
    this.log();
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

  log() {
    process.stdout.write("\x1B[2J");
    process.stdout.clearLine();
    process.stdout.cursorTo(0,0);
    process.stdout.write("Live Connections : " + this.live_connections + "\n");
    process.stdout.write("URLs Processed : " + Object.keys(this.url_visited).length + "\n");
    process.stdout.write(this.current_message + "\n");
    process.stdout.write("Current Queue: " + "\n");
    Object.keys(this.current_queue).forEach(key => {
      process.stdout.write(key + "\n");
    });
  }
}

export default Crawler;
