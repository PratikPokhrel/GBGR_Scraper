from flask_cors import CORS  # Import CORS
from flask import Flask, Blueprint, jsonify, request, send_file, make_response
import logging
from database.db_config import get_db_connection

api1 = Blueprint('api1', __name__)  # Define the Blueprint for API 3

app = Flask(__name__)
CORS(api1)  # Enable CORS for all routes

# Function to get the latest races for a given dog name
def get_latest_races(dog_name):
    query = """
    SELECT TOP 20
        m.meetingDate,
        m.trackName,
        m.raceTime,
        m.raceDate,
        m.raceId,
        m.raceTitle,
        m.resultPosition,
        m.resultPriceNumerator,
        m.resultPriceDenominator,
        m.resultRunTime,
        m.resultComment,
        w.dogName AS Winner,
        m.raceDistance,
        m.raceNumber,
        m.trapNumber,
        w.trainerName,
        m.resultDogWeight,
        w.raceClass,
        m.raceType

    FROM 
        dbo.vwMain m
    LEFT JOIN 
        dbo.vwMain w ON m.raceId = w.raceId AND w.resultPosition = 1
    WHERE 
        m.dogName = ?
    ORDER BY 
        m.raceDate DESC, m.raceTime DESC;
    """

    # Connect to the database and execute the query
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, (dog_name,))
        return cursor.fetchall()


# Flask route to get races for a specific dog name
@api1.route('/races/<dog_name>', methods=['GET'])
def get_races(dog_name):
    try:
        # Fetch the latest races for the given dog name
        races = get_latest_races(dog_name)
        races_list = []
        for race in races:
            races_list.append({
                "meetingDate": race[0],
                "trackName": race[1],
                "raceTime": race[2],
                "raceDate": race[3],
                "raceId": race[4],
                "raceTitle": race[5],
                "resultPosition": race[6],
                "resultPriceNumerator": race[7],
                "resultPriceDenominator": race[8],
                "resultRunTime": race[9],
                "resultComment": race[10],
                "winner": race[11],
                "raceDistance": race[12],
                "raceNumber": race[13],
                "trapNumber": race[14],  # Corrected index for trapNumber
                "trainerName": race[15],  # Corrected index for trapNumber
                "resultDogWeight": race[16],  # Corrected index for trapNumber
                "raceClass": race[17],
                "raceType": race[18],
            })
        # Return the list of races as a JSON response
        return jsonify(races_list)
    except Exception as e:
        # Return an error response if something goes wrong
        return jsonify({"error": str(e)}), 500  

@api1.route('/dog-info', methods=['GET'])
def get_dog_info():
    dog_name = request.args.get('dogName')
    if not dog_name:
        return jsonify({"error": "dogName parameter is required"}), 400

    query = """
    SELECT DISTINCT 
        dogSire, 
        dogDam, 
        trainerName, 
        ownerName 
    FROM vwMain 
    WHERE dogName = ?
    AND dogSire IS NOT NULL
    AND dogDam IS NOT NULL
    AND trainerName IS NOT NULL
    AND ownerName IS NOT NULL
    """

    try:
        # Connect to the database
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (dog_name,))
            results = cursor.fetchall()

            # Convert the results to a list of dictionaries
            data = [
                {
                    "dogSire": row.dogSire,
                    "dogDam": row.dogDam,
                    "trainerName": row.trainerName,
                    "ownerName": row.ownerName,
                }
                for row in results
            ]

            if not data:
                return jsonify({"error": "No valid records found for the given dog name"}), 404

            return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api1.route('/getRaceData', methods=['GET'])
def get_race_data():
    dog_name = request.args.get('dogName')
    if not dog_name:
        return jsonify({"error": "Missing dogName parameter"}), 400

    query = """
    SELECT 
        trackName,
        raceDistance,
        AVG(CAST(resultRunTime AS FLOAT)) AS AverageRaceTime
    FROM 
        dbo.vwMain
    WHERE 
        resultRunTime IS NOT NULL AND dogName = ?
    GROUP BY 
        trackName, 
        raceDistance
    Having raceDistance <> 0
    
    ORDER BY 
        trackName, 
        raceDistance;
    """
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, (dog_name,))
    rows = cursor.fetchall()
    conn.close()

    race_data = []
    for row in rows:
        race_data.append({
            'trackName': row.trackName,
            'raceDistance': row.raceDistance,
            'AverageRaceTime': row.AverageRaceTime
        })

    return jsonify(race_data)
# Function to get data from SQL Server
def get_dog_stats(dog_name):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT 
        dogName,
        COUNT(*) AS totalRaces,
        SUM(CASE WHEN resultPosition = 1 THEN 1 ELSE 0 END) AS firstPositions,
        SUM(CASE WHEN resultPosition = 2 THEN 1 ELSE 0 END) AS secondPositions,
        SUM(CASE WHEN resultPosition = 3 THEN 1 ELSE 0 END) AS thirdPositions,
        ROUND(CAST(SUM(CASE WHEN resultPosition = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) AS winPercentage,
        ROUND(CAST(SUM(CASE WHEN resultPosition IN (1, 2, 3) THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) AS placePercentage,
        MIN(resultSectionalTime) AS best1stSectionalTime
    FROM dbo.vwMain
    WHERE dogName = ?
    GROUP BY dogName;
    """

    cursor.execute(query, (dog_name,))
    row = cursor.fetchone()

    if row:
        result = {
            'dogName': row[0],
            'totalRaces': row[1],
            'firstPositions': row[2],
            'secondPositions': row[3],
            'thirdPositions': row[4],
            'winPercentage': row[5],
            'placePercentage': row[6],
            'best1stSectionalTime': row[7]
        }
    else:
        result = None

    conn.close()
    return result



# API route to get stats for a particular dog
@api1.route('/dogstats', methods=['GET'])
def dog_stats():
    dog_name = request.args.get('dogName')

    if not dog_name:
        return jsonify({'error': 'Please provide a dog name'}), 400

    result = get_dog_stats(dog_name)

    if result:
        return jsonify(result)
    else:
        return jsonify({'error': 'Dog not found'}), 404

# API for fetching greyhound stats
@api1.route('/greyhound_stats', methods=['GET'])
def greyhound_stats():
    dog_name = request.args.get('dog_name')  # Get the dog's name from the query parameter

    if not dog_name:
        return jsonify({"error": "dog_name parameter is required"}), 400

    # Get the database connection
    conn = get_db_connection()
    cursor = conn.cursor()

    # SQL query using CTEs
    query = """
        -- 1. Wins and Runs by Trap Number
        WITH TrapStats AS (
            SELECT 
                trapNumber,
                COUNT(*) AS totalRuns,
                COUNT(CASE WHEN resultPosition = 1 THEN 1 ELSE NULL END) AS totalWins
            FROM [GBGB_Results].[dbo].[vwMain]
            WHERE dogName = ?
            GROUP BY trapNumber
        ),
        -- 2. Overall Stats
        OverallStats AS (
            SELECT 
                COUNT(*) AS totalRaces,
                COUNT(CASE WHEN resultPosition = 1 THEN 1 ELSE NULL END) AS totalWins,
                COUNT(CASE WHEN resultPosition IN (1, 2, 3) THEN 1 ELSE NULL END) AS totalPlaces,
                (COUNT(CASE WHEN resultPosition = 1 THEN 1 ELSE NULL END) * 100.0 / COUNT(*)) AS winPercentage,
                (COUNT(CASE WHEN resultPosition IN (1, 2, 3) THEN 1 ELSE NULL END) * 100.0 / COUNT(*)) AS placePercentage
            FROM [GBGB_Results].[dbo].[vwMain]
            WHERE dogName = ?
        ),
        -- 3. Best Sectional Time (1st Split Time)
        BestSectionalTime AS (
            SELECT 
                MIN(resultSectionalTime) AS bestFirstSecTime
            FROM [GBGB_Results].[dbo].[vwMain]
            WHERE dogName = ?
        )

        -- Final Select (Combined Results)
        SELECT 
            t.trapNumber,
            t.totalRuns,
            t.totalWins,
            o.totalRaces,
            o.totalWins AS totalOverallWins,
            o.totalPlaces,
            o.winPercentage,
            o.placePercentage,
            b.bestFirstSecTime
        FROM TrapStats t
        CROSS JOIN OverallStats o
        CROSS JOIN BestSectionalTime b;
    """

    # Execute the query with the dog_name as a parameter (to prevent SQL injection)
    cursor.execute(query, (dog_name, dog_name, dog_name))
    results = cursor.fetchall()

    # Format results
    if results:
        response = {
            "dog_name": dog_name,
            "trap_stats": [],
            "overall_stats": {
                "totalRaces": results[0].totalRaces,
                "totalWins": results[0].totalOverallWins,
                "totalPlaces": results[0].totalPlaces,
                "winPercentage": results[0].winPercentage,
                "placePercentage": results[0].placePercentage,
                "bestFirstSecTime": results[0].bestFirstSecTime
            }
        }

        for row in results:
            response["trap_stats"].append({
                "trapNumber": row.trapNumber,
                "totalRuns": row.totalRuns,
                "totalWins": row.totalWins
            })

    else:
        response = {"error": "No stats found for the given dog."}

    # Close the connection
    conn.close()

    return jsonify(response)


# Configure logging
logging.basicConfig(level=logging.ERROR, format='%(asctime)s %(levelname)s: %(message)s')




# Endpoint to get dog results
@api1.route('/dog-results', methods=['GET'])
def get_dog_results():
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
        order by meetingDate
        """
        cursor.execute(query, (dog_name,))
        results = cursor.fetchall()

        if results:
            columns = [column[0] for column in cursor.description]
            data = [dict(zip(columns, row)) for row in results]
            return jsonify(data)
        else:
            return jsonify({"message": f"No results found for dog: {dog_name}"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()
