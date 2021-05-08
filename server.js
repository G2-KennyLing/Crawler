const cheerio = require("cheerio");
const request = require("request-promise");
const fs = require("fs");
const { parseAsync } = require("json2csv");

let csvf = Math.random();

const crawlPage = async(key) => {
    let num = 0;
    let page = '';
    let link = key;
    let sumPro = 0;
    request(key, (error, response, html) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);

            const paging = $(".paginate span ").text().split('');
            for (let i = paging.length - 1; page.length <= 2; i--) {
                if (+paging[i] % 1 == 0) {
                    page += paging[i];
                }

            }
            page = page.split('').reverse().join('');
        }
    })
    const crawler = async(key) => {
        try {
            await request.defaults({ 'proxy': "http://30c0fd28ae:LbSYfc4J@162.244.144.79:4444" })
                (
                    key,
                    async(error, response, html) => {
                        if (key.length == 0) return console.log("Link is not found");
                        if (!error && response.statusCode == 200) {
                            const $ = cheerio.load(html);
                            const dtt = [];
                            let data = [];
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
                                        await data.push(obj);
                                        await dtt.push(obj);

                                    } else console.log(error)
                                })

                            });

                            if (num == +page) {
                                return 0;
                            }

                            num++;

                            await crawler(key + '&page=' + num);
                            writeFile(data, csvf);
                            sumPro += dtt.length;
                            console.log("Have " + sumPro + " products crawled from:" + link);
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
    await crawler(key);

}

const readFileInput = (path) => {
    const data = fs.readFileSync(path, 'utf-8');
    const arr = data.split('\n');
    return arr;
}

const writeFile = async(data, csvf) => {
    try {
        const fields = ["Title",
            "Link_Image1",
            "Link_Image2",
            "Link_Image3",
            "Link_Image4",
            "SKU",
            "Link",
            "mmolazi_type",
            "tags",
            "category"
        ];
        const opts = { fields };
        parseAsync(data, opts)
            .then(csv => {
                const arr = csv.split('\n');
                arr.shift();
                const str = '\n' + arr.join('\n');
                fs.appendFileSync("newmoon_import_template" + csvf + ".csv", new Buffer.from(str))

            })
            .catch(err => console.log(err))
    } catch (error) {
        console.log(error)
    }

}
const input = readFileInput("./input.txt");
const main = async(input, csvf) => {
    try {
        for (key of input) {

            await (crawlPage(key));


        }
    } catch (error) {
        console.log(error)
    }
}
const str = ["Title",
    "Link_Image1",
    "Link_Image2",
    "Link_Image3",
    "Link_Image4",
    "SKU",
    "Link",
    "mmolazi_type",
    "tags",
    "category"
].join(",");
fs.appendFileSync("newmoon_import_template" + csvf + ".csv", new Buffer.from(str))
main(input, csvf);