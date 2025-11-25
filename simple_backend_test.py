#!/usr/bin/env python3
"""
Simple AICO Backend API Test
"""

import requests
import json
import time

BACKEND_URL = "https://dualslack.preview.emergentagent.com/api"

def test_backend():
    print("=" * 60)
    print("AICO Backend API Simple Test")
    print("=" * 60)
    
    results = []
    
    # Test 1: Unauthorized access
    print("1. Testing unauthorized access...")
    try:
        response = requests.get(f"{BACKEND_URL}/user/me", timeout=10)
        if response.status_code in [401, 403]:
            print("✅ PASS: Unauthorized access correctly rejected")
            results.append(("Unauthorized Access", True))
        else:
            print(f"❌ FAIL: Expected 401/403, got {response.status_code}")
            results.append(("Unauthorized Access", False))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("Unauthorized Access", False))
    
    # Test 2: User signup
    print("2. Testing user signup...")
    user_data = {
        "email": f"testuser{int(time.time())}@aico.com",
        "password": "SecurePass123!",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/signup", json=user_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            token = data["token"]
            user_id = data["user"]["_id"]
            print("✅ PASS: User signup successful")
            results.append(("User Signup", True))
        else:
            print(f"❌ FAIL: Signup failed with status {response.status_code}: {response.text}")
            results.append(("User Signup", False))
            return results
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("User Signup", False))
        return results
    
    # Test 3: User login
    print("3. Testing user login...")
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            token = data["token"]
            print("✅ PASS: User login successful")
            results.append(("User Login", True))
        else:
            print(f"❌ FAIL: Login failed with status {response.status_code}: {response.text}")
            results.append(("User Login", False))
            return results
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("User Login", False))
        return results
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 4: Get current user
    print("4. Testing get current user...")
    try:
        response = requests.get(f"{BACKEND_URL}/user/me", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Retrieved user data for {data['email']}")
            results.append(("Get Current User", True))
        else:
            print(f"❌ FAIL: Get user failed with status {response.status_code}: {response.text}")
            results.append(("Get Current User", False))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("Get Current User", False))
    
    # Test 5: Create workspace
    print("5. Testing workspace creation...")
    workspace_data = {
        "name": "Test Workspace",
        "description": "Test workspace for API testing"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/workspaces", json=workspace_data, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            workspace_id = data["_id"]
            print(f"✅ PASS: Workspace created with ID {workspace_id}")
            results.append(("Create Workspace", True))
        else:
            print(f"❌ FAIL: Workspace creation failed with status {response.status_code}: {response.text}")
            results.append(("Create Workspace", False))
            return results
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("Create Workspace", False))
        return results
    
    # Test 6: List workspaces
    print("6. Testing workspace listing...")
    try:
        response = requests.get(f"{BACKEND_URL}/workspaces", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Retrieved {len(data)} workspaces")
            results.append(("List Workspaces", True))
        else:
            print(f"❌ FAIL: Workspace listing failed with status {response.status_code}: {response.text}")
            results.append(("List Workspaces", False))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("List Workspaces", False))
    
    # Test 7: Create project
    print("7. Testing project creation...")
    project_data = {
        "name": "Test Project",
        "description": "Test project for API testing",
        "workspace_id": workspace_id,
        "status": "in_progress",
        "assigned_to": [user_id]
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/projects", json=project_data, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            project_id = data["_id"]
            print(f"✅ PASS: Project created with ID {project_id}")
            results.append(("Create Project", True))
        else:
            print(f"❌ FAIL: Project creation failed with status {response.status_code}: {response.text}")
            results.append(("Create Project", False))
            return results
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("Create Project", False))
        return results
    
    # Test 8: List projects
    print("8. Testing project listing...")
    try:
        response = requests.get(f"{BACKEND_URL}/projects?workspace_id={workspace_id}", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Retrieved {len(data)} projects")
            results.append(("List Projects", True))
        else:
            print(f"❌ FAIL: Project listing failed with status {response.status_code}: {response.text}")
            results.append(("List Projects", False))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("List Projects", False))
    
    # Test 9: Create task
    print("9. Testing task creation...")
    task_data = {
        "title": "Test Task",
        "description": "Test task for API testing",
        "project_id": project_id,
        "status": "todo",
        "priority": "medium",
        "assigned_to": user_id
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/tasks", json=task_data, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            task_id = data["_id"]
            print(f"✅ PASS: Task created with ID {task_id}")
            results.append(("Create Task", True))
        else:
            print(f"❌ FAIL: Task creation failed with status {response.status_code}: {response.text}")
            results.append(("Create Task", False))
            return results
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("Create Task", False))
        return results
    
    # Test 10: List tasks
    print("10. Testing task listing...")
    try:
        response = requests.get(f"{BACKEND_URL}/tasks?project_id={project_id}", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Retrieved {len(data)} tasks")
            results.append(("List Tasks", True))
        else:
            print(f"❌ FAIL: Task listing failed with status {response.status_code}: {response.text}")
            results.append(("List Tasks", False))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("List Tasks", False))
    
    # Test 11: Get team members
    print("11. Testing team listing...")
    try:
        response = requests.get(f"{BACKEND_URL}/team?workspace_id={workspace_id}", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS: Retrieved {len(data)} team members")
            results.append(("List Team", True))
        else:
            print(f"❌ FAIL: Team listing failed with status {response.status_code}: {response.text}")
            results.append(("List Team", False))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("List Team", False))
    
    # Test 12: Get analytics
    print("12. Testing analytics dashboard...")
    try:
        response = requests.get(f"{BACKEND_URL}/analytics/dashboard?workspace_id={workspace_id}", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            expected_keys = ["total_projects", "active_projects", "completed_projects", "total_tasks"]
            if all(key in data for key in expected_keys):
                print("✅ PASS: Analytics dashboard data retrieved")
                results.append(("Analytics Dashboard", True))
            else:
                print("❌ FAIL: Missing expected analytics keys")
                results.append(("Analytics Dashboard", False))
        else:
            print(f"❌ FAIL: Analytics failed with status {response.status_code}: {response.text}")
            results.append(("Analytics Dashboard", False))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("Analytics Dashboard", False))
    
    # Test 13: Update task
    print("13. Testing task update...")
    update_task_data = {
        "title": "Updated Test Task",
        "description": "Updated test task description",
        "project_id": project_id,
        "status": "done",
        "priority": "high",
        "assigned_to": user_id
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/tasks/{task_id}", json=update_task_data, headers=headers, timeout=10)
        if response.status_code == 200:
            print("✅ PASS: Task updated successfully")
            results.append(("Update Task", True))
        else:
            print(f"❌ FAIL: Task update failed with status {response.status_code}: {response.text}")
            results.append(("Update Task", False))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("Update Task", False))
    
    # Test 14: Delete task
    print("14. Testing task deletion...")
    try:
        response = requests.delete(f"{BACKEND_URL}/tasks/{task_id}", headers=headers, timeout=10)
        if response.status_code == 200:
            print("✅ PASS: Task deleted successfully")
            results.append(("Delete Task", True))
        else:
            print(f"❌ FAIL: Task deletion failed with status {response.status_code}: {response.text}")
            results.append(("Delete Task", False))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("Delete Task", False))
    
    # Test 15: Delete project
    print("15. Testing project deletion...")
    try:
        response = requests.delete(f"{BACKEND_URL}/projects/{project_id}", headers=headers, timeout=10)
        if response.status_code == 200:
            print("✅ PASS: Project deleted successfully")
            results.append(("Delete Project", True))
        else:
            print(f"❌ FAIL: Project deletion failed with status {response.status_code}: {response.text}")
            results.append(("Delete Project", False))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("Delete Project", False))
    
    return results

if __name__ == "__main__":
    results = test_backend()
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if total - passed > 0:
        print("\nFAILED TESTS:")
        for test_name, success in results:
            if not success:
                print(f"❌ {test_name}")
    
    print("\nPASSED TESTS:")
    for test_name, success in results:
        if success:
            print(f"✅ {test_name}")