
import math
import time
import json
import requests

from config import config

# create handle on main doc of Author
db = config['client'].db('dora', username = config['username'], password = config['password'])
paperCollection = db.collection('Paper')
authorCollection = db.collection('Author')


url = config['baseUrl'] + 'evaluate'


MAX_COUNT = 1000
PAUSE = 5 # in seconds
TIMEOUT = 60000 # in millis, 1 min

authorAttributes = ['AuId', 'AuN', 'DAuN', 'CC', 'ECC', 'E']

def query(id):

  params = {
    'expr': 'Id={}'.format(id),
    'attributes': ','.join(authorAttributes),
    'timeout': TIMEOUT
  }

  # send GET request
  req = requests.get(url, params = params, headers = config['headers'])
  res = req

  # make sure response gave 200, otherwise, raise exception
  res.raise_for_status()

  return res.json()


# takes about 6-10 seconds to save
def saveAuthor(author):

  key = str(author['Id'])
  date = int(round(time.time() * 1000))

  # augment and edit author object
  del author['logprob']
  author['_key'] = key
  # jsonify Extended metadata
  if 'E' in author:
    author['E'] = json.loads(author['E'])
  if 'createDate' in author: author['updateDate'] = date
  else: author['createDate'] = date
  
  # insert or update author in db
  if authorCollection.has(key): authorCollection.update(author)
  else: authorCollection.insert(author)




# start is inclusive
# end is exclusive
# inspired by range() api
def scrape(onNewEntity = None):
  count = 0

  for paper in paperCollection:
    for authorId in paper['AA']:
      obj = query(authorId)
      author = obj['entities'][0]
      saveAuthor(author)

      # call onNewEntity callback if given
      count += 1
      if onNewEntity: onNewEntity(author, paper, count)

      time.sleep(PAUSE)




################################################
def callback(author, paper, count):
  print('count: {}'.format(count))
  print('author: {}'.format(author))
  print('paper: {}'.format(paper))
  print()

scrape(onNewEntity = callback)
################################################


