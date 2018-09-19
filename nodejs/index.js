const PaperScraper = require('./PaperScraper')
const PaperCountScraper = require('./PaperCountScraper')

const paperScraper = new PaperScraper()
paperScraper.on('rawPaper', paper => {
  // send it to author builder
})
paperScraper.on('update', update => {
  // console.log('paper', update.paper)
  console.log('year', update.year)
  console.log('count', update.count)
  console.log('res', update.res)
  console.log()
})
paperScraper.scrape(1900, 1901, {
  initialOffset: 0,
  limit: Infinity
})




// const paperCountScraper = new PaperCountScraper()
// paperCountScraper.on('update', e => console.log(e))
// paperCountScraper.scrape(1900, 1902)


// TODO: make a base class that PaperScraper, JournalScraper, etc, inherit from