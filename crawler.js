import cheerio from 'cheerio';
import request from 'request';

class Crawler {

  constructor(concurrency) {
    this.url_list         = [];
    this.concurrency      = concurrency;
    this.liveConnections  = 0;
    this.url_visited      = {};
  }

  updateLiveConnections(i) {
    this.liveConnections += i;
    console.log("Num Connections: ", this.liveConnections);
  }

  fetchNewURLs(body) {
    let $ = cheerio.load(body);

    let self = this;
    $("a[href^='/']").each(function() {
      self.url_list.push("http://www.medium.com/" + $(this).attr('href'));
    });

    $("a[href^='http']").each(function() {
      if($(this).attr('href').indexOf("medium.com") > -1){
        self.url_list.push($(this).attr('href'));
      }
    });

    $("a[href^='https']").each(function() {
      if($(this).attr('href').indexOf("medium.com") > -1){
        self.url_list.push($(this).attr('href'));
      }
    });
  }

  start(initURL) {
    console.log("Initializing...");
    this.updateLiveConnections(1);

    let self = this;
    request(initURL, (error, response, body) => {
      if(error) {
        self.updateLiveConnections(-1);
        console.log(error.message);
        process.exit(1);
      } else {
        if(response.statusCode === 200) {
          self.updateLiveConnections(-1);

          //Fetch new URLs
          self.fetchNewURLs(body);

          //Start the concurrent connections
          self.crawl();
          self.crawl();
          self.crawl();
          self.crawl();
          self.crawl();
        } else {
          self.updateLiveConnections(-1);
          console.log(error.message);
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

    let self = this;
    request(newURL, (error, response, body) => {
      if(response && response.statusCode === 200) {
        //Fecth new links.
        self.fetchNewURLs(body);
      }

      self.updateLiveConnections(-1);
      //Add new crawler to the queue.
      self.crawl();
    });

  }

}

export default Crawler;
