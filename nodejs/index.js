const paperScraper = require('./src/paperScraper')
const DocSaver = require('./src/DocSaver')
const paperCountScraper = require('./src/paperCountScraper')

const docSaver = new DocSaver()

let prevYear = null
let count = 0
paperScraper.on('rawPaper', paper => {

  if (!prevYear) prevYear = paper.Y
  if (prevYear < paper.Y) count = 0
  count++
  prevYear = paper.Y

  docSaver.editPaper(paper)
  docSaver.saveDoc(paper)

  // authorBuilder.build(paper)
  // authorBuilder.saveDoc()

  console.log('count', count)
  console.log('year', paper.Y)
  console.log()

})

paperScraper.scrape(2016, 2016, {
  limit: 1000000,
  step: -1
})




paperCountScraper.on('update', obj => {
  docSaver.saveDoc({
    _key: paperCountScraper.key,
    count: obj.res.num_entities,
    year: obj.year
  })
})
// paperCountScraper.scrape(1900, 1902)

