const Scraper = require('./Scraper')

const config = require('../config')

const MAX_COUNT = 1000 // api max is 1000
const PAUSE = 5000 // in millis
const URL = config.baseUrl + 'evaluate'

const ATTRIBUTES = [
  'Id', 'Ti', 'L', 'Y', 'D', 'CC', 'ECC', 'RId', 'W', 'E', // paper
  'AA.AuN', 'AA.AuId', 'AA.AfId', 'AA.AfN', 'AA.S', // author
  'F.FId', // field
  'J.JId', // jounrnal
  'C.CId' // conference
]

/**
 * 
 * Emits a 'rawPaper' event for each paper received from API
 */
class PaperScraper extends Scraper {
  constructor () {
    super()
  }


  scrape (start, end, { step = 1, initialOffset = 0, limit = Infinity } = {}) {

    if (initialOffset % MAX_COUNT !== 0)
      throw new Error(`initialOffset must be divisible by MAX_COUNT: ${MAX_COUNT}`)
    if (limit !== Infinity && limit % MAX_COUNT !== 0)
      throw new Error(`limit must be divisible by MAX_COUNT: ${MAX_COUNT}`)

    let year = start
    let offset = initialOffset

    const loop = () => {

      const qs = this.constructQs(`Y=${year}`, ATTRIBUTES.join(','), {
        count: MAX_COUNT,
        offset,
        orderby: 'CC:desc'
      })

      this.query(qs, URL)
      .then(res => {
        const papers = res.entities
        for (const paper of papers) {
          this.emit('rawPaper', paper)
        }

        // if returned papers array is less than MAX_COUNT, ran out of papers for that year
        // finished querying this year
        // step to next year
        if (papers.length < MAX_COUNT) {
          if (year === end) this.stop()
          year += step
          offset = 0
          // finished the final year. stop program
        }

      })
      .catch(err => {
        console.log(err)
        process.exit()
      })

      offset += MAX_COUNT

      // the number of queries we've made has bumped up against our limit
      // finished querying this year
      // step to next year
      if (offset === limit) {
        if (year === end) this.stop()
        year += step
        offset = 0
        // finished the final year. stop program
      }

    }

    // start loop
    this.start(loop, PAUSE)
  }
}

module.exports = new PaperScraper()
