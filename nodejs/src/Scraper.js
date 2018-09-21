const EventEmitter = require('events')

const request = require('request-promise-native')

const config = require('../config')


const TIMEOUT = 60000 // in millis, 1 min

/**
 * Scraper base class
 */
class Scraper extends EventEmitter {
  constructor () {
    super()
    this.loop = null
  }

  /**
   * Makes GET request and returns json object of papers.
   * Throws error if not 200 response
   */
  async query (qs, url) {
    // send get request
    try {
      return request.get(url, { qs, headers: config.headers, json: true })
    } catch (err) {
      throw new Error(err)
    }
  }

  constructQs (expr, attributes = '', { count = 1, offset = 0, timeout = TIMEOUT, orderby = 'logprob:desc' }) {
    return {
      expr,
      attributes,
      count,
      offset,
      orderby,
      timeout
    }
  }

  start (callback, pause) {
    this.loop = setInterval(callback, pause)
  }
  stop () {
    clearInterval(this.loop)
  }
}

module.exports = Scraper