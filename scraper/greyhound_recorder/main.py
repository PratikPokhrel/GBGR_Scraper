from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.firefox.options import Options
from selenium.common.exceptions import NoSuchElementException, StaleElementReferenceException
from bs4 import BeautifulSoup
from datetime import datetime
import pyodbc
import time
import uuid
import schedule
import sys
import os

# Add the path to the scraper directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from config import gecko_driver_path, firefox_binary_path, connection_string, GREYHOUND_RECORDER_UK_URL


def scrape_and_store_data():

    # Setup Firefox options
    options = Options()
    options.binary_location = firefox_binary_path  # Set the binary location

    # Setup the WebDriver (Firefox)
    service = Service(executable_path=gecko_driver_path)
    driver = webdriver.Firefox(service=service, options=options)

    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()

    # Create temporary tables for storing scraped data
    cursor.execute("""
        CREATE TABLE #TempUpcomingMeetings (
            MeetingID UNIQUEIDENTIFIER,
            MeetingDate DATETIME,
            Name NVARCHAR(50),
            AddedOn DATETIME
        )
    """)

    cursor.execute("""
        CREATE TABLE #TempUpcomingMeetingRaces (
            ID UNIQUEIDENTIFIER,
            RaceName NVARCHAR(255),
            GreyhoundName NVARCHAR(255),
            RaceTime NVARCHAR(50),
            RaceDistance NVARCHAR(50),
            TrainerName NVARCHAR(255),
            Career NVARCHAR(50),
            UpcomingMeetingID UNIQUEIDENTIFIER,
            Track_Dist [nvarchar](20) ,
	        Best_Track_Dist [nvarchar](20),
            RowIndex INT

        )
    """)

    # Open the website with the list of races
    driver.get(GREYHOUND_RECORDER_UK_URL)

    # Wait for the page to load completely
    wait = WebDriverWait(driver, 10)

    def extract_data_from_page(meeting_id):
     page_source = driver.page_source
     soup = BeautifulSoup(page_source, 'html.parser')
 
     # Extract the header information
     guide_field_events = soup.select('.form-guide-field-event')
 
     row_index = 1  # Initialize index for each row
 
     for guide_field_event in guide_field_events:
         rows = guide_field_event.select('.form-guide-field-selection-mobile')
         race_name = guide_field_event.select_one('.meeting-event__header-race').text.strip()
         race_distance = guide_field_event.select_one('.meeting-event__header-distance').text.strip()
         race_time = guide_field_event.select_one('.meeting-event__header-time').text.strip()
         
         for row in rows:
             if row is not None:  # Check if row is not None
                 name_element = row.select_one('.form-guide-field-selection-mobile__name')
                 if name_element:
                     name = name_element.text.strip()
                 else:
                     name = 'Unknown'  # Fallback if name is not found
 
                 trainer_element = row.select_one('.form-guide-field-selection-mobile__trainer')
                 if trainer_element:
                     trainer = trainer_element.text.strip()
 
                 if trainer.startswith('T.'):
                     trainer = trainer[2:].strip()
 
                 career_stat = row.find('span', text='Career')
                 career_value = ''
                 if career_stat:
                     career_value = career_stat.find_next('span', class_='form-guide-field-selection-mobile__stat-value').text.strip()
                 
                 tnD = row.find('span', text='T&D')
                 tnD_value = ''
                 if tnD:
                     tnD_value = tnD.find_next('span', class_='form-guide-field-selection-mobile__stat-value').text.strip()
                 print("TND", tnD_value)
 
                 bestTD = row.find('span', text='Best')
                 bestTD_value = ''
                 if bestTD:
                     bestTD_value = bestTD.find_next('span', class_='form-guide-field-selection-mobile__stat-value').text.strip()
                 print("bestTD_value", bestTD_value)
 
                 # Insert data into the temporary meeting races table with RowIndex
                 cursor.execute(""" 
                     INSERT INTO #TempUpcomingMeetingRaces (ID, RaceName, GreyhoundName, RaceTime, RaceDistance, TrainerName, Career, UpcomingMeetingID, Track_Dist, Best_Track_Dist, RowIndex)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                     """, (uuid.uuid4(), race_name, name, race_time, race_distance, trainer.replace("()", "").strip(), career_value, meeting_id, tnD_value, bestTD_value, row_index))
                 
                 row_index += 1  # Increment the row index for each entry
             else:
                 # Insert default data if the row is None, maintaining row index
                 cursor.execute(""" 
                     INSERT INTO #TempUpcomingMeetingRaces (ID, RaceName, GreyhoundName, RaceTime, RaceDistance, TrainerName, Career, UpcomingMeetingID, Track_Dist, Best_Track_Dist, RowIndex)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                     """, (uuid.uuid4(), "-", "-", "", " ", "", "", meeting_id, "", "", row_index))
                 
                 row_index += 1  # Increment the row index even for missing rows
 
     conn.commit()
 
    # Track processed meetings
    processed_meetings = set()

    while True:
        try:
            # Locate all meeting titles
            meeting_titles = wait.until(EC.presence_of_all_elements_located(
                (By.CSS_SELECTOR, '.meeting-list__title')))

            # Print all meeting titles
            for title in meeting_titles:
                print(f"Meeting Title: {title.text.strip()}")

            # Locate meeting rows
            meeting_rows = wait.until(EC.presence_of_all_elements_located(
                (By.CSS_SELECTOR, '.meeting-row')))

            # Break the loop if all meetings have been processed
            if len(processed_meetings) >= len(meeting_rows):
                print("All meetings processed.")
                break

            for i in range(len(meeting_rows)):
                if i in processed_meetings:
                    continue  # Skip already processed meetings

                try:
                    # Re-locate the meeting row in case of stale element
                    meeting_rows = wait.until(EC.presence_of_all_elements_located(
                        (By.CSS_SELECTOR, '.meeting-row')))
                    row = meeting_rows[i]
                    h2_element = row.find_element(
                        By.XPATH, 'preceding-sibling::h2[@class="meeting-list__title"]')

                    if h2_element:
                        print(f'Found <h2> Title: {h2_element.text}')
                        current_year = datetime.now().year

                        # Parse the date string into a datetime object (without year)
                        date_obj = datetime.strptime(h2_element.text, "%A, %B %d")
                        # Replace the year with the current year
                        date_with_year = date_obj.replace(year=current_year)
                        # Format the datetime object to MSSQL datetime format
                        mssql_datetime_str = date_with_year.strftime("%Y-%m-%d %H:%M:%S")
                    else:
                        print('No <h2> title found for this meeting-row.')
                        continue

                    # Extract meeting row title
                    meeting_title = row.find_element(
                        By.CSS_SELECTOR, '.meeting-row__title').text.strip()
                    print(f"Meeting Row Title: {meeting_title}")

                    # Insert meeting title and date into the temporary meetings table
                    meeting_id = uuid.uuid4()
                    cursor.execute(""" 
                        INSERT INTO #TempUpcomingMeetings (MeetingID, MeetingDate, Name, AddedOn)
                        VALUES (?, ?, ?, ?) """, (meeting_id, mssql_datetime_str, meeting_title, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))

                    # Check if the "Fields" button exists within the current row
                    try:
                        fields_button = row.find_element(
                            By.XPATH, './/a[contains(text(), "Fields")]')
                    except NoSuchElementException:
                        print(f"No 'Fields' button found in row {i}.")
                        continue

                    # Click the "Fields" button
                    fields_button.click()
                    driver.refresh()
                    # Wait for the new page to load
                    wait.until(EC.presence_of_element_located(
                        (By.CSS_SELECTOR, '.form-guide-field-event')))

                    # Extract data from the new page
                    extract_data_from_page(meeting_id)

                    # Mark this meeting as processed
                    processed_meetings.add(i)

                    # Navigate back to the original page
                    driver.back()

                    # Wait for the main meeting list to load again
                    wait.until(EC.presence_of_all_elements_located(
                        (By.CSS_SELECTOR, '.meeting-row')))

                except (StaleElementReferenceException, NoSuchElementException) as e:
                    print(f"An error occurred in row processing (row {i}): {e}")
                    continue

        except Exception as e:
            print(f"An error occurred during page processing: {e}")
            break  # Exit the loop on general exceptions

    # Check if any data was inserted into the temporary meetings table
    cursor.execute("SELECT COUNT(*) FROM #TempUpcomingMeetings")
    temp_meetings_count = cursor.fetchone()[0]
    print(f"Rows in temp meetings table: {temp_meetings_count}")

    # Check if any data was inserted into the temporary meeting races table
    cursor.execute("SELECT COUNT(*) FROM #TempUpcomingMeetingRaces")
    temp_races_count = cursor.fetchone()[0]
    print(f"Rows in temp meeting races table: {temp_races_count}")

    # Only delete existing data if there is data in the temp tables
    if temp_meetings_count > 0 or temp_races_count > 0:
        # After scraping, clear existing data from UpcomingMeetings and UpcomingMeetingRaces
        cursor.execute("DELETE FROM UpcomingMeetingRaces")
        cursor.execute("DELETE FROM UpcomingMeetings")

        # Insert data from the temporary meetings table into the main table
        cursor.execute(""" 
            INSERT INTO UpcomingMeetings (MeetingID, MeetingDate, Name, AddedOn)
            SELECT MeetingID, MeetingDate, Name, AddedOn FROM #TempUpcomingMeetings
        """)

        # Insert data from the temporary meeting races table into the main table
        cursor.execute(""" 
            INSERT INTO UpcomingMeetingRaces (ID, RaceName, GreyhoundName, RaceTime, RaceDistance, TrainerName, Career, UpcomingMeetingID,Track_Dist, Best_Track_Dist, RowIndex)
            SELECT ID, RaceName, GreyhoundName, RaceTime, RaceDistance, TrainerName, Career, UpcomingMeetingID, Track_Dist,Best_Track_Dist, RowIndex FROM #TempUpcomingMeetingRaces
        """)

    # Commit the transaction and cleanup
    conn.commit()

    # Drop the temporary tables
    cursor.execute("DROP TABLE IF EXISTS #TempUpcomingMeetings")
    cursor.execute("DROP TABLE IF EXISTS #TempUpcomingMeetingRaces")

    # Close the database connection
    conn.close()

    # Close the WebDriver
    driver.quit()

# Schedule the task to run every 1 hours
# schedule.every(1).hours.do(scrape_and_store_data)
schedule.every(2).minutes.do(scrape_and_store_data)


# Run the scheduler
while True:
    schedule.run_pending()
    time.sleep(1)
