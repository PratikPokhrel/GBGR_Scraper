import requests
from datetime import *
import time
import csv
import pandas as pd
import pyodbc
import os
import schedule  # Import the schedule library

import sys
import os

# Add the path to the scraper directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from config import  connection_string, DATE_API_URL,DETAILS_API_URL

query_dstr = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
csv_file_name = f"data_csv{query_dstr}.csv"

#
# Initialize variables
race_data = []
meeting_id_numbers = [] 

# Scrape the data from the API and save to CSV
def scrape_data():
    race_data = []  # Reset race_data at the start
    query_date = datetime.now() - timedelta(days=1)  # Set to one day before the current date
    # query_date = datetime(2024, 10, 21)

    print('query date', query_date)

    meeting_id_numbers = []
    dump_data = []

    print('query_date:', query_date)

    start_time = time.time()
    print("Beginning Data Query\n")

    query_date_str = query_date.strftime('%Y-%m-%d')
    
    response = requests.get(DATE_API_URL.format(query_date_str))
    print('query date str', query_date_str)
    print(DATE_API_URL.format(query_date_str))
    print("QUERYING FOR ", query_date_str)

    if response.status_code != 200:
            print(
                "Error {}: Bad API call for date {}".format(
                    response.status_code, query_date_str
                )
            )

    response = response.json()

    if response["items"]:
            for race in response["items"]:
                meeting_id = race["meetingId"]
                # print("MEETING ID", meeting_id)
                if meeting_id not in meeting_id_numbers:
                    meeting_id_numbers.append(meeting_id)
                dump_data.append(race)
    else:
            print("Finished querying date: {}".format(query_date_str))


    end_time = time.time()
    print(f"Data query completed in {end_time - start_time} seconds")

    print("Length of dump_data :", len(dump_data), "\n")
    print(meeting_id_numbers)
    print("Length of meeting_id_numbers: ", len(meeting_id_numbers))

    n = 1
    for meeting_id in meeting_id_numbers:
        try:
            response = requests.get(DETAILS_API_URL.format(meeting_id, meeting_id))
            print("Fetching data of meeting id {} of {}".format(n, len(meeting_id_numbers)))
            if response.status_code != 200:
                print("Meeting API Response Status: ", response.status_code)
            response = response.json()
        except Exception as e:
            print("Failed to retrieve data, Error: ", e)
            break

        for meeting_info in response:
            if "races" in meeting_info:
                race_data.append(meeting_info)
            else:
                print("No races found for meeting ID: ", meeting_id)

        n += 1

    csv_file = csv_file_name
    csv_fields = [
        "meetingDate",
        "meetingId",
        "trackName",
        "raceTime",
        "raceDate",
        'raceId',
        'raceTitle',
        'raceNumber',
        'raceType',
        'raceHandicap',
        'raceClass',
        'raceDistance',
        'racePrizes',
        'raceGoing',
        'raceForecast',
        'raceTricast',
        'trapNumber',
        'trapHandicap',
        'dogId',
        'dogName',
        'dogSire',
        'dogDam',
        'dogBorn',
        'dogColour',
        'dogSex',
        'dogSeason',
        'trainerName',
        'ownerName',
        'SP',
        'resultPosition',
        'resultMarketPos',
        'resultMarketCnt',
        'resultPriceNumerator',
        'resultPriceDenominator',
        'resultBtnDistance',
        'resultSectionalTime',
        'resultComment',
        'resultRunTime',
        'resultDogWeight',
        'resultAdjustedTime'
    ]
     
     # Get the current directory of the script file
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Define the path for the CSV file in the same directory as the script
    csv_file = os.path.join(current_dir, csv_file_name)

    with open(csv_file, 'w', newline='') as csvFile:
        writer = csv.DictWriter(csvFile, fieldnames=csv_fields)
        writer.writeheader()
        for meeting in race_data:
            meeting_data = meeting.copy()
            races = meeting_data.pop('races')
            for race in races:
                traps = race.pop('traps')
                for trap in traps:
                    row = {**meeting_data, **race, **trap}
                    writer.writerow(row)

    print("Converted data to CSV file successfully.")

    insert_data_to_sqll()


def insert_data_to_sqll():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file_path = os.path.join(current_dir, csv_file_name)

    try:
        df = pd.read_csv(csv_file_path, encoding='ISO-8859-1')
        print("CSV file loaded successfully.")
    except UnicodeDecodeError:
        print("Error decoding the file. Try another encoding such as 'utf-16' or 'ISO-8859-1'.")
    except Exception as e:
        print(f"An error occurred: {e}")

    def clean_data(df):
        float_columns = [
            'raceDistance', 'resultSectionalTime', 'resultRunTime', 
            'resultDogWeight', 'resultAdjustedTime'
        ]
        
        for column in float_columns:
            if column in df.columns:
                df[column] = pd.to_numeric(df[column], errors='coerce').fillna(0).round(4)
        
        int_columns = [
            'meetingId', 'raceId', 'raceGoing', 'trapNumber', 'dogId',
            'resultPosition', 'resultMarketPos', 'resultMarketCnt', 
            'resultPriceNumerator', 'resultPriceDenominator'
        ]
        for column in int_columns:
            if column in df.columns:
                df[column] = pd.to_numeric(df[column], errors='coerce').fillna(0).astype(int)
        
        date_columns = ['meetingDate', 'raceDate', 'dogBorn']
        for column in date_columns:
            if column in df.columns:
                df[column] = pd.to_datetime(df[column], format='%d/%m/%Y', errors='coerce').dt.strftime('%Y-%m-%d')
        
        return df

    df = clean_data(df)
    df = df.where(pd.notnull(df), None)
    df['raceHandicap'] = df['raceHandicap'].replace({'True': 1, 'False': 0, 'Yes': 1, 'No': 0, None: 0})
    df['raceHandicap'] = pd.to_numeric(df['raceHandicap'], errors='coerce').fillna(0).astype(int)

    def safe_strftime(date, format='%Y-%m-%d'):
        if pd.isna(date):
            return None
        return date.strftime(format)

    def insert_data_to_sql(df, table_name, conn_string, limit):
        conn = pyodbc.connect(conn_string)
        cursor = conn.cursor()
        print("start inserting data")
        df_limited = df.head(limit)

        for index, row in df_limited.iterrows():
            try:
                print('inserting row', index)
                insert_query = f"""
                INSERT INTO {table_name} (
                    meetingDate, meetingId, trackName, raceDate, raceTime, raceId, raceTitle, raceNumber, raceType,
                    raceHandicap, raceClass, raceDistance, racePrizes, raceGoing, raceForecast, raceTricast,
                    trapNumber, trapHandicap, dogId, dogName, dogSire, dogDam, dogBorn, dogColour, dogSex, dogSeason,
                    trainerName, ownerName, SP, resultPosition, resultMarketPos, resultMarketCnt, resultPriceNumerator,
                    resultPriceDenominator, resultBtnDistance, resultSectionalTime, resultComment, resultRunTime,
                    resultDogWeight, resultAdjustedTime
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                values = (
                    row['meetingDate'], row['meetingId'], row['trackName'], row['raceDate'],
                    row['raceTime'], row['raceId'], row['raceTitle'], row['raceNumber'], row['raceType'], row['raceHandicap'],
                    row['raceClass'], row['raceDistance'], row['racePrizes'], row['raceGoing'], row['raceForecast'],
                    row['raceTricast'], row['trapNumber'], row['trapHandicap'], row['dogId'], row['dogName'],
                    row['dogSire'], row['dogDam'], row['dogBorn'], row['dogColour'], row['dogSex'], row['dogSeason'],
                    row['trainerName'], row['ownerName'], row['SP'], row['resultPosition'], row['resultMarketPos'],
                    row['resultMarketCnt'], row['resultPriceNumerator'], row['resultPriceDenominator'], 
                    row['resultBtnDistance'], row['resultSectionalTime'], row['resultComment'], row['resultRunTime'],
                    row['resultDogWeight'], row['resultAdjustedTime']
                )
                cursor.execute(insert_query, values)
            except Exception as e:
                print(f"Error inserting row {index}: {e}")
                continue

        conn.commit()
        cursor.close()
        conn.close()

    insert_data_to_sql(df, 'Results_23_24', connection_string, limit=1000000)
    delete_csv_file(csv_file_path)

def delete_csv_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"{file_path} has been deleted successfully.")
        else:
            print(f"File {file_path} does not exist.")
    except Exception as e:
        print(f"Error occurred while deleting the file: {e}")

def main():
    scrape_data()

# Schedule the job to run at 12:01 AM every day
schedule.every().day.at("00:01").do(main)


if __name__ == "__main__":
    while True:
        schedule.run_pending()  # Run the scheduled tasks
        time.sleep(1)  # Sleep for 1 second between checks
