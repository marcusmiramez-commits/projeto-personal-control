#!/usr/bin/env python3
"""
Student Authentication and Dashboard Testing
Tests the student login and dashboard endpoints to verify they work correctly.

Test Scenarios:
1. Student Login with existing credentials
2. Student Dashboard Data retrieval
3. Workout Routines for Student
4. Attendance Data
5. Payments Data
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://fitness-manager-10.preview.emergentagent.com/api"

class StudentAuthDashboardTester:
    def __init__(self):
        self.student_token = None
        self.student_id = None
        self.student_data = None
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def get_student_headers(self):
        """Get authorization headers for student"""
        return {"Authorization": f"Bearer {self.student_token}"}
    
    def test_student_login(self):
        """Test Scenario 1: Student Login"""
        self.log("\n=== Test Scenario 1: Student Login ===")
        
        # Try existing student credentials
        test_credentials = [
            {"email": "joao@example.com", "password": "123456"},
            {"email": "lucasmapel@gmail.com", "password": "123456"},
            {"email": "joao@example.com", "password": "password"},
            {"email": "lucasmapel@gmail.com", "password": "password"},
            {"email": "joao@example.com", "password": "student123"},
            {"email": "lucasmapel@gmail.com", "password": "student123"}
        ]
        
        for credentials in test_credentials:
            self.log(f"Trying to login with email: {credentials['email']}")
            
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/auth/login/student", 
                    json=credentials
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.log("✅ Student login successful!")
                    self.log(f"Response: {json.dumps(result, indent=2)}")
                    
                    # Verify JWT token is returned
                    if "access_token" not in result:
                        self.log("❌ Missing access_token in response", "ERROR")
                        continue
                    
                    # Verify user object structure
                    if "user" not in result:
                        self.log("❌ Missing user object in response", "ERROR")
                        continue
                    
                    user = result["user"]
                    required_fields = ["id", "name", "email", "type", "professional_id"]
                    
                    for field in required_fields:
                        if field not in user:
                            self.log(f"❌ Missing field in user object: {field}", "ERROR")
                            continue
                    
                    # Verify user type is student
                    if user["type"] != "student":
                        self.log(f"❌ Expected user type 'student', got: {user['type']}", "ERROR")
                        continue
                    
                    # Store credentials for further tests
                    self.student_token = result["access_token"]
                    self.student_id = user["id"]
                    self.student_data = user
                    
                    self.log(f"✅ Student login test PASSED")
                    self.log(f"Student ID: {self.student_id}")
                    self.log(f"Student Name: {user['name']}")
                    self.log(f"Student Email: {user['email']}")
                    self.log(f"Professional ID: {user['professional_id']}")
                    return True
                    
                elif response.status_code == 401:
                    self.log(f"Login failed for {credentials['email']}: Invalid credentials")
                    continue
                else:
                    self.log(f"Login failed for {credentials['email']}: {response.status_code} - {response.text}")
                    continue
                    
            except Exception as e:
                self.log(f"Error during login attempt for {credentials['email']}: {str(e)}", "ERROR")
                continue
        
        self.log("❌ All login attempts failed", "ERROR")
        return False
    
    def test_student_dashboard_data(self):
        """Test Scenario 2: Student Dashboard Data"""
        self.log("\n=== Test Scenario 2: Student Dashboard Data ===")
        
        if not self.student_token:
            self.log("❌ No student token available", "ERROR")
            return False
        
        try:
            response = self.session.get(
                f"{BACKEND_URL}/dashboard/student",
                headers=self.get_student_headers()
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Student dashboard data retrieved successfully!")
                self.log(f"Response: {json.dumps(result, indent=2)}")
                
                # Verify response structure
                required_fields = ["student"]
                for field in required_fields:
                    if field not in result:
                        self.log(f"❌ Missing field in dashboard response: {field}", "ERROR")
                        return False
                
                student = result["student"]
                
                # Verify student object contains required fields for financial calculations
                financial_fields = ["name", "email", "contract_type"]
                for field in financial_fields:
                    if field not in student:
                        self.log(f"❌ Missing field in student object: {field}", "ERROR")
                        return False
                
                # Check contract-specific fields
                contract_type = student.get("contract_type")
                self.log(f"Student contract type: {contract_type}")
                
                if contract_type == "prepaid":
                    if "class_balance" not in student and "class_value" not in student:
                        self.log("❌ Prepaid student missing class_balance or class_value", "ERROR")
                        return False
                elif contract_type == "monthly":
                    if "monthly_value" not in student:
                        self.log("❌ Monthly student missing monthly_value", "ERROR")
                        return False
                elif contract_type == "postpaid":
                    if "class_value" not in student:
                        self.log("❌ Postpaid student missing class_value", "ERROR")
                        return False
                
                self.log("✅ Student dashboard data test PASSED")
                self.log(f"Contract Type: {contract_type}")
                self.log(f"Class Balance: {student.get('class_balance', 'N/A')}")
                self.log(f"Class Value: {student.get('class_value', 'N/A')}")
                self.log(f"Monthly Value: {student.get('monthly_value', 'N/A')}")
                return True
                
            else:
                self.log(f"❌ Dashboard data retrieval failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error retrieving dashboard data: {str(e)}", "ERROR")
            return False
    
    def test_workout_routines_for_student(self):
        """Test Scenario 3: Workout Routines for Student"""
        self.log("\n=== Test Scenario 3: Workout Routines for Student ===")
        
        if not self.student_token or not self.student_id:
            self.log("❌ No student token or ID available", "ERROR")
            return False
        
        try:
            response = self.session.get(
                f"{BACKEND_URL}/workout-routines/student/{self.student_id}",
                headers=self.get_student_headers()
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Workout routines retrieved successfully!")
                self.log(f"Number of routines: {len(result)}")
                
                # Verify routines array is returned
                if not isinstance(result, list):
                    self.log("❌ Expected routines array, got different type", "ERROR")
                    return False
                
                # Verify each routine has workouts array populated
                for i, routine in enumerate(result):
                    self.log(f"Routine {i+1}: {routine.get('routine_name', 'Unknown')}")
                    
                    if "workouts" not in routine:
                        self.log(f"❌ Routine {i+1} missing workouts array", "ERROR")
                        return False
                    
                    if not isinstance(routine["workouts"], list):
                        self.log(f"❌ Routine {i+1} workouts is not an array", "ERROR")
                        return False
                    
                    self.log(f"  - Workouts count: {len(routine['workouts'])}")
                    
                    # Log workout details if any
                    for j, workout in enumerate(routine["workouts"]):
                        workout_name = workout.get("workout_name", "Unknown")
                        division = workout.get("division", "Unknown")
                        exercises_count = len(workout.get("exercises", []))
                        self.log(f"    Workout {j+1}: {workout_name} ({division}) - {exercises_count} exercises")
                
                self.log("✅ Workout routines test PASSED")
                return True
                
            elif response.status_code == 403:
                self.log("❌ Access denied to workout routines", "ERROR")
                return False
            else:
                self.log(f"❌ Workout routines retrieval failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error retrieving workout routines: {str(e)}", "ERROR")
            return False
    
    def test_attendance_data(self):
        """Test Scenario 4: Attendance Data"""
        self.log("\n=== Test Scenario 4: Attendance Data ===")
        
        if not self.student_token:
            self.log("❌ No student token available", "ERROR")
            return False
        
        try:
            response = self.session.get(
                f"{BACKEND_URL}/attendance",
                headers=self.get_student_headers()
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Attendance data retrieved successfully!")
                self.log(f"Number of attendance records: {len(result)}")
                
                # Verify attendances array is returned
                if not isinstance(result, list):
                    self.log("❌ Expected attendances array, got different type", "ERROR")
                    return False
                
                # Verify each attendance has required fields
                present_count = 0
                absent_count = 0
                
                for i, attendance in enumerate(result):
                    required_fields = ["date", "present"]
                    for field in required_fields:
                        if field not in attendance:
                            self.log(f"❌ Attendance record {i+1} missing field: {field}", "ERROR")
                            return False
                    
                    if attendance["present"]:
                        present_count += 1
                    else:
                        absent_count += 1
                    
                    # Log recent attendance records
                    if i < 5:  # Show first 5 records
                        status = "Present" if attendance["present"] else "Absent"
                        self.log(f"  {attendance['date']}: {status}")
                
                self.log(f"Total Present: {present_count}")
                self.log(f"Total Absent: {absent_count}")
                self.log("✅ Attendance data test PASSED")
                return True
                
            else:
                self.log(f"❌ Attendance data retrieval failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error retrieving attendance data: {str(e)}", "ERROR")
            return False
    
    def test_payments_data(self):
        """Test Scenario 5: Payments Data"""
        self.log("\n=== Test Scenario 5: Payments Data ===")
        
        if not self.student_token:
            self.log("❌ No student token available", "ERROR")
            return False
        
        try:
            response = self.session.get(
                f"{BACKEND_URL}/payments",
                headers=self.get_student_headers()
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Payments data retrieved successfully!")
                self.log(f"Number of payment records: {len(result)}")
                
                # Verify payments array is returned
                if not isinstance(result, list):
                    self.log("❌ Expected payments array, got different type", "ERROR")
                    return False
                
                # Verify each payment has required fields
                total_amount = 0
                
                for i, payment in enumerate(result):
                    required_fields = ["status", "amount"]
                    for field in required_fields:
                        if field not in payment:
                            self.log(f"❌ Payment record {i+1} missing field: {field}", "ERROR")
                            return False
                    
                    total_amount += payment["amount"]
                    
                    # Log recent payment records
                    if i < 5:  # Show first 5 records
                        amount = payment["amount"]
                        status = payment["status"]
                        date = payment.get("payment_date", "Unknown")
                        self.log(f"  {date}: R$ {amount:.2f} ({status})")
                
                self.log(f"Total Payment Amount: R$ {total_amount:.2f}")
                self.log("✅ Payments data test PASSED")
                return True
                
            else:
                self.log(f"❌ Payments data retrieval failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error retrieving payments data: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all student authentication and dashboard tests"""
        self.log("Starting Student Authentication and Dashboard Tests...")
        
        # Define test scenarios
        tests = [
            ("Student Login", self.test_student_login),
            ("Student Dashboard Data", self.test_student_dashboard_data),
            ("Workout Routines for Student", self.test_workout_routines_for_student),
            ("Attendance Data", self.test_attendance_data),
            ("Payments Data", self.test_payments_data)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
                    self.log(f"❌ {test_name} FAILED", "ERROR")
            except Exception as e:
                failed += 1
                self.log(f"❌ {test_name} FAILED with exception: {str(e)}", "ERROR")
        
        # Summary
        self.log(f"\n=== TEST SUMMARY ===")
        self.log(f"Total tests: {passed + failed}")
        self.log(f"Passed: {passed}")
        self.log(f"Failed: {failed}")
        
        if failed == 0:
            self.log("🎉 ALL TESTS PASSED!")
            return True
        else:
            self.log(f"❌ {failed} TESTS FAILED")
            return False

if __name__ == "__main__":
    tester = StudentAuthDashboardTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)