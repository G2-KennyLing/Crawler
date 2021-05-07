const cheerio = require("cheerio");
const request = require("request-promise");
const fs = require("fs");
const { Parser } = require("json2csv");



const crawlPage = async(key) => {
    let num = 0;
    let link = key;
    let data = [];
    const crawler = async(key) => {
        try {
            await request.defaults({ 'proxy': "http://30c0fd28ae:LbSYfc4J@162.244.144.79:4444" })
                (
                    key,
                    async(error, response, html) => {
                        if (key.length == 0) return console.log("Link is not found");
                        if (!error && response.statusCode == 200) {
                            const $ = cheerio.load(html);
                            let dtt = [];
                            $(".product-wrap").each(async(index, el) => {
                                const Title = $(el)
                                    .find(" a div.product-details span.title")
                                    .text();
                                const Link_Image1 =
                                    "http:" +
                                    $(el).find("div.product_image a div.image__container img").data().src;
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
                                const obj = {
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
                                }
                                await request.defaults({
                                    'headers': { 'User-Agent': 'Mozilla/5.0' }
                                })(Link, async(error, response, html) => {

                                    if (response.statusCode == 200) {
                                        const $ = cheerio.load(html);
                                        const Link_Image3 = "http:" + $("div.gallery-cell ").eq(2).find("img").get().map((pro) => { return pro.attribs.src });
                                        const Link_Image4 = "http:" + $("div.gallery-cell ").eq(3).find("img").get().map((pro) => { return pro.attribs.src });
                                        obj.Link_Image3 = Link_Image3;
                                        obj.Link_Image4 = Link_Image4;


                                    } else console.log(error)
                                })
                                await dtt.push(obj);
                                await data.push(obj);


                            });
                            let page = '';
                            const paging = $(".paginate span ").text().split('');
                            for (let i = paging.length - 1; page.length <= 2; i--) {
                                if (+paging[i] % 1 == 0) {

                                    page += paging[i];
                                }

                            }
                            page = page.split('').reverse().join('');
                            if (dtt.length == 0) {
                                return 0;
                            }

                            if (num == +page) return 0;
                            num++;
                            console.log("Hi")
                            console.log(data);
                            await crawler(key + '&page=' + num);

                            return data;
                        } else {
                            console.log(error);
                        }
                    }
                );
            console.log("Crawling page:" + link + "&page=" + num);

        } catch (error) {
            console.log(error);
        }

    };
    crawler(key).then((data) => {
        const parser = new Parser();
        console.log("Hi")
        const csv = parser.parse(data);
        fs.appendFileSync("newmoon_import_template.csv", csv);
        console.log("Have " + data.length + " products crawled from:" + link);
    }).catch((error) => {
        console.log(error);
    })

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