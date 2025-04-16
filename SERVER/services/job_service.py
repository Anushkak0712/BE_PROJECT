from database import get_database
from models.job import JobPosting, Application, SavedJob, JobQuestion
from typing import List, Dict, Any, Optional
from datetime import datetime

def create_job_posting(job_data: Dict[str, Any], recruiter_id: str) -> Dict[str, Any]:
    try:
        db = get_database()
        if db is None:
            return {"success": False, "message": "Database connection failed"}
            
        jobs_collection = db['jobs']
        
        # Convert questions to JobQuestion objects
        questions = [JobQuestion(q['question_text'], q['time_limit']) for q in job_data['questions']]
        
        job = JobPosting(
            title=job_data['title'],
            description=job_data['description'],
            company_name=job_data['company_name'],
            recruiter_id=recruiter_id,
            questions=questions,
            requirements=job_data['requirements'],
            location=job_data['location'],
            salary_range=job_data.get('salary_range'),
            job_type=job_data.get('job_type', 'Full-time')
        )
        
        result = jobs_collection.insert_one(job.to_dict())
        
        if result.inserted_id:
            return {
                "success": True,
                "message": "Job posting created successfully",
                "job_id": str(result.inserted_id)
            }
        else:
            return {"success": False, "message": "Failed to create job posting"}
            
    except Exception as e:
        return {"success": False, "message": f"Error creating job posting: {str(e)}"}

def get_job_postings(filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    try:
        db = get_database()
        if db is None:
            return []
            
        jobs_collection = db['jobs']
        query = filters or {}
        jobs = list(jobs_collection.find(query))
        
        # Convert ObjectId to string
        for job in jobs:
            job['_id'] = str(job['_id'])
            
        return jobs
    except Exception as e:
        print(f"Error getting job postings: {e}")
        return []

def save_job(job_id: str, candidate_id: str) -> Dict[str, Any]:
    try:
        db = get_database()
        if db is None:
            return {"success": False, "message": "Database connection failed"}
            
        saved_jobs_collection = db['saved_jobs']
        
        # Check if already saved
        if saved_jobs_collection.find_one({"job_id": job_id, "candidate_id": candidate_id}):
            return {"success": False, "message": "Job already saved"}
            
        saved_job = SavedJob(job_id, candidate_id)
        result = saved_jobs_collection.insert_one(saved_job.to_dict())
        
        if result.inserted_id:
            return {
                "success": True,
                "message": "Job saved successfully",
                "saved_job_id": str(result.inserted_id)
            }
        else:
            return {"success": False, "message": "Failed to save job"}
            
    except Exception as e:
        return {"success": False, "message": f"Error saving job: {str(e)}"}

def submit_application(job_id: str, candidate_id: str, answers: List[Dict[str, Any]], average_scores: Dict[str, float]) -> Dict[str, Any]:
    try:
        db = get_database()
        if db is None:
            return {"success": False, "message": "Database connection failed"}
            
        applications_collection = db['applications']
        jobs_collection = db['jobs']
        
        # Check if job exists
        job = jobs_collection.find_one({"_id": job_id})
        if not job:
            return {"success": False, "message": "Job not found"}
            
        # Create application with average scores
        application = Application(
            job_id=job_id,
            candidate_id=candidate_id,
            answers=answers,
            average_scores=average_scores
        )
        
        result = applications_collection.insert_one(application.to_dict())
        
        if result.inserted_id:
            # Update job's total applications
            jobs_collection.update_one(
                {"_id": job_id},
                {"$inc": {"total_applications": 1}}
            )
            
            return {
                "success": True,
                "message": "Application submitted successfully",
                "application_id": str(result.inserted_id),
                "average_scores": average_scores
            }
        else:
            return {"success": False, "message": "Failed to submit application"}
            
    except Exception as e:
        return {"success": False, "message": f"Error submitting application: {str(e)}"}

def get_applications(job_id: str, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    try:
        db = get_database()
        if db is None:
            return []
            
        applications_collection = db['applications']
        query = {"job_id": job_id}
        if filters:
            query.update(filters)
            
        applications = list(applications_collection.find(query))
        
        # Convert ObjectId to string
        for app in applications:
            app['_id'] = str(app['_id'])
            
        return applications
    except Exception as e:
        print(f"Error getting applications: {e}")
        return []

def update_application_status(application_id: str, status: str) -> Dict[str, Any]:
    try:
        db = get_database()
        if db is None:
            return {"success": False, "message": "Database connection failed"}
            
        applications_collection = db['applications']
        
        result = applications_collection.update_one(
            {"_id": application_id},
            {"$set": {
                "status": status,
                "updated_at": datetime.now()
            }}
        )
        
        if result.modified_count > 0:
            return {
                "success": True,
                "message": "Application status updated successfully"
            }
        else:
            return {"success": False, "message": "Failed to update application status"}
            
    except Exception as e:
        return {"success": False, "message": f"Error updating application status: {str(e)}"}

def request_revaluation(application_id: str) -> Dict[str, Any]:
    try:
        db = get_database()
        if db is None:
            return {"success": False, "message": "Database connection failed"}
            
        applications_collection = db['applications']
        
        result = applications_collection.update_one(
            {"_id": application_id},
            {"$set": {
                "revaluation_requested": True,
                "revaluation_status": "pending",
                "updated_at": datetime.now()
            }}
        )
        
        if result.modified_count > 0:
            return {
                "success": True,
                "message": "Revaluation requested successfully"
            }
        else:
            return {"success": False, "message": "Failed to request revaluation"}
            
    except Exception as e:
        return {"success": False, "message": f"Error requesting revaluation: {str(e)}"} 