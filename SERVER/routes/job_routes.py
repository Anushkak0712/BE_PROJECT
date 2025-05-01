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
from datetime import datetime
import uuid
import cv2
import random
from predictor_module import predict_personality

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
        if 'recruiter_id' in request.args:
            filters['recruiter_id'] = request.args['recruiter_id']
            
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
    filepath = None
    print('request-------->')
    try:
        # Get database connection
        db = get_database()


        # Get user email from token
        token = request.headers.get('Authorization').split(' ')[1]
        data = jwt.decode(
            token,
            os.getenv('JWT_SECRET_KEY', 'sgfsgfdhgfkjhhkjhyutyutruytguyr5646547658774edhfchgfhg'),
            algorithms=['HS256']
        )
        email = data['email']

        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)

        video_files = [file for key, file in request.files.items() if key.startswith('video_')]
        num_questions = len(video_files)
        print('files-------->',video_files)

        if num_questions == 0:
            return jsonify({
                "success": False,
                "message": "No videos provided"
            }), 400

        answers = []
        total_scores = {
            "extraversion": 0,
            "neuroticism": 0,
            "agreeableness": 0,
            "conscientiousness": 0,
            "openness": 0
        }

        # Predefined scores for specific filenames
    #     predefined_scores = {
    #         "video1.mp4": {
    #             'extraversion': 1.010462760925293,
    #             'neuroticism': -13.511393547058105,
    #             'agreeableness': -11.11119270324707,
    #             'conscientiousness': 16.780467987060547,
    #             'openness': -0.36275890469551086
    #             },
    #         "video2.mp4": {
    #             'extraversion': -0.340932697057724,
    #             'neuroticism': -1.0145142078399658,
    #             'agreeableness': 1.6222896575927734,
    #             'conscientiousness': -0.23875777423381805,
    #             'openness': 1.057740330696106
    #             },
    #         "video3.mp4": {
    #                 'extraversion': 0.2852325439453125,
    # 'neuroticism': 0.4350805878639221,
    # 'agreeableness': 0.4812329113483429,
    # 'conscientiousness': 0.5682945251464844,
    # 'openness': 0.41324323415756226},
    #         "video4.mp4": {
    #             "extraversion": 0.5,
    #             "neuroticism": 0.6,
    #             "agreeableness": 0.65,
    #             "conscientiousness": 0.7,
    #             "openness": 0.9
    #         },
    #         "video5.mp4": {
    #             "extraversion": 0.4,
    #             "neuroticism": 0.7,
    #             "agreeableness": 0.55,
    #             "conscientiousness": 0.6,
    #             "openness": 0.85
    #         }
    #     }

        # Process each video answer
        for i, video in enumerate(video_files):
            try:
                # Save video with its original filename
                original_filename = video.filename
                print('video-------->',video)
                filepath = os.path.join(UPLOAD_FOLDER, original_filename)
                
                # Save the video
                video.save(filepath)

                # Generate scores based on filename
                # if original_filename in predefined_scores:
                #     scores = predefined_scores[original_filename]
                # else:
                #     scores = {
                #         "extraversion": round(random.uniform(0.3, 0.9), 2),
                #         "neuroticism": round(random.uniform(0.3, 0.9), 2),
                #         "agreeableness": round(random.uniform(0.3, 0.9), 2),
                #         "conscientiousness": round(random.uniform(0.3, 0.9), 2),
                #         "openness": round(random.uniform(0.3, 0.9), 2)
                #     }
                scores=predict_personality(filepath)
                print('scores-------->',scores)

                # Add to total scores
                for trait in total_scores:
                    if trait in scores:
                        total_scores[trait] += scores[trait]
                
                # Store answer with video URL and scores
                answers.append({
                    "question_index": i,
                    "video_url": f"/api/videos/{original_filename}",
                    "personality_scores": scores
                })
                
            except Exception as e:
                if filepath and os.path.exists(filepath):
                    os.remove(filepath)
                return jsonify({
                    "success": False,
                    "message": f"Error processing video {i+1}: {str(e)}"
                }), 500

        # Calculate average scores
        num_answers = len(answers)
        average_scores = {
            trait: round(score / num_answers, 2)
            for trait, score in total_scores.items()
        }

        # Create application document
        application = {
            "job_id": job_id,
            "candidate_id": email,
            "answers": answers,
            "average_scores": average_scores,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Insert application into database
        applications_collection = db['applications']
        result = applications_collection.insert_one(application)

        if not result.inserted_id:
            return jsonify({
                "success": False,
                "message": "Failed to save application"
            }), 500

        return jsonify({
            "success": True,
            "message": "Application submitted successfully",
            "application_id": str(result.inserted_id),
            "answers": answers,
            "average_scores": average_scores
        }), 200

    except Exception as e:
        print(f"Application error: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error processing application: {str(e)}"
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
        print(data)
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