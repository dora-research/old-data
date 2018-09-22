const config = require('../config')

const db = config.db
const paperCollection = db.collection('Paper')


class DocSaver {
  constructor () {}

  /**
   * Edit and augment paper object
   * @param {Object} paper 
   */
  editPaper (paper) {
    delete paper.logprob
    paper._key = String(paper.Id)

    // if no reference key, create empty ref list
    if (!('RId' in paper)) paper.RId = []

    // jsonify Extended metadata
    if ('E' in paper) paper.E = JSON.parse(paper.E)

    // either update updateDate or insert createDate
    const date = new Date().getTime()
    if ('createDate' in paper) paper.updateDate = date
    else paper.createDate = date
  }

  /**
   * Decides to either insert or update in the db
   * depending on whether the paper already exists or not
   * @param {Object} paper 
   */
  async saveDoc (paper) {
    try {
      let action
      const exists = await paperCollection.documentExists(paper._key)
      if (exists) {
        await paperCollection.update(paper._key, paper)
        action = 'updated'
      } else {
        await paperCollection.save(paper)
        action = 'created'
      }
      return { paper, action }

    } catch (err) {
      throw new Error(err)
    }
  }

}


module.exports = DocSaver