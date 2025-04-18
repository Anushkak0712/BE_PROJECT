from flask import Blueprint, request, jsonify, send_from_directory
from services.job_service import (
    create_job_posting,
    get_job_postings,
    save_job,
    submit_application,
    get_applications,
    update_application_status,
    request_revaluation
)
from routes.user_routes import token_required
from database import get_database
import jwt
import os
from predictor_module import predict_personality
import uuid

job_bp = Blueprint('job', __name__)
# Get the absolute path to the uploads directory
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Route to serve uploaded videos
@job_bp.route('/videos/<filename>')
@token_required
def serve_video(filename):
    try:
        print(f"Attempting to serve video: {filename}")
        print(f"Looking in directory: {UPLOAD_FOLDER}")
        # List files in uploads directory for debugging
        print(f"Files in uploads directory: {os.listdir(UPLOAD_FOLDER)}")
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        print(f"Error serving video: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error serving video: {str(e)}"
        }), 404

@job_bp.route('/jobs', methods=['POST'])
@token_required
def create_job():
    try:
        token = request.headers.get('Authorization')[7:]  # Remove 'Bearer ' prefix
        data = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY', 'sgfsgfdhgfkjhhkjhyutyutruytguyr5646547658774edhfchgfhg'),
            algorithms=['HS256']
        )
        
        if data['user_type'] != 'recruiter':
            return jsonify({
                "success": False,
                "message": "Only recruiters can create job postings"
            }), 403
            
        job_data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'company_name', 'questions', 'requirements', 'location']
        for field in required_fields:
            if field not in job_data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        result = create_job_posting(job_data, data['email'])
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@job_bp.route('/jobs', methods=['GET'])
def get_jobs():
    try:
        filters = {}
        
        # Add filters from query parameters
        if 'location' in request.args:
            filters['location'] = request.args['location']
        if 'job_type' in request.args:
            filters['job_type'] = request.args['job_type']
        if 'company_name' in request.args:
            filters['company_name'] = request.args['company_name']
            
        jobs = get_job_postings(filters)
        return jsonify({
            "success": True,
            "jobs": jobs
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@job_bp.route('/jobs/<job_id>/save', methods=['POST'])
@token_required
def save_job_route(job_id):
    try:
        token = request.headers.get('Authorization')[7:]  # Remove 'Bearer ' prefix
        data = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY', 'sgfsgfdhgfkjhhkjhyutyutruytguyr5646547658774edhfchgfhg'),
            algorithms=['HS256']
        )
        
        if data['user_type'] != 'candidate':
            return jsonify({
                "success": False,
                "message": "Only candidates can save jobs"
            }), 403
            
        result = save_job(job_id, data['email'])
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@job_bp.route('/jobs/<job_id>/apply', methods=['POST'])
@token_required
def apply_job(job_id):
    try:
        token = request.headers.get('Authorization')[7:]  # Remove 'Bearer ' prefix
        data = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY', 'sgfsgfdhgfkjhhkjhyutyutruytguyr5646547658774edhfchgfhg'),
            algorithms=['HS256']
        )
        
        if data['user_type'] != 'candidate':
            return jsonify({
                "success": False,
                "message": "Only candidates can apply for jobs"
            }), 403
            
        # Get job details to know how many questions to expect
        db = get_database()
        if db is None:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
            
        job = db['jobs'].find_one({"_id": job_id})
        if not job:
            return jsonify({
                "success": False,
                "message": "Job not found"
            }), 404
            
        num_questions = len(job['questions'])
        answers = []
        total_scores = {
            "extraversion": 0,
            "neuroticism": 0,
            "agreeableness": 0,
            "conscientiousness": 0,
            "openness": 0
        }
        
        # Process each video answer
        for i in range(num_questions):
            video_key = f'video_{i}'
            if video_key not in request.files:
                return jsonify({
                    "success": False,
                    "message": f"Missing video for question {i+1}"
                }), 400
                
            video = request.files[video_key]
            if video.filename == '':
                return jsonify({
                    "success": False,
                    "message": f"No selected file for question {i+1}"
                }), 400
                
            # Generate unique filename
            unique_filename = f"{job_id}_{data['email']}_{i}_{uuid.uuid4()}.mp4"
            filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
            
            # Save video
            video.save(filepath)
            
            try:
                # Get personality scores from model
                scores = predict_personality(filepath)
                
                # Add to total scores
                for trait in total_scores:
                    if trait in scores:
                        total_scores[trait] += scores[trait]
                
                # Store answer with video URL and scores
                answers.append({
                    "question_index": i,
                    "video_url": f"/api/videos/{unique_filename}",
                    "personality_scores": scores
                })
                
            except Exception as e:
                # Clean up video file if there's an error
                if os.path.exists(filepath):
                    #os.remove(filepath)
                    print(f"Video file {filepath} exists but was not deleted due to error: {str(e)}")
                return jsonify({
                    "success": False,
                    "message": f"Error processing video {i+1}: {str(e)}"
                }), 500
        
        # Calculate average scores
        average_scores = {}
        for trait in total_scores:
            average_scores[trait] = round(total_scores[trait] / num_questions, 4)
        
        # Submit application with processed answers
        result = submit_application(job_id, data['email'], answers, average_scores)
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@job_bp.route('/jobs/<job_id>/applications', methods=['GET'])
@token_required
def get_job_applications(job_id):
    try:
        token = request.headers.get('Authorization')[7:]  # Remove 'Bearer ' prefix
        data = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY', 'sgfsgfdhgfkjhhkjhyutyutruytguyr5646547658774edhfchgfhg'),
            algorithms=['HS256']
        )
        
        if data['user_type'] != 'recruiter':
            return jsonify({
                "success": False,
                "message": "Only recruiters can view applications"
            }), 403
            
        filters = {}
        
        # Add filters from query parameters
        if 'status' in request.args:
            filters['status'] = request.args['status']
        if 'revaluation_status' in request.args:
            filters['revaluation_status'] = request.args['revaluation_status']
            
        applications = get_applications(job_id, filters)
        return jsonify({
            "success": True,
            "applications": applications
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@job_bp.route('/applications/<application_id>/status', methods=['PUT'])
@token_required
def update_status(application_id):
    try:
        token = request.headers.get('Authorization')[7:]  # Remove 'Bearer ' prefix
        data = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY', 'sgfsgfdhgfkjhhkjhyutyutruytguyr5646547658774edhfchgfhg'),
            algorithms=['HS256']
        )
        
        if data['user_type'] != 'recruiter':
            return jsonify({
                "success": False,
                "message": "Only recruiters can update application status"
            }), 403
            
        status_data = request.get_json()
        
        if 'status' not in status_data:
            return jsonify({
                "success": False,
                "message": "Missing required field: status"
            }), 400
            
        result = update_application_status(application_id, status_data['status'])
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@job_bp.route('/applications/<application_id>/revaluate', methods=['POST'])
@token_required
def request_revaluation_route(application_id):
    try:
        token = request.headers.get('Authorization')[7:]  # Remove 'Bearer ' prefix
        data = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY', 'sgfsgfdhgfkjhhkjhyutyutruytguyr5646547658774edhfchgfhg'),
            algorithms=['HS256']
        )
        
        if data['user_type'] != 'candidate':
            return jsonify({
                "success": False,
                "message": "Only candidates can request revaluation"
            }), 403
            
        result = request_revaluation(application_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@job_bp.route('/candidate/applications', methods=['GET'])
@token_required
def get_candidate_applications():
    try:
        token = request.headers.get('Authorization')[7:]  # Remove 'Bearer ' prefix
        data = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY', 'sgfsgfdhgfkjhhkjhyutyutruytguyr5646547658774edhfchgfhg'),
            algorithms=['HS256']
        )
        
        if data['user_type'] != 'candidate':
            return jsonify({
                "success": False,
                "message": "Only candidates can view their applications"
            }), 403
            
        db = get_database()
        if db is None:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
            
        applications_collection = db['applications']
        applications = list(applications_collection.find({"candidate_id": data['email']}))
        
        # Convert ObjectId to string
        for app in applications:
            app['_id'] = str(app['_id'])
            
        return jsonify({
            "success": True,
            "applications": applications
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500 