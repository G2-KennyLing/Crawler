const cheerio = require('cheerio');
const request = require('request-promise');
const fs = require('fs');
const { Parser } = require('json2csv');


request('https://99shirt.com/search?type=product&q=shirt*', (error, response, html) => {
    if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);
        let data = []
        $('.product-wrap').each((index, el) => {
            const title = $(el).find(' a div.product-details span.title').text();
            const image = 'http:' + $(el).find(' div.product_image a div.image__container img').data().src;
            const price = $(el).find('a div.product-details span.price span span.money ').text();
            const link = 'https://99shirt.com' + $(el).find(' a').get().map(pro => { return pro.attribs.href });

            data.push({
                title,
                image,
                price,
                link
            });
        });
        const fields = [{ label: 'Title', value: 'title' }, { label: 'Link_Image_1', value: 'image' }, { label: 'Link', value: 'link' }, { label: 'Price', value: 'price' }];
        const parser = new Parser(fields);
        const csv = parser.parse(data);
        fs.appendFileSync('newmoon_import_template.csv', csv);
    } else {
        console.log(error);
    }
});