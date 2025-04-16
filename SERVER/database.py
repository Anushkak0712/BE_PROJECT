from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# MongoDB Atlas connection string
MONGODB_URI = os.getenv('MONGODB_URI')

def get_database():
    try:
        # Create a connection using MongoClient
        client = MongoClient(MONGODB_URI)
        
        # Test the connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        
        # Create the database
        return client['talentConnect']
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None

def register_user(username, email, password):
    try:
        db = get_database()
        if db is None:
            return {"success": False, "message": "Database connection failed"}
            
        users_collection = db['users']
        
        # Check if user already exists
        if users_collection.find_one({"email": email}):
            return {"success": False, "message": "User already exists"}
            
        # Create new user document
        user_data = {
            "username": username,
            "email": email,
            "password": password,  # Note: In production, you should hash the password
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Insert the new user
        result = users_collection.insert_one(user_data)
        
        if result.inserted_id:
            return {"success": True, "message": "User registered successfully", "user_id": str(result.inserted_id)}
        else:
            return {"success": False, "message": "Failed to register user"}
            
    except Exception as e:
        return {"success": False, "message": f"Error registering user: {str(e)}"}

# Example usage:
db = get_database()
if db is not None:
    # Test user registration
    result = register_user("test_user", "test@example.com", "password123")
    print(result)

# Example usage:
db = get_database()
collection = db['users'] 