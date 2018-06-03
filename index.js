import CrawlerCustom from './crawler_custom.js';
import CrawlerAsync from './crawler_async.js';

let crawler;

if(process.argv[2] === 'custom') {
  crawler = new CrawlerCustom(5);
} else if(process.argv[2] === 'async'){
  crawler = new CrawlerAsync(5);
} else {
  console.log("Please provide valid arguments...");
  console.log("`npm start async` to launch crawler based on Async Library");
  console.log("`npm start custom` to launch custom crawler");
}

crawler.start('http://www.medium.com');
