import request from 'request';
import async from 'async';

import Crawler from './crawler';

class CrawlerAsync extends Crawler {
  constructor(concurrency) {
    super(concurrency)
    this.queue = async.queue(this.crawl.bind(this), concurrency);
    this.queue.drain = () => {
      this.current_message = "All URLs processed.";
      this.log();
      this.writer.end();
    }
  }

  start(initURL) {
    this.current_message = "Initializing...";
    this.log();
    this.queue.push(initURL);
  }

  crawl(url, callback) {
    if(url in this.url_visited) {
      return callback();
    }
    this.current_message = "Crawling: " + url;
    this.log();

    this.updateLiveConnections(1);

    //mark as visited.
    //Marking it before process to avoid adding duplication during a process.
    this.url_visited[url] = true;
    this.current_queue[url] = true;
    this.log();

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
      delete this.current_queue[url];
      this.log();
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
