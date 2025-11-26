from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("SECRET_KEY", "aico-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

app = FastAPI(title="AICO API")
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    workspace_id: str
    status: str = "not_started"
    deadline: Optional[datetime] = None
    assigned_to: List[str] = []

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: str
    status: str = "todo"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    deadline: Optional[datetime] = None

class InviteMember(BaseModel):
    email: EmailStr

class RequestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    workspace_id: str
    priority: str = "medium"
    category: str = "general"
    deadline: Optional[datetime] = None

class CommentCreate(BaseModel):
    content: str
    task_id: Optional[str] = None
    project_id: Optional[str] = None

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"

class TimeEntry(BaseModel):
    workspace_id: str
    check_in: datetime
    check_out: Optional[datetime] = None
    note: Optional[str] = None

class FileUpload(BaseModel):
    name: str
    file_data: str  # base64
    project_id: Optional[str] = None
    task_id: Optional[str] = None
    workspace_id: str

# ==================== AUTH UTILS ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    user["_id"] = str(user["_id"])
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "full_name": user_data.full_name,
        "avatar": None,
        "created_at": datetime.utcnow()
    }
    result = await db.users.insert_one(user_dict)
    token = create_access_token({"sub": str(result.inserted_id)})
    
    return {
        "token": token,
        "user": {
            "_id": str(result.inserted_id),
            "email": user_data.email,
            "full_name": user_data.full_name,
            "avatar": None
        }
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    token = create_access_token({"sub": str(user["_id"])})
    return {
        "token": token,
        "user": {
            "_id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "avatar": user.get("avatar")
        }
    }

@api_router.get("/user/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ==================== WORKSPACE ROUTES ====================

@api_router.post("/workspaces")
async def create_workspace(workspace: WorkspaceCreate, current_user: dict = Depends(get_current_user)):
    workspace_dict = {
        "name": workspace.name,
        "description": workspace.description,
        "owner_id": current_user["_id"],
        "member_ids": [current_user["_id"]],
        "created_at": datetime.utcnow()
    }
    result = await db.workspaces.insert_one(workspace_dict)
    workspace_dict["_id"] = str(result.inserted_id)
    return workspace_dict

@api_router.get("/workspaces")
async def get_workspaces(current_user: dict = Depends(get_current_user)):
    workspaces = await db.workspaces.find({"member_ids": current_user["_id"]}).to_list(1000)
    for ws in workspaces:
        ws["_id"] = str(ws["_id"])
    return workspaces

@api_router.get("/workspaces/{workspace_id}")
async def get_workspace(workspace_id: str, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")
    workspace["_id"] = str(workspace["_id"])
    return workspace

@api_router.put("/workspaces/{workspace_id}")
async def update_workspace(workspace_id: str, workspace: WorkspaceCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if existing["owner_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only owner can update")
    
    await db.workspaces.update_one(
        {"_id": ObjectId(workspace_id)},
        {"$set": {"name": workspace.name, "description": workspace.description}}
    )
    return {"message": "Workspace updated"}

@api_router.post("/workspaces/{workspace_id}/invite")
async def invite_member(workspace_id: str, invite: InviteMember, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace or workspace["owner_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = await db.users.find_one({"email": invite.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = str(user["_id"])
    if user_id in workspace["member_ids"]:
        raise HTTPException(status_code=400, detail="Already a member")
    
    await db.workspaces.update_one(
        {"_id": ObjectId(workspace_id)},
        {"$push": {"member_ids": user_id}}
    )
    return {"message": "Member invited"}

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
        "deadline": project.deadline,
        "assigned_to": project.assigned_to,
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.projects.insert_one(project_dict)
    project_dict["_id"] = str(result.inserted_id)
    return project_dict

@api_router.get("/projects")
async def get_projects(workspace_id: str, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    projects = await db.projects.find({"workspace_id": workspace_id}).to_list(1000)
    for p in projects:
        p["_id"] = str(p["_id"])
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project["_id"] = str(project["_id"])
    return project

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    update_dict = {
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "deadline": project.deadline,
        "assigned_to": project.assigned_to,
        "updated_at": datetime.utcnow()
    }
    result = await db.projects.update_one({"_id": ObjectId(project_id)}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project updated"}

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    await db.tasks.delete_many({"project_id": project_id})
    result = await db.projects.delete_one({"_id": ObjectId(project_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}

# ==================== TASK ROUTES ====================

@api_router.post("/tasks")
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    task_dict = {
        "title": task.title,
        "description": task.description,
        "project_id": task.project_id,
        "status": task.status,
        "priority": task.priority,
        "assigned_to": task.assigned_to,
        "deadline": task.deadline,
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.tasks.insert_one(task_dict)
    task_dict["_id"] = str(result.inserted_id)
    return task_dict

@api_router.get("/tasks")
async def get_tasks(project_id: str, current_user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"project_id": project_id}).to_list(1000)
    for t in tasks:
        t["_id"] = str(t["_id"])
    return tasks

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, task: TaskCreate, current_user: dict = Depends(get_current_user)):
    update_dict = {
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "assigned_to": task.assigned_to,
        "deadline": task.deadline,
        "updated_at": datetime.utcnow()
    }
    result = await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task updated"}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

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
            
            projects_count = await db.projects.count_documents({
                "workspace_id": workspace_id,
                "assigned_to": member_id
            })
            tasks_count = await db.tasks.count_documents({"assigned_to": member_id})
            
            user["projects_count"] = projects_count
            user["tasks_count"] = tasks_count
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
    tasks = await db.tasks.find({"project_id": {"$in": project_ids}}).to_list(1000)
    
    return {
        "total_projects": len(projects),
        "active_projects": len([p for p in projects if p["status"] == "in_progress"]),
        "completed_projects": len([p for p in projects if p["status"] == "completed"]),
        "total_tasks": len(tasks),
        "pending_tasks": len([t for t in tasks if t["status"] == "todo"]),
        "in_progress_tasks": len([t for t in tasks if t["status"] == "in_progress"]),
        "completed_tasks": len([t for t in tasks if t["status"] == "done"]),
        "total_members": len(workspace["member_ids"]),
        "projects_by_status": {
            "not_started": len([p for p in projects if p["status"] == "not_started"]),
            "in_progress": len([p for p in projects if p["status"] == "in_progress"]),
            "completed": len([p for p in projects if p["status"] == "completed"])
        },
        "tasks_by_priority": {
            "low": len([t for t in tasks if t["priority"] == "low"]),
            "medium": len([t for t in tasks if t["priority"] == "medium"]),
            "high": len([t for t in tasks if t["priority"] == "high"])
        }
    }

# ==================== REQUEST/ORDER ROUTES ====================

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
        "status": "pending",
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.requests.insert_one(request_dict)
    request_dict["_id"] = str(result.inserted_id)
    return request_dict

@api_router.get("/requests")
async def get_requests(workspace_id: str, current_user: dict = Depends(get_current_user)):
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace or current_user["_id"] not in workspace["member_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    requests = await db.requests.find({"workspace_id": workspace_id}).to_list(1000)
    for r in requests:
        r["_id"] = str(r["_id"])
    return requests

@api_router.put("/requests/{request_id}")
async def update_request(request_id: str, request: RequestCreate, current_user: dict = Depends(get_current_user)):
    update_dict = {
        "title": request.title,
        "description": request.description,
        "priority": request.priority,
        "category": request.category,
        "deadline": request.deadline,
        "updated_at": datetime.utcnow()
    }
    result = await db.requests.update_one({"_id": ObjectId(request_id)}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Request updated"}

# ==================== NOTIFICATION ROUTES ====================

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user["_id"]}).sort("created_at", -1).to_list(100)
    for n in notifications:
        n["_id"] = str(n["_id"])
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": current_user["_id"]},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

# ==================== COMMENT ROUTES ====================

@api_router.post("/comments")
async def create_comment(comment: CommentCreate, current_user: dict = Depends(get_current_user)):
    comment_dict = {
        "content": comment.content,
        "task_id": comment.task_id,
        "project_id": comment.project_id,
        "user_id": current_user["_id"],
        "user_name": current_user["full_name"],
        "created_at": datetime.utcnow()
    }
    result = await db.comments.insert_one(comment_dict)
    comment_dict["_id"] = str(result.inserted_id)
    return comment_dict

@api_router.get("/comments")
async def get_comments(task_id: Optional[str] = None, project_id: Optional[str] = None):
    query = {}
    if task_id:
        query["task_id"] = task_id
    if project_id:
        query["project_id"] = project_id
    
    comments = await db.comments.find(query).sort("created_at", -1).to_list(1000)
    for c in comments:
        c["_id"] = str(c["_id"])
    return comments

# ==================== TIME TRACKING ROUTES ====================

@api_router.post("/time-entries")
async def create_time_entry(entry: TimeEntry, current_user: dict = Depends(get_current_user)):
    entry_dict = {
        "user_id": current_user["_id"],
        "workspace_id": entry.workspace_id,
        "check_in": entry.check_in,
        "check_out": entry.check_out,
        "note": entry.note,
        "created_at": datetime.utcnow()
    }
    result = await db.time_entries.insert_one(entry_dict)
    entry_dict["_id"] = str(result.inserted_id)
    return entry_dict

@api_router.get("/time-entries")
async def get_time_entries(workspace_id: str, current_user: dict = Depends(get_current_user)):
    entries = await db.time_entries.find({
        "workspace_id": workspace_id,
        "user_id": current_user["_id"]
    }).sort("created_at", -1).to_list(100)
    for e in entries:
        e["_id"] = str(e["_id"])
    return entries

@api_router.put("/time-entries/{entry_id}/checkout")
async def checkout_time_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.time_entries.update_one(
        {"_id": ObjectId(entry_id), "user_id": current_user["_id"]},
        {"$set": {"check_out": datetime.utcnow()}}
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
    file_dict = {
        "name": file.name,
        "file_data": file.file_data,
        "project_id": file.project_id,
        "task_id": file.task_id,
        "workspace_id": file.workspace_id,
        "uploaded_by": current_user["_id"],
        "created_at": datetime.utcnow()
    }
    result = await db.files.insert_one(file_dict)
    file_dict["_id"] = str(result.inserted_id)
    return file_dict

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
    
    files = await db.files.find(query).sort("created_at", -1).to_list(1000)
    for f in files:
        f["_id"] = str(f["_id"])
    return files

@api_router.delete("/files/{file_id}")
async def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.files.delete_one({"_id": ObjectId(file_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    return {"message": "File deleted"}

# ==================== SEARCH ROUTES ====================

@api_router.get("/search")
async def search(
    q: str,
    workspace_id: str,
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    results = {"projects": [], "tasks": [], "requests": []}
    
    if not type or type == "projects":
        projects = await db.projects.find({
            "workspace_id": workspace_id,
            "$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}}
            ]
        }).to_list(50)
        for p in projects:
            p["_id"] = str(p["_id"])
        results["projects"] = projects
    
    if not type or type == "tasks":
        tasks = await db.tasks.find({
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}}
            ]
        }).to_list(50)
        for t in tasks:
            t["_id"] = str(t["_id"])
        results["tasks"] = tasks
    
    if not type or type == "requests":
        requests = await db.requests.find({
            "workspace_id": workspace_id,
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}}
            ]
        }).to_list(50)
        for r in requests:
            r["_id"] = str(r["_id"])
        results["requests"] = r
    
    return results

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
