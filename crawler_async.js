import cheerio from 'cheerio';
import request from 'request';
import csvWriterStream from 'csv-write-stream';
import fs from 'fs';
import async from 'async';

class CrawlerAsync {
  constructor(concurrency) {
    //initialize queue
    this.concurrency      = concurrency;
    this.liveConnections  = 0;
    this.url_visited      = {};
    this.writer           = csvWriterStream();
    this.writer.pipe(fs.createWriteStream('logs.csv'));

    this.queue = async.queue(this.crawl.bind(this), concurrency);
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

  start(initURL) {
    console.log("Initializing...");
    this.queue.push(initURL);
  }

  crawl(url, callback) {
    if(url in this.url_visited) {
      return callback();
    }
    console.log("Crawling: ", url);
    this.updateLiveConnections(1);
    //mark as visited
    this.url_visited[url] = true;

    //writer object
    let writerRow = {
      url: url,
      started_on: new Date(),
      ended_on: null,
      num_links: null,
      response_code: null
    };

    let self = this;
    request(url, (error, response, body) => {
      if(error) {
        self.updateLiveConnections(-1);
        return callback();
      }
      if(response.statusCode === 200) {
        let links = self.fetchNewURLs(body);

        //Write to CSV File
        writerRow.ended_on = new Date();
        writerRow.response_code = response.statusCode;
        writerRow.num_links = links.length;
        self.writer.write(writerRow);
        self.updateLiveConnections(-1);

        //Update Queue
        links.forEach((link) => {
          self.queue.push(link);
        });
      } else {
        self.updateLiveConnections(-1);
        //Write to CSV File
        writerRow.ended_on = new Date();
        writerRow.response_code = response.statusCode;
        this.writer.write(writerRow);
      }
      return callback();
    });

  }
}

export default CrawlerAsync;
