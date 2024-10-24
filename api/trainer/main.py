from flask_cors import CORS  # Import CORS
from flask import Flask, Blueprint, jsonify, request, send_file, make_response
import logging
from database.db_config import get_db_connection

api2 = Blueprint('api2', __name__)  # Define the Blueprint for API 3

app = Flask(__name__)
CORS(api2)  # Enable CORS for all routes

@api2.route('/trainer_stats', methods=['GET'])
def trainer_stats():
    trainer_name = request.args.get('trainerName')  # Get trainer name from query param

    if not trainer_name:
        return jsonify({"error": "trainerName parameter is required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query for Trap Stats (Wins and Runs by Trap Number)
        trap_stats_query = f"""
        SELECT 
            trapNumber,
            COUNT(*) AS totalRaces,
            COUNT(CASE WHEN resultPosition = 1 THEN 1 ELSE NULL END) AS wins
        FROM 
            [GBGB_Results].[dbo].[vwMain]
        WHERE 
            trainerName = ?
        GROUP BY 
            trapNumber
        """

        cursor.execute(trap_stats_query, (trainer_name,))
        trap_stats_results = cursor.fetchall()

        # Query for Overall Stats (Total Races, Wins, Places, Percentages)
        overall_stats_query = f"""
        SELECT 
            COUNT(*) AS totalRaces,
            COUNT(CASE WHEN resultPosition = 1 THEN 1 ELSE NULL END) AS totalWins,
            COUNT(CASE WHEN resultPosition IN (1, 2, 3) THEN 1 ELSE NULL END) AS totalPlaces,
            (COUNT(CASE WHEN resultPosition = 1 THEN 1 ELSE NULL END) * 100.0 / COUNT(*)) AS winPercentage,
            (COUNT(CASE WHEN resultPosition IN (1, 2, 3) THEN 1 ELSE NULL END) * 100.0 / COUNT(*)) AS placePercentage
        FROM 
            [GBGB_Results].[dbo].[vwMain]
        WHERE 
            trainerName = ?
        """

        cursor.execute(overall_stats_query, (trainer_name,))
        overall_stats = cursor.fetchone()

        # Format the response data
        response = {
            "trainerName": trainer_name,
            "trapStats": [],
            "overallStats": {
                "totalRaces": overall_stats.totalRaces,
                "totalWins": overall_stats.totalWins,
                "totalPlaces": overall_stats.totalPlaces,
                "winPercentage": overall_stats.winPercentage,
                "placePercentage": overall_stats.placePercentage
            }
        }

        for row in trap_stats_results:
            response["trapStats"].append({
                "trapNumber": row.trapNumber,
                "totalRaces": row.totalRaces,
                "wins": row.wins
            })

        return jsonify(response)

    except Exception as e:
        logging.error("Error occurred while fetching trainer stats: %s", e)
        return jsonify({"error": "An error occurred while fetching trainer stats"}), 500

    finally:
        if 'conn' in locals() and conn:
            conn.close()

# Endpoint to get dog results
@api2.route('/trainer-results', methods=['GET'])
def trainer_results():
    trainer_name = request.args.get('trainerName')  # Get dogName parameter from query
    if not trainer_name:
        return jsonify({"error": "Please provide a trainerName."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query to get race results for a particular dog
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
        m.dogName,
        w.dogName AS winner,
        m.raceDistance,
        m.raceNumber,
        m.raceType,
        m.trapNumber,
        w.trainerName,
        m.resultDogWeight,
        w.raceClass

    FROM 
        dbo.vwMain m
    LEFT JOIN 
        dbo.vwMain w ON m.raceId = w.raceId AND w.resultPosition = 1
    WHERE 
        m.trainerName = ?
    ORDER BY 
        m.raceDate DESC, m.raceTime DESC;
    """
        cursor.execute(query, (trainer_name,))
        results = cursor.fetchall()

        if results:
            columns = [column[0] for column in cursor.description]
            data = [dict(zip(columns, row)) for row in results]
            return jsonify(data)
        else:
            return jsonify({"message": f"No results found for dog: {trainer_name}"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

@api2.route('/get_trainer_stats/<trainer_name>', methods=['GET'])
def get_all_trainer_stats(trainer_name):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
               SELECT 
            trackName,
            raceDistance,
            COUNT(*) AS totalRaces,
            COUNT(CASE WHEN resultPosition = 1 THEN 1 ELSE NULL END) AS wins1stPlace,
            COUNT(CASE WHEN resultPosition = 2 THEN 1 ELSE NULL END) AS wins2ndPlace,
            COUNT(CASE WHEN resultPosition = 3 THEN 1 ELSE NULL END) AS wins3rdPlace,
            COUNT(CASE WHEN resultPosition IN (1, 2, 3) THEN 1 ELSE NULL END) AS totalTop3Finishes,
            (COUNT(CASE WHEN resultPosition IN (1, 2, 3) THEN 1 ELSE NULL END) * 100.0) / COUNT(*) AS winPercentage,
            ROUND(AVG(resultRunTime), 3) AS averageRunTime,
            ROUND(MIN(resultRunTime), 3) AS fastestRunTime
            
        FROM 
            [GBGB_Results].[dbo].vwMain
        WHERE 
            trainerName = ?
        GROUP BY 
            trackName, raceDistance, trainerName
        Having raceDistance !=0
        
        ORDER BY 
            trackName, raceDistance
        
            """

    cursor.execute(query, (trainer_name,))
    rows = cursor.fetchall()

    results = []
    for row in rows:
        results.append({
            'trackName': row.trackName,
            'raceDistance': row.raceDistance,
            'totalRaces': row.totalRaces,
            'wins1stPlace': row.wins1stPlace,
            'wins2ndPlace': row.wins2ndPlace,
            'wins3rdPlace': row.wins3rdPlace,
            'totalTop3Finishes': row.totalTop3Finishes,
            'winPercentage': row.winPercentage,
            'averageRunTime': row.averageRunTime,
            'fastestRunTime': row.fastestRunTime,
        })
    conn.close()
    return jsonify(results)
# Endpoint to get top 20 greyhound stats for a specific trainer
@api2.route('/top_dogs/<trainer_name>', methods=['GET'])
def get_top_dogs(trainer_name):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT TOP 20
                dogName,
				dogSire,
				dogDam,
                COUNT(*) AS totalRaces,  
                COUNT(CASE WHEN resultPosition = 1 THEN 1 ELSE NULL END) AS wins1stPlace,
                COUNT(CASE WHEN resultPosition = 2 THEN 1 ELSE NULL END) AS wins2ndPlace,
                COUNT(CASE WHEN resultPosition = 3 THEN 1 ELSE NULL END) AS wins3rdPlace,
                COUNT(CASE WHEN resultPosition IN (1, 2, 3) THEN 1 ELSE NULL END) AS totalTop3Finishes,
                COUNT(CASE WHEN trapNumber = 1 AND resultPosition = 1 THEN 1 ELSE NULL END) AS trap1Wins,
                COUNT(CASE WHEN trapNumber = 2 AND resultPosition = 1 THEN 1 ELSE NULL END) AS trap2Wins,
                COUNT(CASE WHEN trapNumber = 3 AND resultPosition = 1 THEN 1 ELSE NULL END) AS trap3Wins,
                COUNT(CASE WHEN trapNumber = 4 AND resultPosition = 1 THEN 1 ELSE NULL END) AS trap4Wins,
                COUNT(CASE WHEN trapNumber = 5 AND resultPosition = 1 THEN 1 ELSE NULL END) AS trap5Wins,
                COUNT(CASE WHEN trapNumber = 6 AND resultPosition = 1 THEN 1 ELSE NULL END) AS trap6Wins,
                (COUNT(CASE WHEN resultPosition IN (1, 2, 3) THEN 1 ELSE NULL END) * 100.0) / COUNT(*) AS winPercentage
            FROM 
                [GBGB_Results].[dbo].[vwMain] vwMain
            WHERE 
                trainerName = ?
            GROUP BY 
                trainerName, dogId, dogName, dogSire, dogDam
            ORDER BY 
                totalRaces DESC, winPercentage DESC;
        """

        cursor.execute(query, (trainer_name,))
        rows = cursor.fetchall()

        results = []
        for row in rows:
            results.append({
                'dogName': row.dogName,
                'dogSire': row.dogSire,
                'dogDam': row.dogDam,
                'totalRaces': row.totalRaces,
                'wins1stPlace': row.wins1stPlace,
                'wins2ndPlace': row.wins2ndPlace,
                'wins3rdPlace': row.wins3rdPlace,
                'totalTop3Finishes': row.totalTop3Finishes,
                'trap1Wins': row.trap1Wins,
                'trap2Wins': row.trap2Wins,
                'trap3Wins': row.trap3Wins,
                'trap4Wins': row.trap4Wins,
                'trap5Wins': row.trap5Wins,
                'trap6Wins': row.trap6Wins,
                'winPercentage': row.winPercentage
            })

        conn.close()
        return jsonify(results)

    except Exception as e:
        # Log the error (if you have logging enabled)
        print(f"Error: {e}")

        # Return an error response
        return make_response(jsonify({"error": str(e)}), 500)

@api2.route('/distribution_of_placements/<trainer_name>', methods=['GET'])
def get_distribution_of_placements(trainer_name):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT 
        SUM(CASE WHEN resultPosition = 1 THEN 1 ELSE 0 END) AS total1st,
        SUM(CASE WHEN resultPosition = 2 THEN 1 ELSE 0 END) AS total2nd,
        SUM(CASE WHEN resultPosition = 3 THEN 1 ELSE 0 END) AS total3rd
    FROM 
        [GBGB_Results].[dbo].[vwMain]
    WHERE 
        trainerName = ?;
    """

    cursor.execute(query, (trainer_name,))
    row = cursor.fetchone()

    result = {
        'total1st': row.total1st,
        'total2nd': row.total2nd,
        'total3rd': row.total3rd
    }

    conn.close()
    return jsonify(result)

@api2.route('/performance_by_race_class/<trainer_name>', methods=['GET'])
def get_performance_by_race_class(trainer_name):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT 
        raceClass,
        COUNT(*) AS totalRaces,
        SUM(CASE WHEN resultPosition = 1 THEN 1 ELSE 0 END) AS wins1stPlace,
        (SUM(CASE WHEN resultPosition = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS winRateByClass
    FROM 
        [GBGB_Results].[dbo].[vwMain]
    WHERE 
        trainerName = ?
    GROUP BY 
        raceClass
    ORDER BY 
        totalRaces DESC;
    """

    cursor.execute(query, (trainer_name,))
    rows = cursor.fetchall()

    results = []
    for row in rows:
        results.append({
            'raceClass': row.raceClass,
            'totalRaces': row.totalRaces,
            'wins1stPlace': row.wins1stPlace,
            'winRateByClass': row.winRateByClass
        })

    conn.close()
    return jsonify(results)

def get_trainer_dog_performance():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT TOP 20
        trainerName,
        dogName,
        COUNT(*) AS TotalRaces,
        SUM(CASE WHEN resultPosition = 1 THEN 1 ELSE 0 END) AS Wins,
        CAST(SUM(CASE WHEN resultPosition = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 AS WinRatePercentage
    FROM dbo.vwMain
    WHERE trackName = 'Crayford'
    GROUP BY trainerName, dogName
    HAVING COUNT(*) >= 10
    ORDER BY WinRatePercentage DESC;
    """
    
    cursor.execute(query)
    result = cursor.fetchall()
    
    performance_data = []
    
    for row in result:
        performance_data.append({
            'trainerName': row[0],
            'dogName': row[1],
            'TotalRaces': row[2],
            'Wins': row[3],
            'WinRatePercentage': row[4]
        })
    
    conn.close()
    return performance_data

@api2.route('/trainer-dog-performance', methods=['GET'])
def trainer_dog_performance():
    data = get_trainer_dog_performance()
    return jsonify(data)