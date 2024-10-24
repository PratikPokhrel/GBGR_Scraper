# scraper/config.py


#Replace this with systems geckodrive and firefox path 
gecko_driver_path = 'C:/Users/prati/Downloads/geckodriver-v0.35.0-win32/geckodriver.exe'
firefox_binary_path = 'C:/Program Files/Mozilla Firefox/firefox.exe'

# API URLs
DATE_API_URL = 'https://api.gbgb.org.uk/api/results?page=1&itemsPerPage=1000000&date={}'
DETAILS_API_URL = 'https://api.gbgb.org.uk/api/results/meeting/{}?meeting={}'

#Greyhound UK URL For scrapping
GREYHOUND_RECORDER_UK_URL = 'https://www.thegreyhoundrecorder.com.au/form-guides/uk/'


#Replace connection string properties with the deployed database
# SQL connection string
connection_string = (
    r'DRIVER={SQL Server};'
    r'SERVER=MSI\SQLEXPRESS;'
    r'DATABASE=GBGB_Results;'
    r'Trusted_Connection=yes;'
)