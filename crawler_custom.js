import request from 'request';
import Crawler from './crawler';

class CrawlerCustom extends Crawler {

  constructor(concurrency) {
    super(concurrency);
    this.url_list  = [];
  }

  start(initURL) {
    this.current_message = "Initializing...";
    this.log();
    this.updateLiveConnections(1);

    //mark as visited
    //Marking it before process to avoid adding duplication during a process.
    this.url_visited[initURL] = true;
    this.current_queue[initURL] = true;
    this.log();

    //writer object
    let writerRow = {
      url: initURL,
      started_on: new Date(),
      ended_on: null,
      num_links: null,
      response_code: null
    };
    let self = this;
    request(initURL, (error, response, body) => {
      delete this.current_queue[initURL];
      this.log();
      if(error) {
        self.updateLiveConnections(-1);
        this.current_message = error.message;
        this.log();
        //Write to CSV File
        writerRow.ended_on = new Date();
        writerRow.response_code = 'Error';
        this.writer.write(writerRow);
        //Exit
        process.exit(1);
      } else {
        if(response.statusCode === 200) {
          self.updateLiveConnections(-1);

          //Fetch new URLs
          let links = self.fetchNewURLs(body);

          //Write to CSV File
          writerRow.ended_on      = new Date();
          writerRow.response_code = response.statusCode;
          writerRow.num_links     = links.length;
          self.writer.write(writerRow);

          //Update URL List
          self.url_list = self.url_list.concat(links);

          //Start the concurrent connections
          for(let i = 0; i < self.concurrency; i++) {
            self.crawl();
          }
        } else {
          self.updateLiveConnections(-1);
          //Write to CSV File
          writerRow.ended_on = new Date();
          writerRow.response_code = response.statusCode;
          self.writer.write(writerRow);
          //Exit
          process.exit(1);
        }
      }
    });

  }

  crawl() {
    if(!this.url_list.length) {
      this.current_message = "All URLs processed.";
      this.log();
      this.writer.end();
      return;
    }

    //Breadth First Crawling (FIFO).
    let newURL = this.url_list.shift();

    //Check for duplicates
    if(newURL in this.url_visited) {
      return this.crawl();
    }

    this.current_message = "Crawling: " + newURL;
    this.log();

    this.updateLiveConnections(1);

    //mark as visited
    //Marking it before process to avoid adding duplication during a process.
    this.url_visited[newURL] = true;
    this.current_queue[newURL] = true;
    this.log();

    //writer object
    let writerRow = {
      url: newURL,
      started_on: new Date(),
      ended_on: null,
      num_links: null,
      response_code: null
    };

    let self = this;
    request(newURL, (error, response, body) => {
      delete this.current_queue[newURL];
      this.log();
      if(error) {
        self.updateLiveConnections(-1);
        //Add new crawler to the queue.
        self.crawl();
      } else if(response.statusCode === 200) {
        //Fecth new links.
        let links = self.fetchNewURLs(body);

        //Write to CSV File
        writerRow.ended_on      = new Date();
        writerRow.response_code = response.statusCode;
        writerRow.num_links     = links.length;
        self.writer.write(writerRow);

        //Update URL List
        self.url_list = self.url_list.concat(links);

        self.updateLiveConnections(-1);

        //Add new crawler to the queue.
        self.crawl();
      } else {
        self.updateLiveConnections(-1);
        //Write to CSV File
        writerRow.ended_on = new Date();
        writerRow.response_code = response.statusCode;
        self.writer.write(writerRow);
        //Add new crawler to the queue.
        self.crawl();
      }
    });

  }

}

export default CrawlerCustom;
