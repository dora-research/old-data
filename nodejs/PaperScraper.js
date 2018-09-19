const EventEmitter = require('events')

const request = require('request-promise-native')

const config = require('./config')

const db = config.db
const paperCollection = db.collection('Paper')

const MAX_COUNT = 1000
const PAUSE = 5000 // in millis
const TIMEOUT = 60000 // in millis, 1 min
const URL = config.baseUrl + 'evaluate'

const ATTRIBUTES = [
  'Id', 'Ti', 'L', 'Y', 'D', 'CC', 'ECC', 'RId', 'W', 'E', // paper
  'AA.AuId', 'AA.AfId', // author
  'F.FId', // field
  'J.JId', // jounrnal
  'C.CId' // conference
]

/**
 * Emits a 'rawPaper' event and an 'update' event that fires
 * after saving or updating a document successfully
 */
class PaperScraper extends EventEmitter {
  constructor () {
    super()
  }

  /**
   * Makes GET request and returns json object of papers.
   * Throws error if not 200 response
   */
  async query (year, offset) {
    // construct query string
    const qs = {
      expr: `Y=${year}`,
      count: MAX_COUNT,
      offset,
      attributes: ATTRIBUTES.join(','),
      timeout: TIMEOUT
    }

    // send get request
    try {
      return await request.get(URL, { qs, headers: config.headers, json: true })
    } catch (err) {
      throw new Error(err)
    }
  }

  /**
   * Edit and augment paper object
   * @param {Object} paper 
   */
  editPaper (paper) {
    delete paper.logprob
    paper._key = String(paper.Id)

    // jsonify Extended metadata
    if ('E' in paper) paper.E = JSON.parse(paper.E)

    // either update updateDate or insert createDate
    const date = new Date().getTime()
    if ('createDate' in paper) paper.updateDate = date
    else paper.createDate = date

    return paper
  }

  /**
   * Decides to either insert or update in the db
   * depending on whether the paper already exists or not
   * @param {Object} paper 
   */
  async savePaper (paper) {
    try {
      const exists = await paperCollection.documentExists(paper._key)
      if (exists) {
        await paperCollection.update(paper._key, paper)
        return 'updated'
      } else {
        await paperCollection.save(paper)
        return 'created'
      }
    } catch (err) {
      console.log(err)
      console.log(paper)
      process.exit()
    }
    
  }

  scrape (start, end, { step = 1, initialOffset = 0, limit = Infinity } = {}) {

    if (initialOffset % MAX_COUNT !== 0)
      throw new Error(`initialOffset must be divisible by MAX_COUNT: ${MAX_COUNT}`)
    if (limit !== Infinity && limit % MAX_COUNT !== 0)
      throw new Error(`limit must be divisible by MAX_COUNT: ${MAX_COUNT}`)

    let year = start
    let count = 0
    let offset = initialOffset

    const loop = () => {

      this.query(year, offset).then(obj => {
        const papers = obj.entities
        for (const paper of papers) {
          this.emit('rawPaper', paper)
          this.editPaper(paper)
          this.savePaper(paper).then(res => {
            count++
            this.emit('update', { paper, year, count, res })
          }).catch(err => {
            console.log(err)
            process.exit()
          })
        }

        // reached final year. close everything
        if (year === end) clearInterval(refreshIntervalId)

        // finished querying this year
        // step to next year
        if (papers.length < MAX_COUNT || offset >= limit) {
          year += step
          count = 0
          offset = 0
        }
      }).catch(err => {
        console.log(err)
        process.exit()
      })

      offset += MAX_COUNT
    }

    // start loop
    const refreshIntervalId = setInterval(loop, PAUSE)

  }
}

module.exports = PaperScraper
