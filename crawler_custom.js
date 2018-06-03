import request from 'request';
import Crawler from './crawler';

class CrawlerCustom extends Crawler {

  constructor(concurrency) {
    super(concurrency);
    this.url_list  = [];
  }

  start(initURL) {
    console.log("Initializing...");
    this.updateLiveConnections(1);

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
      if(error) {
        self.updateLiveConnections(-1);
        console.log(error.message);
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
          writerRow.ended_on = new Date();
          writerRow.response_code = response.statusCode;
          writerRow.num_links = links.length;
          self.writer.write(writerRow);
          self.url_list = self.url_list.concat(links);

          //Start the concurrent connections
          self.crawl();
          self.crawl();
          self.crawl();
          self.crawl();
          self.crawl();
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
      console.log("URL List Empty");
      return;
    }

    //Breadth First Crawling (FIFO).
    let newURL = this.url_list.shift();

    //Check for duplicates
    if(newURL in this.url_visited) {
      return this.crawl();
    }

    console.log("Crawling: ", newURL);

    this.updateLiveConnections(1);

    //mark as visited
    this.url_visited[newURL] = true;

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
      if(error) {
        self.updateLiveConnections(-1);
        //Add new crawler to the queue.
        self.crawl();
      } else if(response.statusCode === 200) {
        //Fecth new links.
        let links = self.fetchNewURLs(body);
        self.url_list = self.url_list.concat(links);

        //Write to CSV File
        writerRow.ended_on = new Date();
        writerRow.response_code = response.statusCode;
        writerRow.num_links = links.length;
        self.writer.write(writerRow);
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
