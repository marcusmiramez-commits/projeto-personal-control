#!/usr/bin/env python3
"""
Backend API Testing for Prepaid Student Class Balance Features
Tests the new features:
1. Auto-update class balance on payment registration
2. Manual class addition endpoint
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://trainer-hub-47.preview.emergentagent.com/api"

class TrainerHubTester:
    def __init__(self):
        self.token = None
        self.professional_id = None
        self.test_student_id = None
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def login_professional(self):
        """Login as a professional to get authentication token"""
        self.log("Attempting to login as professional...")
        
        # First, let's try to get existing professionals
        try:
            # Try with a common test email first
            login_data = {
                "email": "admin@test.com",
                "password": "admin123"
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/login/professional", json=login_data)
            
            if response.status_code == 401:
                # Try to register a new professional if login fails
                self.log("Login failed, attempting to register new professional...")
                register_data = {
                    "name": "Test Professional",
                    "email": "admin@test.com", 
                    "password": "admin123",
                    "phone": "+5511999999999"
                }
                
                register_response = self.session.post(f"{BACKEND_URL}/auth/register/professional", json=register_data)
                if register_response.status_code == 201 or register_response.status_code == 200:
                    result = register_response.json()
                    self.token = result["access_token"]
                    self.professional_id = result["user"]["id"]
                    self.log(f"Professional registered successfully: {result['user']['name']}")
                    return True
                else:
                    self.log(f"Registration failed: {register_response.status_code} - {register_response.text}", "ERROR")
                    return False
            elif response.status_code == 200:
                result = response.json()
                self.token = result["access_token"]
                self.professional_id = result["user"]["id"]
                self.log(f"Professional logged in successfully: {result['user']['name']}")
                return True
            else:
                self.log(f"Login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Login error: {str(e)}", "ERROR")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def create_prepaid_student(self):
        """Create or find a prepaid student for testing"""
        self.log("Creating prepaid student for testing...")
        
        student_data = {
            "name": "Maria Silva",
            "email": "maria.silva@test.com",
            "password": "student123",
            "phone": "+5511888888888",
            "age": 25,
            "goal": "Perda de peso",
            "contract_type": "prepaid",
            "class_value": 60.0,
            "class_balance": 5
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/students", 
                json=student_data, 
                headers=self.get_headers()
            )
            
            if response.status_code == 200 or response.status_code == 201:
                result = response.json()
                self.test_student_id = result["id"]
                self.log(f"Prepaid student created: {result['name']} (ID: {self.test_student_id})")
                self.log(f"Initial class balance: {result['class_balance']}")
                return True
            elif response.status_code == 400 and "Email already registered" in response.text:
                # Student already exists, try to find them
                self.log("Student email already exists, fetching existing student...")
                return self.find_existing_prepaid_student()
            else:
                self.log(f"Failed to create student: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Error creating student: {str(e)}", "ERROR")
            return False
    
    def find_existing_prepaid_student(self):
        """Find an existing prepaid student"""
        try:
            response = self.session.get(f"{BACKEND_URL}/students", headers=self.get_headers())
            
            if response.status_code == 200:
                students = response.json()
                for student in students:
                    if student.get("contract_type") == "prepaid" and student.get("class_value") == 60.0:
                        self.test_student_id = student["id"]
                        self.log(f"Found existing prepaid student: {student['name']} (ID: {self.test_student_id})")
                        self.log(f"Current class balance: {student.get('class_balance', 0)}")
                        return True
                
                # If no prepaid student found, use the first student and update them
                if students:
                    student = students[0]
                    self.test_student_id = student["id"]
                    
                    # Update to prepaid
                    update_data = {
                        "contract_type": "prepaid",
                        "class_value": 60.0,
                        "class_balance": 5
                    }
                    
                    update_response = self.session.put(
                        f"{BACKEND_URL}/students/{self.test_student_id}",
                        json=update_data,
                        headers=self.get_headers()
                    )
                    
                    if update_response.status_code == 200:
                        self.log(f"Updated student to prepaid: {student['name']}")
                        return True
                        
            return False
            
        except Exception as e:
            self.log(f"Error finding student: {str(e)}", "ERROR")
            return False
    
    def get_student_balance(self):
        """Get current student balance"""
        try:
            response = self.session.get(
                f"{BACKEND_URL}/students/{self.test_student_id}",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                student = response.json()
                return student.get("class_balance", 0)
            else:
                self.log(f"Failed to get student: {response.status_code}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"Error getting student balance: {str(e)}", "ERROR")
            return None
    
    def test_manual_class_addition(self):
        """Test manual class addition endpoint"""
        self.log("\n=== Testing Manual Class Addition ===")
        
        # Get initial balance
        initial_balance = self.get_student_balance()
        if initial_balance is None:
            self.log("Failed to get initial balance", "ERROR")
            return False
            
        self.log(f"Initial balance: {initial_balance}")
        
        # Test adding 5 classes
        add_classes_data = {"classes": 5}
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/students/{self.test_student_id}/add-classes",
                json=add_classes_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log("Manual class addition successful!")
                self.log(f"Response: {json.dumps(result, indent=2)}")
                
                # Verify response structure
                expected_keys = ["message", "previous_balance", "new_balance", "classes_added"]
                for key in expected_keys:
                    if key not in result:
                        self.log(f"Missing key in response: {key}", "ERROR")
                        return False
                
                # Verify values
                if result["previous_balance"] != initial_balance:
                    self.log(f"Previous balance mismatch: expected {initial_balance}, got {result['previous_balance']}", "ERROR")
                    return False
                
                if result["classes_added"] != 5:
                    self.log(f"Classes added mismatch: expected 5, got {result['classes_added']}", "ERROR")
                    return False
                
                if result["new_balance"] != initial_balance + 5:
                    self.log(f"New balance mismatch: expected {initial_balance + 5}, got {result['new_balance']}", "ERROR")
                    return False
                
                # Verify actual student balance
                current_balance = self.get_student_balance()
                if current_balance != result["new_balance"]:
                    self.log(f"Student balance not updated correctly: expected {result['new_balance']}, got {current_balance}", "ERROR")
                    return False
                
                self.log("✅ Manual class addition test PASSED")
                return True
                
            else:
                self.log(f"Manual class addition failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Error testing manual class addition: {str(e)}", "ERROR")
            return False
    
    def test_invalid_manual_class_addition(self):
        """Test manual class addition with invalid data"""
        self.log("\n=== Testing Invalid Manual Class Addition ===")
        
        # Test with negative classes
        invalid_data = {"classes": -5}
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/students/{self.test_student_id}/add-classes",
                json=invalid_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 400:
                self.log("✅ Negative classes correctly rejected")
                return True
            else:
                self.log(f"Expected 400 error for negative classes, got: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Error testing invalid manual class addition: {str(e)}", "ERROR")
            return False
    
    def test_payment_auto_class_addition(self):
        """Test automatic class addition via payment"""
        self.log("\n=== Testing Payment Auto Class Addition ===")
        
        # Get initial balance
        initial_balance = self.get_student_balance()
        if initial_balance is None:
            self.log("Failed to get initial balance", "ERROR")
            return False
            
        self.log(f"Initial balance: {initial_balance}")
        
        # Create payment of R$ 600.00 (should add 10 classes at R$ 60.00 each)
        payment_data = {
            "student_id": self.test_student_id,
            "amount": 600.0,
            "payment_date": datetime.now().strftime("%Y-%m-%d"),
            "reference_month": datetime.now().strftime("%Y-%m"),
            "payment_method": "credit_card"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/payments",
                json=payment_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log("Payment creation successful!")
                self.log(f"Response: {json.dumps(result, indent=2)}")
                
                # Verify response contains classes_added
                if "classes_added" not in result:
                    self.log("Missing 'classes_added' in payment response", "ERROR")
                    return False
                
                if "message" not in result:
                    self.log("Missing 'message' in payment response", "ERROR")
                    return False
                
                # Verify classes calculation (600 / 60 = 10)
                expected_classes = 10
                if result["classes_added"] != expected_classes:
                    self.log(f"Classes added mismatch: expected {expected_classes}, got {result['classes_added']}", "ERROR")
                    return False
                
                # Verify student balance was updated
                current_balance = self.get_student_balance()
                expected_balance = initial_balance + expected_classes
                if current_balance != expected_balance:
                    self.log(f"Student balance not updated correctly: expected {expected_balance}, got {current_balance}", "ERROR")
                    return False
                
                self.log("✅ Payment auto class addition test PASSED")
                return True
                
            else:
                self.log(f"Payment creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Error testing payment auto class addition: {str(e)}", "ERROR")
            return False
    
    def test_payment_non_prepaid_student(self):
        """Test payment for non-prepaid student (should not add classes)"""
        self.log("\n=== Testing Payment for Non-Prepaid Student ===")
        
        # Create a monthly student
        monthly_student_data = {
            "name": "João Santos",
            "email": "joao.santos@test.com",
            "password": "student123",
            "phone": "+5511777777777",
            "contract_type": "monthly",
            "monthly_value": 150.0
        }
        
        try:
            # Create monthly student
            response = self.session.post(
                f"{BACKEND_URL}/students", 
                json=monthly_student_data, 
                headers=self.get_headers()
            )
            
            monthly_student_id = None
            if response.status_code in [200, 201]:
                monthly_student_id = response.json()["id"]
            elif response.status_code == 400 and "Email already registered" in response.text:
                # Find existing monthly student
                students_response = self.session.get(f"{BACKEND_URL}/students", headers=self.get_headers())
                if students_response.status_code == 200:
                    students = students_response.json()
                    for student in students:
                        if student.get("contract_type") == "monthly":
                            monthly_student_id = student["id"]
                            break
            
            if not monthly_student_id:
                self.log("Could not create or find monthly student", "ERROR")
                return False
            
            # Create payment for monthly student
            payment_data = {
                "student_id": monthly_student_id,
                "amount": 150.0,
                "payment_date": datetime.now().strftime("%Y-%m-%d"),
                "reference_month": datetime.now().strftime("%Y-%m"),
                "payment_method": "cash"
            }
            
            payment_response = self.session.post(
                f"{BACKEND_URL}/payments",
                json=payment_data,
                headers=self.get_headers()
            )
            
            if payment_response.status_code == 200:
                result = payment_response.json()
                
                # Verify no classes were added
                if result.get("classes_added", 0) != 0:
                    self.log(f"Classes should not be added for monthly student, but got: {result['classes_added']}", "ERROR")
                    return False
                
                self.log("✅ Payment for non-prepaid student correctly handled (no classes added)")
                return True
            else:
                self.log(f"Payment for monthly student failed: {payment_response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Error testing payment for non-prepaid student: {str(e)}", "ERROR")
            return False
    
    def verify_final_balance(self):
        """Verify final student balance"""
        self.log("\n=== Verifying Final Balance ===")
        
        current_balance = self.get_student_balance()
        if current_balance is None:
            self.log("Failed to get final balance", "ERROR")
            return False
        
        # Expected: initial 5 + manual 5 + payment 10 = 20
        expected_balance = 20
        if current_balance == expected_balance:
            self.log(f"✅ Final balance correct: {current_balance}")
            return True
        else:
            self.log(f"❌ Final balance incorrect: expected {expected_balance}, got {current_balance}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        self.log("Starting Prepaid Student Class Balance Tests...")
        
        # Setup
        if not self.login_professional():
            return False
        
        if not self.create_prepaid_student():
            return False
        
        # Run tests
        tests = [
            ("Manual Class Addition", self.test_manual_class_addition),
            ("Invalid Manual Class Addition", self.test_invalid_manual_class_addition),
            ("Payment Auto Class Addition", self.test_payment_auto_class_addition),
            ("Payment Non-Prepaid Student", self.test_payment_non_prepaid_student),
            ("Final Balance Verification", self.verify_final_balance)
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
    tester = TrainerHubTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)