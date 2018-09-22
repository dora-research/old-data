const Scraper = require('./Scraper')

const config = require('../config')

const db = config.db
const annualPaperCountCollection = db.collection('AnnualPaperCount')

const PAUSE = 60000 // in millis, 1 min
const KEY = 'main'
const URL = config.baseUrl + 'calchistogram'


class PaperCounterScraper extends Scraper {
  constructor () {
    super()
    this.key = KEY
  }


  async updateDoc (count, year) {
    try {
      await annualPaperCountCollection.update(KEY, { [year]: count })
      return { count, year }
    } catch (err) {
      throw new Error(err)
    }
  }

  /**
   * Queries from start to end, inclusive
   * @param {*} start 
   * @param {*} end 
   * @param {*} options asd 
   */
  scrape (start, end, { step = 1 } = {}) {

    let year = start

    const loop = () => {

      const qs = this.constructQs(`Y=${year}`)
      this.query(qs, URL)
      .then(obj => {
        return this.updateDoc(obj.res.num_entities, obj.year)
      })
      .then(res => {
        this.emit('update', res)
      })
      .catch(err => {
        console.log(err)
        process.exit()
      })

      year += step

      // reached final year. close everything
      if (year > end) this.stop()

    }

    // start loop
    this.start(loop, PAUSE)
  }
}

module.exports = new PaperCounterScraper()