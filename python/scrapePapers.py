
import math
import time
import json
import requests

from config import config

# create handle on main doc of Paper
db = config['client'].db('dora', username = config['username'], password = config['password'])
paperCollection = db.collection('Paper')


url = config['baseUrl'] + 'evaluate'


MAX_COUNT = 1000
PAUSE = 5 # in seconds
TIMEOUT = 60000 # in millis, 1 min

paperAttributes = ['Id', 'Ti', 'L', 'Y', 'D', 'CC', 'ECC', 'RId', 'W', 'E']
authorAttributes = ['AA.AuId', 'AA.AfId']
fieldAttributes = ['F.FId']
journalAttributes = ['J.JId']
conferenceAttributes = ['C.CId']


def query(year, offset):

  params = {
    'expr': 'Y={}'.format(year),
    'count': MAX_COUNT, # max entities per page
    'offset': offset,
    'attributes': ','.join(paperAttributes + authorAttributes + fieldAttributes + journalAttributes + conferenceAttributes),
    'timeout': TIMEOUT
  }

  # send GET request
  req = requests.get(url, params = params, headers = config['headers'])
  res = req

  # make sure response gave 200, otherwise, raise exception
  res.raise_for_status()

  return res.json()


# takes about 6-10 seconds to save
def savePaper(paper):

  key = str(paper['Id'])
  date = int(round(time.time() * 1000))

  # augment and edit paper object
  del paper['logprob']
  paper['_key'] = key
  # jsonify Extended metadata
  if 'E' in paper:
    paper['E'] = json.loads(paper['E'])
  if 'createDate' in paper: paper['updateDate'] = date
  else: paper['createDate'] = date
  
  # insert or update paper in db
  if paperCollection.has(key): paperCollection.update(paper)
  else: paperCollection.insert(paper)




# start is inclusive
# end is exclusive
# inspired by range() api
def scrape(start, end, step = 1, initialOffset = 0, limit = math.inf, onNewEntity = None):
  count = 0

  if initialOffset % MAX_COUNT != 0:
    raise ValueError('initialOffset must be divisible by MAX_COUNT: {}'.format(MAX_COUNT))
  if limit != math.inf and limit % MAX_COUNT != 0:
    raise ValueError('limit must be divisible by MAX_COUNT: {}'.format(MAX_COUNT))

  for year in range(start, end, step):
    offset = 0
    # if it's the first year, change offset to equal initialOffset
    if start == year: offset = initialOffset

    # will spin until we've queried all the papers for this year or reached our user-imposed limit
    while True:
      obj = query(year, offset)
      papers = obj['entities']

      for paper in papers:
        savePaper(paper)
        # call onNewEntity callback if given
        count += 1
        if onNewEntity: onNewEntity(paper, count)

      # increase offset to next page
      offset += MAX_COUNT

      # if we've run out of papers for that year OR
      # if we'eve reached our user-imposed limit for the year
      if len(papers) < MAX_COUNT or offset == limit: break

      time.sleep(PAUSE)




################################################
def callback(paper, count):
  print('count: {}'.format(count))
  print(paper)
  print()

scrape(2017, 2000, step = -1, limit = 1000000, onNewEntity = callback)
################################################


# possibly extraneous data
'''
# jsonify Extended metadata and remove unecessary data
if 'E' in paper:
  paper['E'] = json.loads(paper['E'])
  if paper['E']['ANF']: del paper['E']['ANF']
'''
