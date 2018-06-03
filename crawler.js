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
    let links = [];

    while (body.length > 0) {
      let atagIndex = body.indexOf('<a');
      if(atagIndex == -1) {
        break;
      }
      body = body.substring(atagIndex);
      let atagCloseIndex = body.indexOf('>');
      let atag = body.substring(0, atagCloseIndex);
      let linkStart = atag.indexOf('href=');

      let linkCloseIndex;
      if(linkStart != -1) {
        atag = atag.substring(linkStart+5);
        if(atag[0] == '"') {
           linkCloseIndex = atag.substring(1).search('"');
        } else if(atag[0] == "'") {
           linkCloseIndex = atag.substring(1).search("'");
        }

        if(linkCloseIndex != undefined) {
          let link = atag.substring(1, linkCloseIndex);
          if(link.startsWith('http') && link.indexOf('medium.com') > -1) {
            links.push(link);
          } else if (link.startsWith('//')) {
            links.push("http:" + link);
          } else if(link.startsWith('/')) {
            links.push("http://www.medium.com/" + link);
          }
        }
      }
      body = body.substring(atagCloseIndex + 1);
    }

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
