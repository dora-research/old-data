const PaperScraper = require('./PaperScraper')
const PaperCountScraper = require('./PaperCountScraper')

const paperScraper = new PaperScraper()
paperScraper.on('rawPaper', paper => {
  // send it to author builder
})

let prevYear = null
let count = 0
paperScraper.on('update', update => {
  if (!prevYear) prevYear = update.paper.Y
  if (prevYear < update.paper.Y) count = 0
  count++
  console.log('count', count)
  // console.log('paper', update.paper)
  console.log('year', update.paper.Y)
  console.log('res', update.action)
  console.log()

  prevYear = update.paper.Y
})
paperScraper.scrape(1900, 1901, {
  initialOffset: 0,
  limit: Infinity
})




// const paperCountScraper = new PaperCountScraper()
// paperCountScraper.on('update', e => console.log(e))
// paperCountScraper.scrape(1900, 1902)


// TODO: make a base class that PaperScraper, JournalScraper, etc, inherit from