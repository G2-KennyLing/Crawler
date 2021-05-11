const cheerio = require("cheerio");
const request = require("request-promise");
const fs = require("fs");
const { parseAsync } = require("json2csv");

let csvf = (new Date()).getTime();
const userAgent = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) ", "AppleWebKit/537.36 (KHTML, like Gecko)", "Chrome/66.0.3359.181 Safari/537.36"];
const proxy = ["http://30c0fd28ae:LbSYfc4J@162.244.144.79:4444", "http://1a64c2daf4:NkSDGHft@192.3.180.190:4444", "http://1a64c2daf4:NkSDGHft@192.3.203.187:4444", "http://1a64c2daf4:NkSDGHft@23.254.82.102:4444"];

const reqJson = async(link) => {
    try {
        const data = [];
        let page = 1;
        let key = link + '/products.json?limit=1000&page=';
        let check = true;
        while (check) {
            await request.defaults({
                    'headers': { 'User-Agent': userAgent[Math.floor(Math.random() * userAgent.length)] }
                }, { 'proxy': proxy[Math.floor(Math.random() * userAgent.length)] })
                .get(key + page, (error, response, body) => {
                    if (key.length == 0) console.log("Link is not found");
                    if (!error && response.statusCode == 200) {
                        if (JSON.parse(body).products.length == 0) check = false;
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
                            obj.Link = link + "/products/" + product.handle;
                            obj.tags = product.tags + "";
                            data.push(obj);
                        }
                        if (data.length == 0) check = false;
                        console.log("Crawling page:" + key + page);
                        page++;
                    } else console.log(error)
                })
        }
        console.log("Have " + data.length + " products crawled from:" + link);
        writeFile(data, csvf);
    } catch (error) {
        console.log(error)
    }
}
const readFileInput = (path) => {
    const data = fs.readFileSync(path, 'utf-8');
    const arr = data.split('\n');
    return arr;
}

const writeFile = async(data, csvf) => {
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
        fs.appendFileSync("newmoon_import_template_" + csvf + ".csv", new Buffer.from(str))
        parseAsync(data)
            .then(csv => {
                const arr = csv.split('\n');
                arr.shift();
                const str = '\n' + arr.join('\n');
                fs.appendFileSync("newmoon_import_template_" + csvf + ".csv", new Buffer.from(str))

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

            await (reqJson(key));
        }
    } catch (error) {
        console.log(error)
    }
}

main(input, csvf);