const cheerio = require("cheerio");
const request = require("request-promise");
const fs = require("fs");
const { parseAsync } = require("json2csv");
const cloudinary = require("cloudinary").v2;

const express = require('express')
const app = express()
const port = 3000

let suffix;
app.use(express.json());
app.use(express.static(__dirname));
app.use(
    express.urlencoded({
        extended: true,
        limit: process.env.CLIENT_MAX_BODY_SIZE,
        parameterLimit: 10000,
    })
);

app.get('/getListUrl', (req, res) => {
    try {
        const data = readFileInput('./input.txt');
        return res.status(200).json({ data });
    } catch (error) {
        console.log(error);
    }
})
app.post('/addUrl', (req, res) => {
    const { url } = req.body;
    if (!url)
        return res.status(200).json({ mes: "Url is not found" })
    url.forEach(u => {
        fs.appendFileSync('./input.txt', '\n' + u);
    })
    const data = readFileInput('./input.txt');
    return res.status(200).json({ data })
})

app.put('/updateUrl', (req, res) => {
    const { data } = req.body;
    console.log(data.length == 0)
    if (data.length == 0) fs.writeFileSync('./input.txt', data.toString());
    fs.writeFileSync('./input.txt', data[0]);
    for (let i = 1; i < data.length; i++) {
        fs.appendFileSync('./input.txt', '\n' + data[i]);
    }
    return res.status(200).json({ data })
})

app.get('/getListProxies', (req, res) => {
    const data = readFileInput('./proxies.txt');
    return res.status(200).json({ data })
})

app.post('/addProxy', (req, res) => {
    const { proxy } = req.body;
    if (!proxy)
        return res.status(200).json({ mes: "Proxy is not found" })
    proxy.forEach(p => {
        fs.appendFileSync('./proxies.txt', '\n' + p);
    })
    const data = readFileInput('./proxies.txt');
    return res.status(200).json({ data })
})

app.put('/updateProxies', (req, res) => {
    const { data } = req.body;
    if (data.length == 0) fs.writeFileSync('./proxies.txt', data);
    fs.writeFileSync('./proxies.txt', data[0]);
    for (let i = 1; i < data.length; i++) {
        fs.appendFileSync('./proxies.txt', '\n' + data[i])
    }
    console.log(data)
    return res.status(200).json({ data })
})

app.get('/getListUserAgent', (req, res) => {
    const data = readFileInput('./useragents.txt');
    return res.status(200).json({ data })
})

app.post('/addUserAgent', (req, res) => {
    const { userAgent } = req.body;
    if (!userAgent)
        return res.status(200).json({ mes: "user agent is not found" })
    userAgent.forEach(u => {
        fs.appendFileSync('./useragents.txt', '\n' + u);
    })

    const data = readFileInput('./useragents.txt');
    return res.status(200).json({ data })
})

app.put('/updateUserAgent', (req, res) => {
    const { data } = req.body;
    if (data.length == 0) fs.writeFileSync('./useragents.txt', data);
    fs.writeFileSync('./useragents.txt', data[0]);
    for (let i = 1; i < data.length; i++) {
        fs.appendFileSync('./useragents.txt', '\n' + data[i])
    }
    return res.status(200).json({ data })
})

app.post('/crawler', async(req, res) => {
    try {
        suffix = new Date().getTime();
        const input = readFileInput("./input.txt");
        const arrPromises = []
        if (input.length > 0) {
            input.forEach((link) => {
                const arr = link.split("/");
                if (arr.indexOf('products') >= 0) arrPromises.push(CrawlerProduct(link))
                else if (arr[3] === 'collections') arrPromises.push(crawlerPageCollection(link))
                else if (arr[3].split('?')[0] === 'search') arrPromises.push(crawlerPageSeach(link))
            })
            Promise.all(arrPromises).then(result => {
                setTimeout(() => {
                    res.sendFile(`newmoon_import_template_${suffix}.csv`, { root: __dirname })
                }, 0)
            })
        } else
            res.status(200).json({ mes: "Link is not found" });
    } catch (error) {
        console.log(error)
    }

})



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

const crawlerPageSeach = async(link, res) => {
    let page = '';
    let urlInput = link + '&page=';
    let data = [];
    if (link.length == 0) return console.log("Link is not found");
    await request(link, (error, response, html) => {
        if (!error && response.statusCode >= 200 && response.statusCode <= 300) {
            const $ = cheerio.load(html);
            const paging = $(".pagination__nav a:last-child").text();
            page = +paging;
        }
    })
    for (let i = 1; i <= page; i++) {
        await request.defaults({
                'headers': { 'User-Agent': userAgent[Math.floor(Math.random() * userAgent.length)] }
            }, { 'proxy': proxy[Math.floor(Math.random() * userAgent.length)] })
            (
                urlInput + i,
                (error, response, html) => {
                    if (!error && response.statusCode >= 200 && response.statusCode <= 300) {
                        const $ = cheerio.load(html);
                        $(".product-item").each(async(index, el) => {
                            const Title = $(el)
                                .find("div.product-item__info div.product-item__info-inner a.product-item__title")
                                .text();
                            let Link =
                                urlInput.split('/search')[0] +
                                $(el)
                                .find("div.product-item__info div.product-item__info-inner a.product-item__title")
                                .get().map((pro) => {
                                    return pro.attribs.href
                                })
                            Link = Link.slice(0, Link.indexOf("?"));

                            const obj = {
                                Title,
                                Link_Image1: '',
                                Link_Image2: '',
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
                                    const Link_Image1 = "http:" + $("a.product-gallery__thumbnail ").eq(0).get().map((pro) => { return pro.attribs.href });
                                    const Link_Image2 = "http:" + $("a.product-gallery__thumbnail ").eq(1).get().map((pro) => { return pro.attribs.href });
                                    const Link_Image3 = "http:" + $("a.product-gallery__thumbnail ").eq(2).get().map((pro) => { return pro.attribs.href });
                                    const Link_Image4 = "http:" + $("a.product-gallery__thumbnail ").eq(3).get().map((pro) => { return pro.attribs.href });
                                    obj.Link_Image1 = Link_Image1;
                                    obj.Link_Image2 = Link_Image2;
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

const writeFile = (data, suffix) => {
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
        return parseAsync(data)
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

const main = async(input) => {
    try {
        await input.forEach((link) => {
            const arr = link.split("/");
            if (arr[3] === 'collections') crawlerPageCollection(link)
            else if (arr[3] === 'products') CrawlerProduct(link)
            else if (arr[3].split('?')[0] === 'search') crawlerPageSeach(link);
        })

    } catch (error) {
        console.log(error)
    }
}


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})