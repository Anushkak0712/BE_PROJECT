from database import get_database
from models.user import Recruiter, Candidate
from typing import Union, Dict, Any
import jwt
from datetime import datetime, timedelta
import os

def register_user(user_data: Dict[str, Any], user_type: str) -> Dict[str, Any]:
    try:
        db = get_database()
        if db is None:
            return {"success": False, "message": "Database connection failed"}
            
        users_collection = db['users']
        
        # Check if user already exists
        if users_collection.find_one({"email": user_data["email"]}):
            return {"success": False, "message": "User already exists"}
        
        # Create user object based on type
        if user_type == "recruiter":
            user = Recruiter(
                username=user_data["username"],
                email=user_data["email"],
                password=user_data["password"],
                company_name=user_data["company_name"],
                position=user_data["position"]
            )
        elif user_type == "candidate":
            user = Candidate(
                username=user_data["username"],
                email=user_data["email"],
                password=user_data["password"],
                skills=user_data["skills"],
                experience=user_data.get("experience")
            )
        else:
            return {"success": False, "message": "Invalid user type"}
        
        # Insert the new user
        result = users_collection.insert_one(user.to_dict())
        
        if result.inserted_id:
            return {
                "success": True,
                "message": f"{user_type.capitalize()} registered successfully",
                "user_id": str(result.inserted_id)
            }
        else:
            return {"success": False, "message": "Failed to register user"}
            
    except ValueError as e:
        return {"success": False, "message": str(e)}
    except Exception as e:
        return {"success": False, "message": f"Error registering user: {str(e)}"}

def login_user(email: str, password: str) -> Dict[str, Any]:
    try:
        db = get_database()
        if db is None:
            return {"success": False, "message": "Database connection failed"}
            
        users_collection = db['users']
        user_data = users_collection.find_one({"email": email})
        
        if not user_data:
            print(f"User not found with email: {email}")
            return {"success": False, "message": "User not found"}
            
        # Create appropriate user object with is_hashed=True
        if user_data["user_type"] == "recruiter":
            user = Recruiter(
                username=user_data["username"],
                email=user_data["email"],
                password=user_data["password"],
                company_name=user_data["company_name"],
                position=user_data["position"],
                is_hashed=True
            )
        else:
            user = Candidate(
                username=user_data["username"],
                email=user_data["email"],
                password=user_data["password"],
                skills=user_data["skills"],
                experience=user_data.get("experience"),
                is_hashed=True
            )
            
        print(f"Attempting to verify password for user: {email}")
        if user.verify_password(password):
            print("Password verified successfully")
            # Generate JWT token
            token = jwt.encode(
                {
                    'email': user.email,
                    'user_type': user.user_type,
                    'exp': datetime.utcnow() + timedelta(days=1)
                },
                os.getenv('JWT_SECRET_KEY', 'sgfsgfdhgfkjhhkjhyutyutruytguyr5646547658774edhfchgfhg'),
                algorithm='HS256'
            )
            return {
                "success": True,
                "message": "Login successful",
                "token": token,
                "user_type": user.user_type
            }
        else:
            print("Password verification failed")
            return {"success": False, "message": "Invalid password"}
            
    except Exception as e:
        print(f"Error during login: {str(e)}")
        return {"success": False, "message": f"Error during login: {str(e)}"}

def request_password_reset(email: str) -> Dict[str, Any]:
    try:
        db = get_database()
        if db is None:
            return {"success": False, "message": "Database connection failed"}
            
        users_collection = db['users']
        user_data = users_collection.find_one({"email": email})
        
        if not user_data:
            return {"success": False, "message": "User not found"}
            
        # Create appropriate user object
        if user_data["user_type"] == "recruiter":
            user = Recruiter(
                username=user_data["username"],
                email=user_data["email"],
                password=user_data["password"],
                company_name=user_data["company_name"],
                position=user_data["position"]
            )
        else:
            user = Candidate(
                username=user_data["username"],
                email=user_data["email"],
                password=user_data["password"],
                skills=user_data["skills"],
                experience=user_data.get("experience")
            )
            
        reset_token = user.generate_reset_token()
        
        # Update user in database with reset token
        users_collection.update_one(
            {"email": email},
            {"$set": {
                "reset_token": reset_token,
                "reset_token_expiry": user.reset_token_expiry
            }}
        )
        
        # In a real application, you would send this token via email
        return {
            "success": True,
            "message": "Password reset token generated",
            "reset_token": reset_token
        }
            
    except Exception as e:
        return {"success": False, "message": f"Error generating reset token: {str(e)}"}

def reset_password(token: str, new_password: str) -> Dict[str, Any]:
    try:
        db = get_database()
        if db is None:
            return {"success": False, "message": "Database connection failed"}
            
        users_collection = db['users']
        
        # Find user with matching reset token
        user_data = users_collection.find_one({
            "reset_token": token,
            "reset_token_expiry": {"$gt": datetime.utcnow()}
        })
        
        if not user_data:
            return {"success": False, "message": "Invalid or expired reset token"}
            
        # Create appropriate user object
        if user_data["user_type"] == "recruiter":
            user = Recruiter(
                username=user_data["username"],
                email=user_data["email"],
                password=new_password,
                company_name=user_data["company_name"],
                position=user_data["position"]
            )
        else:
            user = Candidate(
                username=user_data["username"],
                email=user_data["email"],
                password=new_password,
                skills=user_data["skills"],
                experience=user_data.get("experience")
            )
            
        # Update user password and clear reset token
        users_collection.update_one(
            {"email": user.email},
            {"$set": {
                "password": user.password,
                "reset_token": None,
                "reset_token_expiry": None
            }}
        )
        
        return {"success": True, "message": "Password reset successful"}
            
    except Exception as e:
        return {"success": False, "message": f"Error resetting password: {str(e)}"}

def get_user_by_email(email: str) -> Union[Dict[str, Any], None]:
    try:
        db = get_database()
        if db is None:
            return None
            
        users_collection = db['users']
        return users_collection.find_one({"email": email})
    except Exception as e:
        print(f"Error getting user: {e}")
        return None 