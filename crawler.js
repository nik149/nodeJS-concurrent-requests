import axios from 'axios';

class Crawler {

  constructor(concurrency) {
    this.url_list         = [];
    this.concurrency      = concurrency;
    this.liveConnections  = 0;
    this.url_visited      = {};
  }

  updateLiveConnections(i) {
    this.liveConnections += i;
    console.log("Num Connections: ", liveConnections);
  }

  start(initURL) {
    this.updateLiveConnections(1);

    axios.get(initURL).then(response => {
      if(response.statusCode === 200) {
        this.updateLiveConnections(-1);
        //Push new URLs
        this.url_list.concat(this.fetchNewURLs(response.data));

        //Start the concurrent connections
        this.crawl();
        this.crawl();
        this.crawl();
        this.crawl();
        this.crawl();

      } else {
        throw new Error('Invalid Response Code from Server ', response.statusCode);
      }
    })
    .catch(error => {
      this.updateLiveConnections(-1);
      console.log(error.message);
      process.exit(1);
    });
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

    return links;
  }

  crawl() {
    console.log("Crawling");
    if(!this.url_list.length) {
      console.log("URL List Empty");
      return;
    }

    //Breadth First Crawling.
    let newURL = this.url_list.shift();

    if(newURL in this.url_visited) {
      console.log("Duplicate");
      return;
    }
    this.updateLiveConnections(1);
    this.url_visited[newURL] = true;

    axios.get(newURL)
    .then(response => {
      if(response.statusCode === 200) {
        this.updateLiveConnections(-1);

        //Concat new links from this page.
        this.url_list.concat(this.fetchNewURLs(response.data));

        //Add new to the queue.
        this.crawl();
      } else {
        throw new Error('Invalid Response Code from Server ', response.statusCode);
      }
    })
    .catch(error => {
      this.updateLiveConnections(-1);
      console.log(error.message);
      this.crawl();
    });
  }

}
