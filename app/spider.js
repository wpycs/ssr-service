const file = require('./file')
const config = require('./config')
const puppeteer = require('puppeteer')
let browser
(async () => {
  browser = await puppeteer.launch()
})()

class Spider {
  async clear (ctx) {
    ctx.body = await file.clear(ctx.query.url)
  }
  async index (ctx) {
    const {
      url, // the web page url to load
      realtime = false, // is loading page realtime
      activeTime = 60, // cache time of html file (seconds)
      timeout, // page will return after the timeout (milliseconds)
      selector, // page will return after the element show
      pageTimeout = config.pageTimeout //  maximum load time in pageTimeout (milliseconds)
    } = Object.assign(ctx.query, ctx.request.body)

    if (!realtime || realtime === 'false') {
      const htmlFile = await file.getFile(url, activeTime)
      if (htmlFile) {
        ctx.body = htmlFile
        return
      }
    }

    const page = await browser.newPage()
    // use default user-agent avoid to endless loop
    delete ctx.headers['user-agent']
    await page.setExtraHTTPHeaders(ctx.headers)
    await page.goto(url, { pageTimeout })
    if (selector) {
      await page.waitForSelector(selector, { pageTimeout })
    }
    if (timeout) {
      await page.waitFor(Number(timeout))
    }
    const html = await page.content()
    file.save(html, url, activeTime)
    page.close()
    ctx.body = html
  }
}

module.exports = new Spider()
