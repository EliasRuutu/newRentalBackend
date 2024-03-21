var express = require("express");
var router = express.Router();
var https = require("https");
var fs = require("fs");
var unzip = require("unzip-stream");
var { XMLParser } = require("fast-xml-parser");
var big_json = require("big-json");

download("accommodations");
download("descriptions");
setInterval(() => {
  download("accommodations");
  download("descriptions");
}, 3600000);
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/accommodations", function (req, resp, next) {
  const readStream = fs.createReadStream("./xml/accommodations.json");
  const parseStream = big_json.createParseStream();

  parseStream.on("data", function (pojo) {
    resp.setHeader("Access-Control-Allow-Origin", "*");
    return resp.json({
      data: pojo["AccommodationList"]["Accommodation"].slice(0, 10),
    });
  });
  readStream.pipe(parseStream);
});

router.get("/descriptions", function (req, resp, next) {
  const readStream = fs.createReadStream("./xml/descriptions.json");
  const parseStream = big_json.createParseStream();

  parseStream.on("data", function (pojo) {
    resp.setHeader("Access-Control-Allow-Origin", "*");
    return resp.json({
      data: pojo["AccommodationList"]["Accommodation"].slice(0, 10),
    });
  });
  readStream.pipe(parseStream);
});

async function download(name) {
  const url = `https://feeds.avantio.com/${name}/836efa4efbe7fa63f2ebbae30d7b965f`;
  console.log("======================>", `./xml/${name}.zip`);
  https.get(url, (res) => {
    if (res) {
      res
        .pipe(fs.createWriteStream(`./xml/${name}.zip`))
        .on("close", function () {
          fs.createReadStream(`./xml/${name}.zip`)
            .pipe(unzip.Parse())
            .on("entry", function (entry) {
              entry
                .pipe(fs.createWriteStream(`./xml/${name}.xml`))
                .on("close", function () {
                  fs.readFile(`./xml/${name}.xml`, function (err, data) {
                    const parser = new XMLParser();
                    const json = parser.parse(data);
                    const writeStream = fs.createWriteStream(
                      `./xml/${name}.json`
                    );
                    const parseStream = big_json.createStringifyStream({
                      body: json,
                    });
                    parseStream.pipe(writeStream);
                  });
                });
            });
        });
    }
  });
}

module.exports = router;
