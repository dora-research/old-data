import PaperScraper from getPapersByYear

paperScraper = PaperScraper()

paperScraper.run(2017, 2000, step = -1, limit = 1000000)