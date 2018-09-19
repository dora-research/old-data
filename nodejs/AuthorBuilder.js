const EventEmitter = require('events')

const config = require('./config')

const db = config.db
const authorCollection = db.collection('Author')


class PaperScraper extends EventEmitter {
  constructor () {
    super()
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
      const exists = await authorCollection.documentExists(paper._key)
      if (exists) {
        await authorCollection.update(paper._key, paper)
        return 'updated'
      } else {
        await authorCollection.save(paper)
        return 'created'
      }
    } catch (err) {
      console.log(err)
      console.log(paper)
      process.exit()
    }
    
  }

  scrape (start, end, { step = 1, initialOffset = 0, limit = Infinity } = {}) {

    // if (initialOffset % MAX_COUNT !== 0)
    //   throw new Error(`initialOffset must be divisible by MAX_COUNT: ${MAX_COUNT}`)
    // if (limit !== Infinity && limit % MAX_COUNT !== 0)
    //   throw new Error(`limit must be divisible by MAX_COUNT: ${MAX_COUNT}`)

    let year = start
    let count = 0

    const loop = () => {

      this.query(year, count + initialOffset).then(obj => {
        const papers = obj.entities

        for (const paper of papers) {
          this.editPaper(paper)
          this.savePaper(paper).then(res => {
            count++
            this.emit('update', paper, res, count)
          }).catch(err => {
            console.log(err)
            process.exit()
          })
        }

        // reached final year. close everything
        if (year === end) clearInterval(refreshIntervalId)

        // finished querying this year
        // step to next year
        if (papers.length < MAX_COUNT || count === limit) {
          year += step
          count = 0
          initialOffset = 0
        }
      }).catch(err => {
        console.log(err)
        process.exit()
      })
    }

    // start loop
    const refreshIntervalId = setInterval(loop, PAUSE)

  }
}

module.exports = PaperScraper
