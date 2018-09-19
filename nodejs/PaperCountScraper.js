const EventEmitter = require('events')

const request = require('request-promise-native')

const config = require('./config')

const db = config.db
const annualPaperCountCollection = db.collection('AnnualPaperCount')

const PAUSE = 60000 // in millis, 1 min
const TIMEOUT = 60000 // in millis, 1 min
const KEY = 'main'
const URL = config.baseUrl + 'calchistogram'


class PaperCounter extends EventEmitter {
  constructor () {
    super()
  }

  /**
   * Makes GET request and returns json object of papers.
   * Throws error if not 200 response
   */
  async query (year) {
    // construct query string
    const qs = {
      expr: `Y=${year}`,
      timeout: TIMEOUT
    }

    // send get request
    try {
      const res = await request.get(URL, { qs, headers: config.headers, json: true })
      return { res, year}
    } catch (err) {
      throw new Error(err)
    }
  }


  /**
   * Decides to either insert or update in the db
   * depending on whether the paper already exists or not
   * @param {Object} paper 
   */
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

      this.query(year).then(obj => {
        return this.updateDoc(obj.res.num_entities, obj.year)
      }).then(res => {
        this.emit('update', res)
      }).catch(err => {
        console.log(err)
        process.exit()
      })


      // reached final year. close everything
      if (year === end) clearInterval(refreshIntervalId)

      year += step
    }

    // start loop
    const refreshIntervalId = setInterval(loop, PAUSE)
  }
}

module.exports = PaperCounter