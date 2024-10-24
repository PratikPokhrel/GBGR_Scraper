from flask_cors import CORS  # Import CORS
import uuid
from flask import Flask, Blueprint, jsonify, request, send_file, make_response
import csv
import io  # Import the io module
import logging
from database.db_config import get_db_connection

api4 = Blueprint('api4', __name__)  # Define the Blueprint for API 3

app = Flask(__name__)
CORS(api4)  # Enable CORS for all routes

# API to get all upcoming meetings
@api4.route('/api/upcoming-meetings', methods=['GET'])
def get_upcoming_meetings():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            um.MeetingID,
            um.MeetingDate,
            um.Name,
            um.AddedOn,
            COUNT(DISTINCT(umr.RaceName)) AS TotalRaces
        FROM 
            dbo.UpcomingMeetings AS um
        LEFT JOIN 
            dbo.UpcomingMeetingRaces AS umr ON um.MeetingID = umr.UpcomingMeetingID
        GROUP BY 
            um.MeetingID, um.MeetingDate, um.Name, um.AddedOn
    ''')
    
    rows = cursor.fetchall()
    meetings = [
        {
            "MeetingID": str(row.MeetingID),
            "MeetingDate": row.MeetingDate,
            "Name": row.Name,
            "AddedOn": row.AddedOn,
            "TotalRaces": row.TotalRaces
        } for row in rows
    ]
    
    conn.close()
    return jsonify(meetings)

# Function to query data
def get_dog_performance():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT TOP 20
        dogName,
        COUNT(*) AS TotalRaces,
        SUM(CASE WHEN resultPosition = 1 THEN 1 ELSE 0 END) AS Wins,
        CAST(SUM(CASE WHEN resultPosition = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 AS WinRatePercentage
    FROM dbo.vwMain
    WHERE trackName = 'Crayford'
    GROUP BY dogName
    HAVING COUNT(*) >= 10
    ORDER BY WinRatePercentage DESC;
    """
    
    cursor.execute(query)
    result = cursor.fetchall()
    
    dogs_performance = []
    
    for row in result:
        dogs_performance.append({
            'dogName': row[0],
            'TotalRaces': row[1],
            'Wins': row[2],
            'WinRatePercentage': row[3]
        })
    
    conn.close()
    return dogs_performance

@api4.route('/dog-performance', methods=['GET'])
def dog_performance():
    data = get_dog_performance()
    return jsonify(data)

# API to get all races by MeetingID
@api4.route('/api/races/<meeting_id>', methods=['GET'])
def get_races_by_meeting_id(meeting_id):
    try:
        meeting_id = uuid.UUID(meeting_id)  # Ensure it's a valid UUID
    except ValueError:
        return jsonify({"error": "Invalid Meeting ID"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT 
            ID, 
           CAST(REPLACE(RaceName, 'Race ', '') AS INT) AS RaceName, 
            RaceTime, 
            RaceDistance, 
            GreyhoundName, 
            TrainerName, 
            Career,
            Track_Dist,
            Best_Track_Dist,
            RowIndex
        FROM dbo.UpcomingMeetingRaces
        WHERE UpcomingMeetingID = ?
        ORDER BY CAST(REPLACE(RaceName, 'Race ', '') AS INT)
    ''', (meeting_id,))
    
    rows = cursor.fetchall()
    races = [
        {
            "ID": str(row.ID),
            "RaceName": row.RaceName,
            "RaceTime": row.RaceTime,
            "RaceDistance": row.RaceDistance,
            "GreyhoundName": row.GreyhoundName,
            "TrainerName": row.TrainerName,
            "Career": row.Career,
            "Track_Dist": row.Track_Dist,
            "Best_Track_Dist": row.Best_Track_Dist,
            "RowIndex": row.RowIndex,
            
        } for row in rows
    ]
    conn.close()
    
    if not races:
        return jsonify({"message": "No races found for this meeting"}), 404
    
    return jsonify(races)



# Endpoint to get dog results and download CSV
@api4.route('/dog-results-csv', methods=['GET'])
def download_dog_results_csv():
    dog_name = request.args.get('dogName')  # Get dogName parameter from query
    if not dog_name:
        return jsonify({"error": "Please provide a dogName."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query to get race results for a particular dog
        query = """
        SELECT * 
        FROM dbo.vwMain
        WHERE dogName = ?
        ORDER by MeetingDate DESC
        """
        cursor.execute(query, (dog_name,))
        results = cursor.fetchall()

        if not results:
            return jsonify({"message": f"No results found for dog: {dog_name}"}), 404

        # Create a CSV in-memory stream
        output = io.StringIO()
        writer = csv.writer(output)

        # Write the header
        columns = [column[0] for column in cursor.description]
        writer.writerow(columns)

        # Write the data
        for row in results:
            writer.writerow(row)

        output.seek(0)  # Go to the beginning of the stream

        # Create a Flask response with the CSV content
        response = make_response(output.getvalue())
        response.headers['Content-Disposition'] = f'attachment; filename={dog_name}_results.csv'
        response.headers['Content-Type'] = 'text/csv'
        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()



# Endpoint to get trainer results and download CSV
@api4.route('/trainer-results-csv', methods=['GET'])
def download_trainer_results_csv():
    trainer_name = request.args.get('trainerName')  # Get trainerName parameter from query
    if not trainer_name:
        return jsonify({"error": "Please provide a trainerName."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query to get race results for a particular trainer
        query = """
        SELECT * 
        FROM dbo.vwMain
        WHERE trainerName = ?
        ORDER by MeetingDate DESC
        
        """
        cursor.execute(query, (trainer_name,))
        results = cursor.fetchall()

        if not results:
            return jsonify({"message": f"No results found for trainer: {trainer_name}"}), 404

        # Create a CSV in-memory stream
        output = io.StringIO()
        writer = csv.writer(output)

        # Write the header
        columns = [column[0] for column in cursor.description]
        writer.writerow(columns)

        # Write the data
        for row in results:
            writer.writerow(row)

        output.seek(0)  # Go to the beginning of the stream

        # Create a Flask response with the CSV content
        response = make_response(output.getvalue())
        response.headers['Content-Disposition'] = f'attachment; filename={trainer_name}_results.csv'
        response.headers['Content-Type'] = 'text/csv'
        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()




@api4.route('/track-results-csv', methods=['GET'])
def download_track_results_csv():
    track_name = request.args.get('trackName')  # Get dogName parameter from query
    if not track_name:
        return jsonify({"error": "Please provide a trackName."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query to get race results for a particular dog
        query = """
        SELECT  [meetingDate]
      ,[meetingId]
      ,[trackName]
      ,[raceTime]
      ,[raceDate]
      ,[raceId]
      ,[raceTitle]
      ,[raceNumber]
      ,[raceType]
      ,[raceHandicap]
      ,[raceClass]
      ,[raceDistance]
      ,[raceGoing]
      ,[trapNumber]
      ,[dogId]
      ,[dogName]
      ,[dogSire]
      ,[dogDam]
      ,[dogBorn]
      ,[dogColour]
      ,[dogSex]
      ,[dogSeason]
      ,[trainerName]
      ,[ownerName]
      ,[resultPosition]
      ,[resultMarketPos]
      ,[resultMarketCnt]
      ,[resultBtnDistance]
      ,[resultSectionalTime]
      ,[resultComment]
      ,[resultRunTime]
      ,[resultDogWeight]
      ,[resultAdjustedTime]
  FROM [GBGB_Results].[dbo].[vwMain]

        WHERE trackName = ?
        ORDER by MeetingDate DESC
        """
        cursor.execute(query, (track_name,))
        results = cursor.fetchall()

        if not results:
            return jsonify({"message": f"No results found for track: {track_name}"}), 404

        # Create a CSV in-memory stream
        output = io.StringIO()
        writer = csv.writer(output)

        # Write the header
        columns = [column[0] for column in cursor.description]
        writer.writerow(columns)

        # Write the data
        for row in results:
            writer.writerow(row)

        output.seek(0)  # Go to the beginning of the stream

        # Create a Flask response with the CSV content
        response = make_response(output.getvalue())
        response.headers['Content-Disposition'] = f'attachment; filename={track_name}_results.csv'
        response.headers['Content-Type'] = 'text/csv'
        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

# API to fetch distinct trackNames (no pagination as it's usually a small dataset)
@api4.route('/api/tracknames', methods=['GET'])
def get_track_names():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = "SELECT DISTINCT trackName FROM dbo.vwMain ORDER BY trackName"
        cursor.execute(query)
        rows = cursor.fetchall()

        track_names = [row[0] for row in rows if row[0] is not None]

        cursor.close()
        conn.close()

        return jsonify(track_names)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API to fetch distinct dogNames with pagination
@api4.route('/api/dognames', methods=['GET'])
def get_dog_names():
    try:
        # Get pagination parameters and search query from the request
        search_query = request.args.get('search', '')
        limit = int(request.args.get('limit', 20))  # Default 20 records
        offset = int(request.args.get('offset', 0))  # Default offset 0

        conn = get_db_connection()
        cursor = conn.cursor()

        # Modify query to filter dogNames based on search_query
        query = f"""
            SELECT DISTINCT dogName
            FROM dbo.vwMain
            WHERE dogName LIKE ?
            ORDER BY dogName
            OFFSET {offset} ROWS
            FETCH NEXT {limit} ROWS ONLY;
        """
        search_pattern = f"{search_query}%"  # Matches dog names starting with search_query
        cursor.execute(query, (search_pattern,))
        rows = cursor.fetchall()

        dog_names = [row[0] for row in rows if row[0] is not None]

        cursor.close()
        conn.close()

        return jsonify(dog_names)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API to fetch distinct trainerNames with pagination
@api4.route('/api/trainernames', methods=['GET'])
def get_trainer_names():
    try:
        # Get pagination parameters and search query from the request
        search_query = request.args.get('search', '')
        limit = int(request.args.get('limit', 20))  # Default 20 records
        offset = int(request.args.get('offset', 0))  # Default offset 0

        conn = get_db_connection()
        cursor = conn.cursor()

        # Modify query to filter trainerNames based on search_query
        query = f"""
            SELECT DISTINCT trainerName
            FROM dbo.vwMain
            WHERE trainerName LIKE ?
            ORDER BY trainerName
            OFFSET {offset} ROWS
            FETCH NEXT {limit} ROWS ONLY;
        """
        search_pattern = f"%{search_query}%"  # Matches trainer names starting with search_query
        cursor.execute(query, (search_pattern,))
        rows = cursor.fetchall()

        trainer_names = [row[0] for row in rows if row[0] is not None]

        cursor.close()
        conn.close()

        return jsonify(trainer_names)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to get raceClass, raceType, raceDistance for a particular trackName
@api4.route('/api/race-drop-downs/<trackName>', methods=['GET'])
def get_race_details(trackName):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT DISTINCT raceClass, raceType, raceDistance 
        FROM vwMain 
        WHERE trackName = ?
    """
    cursor.execute(query, (trackName,))
    race_details = [
        {"raceClass": row[0], "raceType": row[1], "raceDistance": row[2]} 
        for row in cursor.fetchall()
    ]
    conn.close()

    return jsonify(race_details)
# Route to get race details based on trackName and optional filters



@api4.route('/download-form-csv', methods=['POST'])
def download_form_csv():
    data = request.json
    track_name = data.get('trackName')
    race_class = data.get('raceClass')
    race_type = data.get('raceType')
    race_distance = data.get('raceDistance')
    from_date = data.get('fromDate')
    to_date = data.get('toDate')

    # Modify query to select all columns (*)
    query = "SELECT * FROM vwMain WHERE trackName = ?"
    params = [track_name]

    if race_class:
        query += " AND raceClass = ?"
        params.append(race_class)

    if race_type:
        query += " AND raceType = ?"
        params.append(race_type)

    if race_distance:
        query += " AND raceDistance = ?"
        params.append(race_distance)

    if from_date and to_date:
        query += " AND MeetingDate BETWEEN ? AND ?"
        params.append(from_date)
        params.append(to_date)
        
    query += " ORDER BY MeetingDate DESC"
    print(query)
    # Connect to the database and execute the query
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(query, params)
        results = cursor.fetchall()

        if not results:
            return jsonify({"message": f"No results found for track: {track_name}"}), 404

        # Create a CSV in-memory stream
        output = io.StringIO()
        writer = csv.writer(output)

        # Write the header
        columns = [column[0] for column in cursor.description]
        writer.writerow(columns)

        # Write the data
        for row in results:
            writer.writerow(row)

        output.seek(0)  # Go to the beginning of the stream

        # Create a Flask response with the CSV content
        response = make_response(output.getvalue())
        response.headers['Content-Disposition'] = f'attachment; filename={track_name}_results.csv'
        response.headers['Content-Type'] = 'text/csv'
        return response

    finally:
        conn.close()


