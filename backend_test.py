#!/usr/bin/env python3
"""
AICO Backend API Testing Suite
Tests all backend endpoints comprehensively
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Backend URL from environment
BACKEND_URL = "https://dualslack.preview.emergentagent.com/api"

class AICoAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.auth_token = None
        self.user_id = None
        self.workspace_id = None
        self.project_id = None
        self.task_id = None
        self.request_id = None
        self.time_entry_id = None
        self.file_id = None
        self.comment_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
            
    def get_auth_headers(self):
        """Get authorization headers"""
        if not self.auth_token:
            return {}
        return {"Authorization": f"Bearer {self.auth_token}"}
        
    def test_auth_signup(self):
        """Test user signup"""
        test_user = {
            "email": "john.doe@aico.com",
            "password": "SecurePass123!",
            "full_name": "John Doe"
        }
        
        response = self.make_request("POST", "/auth/signup", test_user)
        if response and response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                self.auth_token = data["token"]
                self.user_id = data["user"]["_id"]
                self.log_test("Auth Signup", True, f"User created with ID: {self.user_id}")
                return True
            else:
                self.log_test("Auth Signup", False, "Missing token or user in response")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Auth Signup", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_auth_login(self):
        """Test user login"""
        login_data = {
            "email": "john.doe@aico.com",
            "password": "SecurePass123!"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response and response.status_code == 200:
            data = response.json()
            if "token" in data:
                self.auth_token = data["token"]
                self.log_test("Auth Login", True, "Login successful")
                return True
            else:
                self.log_test("Auth Login", False, "Missing token in response")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Auth Login", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_auth_me(self):
        """Test get current user"""
        headers = self.get_auth_headers()
        response = self.make_request("GET", "/user/me", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "_id" in data and "email" in data:
                self.log_test("Auth Get Me", True, f"User data retrieved: {data['email']}")
                return True
            else:
                self.log_test("Auth Get Me", False, "Missing user data in response")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Auth Get Me", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_auth_unauthorized(self):
        """Test unauthorized access"""
        response = self.make_request("GET", "/user/me")
        
        if response and response.status_code in [401, 403]:
            self.log_test("Auth Unauthorized", True, f"Correctly rejected unauthorized request (status: {response.status_code})")
            return True
        else:
            self.log_test("Auth Unauthorized", False, f"Expected 401/403, got {response.status_code if response else 'None'}")
        return False
        
    def test_workspace_create(self):
        """Test workspace creation"""
        workspace_data = {
            "name": "AICO Development Team",
            "description": "Main development workspace for AICO project"
        }
        
        headers = self.get_auth_headers()
        response = self.make_request("POST", "/workspaces", workspace_data, headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "_id" in data and "name" in data:
                self.workspace_id = data["_id"]
                self.log_test("Workspace Create", True, f"Workspace created with ID: {self.workspace_id}")
                return True
            else:
                self.log_test("Workspace Create", False, "Missing workspace data in response")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Workspace Create", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_workspace_list(self):
        """Test workspace listing"""
        headers = self.get_auth_headers()
        response = self.make_request("GET", "/workspaces", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                self.log_test("Workspace List", True, f"Retrieved {len(data)} workspaces")
                return True
            else:
                self.log_test("Workspace List", False, "No workspaces returned")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Workspace List", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_workspace_get(self):
        """Test get specific workspace"""
        if not self.workspace_id:
            self.log_test("Workspace Get", False, "No workspace ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", f"/workspaces/{self.workspace_id}", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "_id" in data and data["_id"] == self.workspace_id:
                self.log_test("Workspace Get", True, f"Retrieved workspace: {data['name']}")
                return True
            else:
                self.log_test("Workspace Get", False, "Workspace data mismatch")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Workspace Get", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_workspace_update(self):
        """Test workspace update"""
        if not self.workspace_id:
            self.log_test("Workspace Update", False, "No workspace ID available")
            return False
            
        update_data = {
            "name": "AICO Development Team - Updated",
            "description": "Updated description for AICO project workspace"
        }
        
        headers = self.get_auth_headers()
        response = self.make_request("PUT", f"/workspaces/{self.workspace_id}", update_data, headers)
        
        if response and response.status_code == 200:
            self.log_test("Workspace Update", True, "Workspace updated successfully")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Workspace Update", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_project_create(self):
        """Test project creation"""
        if not self.workspace_id:
            self.log_test("Project Create", False, "No workspace ID available")
            return False
            
        project_data = {
            "name": "AICO Mobile App",
            "description": "Development of the AICO mobile application",
            "workspace_id": self.workspace_id,
            "status": "in_progress",
            "assigned_to": [self.user_id]
        }
        
        headers = self.get_auth_headers()
        response = self.make_request("POST", "/projects", project_data, headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "_id" in data and "name" in data:
                self.project_id = data["_id"]
                self.log_test("Project Create", True, f"Project created with ID: {self.project_id}")
                return True
            else:
                self.log_test("Project Create", False, "Missing project data in response")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Project Create", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_project_list(self):
        """Test project listing"""
        if not self.workspace_id:
            self.log_test("Project List", False, "No workspace ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", f"/projects?workspace_id={self.workspace_id}", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                self.log_test("Project List", True, f"Retrieved {len(data)} projects")
                return True
            else:
                self.log_test("Project List", False, "No projects returned")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Project List", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_project_get(self):
        """Test get specific project"""
        if not self.project_id:
            self.log_test("Project Get", False, "No project ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", f"/projects/{self.project_id}", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "_id" in data and data["_id"] == self.project_id:
                self.log_test("Project Get", True, f"Retrieved project: {data['name']}")
                return True
            else:
                self.log_test("Project Get", False, "Project data mismatch")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Project Get", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_project_update(self):
        """Test project update"""
        if not self.project_id:
            self.log_test("Project Update", False, "No project ID available")
            return False
            
        update_data = {
            "name": "AICO Mobile App - Updated",
            "description": "Updated description for AICO mobile application",
            "workspace_id": self.workspace_id,
            "status": "completed",
            "assigned_to": [self.user_id]
        }
        
        headers = self.get_auth_headers()
        response = self.make_request("PUT", f"/projects/{self.project_id}", update_data, headers)
        
        if response and response.status_code == 200:
            self.log_test("Project Update", True, "Project updated successfully")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Project Update", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_task_create(self):
        """Test task creation"""
        if not self.project_id:
            self.log_test("Task Create", False, "No project ID available")
            return False
            
        task_data = {
            "title": "Implement User Authentication",
            "description": "Develop secure user authentication system with JWT tokens",
            "project_id": self.project_id,
            "status": "in_progress",
            "priority": "high",
            "assigned_to": self.user_id
        }
        
        headers = self.get_auth_headers()
        response = self.make_request("POST", "/tasks", task_data, headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "_id" in data and "title" in data:
                self.task_id = data["_id"]
                self.log_test("Task Create", True, f"Task created with ID: {self.task_id}")
                return True
            else:
                self.log_test("Task Create", False, "Missing task data in response")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Task Create", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_task_list(self):
        """Test task listing"""
        if not self.project_id:
            self.log_test("Task List", False, "No project ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", f"/tasks?project_id={self.project_id}", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                self.log_test("Task List", True, f"Retrieved {len(data)} tasks")
                return True
            else:
                self.log_test("Task List", False, "No tasks returned")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Task List", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_task_update(self):
        """Test task update"""
        if not self.task_id:
            self.log_test("Task Update", False, "No task ID available")
            return False
            
        update_data = {
            "title": "Implement User Authentication - Updated",
            "description": "Updated: Develop secure user authentication system with JWT tokens and refresh tokens",
            "project_id": self.project_id,
            "status": "done",
            "priority": "high",
            "assigned_to": self.user_id
        }
        
        headers = self.get_auth_headers()
        response = self.make_request("PUT", f"/tasks/{self.task_id}", update_data, headers)
        
        if response and response.status_code == 200:
            self.log_test("Task Update", True, "Task updated successfully")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Task Update", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_team_get(self):
        """Test team listing"""
        if not self.workspace_id:
            self.log_test("Team Get", False, "No workspace ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", f"/team?workspace_id={self.workspace_id}", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                self.log_test("Team Get", True, f"Retrieved {len(data)} team members")
                return True
            else:
                self.log_test("Team Get", False, "No team members returned")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Team Get", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_analytics_dashboard(self):
        """Test analytics dashboard"""
        if not self.workspace_id:
            self.log_test("Analytics Dashboard", False, "No workspace ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", f"/analytics/dashboard?workspace_id={self.workspace_id}", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            expected_keys = ["total_projects", "active_projects", "completed_projects", "total_tasks", 
                           "pending_tasks", "in_progress_tasks", "completed_tasks", "total_members"]
            if all(key in data for key in expected_keys):
                self.log_test("Analytics Dashboard", True, f"Analytics data retrieved with all expected fields")
                return True
            else:
                missing_keys = [key for key in expected_keys if key not in data]
                self.log_test("Analytics Dashboard", False, f"Missing keys: {missing_keys}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Analytics Dashboard", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_workspace_invite(self):
        """Test workspace member invitation"""
        if not self.workspace_id:
            self.log_test("Workspace Invite", False, "No workspace ID available")
            return False
            
        # First create another user to invite
        invite_user = {
            "email": "jane.smith@aico.com",
            "password": "SecurePass456!",
            "full_name": "Jane Smith"
        }
        
        response = self.make_request("POST", "/auth/signup", invite_user)
        if not response or response.status_code != 200:
            self.log_test("Workspace Invite", False, "Failed to create user to invite")
            return False
            
        # Now invite the user
        invite_data = {"email": "jane.smith@aico.com"}
        headers = self.get_auth_headers()
        response = self.make_request("POST", f"/workspaces/{self.workspace_id}/invite", invite_data, headers)
        
        if response and response.status_code == 200:
            self.log_test("Workspace Invite", True, "Member invited successfully")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Workspace Invite", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_task_delete(self):
        """Test task deletion"""
        if not self.task_id:
            self.log_test("Task Delete", False, "No task ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("DELETE", f"/tasks/{self.task_id}", headers=headers)
        
        if response and response.status_code == 200:
            self.log_test("Task Delete", True, "Task deleted successfully")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Task Delete", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_project_delete(self):
        """Test project deletion"""
        if not self.project_id:
            self.log_test("Project Delete", False, "No project ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("DELETE", f"/projects/{self.project_id}", headers=headers)
        
        if response and response.status_code == 200:
            self.log_test("Project Delete", True, "Project deleted successfully")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Project Delete", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_request_create(self):
        """Test request creation"""
        if not self.workspace_id:
            self.log_test("Request Create", False, "No workspace ID available")
            return False
            
        request_data = {
            "title": "AICO Feature Request",
            "description": "Request for new feature in AICO system",
            "workspace_id": self.workspace_id,
            "priority": "high",
            "category": "feature"
        }
        
        headers = self.get_auth_headers()
        response = self.make_request("POST", "/requests", request_data, headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "_id" in data:
                self.request_id = data["_id"]
                self.log_test("Request Create", True, f"Request created with ID: {self.request_id}")
                return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("Request Create", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_request_list(self):
        """Test request listing"""
        if not self.workspace_id:
            self.log_test("Request List", False, "No workspace ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", f"/requests?workspace_id={self.workspace_id}", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Request List", True, f"Retrieved {len(data)} requests")
                return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("Request List", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_request_update(self):
        """Test request update"""
        if not self.request_id:
            self.log_test("Request Update", False, "No request ID available")
            return False
            
        update_data = {
            "title": "AICO Feature Request - Updated",
            "description": "Updated request description",
            "workspace_id": self.workspace_id,
            "priority": "medium",
            "category": "enhancement"
        }
        
        headers = self.get_auth_headers()
        response = self.make_request("PUT", f"/requests/{self.request_id}", update_data, headers)
        
        if response and response.status_code == 200:
            self.log_test("Request Update", True, "Request updated successfully")
            return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("Request Update", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_notifications_list(self):
        """Test notifications listing"""
        headers = self.get_auth_headers()
        response = self.make_request("GET", "/notifications", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Notifications List", True, f"Retrieved {len(data)} notifications")
                return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("Notifications List", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_comment_create(self):
        """Test comment creation"""
        if not self.task_id:
            self.log_test("Comment Create", False, "No task ID available")
            return False
            
        comment_data = {
            "content": "This is a test comment for the task",
            "task_id": self.task_id
        }
        
        headers = self.get_auth_headers()
        response = self.make_request("POST", "/comments", comment_data, headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "_id" in data:
                self.comment_id = data["_id"]
                self.log_test("Comment Create", True, f"Comment created with ID: {self.comment_id}")
                return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("Comment Create", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_comment_list(self):
        """Test comment listing"""
        if not self.task_id:
            self.log_test("Comment List", False, "No task ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", f"/comments?task_id={self.task_id}", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Comment List", True, f"Retrieved {len(data)} comments")
                return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("Comment List", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_time_entry_create(self):
        """Test time entry creation"""
        if not self.workspace_id:
            self.log_test("Time Entry Create", False, "No workspace ID available")
            return False
            
        time_data = {
            "workspace_id": self.workspace_id,
            "check_in": datetime.utcnow().isoformat(),
            "note": "Working on AICO development tasks"
        }
        
        headers = self.get_auth_headers()
        response = self.make_request("POST", "/time-entries", time_data, headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "_id" in data:
                self.time_entry_id = data["_id"]
                self.log_test("Time Entry Create", True, f"Time entry created with ID: {self.time_entry_id}")
                return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("Time Entry Create", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_time_entry_list(self):
        """Test time entry listing"""
        if not self.workspace_id:
            self.log_test("Time Entry List", False, "No workspace ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", f"/time-entries?workspace_id={self.workspace_id}", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Time Entry List", True, f"Retrieved {len(data)} time entries")
                return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("Time Entry List", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_time_entry_active(self):
        """Test active time entry"""
        headers = self.get_auth_headers()
        response = self.make_request("GET", "/time-entries/active", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Time Entry Active", True, f"Active time entry check successful")
            return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("Time Entry Active", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_time_entry_checkout(self):
        """Test time entry checkout"""
        if not self.time_entry_id:
            self.log_test("Time Entry Checkout", False, "No time entry ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("PUT", f"/time-entries/{self.time_entry_id}/checkout", headers=headers)
        
        if response and response.status_code == 200:
            self.log_test("Time Entry Checkout", True, "Time entry checked out successfully")
            return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("Time Entry Checkout", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_file_upload(self):
        """Test file upload"""
        if not self.workspace_id:
            self.log_test("File Upload", False, "No workspace ID available")
            return False
            
        import base64
        test_content = "This is a test file for AICO system"
        file_data = base64.b64encode(test_content.encode()).decode()
        
        file_upload_data = {
            "name": "test_document.txt",
            "file_data": file_data,
            "workspace_id": self.workspace_id,
            "project_id": self.project_id
        }
        
        headers = self.get_auth_headers()
        response = self.make_request("POST", "/files", file_upload_data, headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "_id" in data:
                self.file_id = data["_id"]
                self.log_test("File Upload", True, f"File uploaded with ID: {self.file_id}")
                return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("File Upload", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_file_list(self):
        """Test file listing"""
        if not self.workspace_id:
            self.log_test("File List", False, "No workspace ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", f"/files?workspace_id={self.workspace_id}", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("File List", True, f"Retrieved {len(data)} files")
                return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("File List", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_file_delete(self):
        """Test file deletion"""
        if not self.file_id:
            self.log_test("File Delete", False, "No file ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("DELETE", f"/files/{self.file_id}", headers=headers)
        
        if response and response.status_code == 200:
            self.log_test("File Delete", True, "File deleted successfully")
            return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("File Delete", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def test_search(self):
        """Test search functionality"""
        if not self.workspace_id:
            self.log_test("Search", False, "No workspace ID available")
            return False
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", f"/search?q=AICO&workspace_id={self.workspace_id}", headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if "projects" in data and "tasks" in data and "requests" in data:
                total_results = len(data["projects"]) + len(data["tasks"]) + len(data["requests"])
                self.log_test("Search", True, f"Search completed, found {total_results} total results")
                return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log_test("Search", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False
        
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 60)
        print("AICO Backend API Testing Suite")
        print("=" * 60)
        print(f"Testing backend at: {self.base_url}")
        print()
        
        # Authentication Tests
        print("🔐 AUTHENTICATION TESTS")
        print("-" * 30)
        self.test_auth_unauthorized()
        self.test_auth_signup()
        self.test_auth_login()
        self.test_auth_me()
        print()
        
        # Workspace Tests
        print("🏢 WORKSPACE TESTS")
        print("-" * 30)
        self.test_workspace_create()
        self.test_workspace_list()
        self.test_workspace_get()
        self.test_workspace_update()
        self.test_workspace_invite()
        print()
        
        # Project Tests
        print("📋 PROJECT TESTS")
        print("-" * 30)
        self.test_project_create()
        self.test_project_list()
        self.test_project_get()
        self.test_project_update()
        print()
        
        # Task Tests
        print("✅ TASK TESTS")
        print("-" * 30)
        self.test_task_create()
        self.test_task_list()
        self.test_task_update()
        print()
        
        # Request Tests
        print("📝 REQUEST TESTS")
        print("-" * 30)
        self.test_request_create()
        self.test_request_list()
        self.test_request_update()
        print()
        
        # Time Tracking Tests
        print("⏰ TIME TRACKING TESTS")
        print("-" * 30)
        self.test_time_entry_create()
        self.test_time_entry_list()
        self.test_time_entry_active()
        self.test_time_entry_checkout()
        print()
        
        # File Tests
        print("📁 FILE TESTS")
        print("-" * 30)
        self.test_file_upload()
        self.test_file_list()
        self.test_file_delete()
        print()
        
        # Comment Tests
        print("💬 COMMENT TESTS")
        print("-" * 30)
        self.test_comment_create()
        self.test_comment_list()
        print()
        
        # Search Tests
        print("🔍 SEARCH TESTS")
        print("-" * 30)
        self.test_search()
        print()
        
        # Team Tests
        print("👥 TEAM TESTS")
        print("-" * 30)
        self.test_team_get()
        print()
        
        # Analytics Tests
        print("📊 ANALYTICS TESTS")
        print("-" * 30)
        self.test_analytics_dashboard()
        print()
        
        # Notification Tests
        print("🔔 NOTIFICATION TESTS")
        print("-" * 30)
        self.test_notifications_list()
        print()
        
        # Cleanup Tests
        print("🗑️ CLEANUP TESTS")
        print("-" * 30)
        self.test_task_delete()
        self.test_project_delete()
        print()
        
        # Summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        print()
        
        if failed > 0:
            print("FAILED TESTS:")
            print("-" * 20)
            for result in self.test_results:
                if not result["success"]:
                    print(f"❌ {result['test']}: {result['details']}")
            print()
            
        print("PASSED TESTS:")
        print("-" * 20)
        for result in self.test_results:
            if result["success"]:
                print(f"✅ {result['test']}")
                
        return passed, failed

if __name__ == "__main__":
    tester = AICoAPITester()
    tester.run_all_tests()