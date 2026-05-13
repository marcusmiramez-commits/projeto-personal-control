#!/usr/bin/env python3
"""
Student Login Flow Testing
Tests the complete student login flow to diagnose the "Algo deu errado" error:

1. Test login endpoint for student
2. Test dashboard endpoint with token
3. Test all endpoints that StudentDashboard calls
4. Report exact error messages and stack traces
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://trainer-portal-demo.preview.emergentagent.com/api"

class StudentLoginTester:
    def __init__(self):
        self.session = requests.Session()
        self.student_token = None
        self.student_id = None
        self.professional_token = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def setup_professional(self):
        """Setup professional account for creating test students"""
        self.log("Setting up professional account...")
        
        # Try to login as professional
        login_data = {
            "email": "admin@test.com",
            "password": "admin123"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login/professional", json=login_data)
            
            if response.status_code == 401:
                # Register new professional
                register_data = {
                    "name": "Test Professional",
                    "email": "admin@test.com", 
                    "password": "admin123",
                    "phone": "+5511999999999"
                }
                
                register_response = self.session.post(f"{BACKEND_URL}/auth/register/professional", json=register_data)
                if register_response.status_code in [200, 201]:
                    result = register_response.json()
                    self.professional_token = result["access_token"]
                    self.log("Professional registered successfully")
                    return True
                else:
                    self.log(f"Professional registration failed: {register_response.status_code} - {register_response.text}", "ERROR")
                    return False
            elif response.status_code == 200:
                result = response.json()
                self.professional_token = result["access_token"]
                self.log("Professional logged in successfully")
                return True
            else:
                self.log(f"Professional login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Professional setup error: {str(e)}", "ERROR")
            return False
    
    def create_test_students(self):
        """Create test students with the exact credentials mentioned"""
        self.log("Creating test students...")
        
        students_to_create = [
            {
                "name": "Lucas Mapel",
                "email": "lucasmapel@gmail.com",
                "password": "123456",
                "phone": "+5511888888888",
                "age": 25,
                "goal": "Fitness",
                "contract_type": "prepaid",
                "class_value": 60.0,
                "class_balance": 10
            },
            {
                "name": "Leticia",
                "email": "leticia@test.com",
                "password": "leticia",
                "phone": "+5511777777777",
                "age": 28,
                "goal": "Weight loss",
                "contract_type": "monthly",
                "monthly_value": 150.0
            },
            {
                "name": "Cassio",
                "email": "cassio@test.com",
                "password": "cassio",
                "phone": "+5511666666666",
                "age": 30,
                "goal": "Muscle gain",
                "contract_type": "postpaid",
                "class_value": 50.0
            }
        ]
        
        headers = {"Authorization": f"Bearer {self.professional_token}"}
        
        for student_data in students_to_create:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/students", 
                    json=student_data, 
                    headers=headers
                )
                
                if response.status_code in [200, 201]:
                    result = response.json()
                    self.log(f"Created student: {result['name']} ({result['email']})")
                elif response.status_code == 400 and "Email already registered" in response.text:
                    self.log(f"Student {student_data['email']} already exists")
                else:
                    self.log(f"Failed to create student {student_data['email']}: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"Error creating student {student_data['email']}: {str(e)}", "ERROR")
        
        return True
    
    def test_student_login(self, email, password):
        """Test student login endpoint"""
        self.log(f"\n=== Testing Student Login: {email} ===")
        
        login_data = {
            "email": email,
            "password": password
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login/student", json=login_data)
            
            self.log(f"Login response status: {response.status_code}")
            self.log(f"Login response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"Login successful! Response: {json.dumps(result, indent=2)}")
                
                # Extract token and student info
                self.student_token = result.get("access_token")
                user_info = result.get("user", {})
                self.student_id = user_info.get("id")
                
                if not self.student_token:
                    self.log("ERROR: No access_token in login response", "ERROR")
                    return False
                
                if not self.student_id:
                    self.log("ERROR: No student ID in login response", "ERROR")
                    return False
                
                self.log(f"✅ Student login successful - Token: {self.student_token[:20]}...")
                self.log(f"Student ID: {self.student_id}")
                return True
            else:
                self.log(f"❌ Student login failed: {response.status_code}", "ERROR")
                self.log(f"Response body: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Student login exception: {str(e)}", "ERROR")
            return False
    
    def test_student_dashboard(self):
        """Test student dashboard endpoint"""
        self.log(f"\n=== Testing Student Dashboard ===")
        
        if not self.student_token:
            self.log("No student token available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/student", headers=headers)
            
            self.log(f"Dashboard response status: {response.status_code}")
            self.log(f"Dashboard response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ Dashboard successful! Response: {json.dumps(result, indent=2)}")
                return True
            else:
                self.log(f"❌ Dashboard failed: {response.status_code}", "ERROR")
                self.log(f"Response body: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Dashboard exception: {str(e)}", "ERROR")
            return False
    
    def test_workout_routines_endpoint(self):
        """Test workout routines endpoint"""
        self.log(f"\n=== Testing Workout Routines Endpoint ===")
        
        if not self.student_token or not self.student_id:
            self.log("No student token or ID available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/workout-routines/student/{self.student_id}", headers=headers)
            
            self.log(f"Workout routines response status: {response.status_code}")
            self.log(f"Workout routines response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ Workout routines successful! Response: {json.dumps(result, indent=2)}")
                return True
            else:
                self.log(f"❌ Workout routines failed: {response.status_code}", "ERROR")
                self.log(f"Response body: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Workout routines exception: {str(e)}", "ERROR")
            return False
    
    def test_attendance_endpoint(self):
        """Test attendance endpoint"""
        self.log(f"\n=== Testing Attendance Endpoint ===")
        
        if not self.student_token:
            self.log("No student token available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/attendance", headers=headers)
            
            self.log(f"Attendance response status: {response.status_code}")
            self.log(f"Attendance response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ Attendance successful! Response: {json.dumps(result, indent=2)}")
                return True
            else:
                self.log(f"❌ Attendance failed: {response.status_code}", "ERROR")
                self.log(f"Response body: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Attendance exception: {str(e)}", "ERROR")
            return False
    
    def test_payments_endpoint(self):
        """Test payments endpoint"""
        self.log(f"\n=== Testing Payments Endpoint ===")
        
        if not self.student_token:
            self.log("No student token available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/payments", headers=headers)
            
            self.log(f"Payments response status: {response.status_code}")
            self.log(f"Payments response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ Payments successful! Response: {json.dumps(result, indent=2)}")
                return True
            else:
                self.log(f"❌ Payments failed: {response.status_code}", "ERROR")
                self.log(f"Response body: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Payments exception: {str(e)}", "ERROR")
            return False
    
    def check_backend_logs(self):
        """Check backend logs for errors"""
        self.log(f"\n=== Checking Backend Logs ===")
        
        try:
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                self.log("Backend error logs:")
                self.log(result.stdout)
            else:
                self.log("Could not read backend error logs", "ERROR")
                
            # Also check stdout logs
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.out.log"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                self.log("Backend output logs:")
                self.log(result.stdout)
            else:
                self.log("Could not read backend output logs", "ERROR")
                
        except Exception as e:
            self.log(f"Error checking logs: {str(e)}", "ERROR")
    
    def run_complete_test(self):
        """Run complete student login flow test"""
        self.log("Starting Student Login Flow Test...")
        
        # Setup
        if not self.setup_professional():
            return False
        
        if not self.create_test_students():
            return False
        
        # Test credentials to try
        test_credentials = [
            ("lucasmapel@gmail.com", "123456"),
            ("leticia@test.com", "leticia"),
            ("cassio@test.com", "cassio")
        ]
        
        success_count = 0
        
        for email, password in test_credentials:
            self.log(f"\n{'='*60}")
            self.log(f"TESTING STUDENT: {email}")
            self.log(f"{'='*60}")
            
            # Test login
            if self.test_student_login(email, password):
                # Test all endpoints
                dashboard_ok = self.test_student_dashboard()
                workout_ok = self.test_workout_routines_endpoint()
                attendance_ok = self.test_attendance_endpoint()
                payments_ok = self.test_payments_endpoint()
                
                if dashboard_ok and workout_ok and attendance_ok and payments_ok:
                    self.log(f"✅ ALL TESTS PASSED for {email}")
                    success_count += 1
                else:
                    self.log(f"❌ SOME TESTS FAILED for {email}")
                    # Check logs for this specific failure
                    self.check_backend_logs()
            else:
                self.log(f"❌ LOGIN FAILED for {email}")
        
        # Final summary
        self.log(f"\n{'='*60}")
        self.log(f"FINAL SUMMARY")
        self.log(f"{'='*60}")
        self.log(f"Successful logins: {success_count}/{len(test_credentials)}")
        
        if success_count == 0:
            self.log("❌ ALL STUDENT LOGINS FAILED - CRITICAL ISSUE", "ERROR")
            self.check_backend_logs()
            return False
        elif success_count < len(test_credentials):
            self.log("⚠️  SOME STUDENT LOGINS FAILED", "ERROR")
            return False
        else:
            self.log("🎉 ALL STUDENT LOGINS SUCCESSFUL")
            return True

if __name__ == "__main__":
    tester = StudentLoginTester()
    success = tester.run_complete_test()
    sys.exit(0 if success else 1)