
import time
import requests

from config import config

# create handle on main doc of AnnualPaperCount
db = config['client'].db('dora', username = config['username'], password = config['password'])
annualPaperCountCollection = db.collection('AnnualPaperCount')

url = config['baseUrl'] + 'calchistogram'

PAUSE = 60
TIMEOUT = 60000 # in millis, 1 min
KEY = 'main'

def query(year):

  params = {
    'expr': 'Y={}'.format(year),
    'timeout': TIMEOUT # allow 1 min before timing out
  }

  # send GET request
  req = requests.get(url, params = params, headers = config['headers'])
  res = req

  # make sure response gave 200, otherwise, raise exception
  res.raise_for_status()

  return res.json()

def saveValue(year, obj):
  annualPaperCountCollection.update({
    '_key': KEY,
    year: obj['num_entities']
  })
  

def scrape(start, end, step = 1):

  for year in range(start, end, step):
    obj = query(year)
    saveValue(year, obj)

    print(obj)

    time.sleep(PAUSE)



scrape(1900, 2018)