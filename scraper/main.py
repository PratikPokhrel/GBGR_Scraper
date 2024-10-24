import subprocess

# Define the paths to both scripts
gbgb_script = "gbgb/main.py"
greyhound_recorder_script = "greyhound_recorder/main.py"

# Run both scripts concurrently
try:
    print("Running gbgb script...")
    gbgb_process = subprocess.Popen(["python", gbgb_script])

    print("Running greyhound recorder script...")
    greyhound_recorder_process = subprocess.Popen(["python", greyhound_recorder_script])

    # Wait for both processes to complete
    gbgb_process.wait()
    greyhound_recorder_process.wait()

    print("Both scripts executed successfully.")
except subprocess.CalledProcessError as e:
    print(f"Error occurred while executing the scripts: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")

