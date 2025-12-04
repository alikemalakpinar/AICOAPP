from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr, validator
from bson import ObjectId
from collections import defaultdict
import os
import re
import logging
import asyncio
import time
import hashlib
import secrets
from pathlib import Path
from functools import wraps

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ==================== CONFIGURATION ====================

class Config:
    MONGO_URL = os.environ['MONGO_URL']
    DB_NAME = os.environ['DB_NAME']
    SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_urlsafe(32))
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS = 30
    REFRESH_TOKEN_EXPIRE_DAYS = 90

    # Rate limiting
    RATE_LIMIT_REQUESTS = 100  # requests per minute
    RATE_LIMIT_WINDOW = 60  # seconds
    LOGIN_RATE_LIMIT = 5  # login attempts per minute

    # File upload
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
                          'application/pdf', 'text/plain', 'application/json',
                          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

    # Password requirements
    MIN_PASSWORD_LENGTH = 8
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGIT = True

config = Config()

# MongoDB connection with connection pooling
client = AsyncIOMotorClient(
    config.MONGO_URL,
    maxPoolSize=50,
    minPoolSize=10,
    maxIdleTimeMS=30000,
    serverSelectionTimeoutMS=5000
)
db = client[config.DB_NAME]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
security = HTTPBearer()

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== RATE LIMITER ====================

class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.login_attempts: Dict[str, List[float]] = defaultdict(list)
        self.blocked_ips: Dict[str, float] = {}

    def _clean_old_requests(self, key: str, window: int, storage: Dict):
        current_time = time.time()
        storage[key] = [req_time for req_time in storage[key]
                        if current_time - req_time < window]

    def is_blocked(self, ip: str) -> bool:
        if ip in self.blocked_ips:
            if time.time() < self.blocked_ips[ip]:
                return True
            else:
                del self.blocked_ips[ip]
        return False

    def block_ip(self, ip: str, duration: int = 900):  # 15 minutes default
        self.blocked_ips[ip] = time.time() + duration

    def check_rate_limit(self, ip: str, limit: int = None, window: int = None) -> bool:
        limit = limit or config.RATE_LIMIT_REQUESTS
        window = window or config.RATE_LIMIT_WINDOW

        if self.is_blocked(ip):
            return False

        self._clean_old_requests(ip, window, self.requests)

        if len(self.requests[ip]) >= limit:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return False

        self.requests[ip].append(time.time())
        return True

    def check_login_limit(self, ip: str) -> bool:
        self._clean_old_requests(ip, config.RATE_LIMIT_WINDOW, self.login_attempts)

        if len(self.login_attempts[ip]) >= config.LOGIN_RATE_LIMIT:
            logger.warning(f"Login rate limit exceeded for IP: {ip}")
            self.block_ip(ip, 300)  # Block for 5 minutes
            return False

        self.login_attempts[ip].append(time.time())
        return True

rate_limiter = RateLimiter()

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str = Field(..., min_length=2, max_length=100)

    @validator('password')
    def validate_password(cls, v):
        if len(v) < config.MIN_PASSWORD_LENGTH:
            raise ValueError(f'Password must be at least {config.MIN_PASSWORD_LENGTH} characters')
        if config.REQUIRE_UPPERCASE and not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if config.REQUIRE_LOWERCASE and not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if config.REQUIRE_DIGIT and not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v

    @validator('full_name')
    def validate_name(cls, v):
        if not re.match(r'^[\w\s\-\.]+$', v, re.UNICODE):
            raise ValueError('Name contains invalid characters')
        return v.strip()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < config.MIN_PASSWORD_LENGTH:
            raise ValueError(f'Password must be at least {config.MIN_PASSWORD_LENGTH} characters')
        if config.REQUIRE_UPPERCASE and not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if config.REQUIRE_LOWERCASE and not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if config.REQUIRE_DIGIT and not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = None

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    workspace_id: str
    status: str = Field("not_started", pattern=r'^(not_started|in_progress|on_hold|completed|cancelled)$')
    deadline: Optional[datetime] = None
    assigned_to: List[str] = []
    tags: List[str] = []
    priority: str = Field("medium", pattern=r'^(low|medium|high|critical)$')
    progress: int = Field(0, ge=0, le=100)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=300)
    description: Optional[str] = Field(None, max_length=5000)
    project_id: str
    status: str = Field("todo", pattern=r'^(todo|in_progress|review|done|cancelled)$')
    priority: str = Field("medium", pattern=r'^(low|medium|high|critical)$')
    assigned_to: Optional[str] = None
    deadline: Optional[datetime] = None
    tags: List[str] = []
    estimated_hours: Optional[float] = Field(None, ge=0, le=1000)
    parent_task_id: Optional[str] = None  # For subtasks

class SubtaskCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    task_id: str
    completed: bool = False

class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., max_length=50000)
    workspace_id: str
    project_id: Optional[str] = None
    task_id: Optional[str] = None
    is_pinned: bool = False
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    tags: List[str] = []

class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    workspace_id: str

class FavoriteCreate(BaseModel):
    item_type: str = Field(..., pattern=r'^(project|task|note|request)$')
    item_id: str
    workspace_id: str

class InviteMember(BaseModel):
    email: EmailStr
    role: str = Field("member", pattern=r'^(admin|member|viewer)$')

class RequestCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=300)
    description: Optional[str] = Field(None, max_length=5000)
    workspace_id: str
    priority: str = Field("medium", pattern=r'^(low|medium|high|critical)$')
    category: str = Field("general", pattern=r'^(general|bug|feature|support|urgent)$')
    deadline: Optional[datetime] = None
    tags: List[str] = []

class RequestStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r'^(pending|in_review|approved|rejected|completed)$')

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    request_id: Optional[str] = None
    parent_comment_id: Optional[str] = None  # For nested comments

class NotificationCreate(BaseModel):
    user_id: str
    title: str = Field(..., max_length=200)
    message: str = Field(..., max_length=1000)
    type: str = Field("info", pattern=r'^(info|success|warning|error|mention|deadline|assignment)$')
    link: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class TimeEntry(BaseModel):
    workspace_id: str
    project_id: Optional[str] = None
    task_id: Optional[str] = None
    check_in: datetime
    check_out: Optional[datetime] = None
    note: Optional[str] = Field(None, max_length=500)

class FileUpload(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    file_data: str  # base64
    mime_type: str
    size: int
    project_id: Optional[str] = None
    task_id: Optional[str] = None
    workspace_id: str

    @validator('size')
    def validate_size(cls, v):
        if v > config.MAX_FILE_SIZE:
            raise ValueError(f'File size exceeds maximum limit of {config.MAX_FILE_SIZE // (1024*1024)}MB')
        return v

    @validator('mime_type')
    def validate_mime_type(cls, v):
        if v not in config.ALLOWED_FILE_TYPES:
            raise ValueError(f'File type {v} is not allowed')
        return v

class ActivityLog(BaseModel):
    action: str
    entity_type: str
    entity_id: str
    entity_name: str
    workspace_id: str
    details: Optional[Dict[str, Any]] = None

class UserSettings(BaseModel):
    theme: str = Field("dark", pattern=r'^(light|dark|system)$')
    language: str = Field("tr", pattern=r'^(tr|en)$')
    notifications_enabled: bool = True
    email_notifications: bool = True
    push_notifications: bool = True
    sound_enabled: bool = True
    desktop_notifications: bool = True

# ==================== APP INITIALIZATION ====================

app = FastAPI(
    title="AICO API",
    description="Professional Project Management API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

api_router = APIRouter(prefix="/api")

# ==================== MIDDLEWARE ====================

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"

    # Skip rate limiting for health check
    if request.url.path == "/health":
        return await call_next(request)

    if not rate_limiter.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )

    response = await call_next(request)
    return response

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )

    return response

# ==================== AUTH UTILS ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=config.ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")

        if not user_id or token_type != "access":
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError as e:
        logger.warning(f"JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked")

    user["_id"] = str(user["_id"])
    return user

# ==================== ACTIVITY LOGGING ====================

async def log_activity(
    user_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    entity_name: str,
    workspace_id: str,
    details: Dict[str, Any] = None
):
    activity = {
        "user_id": user_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "entity_name": entity_name,
        "workspace_id": workspace_id,
        "details": details or {},
        "created_at": datetime.utcnow()
    }
    await db.activities.insert_one(activity)

# ==================== NOTIFICATION HELPERS ====================

async def send_notification(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "info",
    link: str = None,
    data: Dict[str, Any] = None
):
    notification = {
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notification_type,
        "link": link,
        "data": data or {},
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(notification)

    # Here you would integrate with push notification service
    # e.g., Firebase Cloud Messaging, OneSignal, etc.
    logger.info(f"Notification sent to user {user_id}: {title}")

async def notify_workspace_members(
    workspace_id: str,
    exclude_user_id: str,
    title: str,
    message: str,
    notification_type: str = "info",
    link: str = None
):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if workspace:
        for member_id in workspace.get("member_ids", []):
            if member_id != exclude_user_id:
                await send_notification(member_id, title, message, notification_type, link)

# ==================== HEALTH CHECK ====================

@app.get("/health")
async def health_check():
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unavailable")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate, request: Request):
    client_ip = request.client.host if request.client else "unknown"

    if not rate_limiter.check_login_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many signup attempts. Please try again later.")

    # Check existing user
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = {
        "email": user_data.email.lower(),
        "password": get_password_hash(user_data.password),
        "full_name": user_data.full_name,
        "avatar": None,
        "phone": None,
        "bio": None,
        "is_blocked": False,
        "is_verified": False,
        "settings": UserSettings().dict(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    }

    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)

    # Create default workspace
    default_workspace = {
        "name": "Kişisel Çalışma Alanı",
        "description": "Varsayılan çalışma alanınız",
        "owner_id": user_id,
        "member_ids": [user_id],
        "member_roles": {user_id: "admin"},
        "color": "#3b82f6",
        "icon": "briefcase",
        "created_at": datetime.utcnow()
    }
    await db.workspaces.insert_one(default_workspace)

    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})

    logger.info(f"New user registered: {user_data.email}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "_id": user_id,
            "email": user_data.email.lower(),
            "full_name": user_data.full_name,
            "avatar": None
        }
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin, request: Request):
    client_ip = request.client.host if request.client else "unknown"

    if not rate_limiter.check_login_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")

    user = await db.users.find_one({"email": user_data.email.lower()})

    if not user or not verify_password(user_data.password, user["password"]):
        logger.warning(f"Failed login attempt for: {user_data.email} from {client_ip}")
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked")

    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )

    user_id = str(user["_id"])
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})

    logger.info(f"User logged in: {user_data.email}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "_id": user_id,
            "email": user["email"],
            "full_name": user["full_name"],
            "avatar": user.get("avatar")
        }
    }

@api_router.post("/auth/refresh")
async def refresh_token(refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")

        if not user_id or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("is_blocked"):
            raise HTTPException(status_code=401, detail="Invalid user")

        new_access_token = create_access_token({"sub": user_id})

        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.get("/user/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = dict(current_user)
    user.pop("password", None)
    return user

@api_router.put("/user/me")
async def update_me(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {"updated_at": datetime.utcnow()}

    if user_update.full_name:
        update_dict["full_name"] = user_update.full_name
    if user_update.email:
        existing = await db.users.find_one({
            "email": user_update.email.lower(),
            "_id": {"$ne": ObjectId(current_user["_id"])}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_dict["email"] = user_update.email.lower()
    if user_update.avatar is not None:
        update_dict["avatar"] = user_update.avatar
    if user_update.phone is not None:
        update_dict["phone"] = user_update.phone
    if user_update.bio is not None:
        update_dict["bio"] = user_update.bio

    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_dict}
    )

    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    return user

@api_router.put("/user/password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})

    if not verify_password(password_data.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {
            "password": get_password_hash(password_data.new_password),
            "updated_at": datetime.utcnow()
        }}
    )

    return {"message": "Password updated successfully"}

@api_router.put("/user/settings")
async def update_settings(settings: UserSettings, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"settings": settings.dict(), "updated_at": datetime.utcnow()}}
    )
    return {"message": "Settings updated", "settings": settings.dict()}

# ==================== WORKSPACE ROUTES ====================

@api_router.post("/workspaces")
async def create_workspace(workspace: WorkspaceCreate, current_user: dict = Depends(get_current_user)):
    workspace_dict = {
        "name": workspace.name,
        "description": workspace.description,
        "color": workspace.color or "#3b82f6",
        "icon": workspace.icon or "folder",
        "owner_id": current_user["_id"],
        "member_ids": [current_user["_id"]],
        "member_roles": {current_user["_id"]: "admin"},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.workspaces.insert_one(workspace_dict)
    workspace_dict["_id"] = str(result.inserted_id)

    await log_activity(
        current_user["_id"], "created", "workspace",
        str(result.inserted_id), workspace.name,
        str(result.inserted_id)
    )

    return workspace_dict

@api_router.get("/workspaces")
async def get_workspaces(current_user: dict = Depends(get_current_user)):
    workspaces = await db.workspaces.find({"member_ids": current_user["_id"]}).to_list(1000)

    for ws in workspaces:
        ws["_id"] = str(ws["_id"])
        # Get stats
        project_count = await db.projects.count_documents({"workspace_id": ws["_id"]})
        member_count = len(ws.get("member_ids", []))
        ws["stats"] = {
            "projects": project_count,
            "members": member_count
        }

    return workspaces

@api_router.get("/workspaces/{workspace_id}")
async def get_workspace(workspace_id: str, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    workspace["_id"] = str(workspace["_id"])

    # Get detailed stats
    projects = await db.projects.find({"workspace_id": workspace_id}).to_list(1000)
    project_ids = [str(p["_id"]) for p in projects]
    tasks = await db.tasks.find({"project_id": {"$in": project_ids}}).to_list(10000)

    workspace["stats"] = {
        "projects": len(projects),
        "tasks": len(tasks),
        "completed_tasks": len([t for t in tasks if t["status"] == "done"]),
        "members": len(workspace.get("member_ids", []))
    }

    return workspace

@api_router.put("/workspaces/{workspace_id}")
async def update_workspace(workspace_id: str, workspace: WorkspaceCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Workspace not found")

    user_role = existing.get("member_roles", {}).get(current_user["_id"])
    if user_role != "admin" and existing["owner_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only admins can update workspace")

    update_dict = {
        "name": workspace.name,
        "description": workspace.description,
        "color": workspace.color,
        "icon": workspace.icon,
        "updated_at": datetime.utcnow()
    }

    await db.workspaces.update_one({"_id": ObjectId(workspace_id)}, {"$set": update_dict})

    await log_activity(
        current_user["_id"], "updated", "workspace",
        workspace_id, workspace.name, workspace_id
    )

    return {"message": "Workspace updated"}

@api_router.delete("/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: str, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if workspace["owner_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only owner can delete workspace")

    # Delete all related data
    await db.projects.delete_many({"workspace_id": workspace_id})
    await db.requests.delete_many({"workspace_id": workspace_id})
    await db.notes.delete_many({"workspace_id": workspace_id})
    await db.files.delete_many({"workspace_id": workspace_id})
    await db.activities.delete_many({"workspace_id": workspace_id})
    await db.workspaces.delete_one({"_id": ObjectId(workspace_id)})

    return {"message": "Workspace deleted"}

@api_router.post("/workspaces/{workspace_id}/invite")
async def invite_member(workspace_id: str, invite: InviteMember, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    user_role = workspace.get("member_roles", {}).get(current_user["_id"])
    if user_role != "admin" and workspace["owner_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only admins can invite members")

    user = await db.users.find_one({"email": invite.email.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = str(user["_id"])
    if user_id in workspace["member_ids"]:
        raise HTTPException(status_code=400, detail="Already a member")

    await db.workspaces.update_one(
        {"_id": ObjectId(workspace_id)},
        {
            "$push": {"member_ids": user_id},
            "$set": {f"member_roles.{user_id}": invite.role}
        }
    )

    # Send notification
    await send_notification(
        user_id,
        "Çalışma Alanı Daveti",
        f"{current_user['full_name']} sizi '{workspace['name']}' çalışma alanına davet etti.",
        "info",
        f"/workspaces/{workspace_id}"
    )

    await log_activity(
        current_user["_id"], "invited", "member",
        user_id, user["full_name"], workspace_id
    )

    return {"message": "Member invited successfully"}

@api_router.delete("/workspaces/{workspace_id}/members/{member_id}")
async def remove_member(workspace_id: str, member_id: str, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if workspace["owner_id"] == member_id:
        raise HTTPException(status_code=400, detail="Cannot remove workspace owner")

    user_role = workspace.get("member_roles", {}).get(current_user["_id"])
    if user_role != "admin" and workspace["owner_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only admins can remove members")

    await db.workspaces.update_one(
        {"_id": ObjectId(workspace_id)},
        {
            "$pull": {"member_ids": member_id},
            "$unset": {f"member_roles.{member_id}": ""}
        }
    )

    return {"message": "Member removed"}

# ==================== PROJECT ROUTES ====================

@api_router.post("/projects")
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(project.workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    project_dict = {
        "name": project.name,
        "description": project.description,
        "workspace_id": project.workspace_id,
        "status": project.status,
        "priority": project.priority,
        "progress": project.progress,
        "deadline": project.deadline,
        "assigned_to": project.assigned_to,
        "tags": project.tags,
        "color": project.color or "#3b82f6",
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.projects.insert_one(project_dict)
    project_dict["_id"] = str(result.inserted_id)

    await log_activity(
        current_user["_id"], "created", "project",
        str(result.inserted_id), project.name, project.workspace_id
    )

    # Notify assigned users
    for user_id in project.assigned_to:
        if user_id != current_user["_id"]:
            await send_notification(
                user_id,
                "Yeni Proje Ataması",
                f"'{project.name}' projesine atandınız.",
                "assignment",
                f"/projects/{result.inserted_id}"
            )

    return project_dict

@api_router.get("/projects")
async def get_projects(workspace_id: str, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    projects = await db.projects.find({"workspace_id": workspace_id}).sort("created_at", -1).to_list(1000)

    for p in projects:
        p["_id"] = str(p["_id"])
        # Get task stats
        tasks = await db.tasks.find({"project_id": p["_id"]}).to_list(1000)
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t["status"] == "done"])
        p["task_stats"] = {
            "total": total_tasks,
            "completed": completed_tasks,
            "progress": int((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0)
        }

    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    workspace = await db.workspaces.find_one({"_id": ObjectId(project["workspace_id"])})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    project["_id"] = str(project["_id"])

    # Get tasks
    tasks = await db.tasks.find({"project_id": project_id}).to_list(1000)
    for t in tasks:
        t["_id"] = str(t["_id"])
    project["tasks"] = tasks

    # Get comments
    comments = await db.comments.find({"project_id": project_id}).sort("created_at", -1).to_list(100)
    for c in comments:
        c["_id"] = str(c["_id"])
    project["comments"] = comments

    # Get files
    files = await db.files.find({"project_id": project_id}).to_list(100)
    for f in files:
        f["_id"] = str(f["_id"])
    project["files"] = files

    return project

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    update_dict = {
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "priority": project.priority,
        "progress": project.progress,
        "deadline": project.deadline,
        "assigned_to": project.assigned_to,
        "tags": project.tags,
        "color": project.color,
        "updated_at": datetime.utcnow()
    }

    await db.projects.update_one({"_id": ObjectId(project_id)}, {"$set": update_dict})

    await log_activity(
        current_user["_id"], "updated", "project",
        project_id, project.name, existing["workspace_id"]
    )

    # Notify new assignees
    old_assignees = set(existing.get("assigned_to", []))
    new_assignees = set(project.assigned_to) - old_assignees
    for user_id in new_assignees:
        if user_id != current_user["_id"]:
            await send_notification(
                user_id,
                "Proje Ataması",
                f"'{project.name}' projesine atandınız.",
                "assignment"
            )

    return {"message": "Project updated"}

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    workspace = await db.workspaces.find_one({"_id": ObjectId(project["workspace_id"])})
    user_role = workspace.get("member_roles", {}).get(current_user["_id"])

    if project["created_by"] != current_user["_id"] and user_role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    # Delete related data
    await db.tasks.delete_many({"project_id": project_id})
    await db.comments.delete_many({"project_id": project_id})
    await db.files.delete_many({"project_id": project_id})
    await db.projects.delete_one({"_id": ObjectId(project_id)})

    await log_activity(
        current_user["_id"], "deleted", "project",
        project_id, project["name"], project["workspace_id"]
    )

    return {"message": "Project deleted"}

# ==================== TASK ROUTES ====================

@api_router.post("/tasks")
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": ObjectId(task.project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task_dict = {
        "title": task.title,
        "description": task.description,
        "project_id": task.project_id,
        "status": task.status,
        "priority": task.priority,
        "assigned_to": task.assigned_to,
        "deadline": task.deadline,
        "tags": task.tags,
        "estimated_hours": task.estimated_hours,
        "parent_task_id": task.parent_task_id,
        "subtasks": [],
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.tasks.insert_one(task_dict)
    task_dict["_id"] = str(result.inserted_id)

    await log_activity(
        current_user["_id"], "created", "task",
        str(result.inserted_id), task.title, project["workspace_id"]
    )

    # Notify assigned user
    if task.assigned_to and task.assigned_to != current_user["_id"]:
        await send_notification(
            task.assigned_to,
            "Yeni Görev Ataması",
            f"'{task.title}' görevi size atandı.",
            "assignment",
            f"/tasks/{result.inserted_id}"
        )

    return task_dict

@api_router.get("/tasks")
async def get_tasks(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if assigned_to:
        query["assigned_to"] = assigned_to

    tasks = await db.tasks.find(query).sort("created_at", -1).to_list(1000)

    for t in tasks:
        t["_id"] = str(t["_id"])
        # Get subtasks count
        subtasks = await db.subtasks.find({"task_id": t["_id"]}).to_list(100)
        t["subtask_count"] = len(subtasks)
        t["completed_subtasks"] = len([s for s in subtasks if s.get("completed")])

    return tasks

@api_router.get("/tasks/{task_id}")
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task["_id"] = str(task["_id"])

    # Get subtasks
    subtasks = await db.subtasks.find({"task_id": task_id}).to_list(100)
    for s in subtasks:
        s["_id"] = str(s["_id"])
    task["subtasks"] = subtasks

    # Get comments
    comments = await db.comments.find({"task_id": task_id}).sort("created_at", -1).to_list(100)
    for c in comments:
        c["_id"] = str(c["_id"])
    task["comments"] = comments

    # Get files
    files = await db.files.find({"task_id": task_id}).to_list(100)
    for f in files:
        f["_id"] = str(f["_id"])
    task["files"] = files

    return task

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, task: TaskCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")

    update_dict = {
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "assigned_to": task.assigned_to,
        "deadline": task.deadline,
        "tags": task.tags,
        "estimated_hours": task.estimated_hours,
        "updated_at": datetime.utcnow()
    }

    await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_dict})

    project = await db.projects.find_one({"_id": ObjectId(existing["project_id"])})

    await log_activity(
        current_user["_id"], "updated", "task",
        task_id, task.title, project["workspace_id"] if project else ""
    )

    # Notify if assigned to someone new
    if task.assigned_to and task.assigned_to != existing.get("assigned_to") and task.assigned_to != current_user["_id"]:
        await send_notification(
            task.assigned_to,
            "Görev Ataması",
            f"'{task.title}' görevi size atandı.",
            "assignment"
        )

    return {"message": "Task updated"}

@api_router.patch("/tasks/{task_id}/status")
async def update_task_status(task_id: str, status: str, current_user: dict = Depends(get_current_user)):
    if status not in ["todo", "in_progress", "review", "done", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )

    project = await db.projects.find_one({"_id": ObjectId(task["project_id"])})

    await log_activity(
        current_user["_id"], "status_changed", "task",
        task_id, task["title"], project["workspace_id"] if project else "",
        {"old_status": task["status"], "new_status": status}
    )

    return {"message": "Status updated"}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Delete related data
    await db.subtasks.delete_many({"task_id": task_id})
    await db.comments.delete_many({"task_id": task_id})
    await db.files.delete_many({"task_id": task_id})
    await db.tasks.delete_one({"_id": ObjectId(task_id)})

    project = await db.projects.find_one({"_id": ObjectId(task["project_id"])})

    await log_activity(
        current_user["_id"], "deleted", "task",
        task_id, task["title"], project["workspace_id"] if project else ""
    )

    return {"message": "Task deleted"}

# ==================== SUBTASK ROUTES ====================

@api_router.post("/subtasks")
async def create_subtask(subtask: SubtaskCreate, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"_id": ObjectId(subtask.task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    subtask_dict = {
        "title": subtask.title,
        "task_id": subtask.task_id,
        "completed": subtask.completed,
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow()
    }

    result = await db.subtasks.insert_one(subtask_dict)
    subtask_dict["_id"] = str(result.inserted_id)

    return subtask_dict

@api_router.get("/subtasks")
async def get_subtasks(task_id: str, current_user: dict = Depends(get_current_user)):
    subtasks = await db.subtasks.find({"task_id": task_id}).to_list(100)
    for s in subtasks:
        s["_id"] = str(s["_id"])
    return subtasks

@api_router.patch("/subtasks/{subtask_id}")
async def toggle_subtask(subtask_id: str, completed: bool, current_user: dict = Depends(get_current_user)):
    result = await db.subtasks.update_one(
        {"_id": ObjectId(subtask_id)},
        {"$set": {"completed": completed}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subtask not found")
    return {"message": "Subtask updated"}

@api_router.delete("/subtasks/{subtask_id}")
async def delete_subtask(subtask_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.subtasks.delete_one({"_id": ObjectId(subtask_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subtask not found")
    return {"message": "Subtask deleted"}

# ==================== NOTES ROUTES ====================

@api_router.post("/notes")
async def create_note(note: NoteCreate, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(note.workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    note_dict = {
        "title": note.title,
        "content": note.content,
        "workspace_id": note.workspace_id,
        "project_id": note.project_id,
        "task_id": note.task_id,
        "is_pinned": note.is_pinned,
        "color": note.color or "#3b82f6",
        "tags": note.tags,
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.notes.insert_one(note_dict)
    note_dict["_id"] = str(result.inserted_id)

    await log_activity(
        current_user["_id"], "created", "note",
        str(result.inserted_id), note.title, note.workspace_id
    )

    return note_dict

@api_router.get("/notes")
async def get_notes(
    workspace_id: str,
    project_id: Optional[str] = None,
    task_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"workspace_id": workspace_id}
    if project_id:
        query["project_id"] = project_id
    if task_id:
        query["task_id"] = task_id

    notes = await db.notes.find(query).sort([("is_pinned", -1), ("updated_at", -1)]).to_list(1000)
    for n in notes:
        n["_id"] = str(n["_id"])
    return notes

@api_router.get("/notes/{note_id}")
async def get_note(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"_id": ObjectId(note_id)})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note["_id"] = str(note["_id"])
    return note

@api_router.put("/notes/{note_id}")
async def update_note(note_id: str, note: NoteCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.notes.find_one({"_id": ObjectId(note_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Note not found")

    update_dict = {
        "title": note.title,
        "content": note.content,
        "is_pinned": note.is_pinned,
        "color": note.color,
        "tags": note.tags,
        "updated_at": datetime.utcnow()
    }

    await db.notes.update_one({"_id": ObjectId(note_id)}, {"$set": update_dict})
    return {"message": "Note updated"}

@api_router.patch("/notes/{note_id}/pin")
async def toggle_pin_note(note_id: str, is_pinned: bool, current_user: dict = Depends(get_current_user)):
    result = await db.notes.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": {"is_pinned": is_pinned, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note pin status updated"}

@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"_id": ObjectId(note_id)})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    await db.notes.delete_one({"_id": ObjectId(note_id)})

    await log_activity(
        current_user["_id"], "deleted", "note",
        note_id, note["title"], note["workspace_id"]
    )

    return {"message": "Note deleted"}

# ==================== TAGS ROUTES ====================

@api_router.post("/tags")
async def create_tag(tag: TagCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.tags.find_one({"name": tag.name, "workspace_id": tag.workspace_id})
    if existing:
        raise HTTPException(status_code=400, detail="Tag already exists")

    tag_dict = {
        "name": tag.name,
        "color": tag.color,
        "workspace_id": tag.workspace_id,
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow()
    }

    result = await db.tags.insert_one(tag_dict)
    tag_dict["_id"] = str(result.inserted_id)
    return tag_dict

@api_router.get("/tags")
async def get_tags(workspace_id: str, current_user: dict = Depends(get_current_user)):
    tags = await db.tags.find({"workspace_id": workspace_id}).to_list(100)
    for t in tags:
        t["_id"] = str(t["_id"])
    return tags

@api_router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tags.delete_one({"_id": ObjectId(tag_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"message": "Tag deleted"}

# ==================== FAVORITES ROUTES ====================

@api_router.post("/favorites")
async def add_favorite(favorite: FavoriteCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.favorites.find_one({
        "user_id": current_user["_id"],
        "item_type": favorite.item_type,
        "item_id": favorite.item_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")

    favorite_dict = {
        "user_id": current_user["_id"],
        "item_type": favorite.item_type,
        "item_id": favorite.item_id,
        "workspace_id": favorite.workspace_id,
        "created_at": datetime.utcnow()
    }

    result = await db.favorites.insert_one(favorite_dict)
    favorite_dict["_id"] = str(result.inserted_id)
    return favorite_dict

@api_router.get("/favorites")
async def get_favorites(workspace_id: str, current_user: dict = Depends(get_current_user)):
    favorites = await db.favorites.find({
        "user_id": current_user["_id"],
        "workspace_id": workspace_id
    }).to_list(100)

    result = []
    for f in favorites:
        f["_id"] = str(f["_id"])

        # Get item details
        if f["item_type"] == "project":
            item = await db.projects.find_one({"_id": ObjectId(f["item_id"])})
        elif f["item_type"] == "task":
            item = await db.tasks.find_one({"_id": ObjectId(f["item_id"])})
        elif f["item_type"] == "note":
            item = await db.notes.find_one({"_id": ObjectId(f["item_id"])})
        elif f["item_type"] == "request":
            item = await db.requests.find_one({"_id": ObjectId(f["item_id"])})
        else:
            item = None

        if item:
            item["_id"] = str(item["_id"])
            f["item"] = item
            result.append(f)

    return result

@api_router.delete("/favorites/{favorite_id}")
async def remove_favorite(favorite_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.favorites.delete_one({
        "_id": ObjectId(favorite_id),
        "user_id": current_user["_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Removed from favorites"}

# ==================== TEAM ROUTES ====================

@api_router.get("/team")
async def get_team(workspace_id: str, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    members = []
    for member_id in workspace["member_ids"]:
        user = await db.users.find_one({"_id": ObjectId(member_id)})
        if user:
            user["_id"] = str(user["_id"])
            user.pop("password", None)

            # Get role
            user["role"] = workspace.get("member_roles", {}).get(member_id, "member")

            # Get stats
            projects_count = await db.projects.count_documents({
                "workspace_id": workspace_id,
                "assigned_to": member_id
            })
            tasks_count = await db.tasks.count_documents({"assigned_to": member_id})
            completed_tasks = await db.tasks.count_documents({
                "assigned_to": member_id,
                "status": "done"
            })

            user["stats"] = {
                "projects": projects_count,
                "tasks": tasks_count,
                "completed_tasks": completed_tasks
            }

            members.append(user)

    return members

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics/dashboard")
async def get_dashboard_stats(workspace_id: str, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    projects = await db.projects.find({"workspace_id": workspace_id}).to_list(1000)
    project_ids = [str(p["_id"]) for p in projects]
    tasks = await db.tasks.find({"project_id": {"$in": project_ids}}).to_list(10000)

    # Calculate overdue items
    now = datetime.utcnow()
    overdue_tasks = [t for t in tasks if t.get("deadline") and t["deadline"] < now and t["status"] != "done"]
    overdue_projects = [p for p in projects if p.get("deadline") and p["deadline"] < now and p["status"] != "completed"]

    return {
        "total_projects": len(projects),
        "active_projects": len([p for p in projects if p["status"] == "in_progress"]),
        "completed_projects": len([p for p in projects if p["status"] == "completed"]),
        "total_tasks": len(tasks),
        "pending_tasks": len([t for t in tasks if t["status"] == "todo"]),
        "in_progress_tasks": len([t for t in tasks if t["status"] == "in_progress"]),
        "completed_tasks": len([t for t in tasks if t["status"] == "done"]),
        "overdue_tasks": len(overdue_tasks),
        "overdue_projects": len(overdue_projects),
        "total_members": len(workspace["member_ids"]),
        "projects_by_status": {
            "not_started": len([p for p in projects if p["status"] == "not_started"]),
            "in_progress": len([p for p in projects if p["status"] == "in_progress"]),
            "on_hold": len([p for p in projects if p["status"] == "on_hold"]),
            "completed": len([p for p in projects if p["status"] == "completed"])
        },
        "tasks_by_priority": {
            "low": len([t for t in tasks if t["priority"] == "low"]),
            "medium": len([t for t in tasks if t["priority"] == "medium"]),
            "high": len([t for t in tasks if t["priority"] == "high"]),
            "critical": len([t for t in tasks if t["priority"] == "critical"])
        },
        "tasks_by_status": {
            "todo": len([t for t in tasks if t["status"] == "todo"]),
            "in_progress": len([t for t in tasks if t["status"] == "in_progress"]),
            "review": len([t for t in tasks if t["status"] == "review"]),
            "done": len([t for t in tasks if t["status"] == "done"])
        }
    }

@api_router.get("/analytics/productivity")
async def get_productivity_stats(workspace_id: str, days: int = 30, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    start_date = datetime.utcnow() - timedelta(days=days)

    # Get completed tasks in period
    projects = await db.projects.find({"workspace_id": workspace_id}).to_list(1000)
    project_ids = [str(p["_id"]) for p in projects]

    completed_tasks = await db.tasks.find({
        "project_id": {"$in": project_ids},
        "status": "done",
        "updated_at": {"$gte": start_date}
    }).to_list(10000)

    # Group by date
    daily_stats = defaultdict(int)
    for task in completed_tasks:
        date_key = task["updated_at"].strftime("%Y-%m-%d")
        daily_stats[date_key] += 1

    return {
        "period_days": days,
        "total_completed": len(completed_tasks),
        "daily_average": len(completed_tasks) / days if days > 0 else 0,
        "daily_breakdown": dict(daily_stats)
    }

# ==================== ACTIVITY FEED ROUTES ====================

@api_router.get("/activities")
async def get_activities(
    workspace_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    activities = await db.activities.find({"workspace_id": workspace_id}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)

    for a in activities:
        a["_id"] = str(a["_id"])
        # Get user info
        user = await db.users.find_one({"_id": ObjectId(a["user_id"])})
        if user:
            a["user"] = {
                "_id": str(user["_id"]),
                "full_name": user["full_name"],
                "avatar": user.get("avatar")
            }

    return activities

# ==================== REQUEST ROUTES ====================

@api_router.post("/requests")
async def create_request(request: RequestCreate, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(request.workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    request_dict = {
        "title": request.title,
        "description": request.description,
        "workspace_id": request.workspace_id,
        "priority": request.priority,
        "category": request.category,
        "deadline": request.deadline,
        "tags": request.tags,
        "status": "pending",
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.requests.insert_one(request_dict)
    request_dict["_id"] = str(result.inserted_id)

    await log_activity(
        current_user["_id"], "created", "request",
        str(result.inserted_id), request.title, request.workspace_id
    )

    # Notify workspace admins
    for member_id, role in workspace.get("member_roles", {}).items():
        if role == "admin" and member_id != current_user["_id"]:
            await send_notification(
                member_id,
                "Yeni Talep",
                f"{current_user['full_name']} yeni bir talep oluşturdu: {request.title}",
                "info"
            )

    return request_dict

@api_router.get("/requests")
async def get_requests(
    workspace_id: str,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    query = {"workspace_id": workspace_id}
    if status:
        query["status"] = status

    requests = await db.requests.find(query).sort("created_at", -1).to_list(1000)

    for r in requests:
        r["_id"] = str(r["_id"])
        # Get creator info
        creator = await db.users.find_one({"_id": ObjectId(r["created_by"])})
        if creator:
            r["creator"] = {
                "_id": str(creator["_id"]),
                "full_name": creator["full_name"],
                "avatar": creator.get("avatar")
            }

    return requests

@api_router.put("/requests/{request_id}")
async def update_request(request_id: str, request: RequestCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.requests.find_one({"_id": ObjectId(request_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Request not found")

    update_dict = {
        "title": request.title,
        "description": request.description,
        "priority": request.priority,
        "category": request.category,
        "deadline": request.deadline,
        "tags": request.tags,
        "updated_at": datetime.utcnow()
    }

    await db.requests.update_one({"_id": ObjectId(request_id)}, {"$set": update_dict})

    await log_activity(
        current_user["_id"], "updated", "request",
        request_id, request.title, existing["workspace_id"]
    )

    return {"message": "Request updated"}

@api_router.put("/requests/{request_id}/status")
async def update_request_status(request_id: str, status_update: RequestStatusUpdate, current_user: dict = Depends(get_current_user)):
    request = await db.requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    await db.requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": status_update.status, "updated_at": datetime.utcnow()}}
    )

    # Notify request creator
    if request["created_by"] != current_user["_id"]:
        status_labels = {
            "pending": "Beklemede",
            "in_review": "İnceleniyor",
            "approved": "Onaylandı",
            "rejected": "Reddedildi",
            "completed": "Tamamlandı"
        }
        await send_notification(
            request["created_by"],
            "Talep Durumu Güncellendi",
            f"'{request['title']}' talebinizin durumu '{status_labels.get(status_update.status, status_update.status)}' olarak güncellendi.",
            "info"
        )

    await log_activity(
        current_user["_id"], "status_changed", "request",
        request_id, request["title"], request["workspace_id"],
        {"old_status": request["status"], "new_status": status_update.status}
    )

    return {"message": "Request status updated"}

@api_router.delete("/requests/{request_id}")
async def delete_request(request_id: str, current_user: dict = Depends(get_current_user)):
    request = await db.requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    workspace = await db.workspaces.find_one({"_id": ObjectId(request["workspace_id"])})
    user_role = workspace.get("member_roles", {}).get(current_user["_id"])

    if request["created_by"] != current_user["_id"] and user_role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    await db.comments.delete_many({"request_id": request_id})
    await db.requests.delete_one({"_id": ObjectId(request_id)})

    return {"message": "Request deleted"}

# ==================== NOTIFICATION ROUTES ====================

@api_router.get("/notifications")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["_id"]}
    if unread_only:
        query["read"] = False

    notifications = await db.notifications.find(query).sort("created_at", -1).limit(limit).to_list(limit)

    for n in notifications:
        n["_id"] = str(n["_id"])

    # Get unread count
    unread_count = await db.notifications.count_documents({
        "user_id": current_user["_id"],
        "read": False
    })

    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": current_user["_id"]},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.delete_one({
        "_id": ObjectId(notification_id),
        "user_id": current_user["_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}

# ==================== COMMENT ROUTES ====================

@api_router.post("/comments")
async def create_comment(comment: CommentCreate, current_user: dict = Depends(get_current_user)):
    comment_dict = {
        "content": comment.content,
        "task_id": comment.task_id,
        "project_id": comment.project_id,
        "request_id": comment.request_id,
        "parent_comment_id": comment.parent_comment_id,
        "user_id": current_user["_id"],
        "user_name": current_user["full_name"],
        "user_avatar": current_user.get("avatar"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.comments.insert_one(comment_dict)
    comment_dict["_id"] = str(result.inserted_id)

    # Notify mentioned users and item owner
    # Simple @mention detection
    mentions = re.findall(r'@(\w+)', comment.content)
    for mention in mentions:
        user = await db.users.find_one({"full_name": {"$regex": mention, "$options": "i"}})
        if user and str(user["_id"]) != current_user["_id"]:
            await send_notification(
                str(user["_id"]),
                "Bahsedildiniz",
                f"{current_user['full_name']} bir yorumda sizden bahsetti.",
                "mention"
            )

    return comment_dict

@api_router.get("/comments")
async def get_comments(
    task_id: Optional[str] = None,
    project_id: Optional[str] = None,
    request_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if task_id:
        query["task_id"] = task_id
    if project_id:
        query["project_id"] = project_id
    if request_id:
        query["request_id"] = request_id

    comments = await db.comments.find(query).sort("created_at", 1).to_list(1000)

    for c in comments:
        c["_id"] = str(c["_id"])

    return comments

@api_router.put("/comments/{comment_id}")
async def update_comment(comment_id: str, content: str, current_user: dict = Depends(get_current_user)):
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Can only edit your own comments")

    await db.comments.update_one(
        {"_id": ObjectId(comment_id)},
        {"$set": {"content": content, "updated_at": datetime.utcnow(), "edited": True}}
    )
    return {"message": "Comment updated"}

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Can only delete your own comments")

    await db.comments.delete_one({"_id": ObjectId(comment_id)})
    return {"message": "Comment deleted"}

# ==================== TIME TRACKING ROUTES ====================

@api_router.post("/time-entries")
async def create_time_entry(entry: TimeEntry, current_user: dict = Depends(get_current_user)):
    entry_dict = {
        "user_id": current_user["_id"],
        "workspace_id": entry.workspace_id,
        "project_id": entry.project_id,
        "task_id": entry.task_id,
        "check_in": entry.check_in,
        "check_out": entry.check_out,
        "note": entry.note,
        "created_at": datetime.utcnow()
    }

    result = await db.time_entries.insert_one(entry_dict)
    entry_dict["_id"] = str(result.inserted_id)
    return entry_dict

@api_router.get("/time-entries")
async def get_time_entries(
    workspace_id: str,
    project_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"workspace_id": workspace_id, "user_id": current_user["_id"]}

    if project_id:
        query["project_id"] = project_id
    if start_date:
        query["check_in"] = {"$gte": start_date}
    if end_date:
        if "check_in" in query:
            query["check_in"]["$lte"] = end_date
        else:
            query["check_in"] = {"$lte": end_date}

    entries = await db.time_entries.find(query).sort("check_in", -1).to_list(1000)

    for e in entries:
        e["_id"] = str(e["_id"])
        # Calculate duration
        if e.get("check_out"):
            duration = (e["check_out"] - e["check_in"]).total_seconds()
            e["duration_seconds"] = duration
            e["duration_formatted"] = f"{int(duration // 3600)}h {int((duration % 3600) // 60)}m"

    return entries

@api_router.put("/time-entries/{entry_id}/checkout")
async def checkout_time_entry(entry_id: str, note: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    update_dict = {"check_out": datetime.utcnow()}
    if note:
        update_dict["note"] = note

    result = await db.time_entries.update_one(
        {"_id": ObjectId(entry_id), "user_id": current_user["_id"]},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return {"message": "Checked out"}

@api_router.get("/time-entries/active")
async def get_active_time_entry(current_user: dict = Depends(get_current_user)):
    entry = await db.time_entries.find_one({
        "user_id": current_user["_id"],
        "check_out": None
    })
    if entry:
        entry["_id"] = str(entry["_id"])
    return entry

# ==================== FILE UPLOAD ROUTES ====================

@api_router.post("/files")
async def upload_file(file: FileUpload, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(file.workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    file_dict = {
        "name": file.name,
        "file_data": file.file_data,
        "mime_type": file.mime_type,
        "size": file.size,
        "project_id": file.project_id,
        "task_id": file.task_id,
        "workspace_id": file.workspace_id,
        "uploaded_by": current_user["_id"],
        "uploader_name": current_user["full_name"],
        "created_at": datetime.utcnow()
    }

    result = await db.files.insert_one(file_dict)

    # Don't return file_data in response
    response = {
        "_id": str(result.inserted_id),
        "name": file.name,
        "mime_type": file.mime_type,
        "size": file.size,
        "project_id": file.project_id,
        "task_id": file.task_id,
        "workspace_id": file.workspace_id,
        "uploaded_by": current_user["_id"],
        "uploader_name": current_user["full_name"],
        "created_at": file_dict["created_at"]
    }

    await log_activity(
        current_user["_id"], "uploaded", "file",
        str(result.inserted_id), file.name, file.workspace_id
    )

    return response

@api_router.get("/files")
async def get_files(
    workspace_id: str,
    project_id: Optional[str] = None,
    task_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"workspace_id": workspace_id}
    if project_id:
        query["project_id"] = project_id
    if task_id:
        query["task_id"] = task_id

    # Exclude file_data from listing for performance
    files = await db.files.find(
        query,
        {"file_data": 0}
    ).sort("created_at", -1).to_list(1000)

    for f in files:
        f["_id"] = str(f["_id"])
        # Add formatted size
        size = f.get("size", 0)
        if size < 1024:
            f["size_formatted"] = f"{size} B"
        elif size < 1024 * 1024:
            f["size_formatted"] = f"{size / 1024:.1f} KB"
        else:
            f["size_formatted"] = f"{size / (1024 * 1024):.1f} MB"

    return files

@api_router.get("/files/{file_id}")
async def get_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    file["_id"] = str(file["_id"])
    return file

@api_router.delete("/files/{file_id}")
async def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    if file["uploaded_by"] != current_user["_id"]:
        workspace = await db.workspaces.find_one({"_id": ObjectId(file["workspace_id"])})
        user_role = workspace.get("member_roles", {}).get(current_user["_id"])
        if user_role != "admin":
            raise HTTPException(status_code=403, detail="Permission denied")

    await db.files.delete_one({"_id": ObjectId(file_id)})

    await log_activity(
        current_user["_id"], "deleted", "file",
        file_id, file["name"], file["workspace_id"]
    )

    return {"message": "File deleted"}

# ==================== SEARCH ROUTES ====================

@api_router.get("/search")
async def search(
    q: str,
    workspace_id: str,
    types: Optional[str] = None,  # comma-separated: projects,tasks,notes,requests
    current_user: dict = Depends(get_current_user)
):
    if len(q) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")

    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    search_types = types.split(",") if types else ["projects", "tasks", "notes", "requests"]
    results = {}

    regex_query = {"$regex": q, "$options": "i"}

    if "projects" in search_types:
        projects = await db.projects.find({
            "workspace_id": workspace_id,
            "$or": [
                {"name": regex_query},
                {"description": regex_query}
            ]
        }).limit(20).to_list(20)
        for p in projects:
            p["_id"] = str(p["_id"])
        results["projects"] = projects

    if "tasks" in search_types:
        project_ids = [str(p["_id"]) for p in await db.projects.find({"workspace_id": workspace_id}).to_list(1000)]
        tasks = await db.tasks.find({
            "project_id": {"$in": project_ids},
            "$or": [
                {"title": regex_query},
                {"description": regex_query}
            ]
        }).limit(20).to_list(20)
        for t in tasks:
            t["_id"] = str(t["_id"])
        results["tasks"] = tasks

    if "notes" in search_types:
        notes = await db.notes.find({
            "workspace_id": workspace_id,
            "$or": [
                {"title": regex_query},
                {"content": regex_query}
            ]
        }).limit(20).to_list(20)
        for n in notes:
            n["_id"] = str(n["_id"])
        results["notes"] = notes

    if "requests" in search_types:
        requests_list = await db.requests.find({
            "workspace_id": workspace_id,
            "$or": [
                {"title": regex_query},
                {"description": regex_query}
            ]
        }).limit(20).to_list(20)
        for r in requests_list:
            r["_id"] = str(r["_id"])
        results["requests"] = requests_list

    return results

# ==================== DEADLINE REMINDERS ====================

@api_router.get("/reminders/upcoming")
async def get_upcoming_deadlines(
    workspace_id: str,
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    now = datetime.utcnow()
    deadline_end = now + timedelta(days=days)

    # Get projects with upcoming deadlines
    projects = await db.projects.find({
        "workspace_id": workspace_id,
        "deadline": {"$gte": now, "$lte": deadline_end},
        "status": {"$ne": "completed"}
    }).sort("deadline", 1).to_list(50)

    for p in projects:
        p["_id"] = str(p["_id"])
        days_left = (p["deadline"] - now).days
        p["days_left"] = days_left
        p["urgency"] = "critical" if days_left <= 1 else "high" if days_left <= 3 else "medium"

    # Get tasks with upcoming deadlines
    project_ids = [str(p["_id"]) for p in await db.projects.find({"workspace_id": workspace_id}).to_list(1000)]
    tasks = await db.tasks.find({
        "project_id": {"$in": project_ids},
        "deadline": {"$gte": now, "$lte": deadline_end},
        "status": {"$ne": "done"}
    }).sort("deadline", 1).to_list(100)

    for t in tasks:
        t["_id"] = str(t["_id"])
        days_left = (t["deadline"] - now).days
        t["days_left"] = days_left
        t["urgency"] = "critical" if days_left <= 1 else "high" if days_left <= 3 else "medium"

    return {
        "projects": projects,
        "tasks": tasks
    }

# ==================== REGISTER ROUTER ====================

app.include_router(api_router)

# ==================== CORS MIDDLEWARE ====================

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # In production, specify actual origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== SHUTDOWN ====================

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("Database connection closed")

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup_event():
    logger.info("AICO API starting up...")

    # Create indexes for better performance
    try:
        await db.users.create_index("email", unique=True)
        await db.workspaces.create_index("member_ids")
        await db.projects.create_index("workspace_id")
        await db.tasks.create_index("project_id")
        await db.tasks.create_index("assigned_to")
        await db.notifications.create_index([("user_id", 1), ("read", 1)])
        await db.activities.create_index([("workspace_id", 1), ("created_at", -1)])
        await db.notes.create_index("workspace_id")
        await db.files.create_index("workspace_id")
        logger.info("Database indexes created")
    except Exception as e:
        logger.warning(f"Index creation warning: {str(e)}")

    logger.info("AICO API ready")
