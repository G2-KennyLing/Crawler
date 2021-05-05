const cheerio = require("cheerio");
const request = require("request-promise");
const fs = require("fs");
const { Parser } = require("json2csv");


const crawlPage = (key) => {
    let num = -1;
    let sumProd = 0;
    let link = key;
    const crawler = async(key) => {
        try {
            request(
                key,
                (error, response, html) => {
                    if (key.length == 0) return console.log("Link is not found")
                    if (!error && response.statusCode == 200) {
                        const $ = cheerio.load(html);
                        let data = [];
                        $(".product-wrap").each((index, el) => {
                            const Title = $(el)
                                .find(" a div.product-details span.title")
                                .text();
                            const Link_Image1 =
                                "http:" +
                                $(el).find(" div.product_image a div.image__container img").data()
                                .src;
                            const Link_Image2 = "http:" +
                                ($(el).find(" div.product_image a div.image__container img.secondary")).get().map((pro) => { return pro.attribs.src });
                            let Link =
                                "https://99shirt.com" +
                                $(el)
                                .find(" a")
                                .get()
                                .map((pro) => {
                                    return pro.attribs.href;
                                });
                            Link = Link.slice(0, Link.indexOf("?"));
                            data.push({
                                Title,
                                Link_Image1,
                                Link_Image2,
                                Link_Image3: '',
                                Link_Image4: '',
                                SKU: '',
                                Link,
                                mmolazi_type: '',
                                tags: '',
                                category: '',
                            });
                        });
                        let page = '';
                        const paging = $(".paginate span a").text().split('');
                        for (let i = 2; i < paging.length; i++) {
                            if ((+paging[i]) % 1 != 0) break;
                            page += paging[i]
                        }
                        if (data.length == 0) {
                            return 0;
                        }
                        const fields = [
                            { label: "Title", value: "Title" },
                            { label: "Link_Image_1", value: "Link_Image_1" },
                            { label: "Link", value: "Link" }
                        ];
                        sumProd += data.length;

                        const parser = new Parser(fields);
                        const csv = parser.parse(data);
                        fs.appendFileSync("newmoon_import_template.csv", csv);
                        if (num == +page) return 0;
                        num++;

                        crawler(key + '&page=' + num);

                    } else {
                        console.log(error);
                    }
                }
            );
            console.log("Crawling page:" + link + "&page=" + num);
            console.log("Have " + sumProd + " products crawled from:" + link);
        } catch (error) {
            console.log(error);
        }

    };
    crawler(key);
}

const readFileInput = () => {
    const data = fs.readFileSync('./input.txt', 'utf-8');
    const arr = data.split('\n');
    return arr;
}
const input = readFileInput();
const main = async(input) => {
    try {
        for (key of input) {

            crawlPage(key);
        }
    } catch (error) {
        console.log(error)
    }
}
main(input);