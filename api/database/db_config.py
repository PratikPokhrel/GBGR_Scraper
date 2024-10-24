
import pyodbc

# Database connection string
connection_string = (
    r'DRIVER={SQL Server};'
    r'SERVER=MSI\SQLEXPRESS;'
    r'DATABASE=GBGB_Results;'
    r'Trusted_Connection=yes;'
)

# Function to create a database connection
def get_db_connection():
    conn = pyodbc.connect(connection_string)
    return conn
