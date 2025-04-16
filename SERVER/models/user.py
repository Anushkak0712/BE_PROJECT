from datetime import datetime
from typing import Optional
import re
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import os

class BaseUser:
    def __init__(self, username: str, email: str, password: str, is_hashed: bool = False):
        if not self._is_valid_email(email):
            raise ValueError("Invalid email format")
            
        self.username = username
        self.email = email
        self.password = password if is_hashed else self._hash_password(password)
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.reset_token = None
        self.reset_token_expiry = None

    def _is_valid_email(self, email: str) -> bool:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    def _hash_password(self, password: str) -> str:
        return generate_password_hash(password)

    def verify_password(self, password: str) -> bool:
        return check_password_hash(self.password, password)

    def generate_reset_token(self) -> str:
        self.reset_token = jwt.encode(
            {
                'email': self.email,
                'exp': datetime.utcnow() + timedelta(hours=1)
            },
            os.getenv('JWT_SECRET_KEY', 'your-secret-key'),
            algorithm='HS256'
        )
        self.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        return self.reset_token

    def verify_reset_token(self, token: str) -> bool:
        try:
            payload = jwt.decode(
                token,
                os.getenv('JWT_SECRET_KEY', 'your-secret-key'),
                algorithms=['HS256']
            )
            return payload['email'] == self.email
        except:
            return False

class Recruiter(BaseUser):
    def __init__(self, username: str, email: str, password: str, company_name: str, position: str, is_hashed: bool = False):
        super().__init__(username, email, password, is_hashed)
        self.user_type = "recruiter"
        self.company_name = company_name
        self.position = position

    def to_dict(self):
        return {
            "username": self.username,
            "email": self.email,
            "password": self.password,
            "user_type": self.user_type,
            "company_name": self.company_name,
            "position": self.position,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "reset_token": self.reset_token,
            "reset_token_expiry": self.reset_token_expiry
        }

class Candidate(BaseUser):
    def __init__(self, username: str, email: str, password: str, skills: list, experience: Optional[int] = None, is_hashed: bool = False):
        super().__init__(username, email, password, is_hashed)
        self.user_type = "candidate"
        self.skills = skills
        self.experience = experience

    def to_dict(self):
        return {
            "username": self.username,
            "email": self.email,
            "password": self.password,
            "user_type": self.user_type,
            "skills": self.skills,
            "experience": self.experience,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "reset_token": self.reset_token,
            "reset_token_expiry": self.reset_token_expiry
        } 