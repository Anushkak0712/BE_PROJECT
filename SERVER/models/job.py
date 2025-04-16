from datetime import datetime
from typing import List, Optional, Dict
from bson import ObjectId

class JobQuestion:
    def __init__(self, question_text: str, time_limit: int):
        self.question_text = question_text
        self.time_limit = time_limit  # in seconds

    def to_dict(self):
        return {
            "question_text": self.question_text,
            "time_limit": self.time_limit
        }

class JobPosting:
    def __init__(self, 
                 title: str, 
                 description: str, 
                 company_name: str,
                 recruiter_id: str,
                 questions: List[JobQuestion],
                 requirements: List[str],
                 location: str,
                 salary_range: Optional[str] = None,
                 job_type: str = "Full-time"):
        self._id = str(ObjectId())
        self.title = title
        self.description = description
        self.company_name = company_name
        self.recruiter_id = recruiter_id
        self.questions = [q.to_dict() for q in questions]
        self.requirements = requirements
        self.location = location
        self.salary_range = salary_range
        self.job_type = job_type
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.status = "active"
        self.total_applications = 0

    def to_dict(self):
        return {
            "_id": self._id,
            "title": self.title,
            "description": self.description,
            "company_name": self.company_name,
            "recruiter_id": self.recruiter_id,
            "questions": self.questions,
            "requirements": self.requirements,
            "location": self.location,
            "salary_range": self.salary_range,
            "job_type": self.job_type,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "status": self.status,
            "total_applications": self.total_applications
        }

class Application:
    def __init__(self, 
                 job_id: str,
                 candidate_id: str,
                 answers: List[dict],  # List of {question_id: str, video_url: str, personality_scores: dict}
                 average_scores: Dict[str, float],  # Average scores across all answers
                 status: str = "pending"):
        self._id = str(ObjectId())
        self.job_id = job_id
        self.candidate_id = candidate_id
        self.answers = answers
        self.average_scores = average_scores
        self.status = status  # pending, shortlisted, rejected
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.revaluation_requested = False
        self.revaluation_status = None  # pending, approved, rejected

    def to_dict(self):
        return {
            "_id": self._id,
            "job_id": self.job_id,
            "candidate_id": self.candidate_id,
            "answers": self.answers,
            "average_scores": self.average_scores,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "revaluation_requested": self.revaluation_requested,
            "revaluation_status": self.revaluation_status
        }

class SavedJob:
    def __init__(self, job_id: str, candidate_id: str):
        self._id = str(ObjectId())
        self.job_id = job_id
        self.candidate_id = candidate_id
        self.saved_at = datetime.now()

    def to_dict(self):
        return {
            "_id": self._id,
            "job_id": self.job_id,
            "candidate_id": self.candidate_id,
            "saved_at": self.saved_at
        } 