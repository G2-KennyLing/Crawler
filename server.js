const cheerio = require("cheerio");
const request = require("request-promise");
const fs = require("fs");
const { Parser } = require("json2csv");
const http = require("http");
const url = require("url");
const crawler = async(key) => {
    try {
        console.log(key);
        console.log(`https://99shirt.com/search?type=product&q=${key}*`);
        request(
            "https://99shirt.com/search?type=product&q=" + key + "*",
            (error, response, html) => {
                if (!error && response.statusCode == 200) {
                    const $ = cheerio.load(html);
                    let data = [];
                    $(".product-wrap").each((index, el) => {
                        const title = $(el)
                            .find(" a div.product-details span.title")
                            .text();
                        const image =
                            "http:" +
                            $(el).find(" div.product_image a div.image__container img").data()
                            .src;
                        const price = $(el)
                            .find("a div.product-details span.price span span.money ")
                            .text();
                        const link =
                            "https://99shirt.com" +
                            $(el)
                            .find(" a")
                            .get()
                            .map((pro) => {
                                return pro.attribs.href;
                            });

                        data.push({
                            title,
                            image,
                            price,
                            link,
                        });
                    });
                    if (data.length == 0) {
                        return console.log("Not have data");
                    }
                    const fields = [
                        { label: "Title", value: "title" },
                        { label: "Link_Image_1", value: "image" },
                        { label: "Link", value: "link" },
                        { label: "Price", value: "price" },
                    ];
                    const parser = new Parser(fields);
                    const csv = parser.parse(data);
                    fs.appendFileSync("newmoon_import_template.csv", csv);
                } else {
                    console.log(error);
                }
            }
        );
    } catch (error) {
        console.log(error);
    }
};

fs.readFile("./index.html", function(err, html) {
    if (err) {
        throw err;
    }
    http
        .createServer(function(req, res) {
            const reqUrl = url.parse(req.url).pathname;
            if (reqUrl == "/") {
                res.writeHeader(200, { "Content-Type": "text/html" });
                res.write(html);
                res.end();
            } else if (reqUrl == "/crawl") {
                const query = url.parse(req.url).query;
                console.log(query.split("=")[1]);
                const key = query.split("=")[1];
                crawler(key);
                res.writeHeader(200, { "Content-Type": "text/html" });
                res.write(html);
                res.write("<div>success</div>");
                res.end();
            }
        })
        .listen(8000);
});