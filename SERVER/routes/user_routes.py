from flask import Blueprint, request, jsonify
from services.user_service import register_user, login_user, request_password_reset, reset_password
import jwt
from functools import wraps
import os

user_bp = Blueprint('user', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({
                "success": False,
                "message": "Token is missing"
            }), 401
            
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
                
            data = jwt.decode(
                token,
                os.getenv('JWT_SECRET_KEY', 'sgfsgfdhgfkjhhkjhyutyutruytguyr5646547658774edhfchgfhg'),
                algorithms=['HS256']
            )
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({
                "success": False,
                "message": "Token has expired"
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "success": False,
                "message": "Invalid token"
            }), 401
            
    return decorated

@user_bp.route('/register/recruiter', methods=['POST'])
def register_recruiter():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'company_name', 'position']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        # Register recruiter
        result = register_user(data, "recruiter")
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@user_bp.route('/register/candidate', methods=['POST'])
def register_candidate():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'skills']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        # Register candidate
        result = register_user(data, "candidate")
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@user_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        # Attempt login
        result = login_user(data['email'], data['password'])
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 401
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@user_bp.route('/request-password-reset', methods=['POST'])
def request_reset():
    try:
        data = request.get_json()
        
        if 'email' not in data:
            return jsonify({
                "success": False,
                "message": "Email is required"
            }), 400
        
        result = request_password_reset(data['email'])
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@user_bp.route('/reset-password', methods=['POST'])
def reset():
    try:
        data = request.get_json()
        
        required_fields = ['token', 'new_password']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        result = reset_password(data['token'], data['new_password'])
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    try:
        token = request.headers.get('Authorization')[7:]  # Remove 'Bearer ' prefix
        data = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY', 'sgfsgfdhgfkjhhkjhyutyutruytguyr5646547658774edhfchgfhg'),
            algorithms=['HS256']
        )
        
        # In a real application, you would fetch the user's profile data here
        return jsonify({
            "success": True,
            "message": "Profile retrieved successfully",
            "email": data['email'],
            "user_type": data['user_type']
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving profile: {str(e)}"
        }), 500 