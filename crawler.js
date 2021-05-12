const cheerio = require("cheerio");
const request = require("request-promise");
const fs = require("fs");
const { parseAsync } = require("json2csv");

let suffix = (new Date()).getTime();

const readFileInput = (path) => {
    const data = fs.readFileSync(path, 'utf-8');
    const arr = data.split('\n');
    return arr;
}

const userAgent = readFileInput('./useragents.txt');
const proxy = readFileInput('./proxies.txt')

const crawlerPageCollection = async(link) => {
    try {
        const data = [];
        let products_count = 0;
        let urlInput = link + '/products.json?limit=250&page=';
        let page = 1;
        if (link.length == 0) console.log("Link is not found");
        await request.defaults({
                'headers': { 'User-Agent': userAgent[Math.floor(Math.random() * userAgent.length)] }
            }, { 'proxy': proxy[Math.floor(Math.random() * userAgent.length)] })
            .get(link + '.json', (error, response, body) => {
                products_count = JSON.parse(body).collection.products_count;
                if (products_count === 0) return console.log('Page not have data');
            })
        page += Math.floor(products_count / 250);
        for (let i = 1; i <= page; i++) {
            await request.defaults({
                    'headers': { 'User-Agent': userAgent[Math.floor(Math.random() * userAgent.length)] }
                }, { 'proxy': proxy[Math.floor(Math.random() * userAgent.length)] })
                .get(urlInput + i, (error, response, body) => {
                    if (!error && response.statusCode >= 200 && response.statusCode <= 300) {
                        if (JSON.parse(body).products.length === 0) return 0;
                        for (let product of JSON.parse(body).products) {
                            const obj = {
                                Title: '',
                                Link_Image1: '',
                                Link_Image2: '',
                                Link_Image3: '',
                                Link_Image4: '',
                                SKU: '',
                                Link: '',
                                mmolazi_type: '',
                                tags: '',
                                category: '',
                            }
                            obj.Title = product.title;
                            obj.Link_Image1 = product.images[0] ? product.images[0].src : '';
                            obj.Link_Image2 = product.images[1] ? product.images[1].src : '';
                            obj.Link_Image3 = product.images[2] ? product.images[2].src : '';
                            obj.Link_Image4 = product.images[3] ? product.images[3].src : '';
                            obj.Link = link + `/products/ ${product.handle}`;
                            obj.tags = product.tags + "";
                            data.push(obj);
                        }
                        console.log(`Crawling page: ${urlInput + i}`);
                    } else console.log(error)
                })
        }
        console.log(`Have  ${data.length } products crawled from: ${link}`);
        writeFile(data, suffix);
    } catch (error) {
        console.log(error)
    }
}

const crawlerPageSeach = async(link) => {
    let num = 0;
    let page = '';
    let urlInput = link + '&page=';
    let data = [];
    if (link.length == 0) return console.log("Link is not found");
    await request(link, (error, response, html) => {
        if (!error && response.statusCode >= 200 && response.statusCode <= 300) {
            const $ = cheerio.load(html);
            const paging = $(".paginate span ").text().split('');
            for (let i = paging.length - 1; i > 0; i--) {
                if (paging[i] == '…') break;
                if (+paging[i] % 1 == 0) {
                    page += paging[i];
                }
            }
            page = page.split('').reverse().join('');
        }
    })
    page = +page;
    for (let i = 1; i <= page; i++) {
        await request.defaults({
                'headers': { 'User-Agent': userAgent[Math.floor(Math.random() * userAgent.length)] }
            }, { 'proxy': proxy[Math.floor(Math.random() * userAgent.length)] })
            (
                urlInput + i,
                async(error, response, html) => {
                    if (!error && response.statusCode >= 200 && response.statusCode <= 300) {
                        const $ = cheerio.load(html);
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
                                urlInput.split('/search')[0] +
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
                                'headers': { 'User-Agent': userAgent[Math.floor(Math.random() * userAgent.length)] }
                            }, { 'proxy': proxy[Math.floor(Math.random() * userAgent.length)] })(Link, async(error, response, html) => {
                                if (response.statusCode >= 200 && response.statusCode <= 300) {
                                    const $ = cheerio.load(html);
                                    const Link_Image3 = "http:" + $("div.gallery-cell ").eq(2).find("img").get().map((pro) => { return pro.attribs.src });
                                    const Link_Image4 = "http:" + $("div.gallery-cell ").eq(3).find("img").get().map((pro) => { return pro.attribs.src });
                                    obj.Link_Image3 = Link_Image3;
                                    obj.Link_Image4 = Link_Image4;
                                    await data.push(obj);
                                } else console.log(error)
                            })
                        });
                        console.log(`Crawling page: ${urlInput + i}`);
                    } else {
                        console.log(error);
                    }
                }
            )
    }
    writeFile(data, suffix);
    console.log(`Have ${data.length} products crawled from: ${link}`);

}

const CrawlerProduct = async(link) => {
    try {
        let data = [];
        let urlInput = `${link}.json`;
        await request.defaults({
                'headers': { 'User-Agent': userAgent[Math.floor(Math.random() * userAgent.length)] }
            }, { 'proxy': proxy[Math.floor(Math.random() * userAgent.length)] })
            .get(urlInput, (error, response, body) => {
                if (link.length == 0) console.log("Link is not found");
                if (!error && response.statusCode >= 200 && response.statusCode <= 300) {
                    let product = JSON.parse(body).product;
                    const obj = {
                        Title: '',
                        Link_Image1: '',
                        Link_Image2: '',
                        Link_Image3: '',
                        Link_Image4: '',
                        SKU: '',
                        Link: '',
                        mmolazi_type: '',
                        tags: '',
                        category: '',
                    }
                    obj.Title = product.title;
                    obj.Link_Image1 = product.images[0] ? product.images[0].src : '';
                    obj.Link_Image2 = product.images[1] ? product.images[1].src : '';
                    obj.Link_Image3 = product.images[2] ? product.images[2].src : '';
                    obj.Link_Image4 = product.images[3] ? product.images[3].src : '';
                    obj.Link = link + `/products/ ${product.handle}`;
                    obj.tags = product.tags + "";
                    data.push(obj);
                    console.log(`Crawling page: ${link}`);
                    if (data.length == 0) return console.log("Page not have data");
                    console.log(`Have  ${data.length } products crawled from: ${link}`);
                    writeFile(data, suffix);
                } else console.log(error)
            })
    } catch (error) {
        console.log(error);
    }
}


const writeFile = async(data, suffix) => {
    try {
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
        fs.appendFileSync(`newmoon_import_template_${suffix}.csv`, new Buffer.from(str))
        parseAsync(data)
            .then(csv => {
                const arr = csv.split('\n');
                arr.shift();
                const str = '\n' + arr.join('\n');
                fs.appendFileSync(`newmoon_import_template_${suffix}.csv`, new Buffer.from(str))

            })
            .catch(err => console.log(err))
    } catch (error) {
        console.log(error)
    }

}
const input = readFileInput("./input.txt");
const main = async(input) => {
    try {
        for (link of input) {
            const arr = link.split("/");
            if (arr[3] === 'collections') crawlerPageCollection(link)
            else if (arr[3] === 'products') CrawlerProduct(link)
            else if (arr[3].split('?')[0] === 'search') crawlerPageSeach(link);
        }
    } catch (error) {
        console.log(error)
    }
}
main(input);