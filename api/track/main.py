from flask_cors import CORS  # Import CORS
import uuid
from flask import Flask, Blueprint, jsonify, request, send_file, make_response
import logging
from database.db_config import get_db_connection

api3 = Blueprint('api3', __name__)  # Define the Blueprint for API 3

app = Flask(__name__)
CORS(api3)  # Enable CORS for all routes

# API endpoint for querying trainer statistics filtered by trackName
@api3.route('/trainer-stats', methods=['GET'])
def get_trainer_stats():
    track_name = request.args.get('trackName')  # Get trackName from the query string

    if not track_name:
        return jsonify({"error": "Please provide a trackName."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # SQL query with trackName as a parameter
        query = """
        SELECT TOP 20
            trackName, 
            trainerName, 
            COUNT(CASE WHEN resultPosition = 1 THEN 1 END) AS wins, 
            COUNT(*) AS totalRaces, 
            CASE 
                WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN resultPosition = 1 THEN 1 END) * 1.0 / COUNT(*)) * 100 
                ELSE 0 
            END AS winRate
        FROM 
            dbo.vwMain
        WHERE 
            trackName = ?
        GROUP BY 
            trackName, 
            trainerName
        HAVING 
            COUNT(*) > 10
        ORDER BY 
            winRate DESC;
        """

        # Execute the query and fetch results
        cursor.execute(query, (track_name,))
        results = cursor.fetchall()

        # Structure the results as a list of dictionaries
        trainer_stats = []
        for row in results:
            trainer_stats.append({
                "trackName": row[0],
                "trainerName": row[1],
                "wins": row[2],
                "totalRaces": row[3],
                "winRate": row[4]  # winRate will be 0 if totalRaces is 0
            })

        return jsonify(trainer_stats), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

# Route to get the last 50 races per trackName
@api3.route('/get_last_50_races', methods=['GET'])
def get_last_50_races():
    # Get the trackName from the request query parameters
    track_name = request.args.get('trackName')

    # If trackName is not provided, return an error message
    if not track_name:
        return jsonify({"error": "trackName parameter is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # SQL query to get the last 50 races for the specified trackName
    query = """
    WITH RankedRaces AS (
    SELECT 
        meetingDate,
        meetingId,
        trackName,
        raceTime,
        raceDate,
        raceId,
        raceTitle,
        raceNumber,
        raceType,
        raceHandicap,
        raceClass,
        raceDistance,
        raceGoing,
        trapNumber,
        dogId,
        dogName,
        dogSire,
        dogDam,
        dogBorn,
        dogColour,
        dogSex,
        dogSeason,
        trainerName,
        ownerName,
        resultPosition,
        resultMarketPos,
        resultMarketCnt,
        resultBtnDistance,
        resultSectionalTime,
        resultComment,
        resultRunTime,
        resultDogWeight,
        resultAdjustedTime,
        ROW_NUMBER() OVER (PARTITION BY trackName ORDER BY raceDate DESC, raceTime DESC) AS raceRank
    FROM [GBGB_Results].[dbo].[vwMain]
    WHERE trackName = ?
),
Winners AS (
    SELECT 
        meetingDate,
        meetingId,
        trackName,
        raceTime,
        raceDate,
        raceId,
        raceTitle,
        raceNumber,
        raceType,
        raceHandicap,
        raceClass,
        raceDistance,
        raceGoing,
        trapNumber,
        dogId,
        dogName,
        dogSire,
        dogDam,
        dogBorn,
        dogColour,
        dogSex,
        dogSeason,
        trainerName,
        ownerName,
        resultPosition,
        resultMarketPos,
        resultMarketCnt,
        resultBtnDistance,
        resultSectionalTime,
        resultComment,
        resultRunTime,
        resultDogWeight,
        resultAdjustedTime,
        ROW_NUMBER() OVER (ORDER BY meetingDate DESC, raceTime DESC) AS winnerRank
    FROM RankedRaces
    WHERE resultPosition = 1
)
SELECT 
    *
FROM Winners
WHERE winnerRank <= 100
ORDER BY meetingDate DESC, raceNumber ASC;

    """

    # Execute the query with the provided trackName as a parameter
    cursor.execute(query, track_name)
    rows = cursor.fetchall()

    # Define column names
    columns = [column[0] for column in cursor.description]

    # Convert the query result into a list of dictionaries
    results = [dict(zip(columns, row)) for row in rows]

    conn.close()

    return jsonify(results)

# API to get total races and wins by trap number for Central Park
# API to get total races and wins by trap number for a specific track
@api3.route('/trap_stats', methods=['GET'])
def trap_stats():
    track_name = request.args.get('trackName')  # Get the trackName from the query parameter

    if not track_name:
        return jsonify({"error": "trackName parameter is required"}), 400

    # Get the database connection
    conn = get_db_connection()
    cursor = conn.cursor()

    # SQL query to get total races and wins by trap number
    query = f"""
        SELECT 
            trapNumber,
            COUNT(*) AS totalRaces,
            COUNT(CASE WHEN resultPosition = 1 THEN 1 ELSE NULL END) AS totalWins
        FROM [GBGB_Results].[dbo].[vwMain]
        WHERE trackName = ?
        GROUP BY trapNumber
        ORDER BY trapNumber;
    """

    cursor.execute(query, track_name)
    results = cursor.fetchall()

    # Format results into a list of dictionaries
    trap_stats = []
    for row in results:
        trap_stats.append({
            "trapNumber": row.trapNumber,
            "totalRaces": row.totalRaces,
            "totalWins": row.totalWins
        })

    # Close the connection
    conn.close()

    # Return the results as JSON
    return jsonify({"trackName": track_name, "trapStats": trap_stats})
