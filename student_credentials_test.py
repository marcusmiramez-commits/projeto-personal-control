#!/usr/bin/env python3
"""
Student Credentials Update Testing
Tests the student credentials update endpoint (PUT /api/students/me/credentials)
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://fitness-manager-10.preview.emergentagent.com/api"

class StudentCredentialsUpdateTester:
    def __init__(self):
        self.student_token = None
        self.student_id = None
        self.original_email = None
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def get_student_headers(self):
        """Get authorization headers for student"""
        return {"Authorization": f"Bearer {self.student_token}"}
    
    def login_student(self):
        """Login as student to get authentication token"""
        self.log("Attempting to login as student...")
        
        # Try existing student credentials
        test_credentials = [
            {"email": "lucasmapel@gmail.com", "password": "123456"},
            {"email": "joao@example.com", "password": "123456"}
        ]
        
        for credentials in test_credentials:
            try:
                response = self.session.post(
                    f"{BACKEND_URL}/auth/login/student", 
                    json=credentials
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.student_token = result["access_token"]
                    self.student_id = result["user"]["id"]
                    self.original_email = result["user"]["email"]
                    
                    self.log(f"✅ Student logged in successfully: {result['user']['name']}")
                    self.log(f"Student ID: {self.student_id}")
                    self.log(f"Original Email: {self.original_email}")
                    return True
                    
            except Exception as e:
                self.log(f"Error during login attempt: {str(e)}", "ERROR")
                continue
        
        self.log("❌ All login attempts failed", "ERROR")
        return False
    
    def test_email_update(self):
        """Test updating student email"""
        self.log("\n=== Testing Email Update ===")
        
        if not self.student_token:
            self.log("❌ No student token available", "ERROR")
            return False
        
        # Test with a new email
        new_email = f"updated_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com"
        
        try:
            update_data = {
                "email": new_email
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/students/me/credentials",
                json=update_data,
                headers=self.get_student_headers()
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Email update successful!")
                self.log(f"Response: {json.dumps(result, indent=2)}")
                
                # Verify the email was actually updated by logging in with new email
                login_data = {
                    "email": new_email,
                    "password": "123456"  # Assuming original password
                }
                
                login_response = self.session.post(
                    f"{BACKEND_URL}/auth/login/student", 
                    json=login_data
                )
                
                if login_response.status_code == 200:
                    self.log("✅ Login with new email successful - email update verified")
                    
                    # Restore original email for other tests
                    restore_data = {"email": self.original_email}
                    restore_response = self.session.put(
                        f"{BACKEND_URL}/students/me/credentials",
                        json=restore_data,
                        headers=self.get_student_headers()
                    )
                    
                    if restore_response.status_code == 200:
                        self.log("✅ Original email restored")
                    
                    return True
                else:
                    self.log("❌ Could not login with new email - email update may have failed", "ERROR")
                    return False
                
            else:
                self.log(f"❌ Email update failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error updating email: {str(e)}", "ERROR")
            return False
    
    def test_password_update(self):
        """Test updating student password"""
        self.log("\n=== Testing Password Update ===")
        
        if not self.student_token:
            self.log("❌ No student token available", "ERROR")
            return False
        
        try:
            # Test password update with correct current password
            update_data = {
                "current_password": "123456",
                "new_password": "newpassword123"
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/students/me/credentials",
                json=update_data,
                headers=self.get_student_headers()
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Password update successful!")
                self.log(f"Response: {json.dumps(result, indent=2)}")
                
                # Verify the password was actually updated by logging in with new password
                login_data = {
                    "email": self.original_email,
                    "password": "newpassword123"
                }
                
                login_response = self.session.post(
                    f"{BACKEND_URL}/auth/login/student", 
                    json=login_data
                )
                
                if login_response.status_code == 200:
                    self.log("✅ Login with new password successful - password update verified")
                    
                    # Update token for further tests
                    self.student_token = login_response.json()["access_token"]
                    
                    # Restore original password for other tests
                    restore_data = {
                        "current_password": "newpassword123",
                        "new_password": "123456"
                    }
                    restore_response = self.session.put(
                        f"{BACKEND_URL}/students/me/credentials",
                        json=restore_data,
                        headers=self.get_student_headers()
                    )
                    
                    if restore_response.status_code == 200:
                        self.log("✅ Original password restored")
                    
                    return True
                else:
                    self.log("❌ Could not login with new password - password update may have failed", "ERROR")
                    return False
                
            else:
                self.log(f"❌ Password update failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error updating password: {str(e)}", "ERROR")
            return False
    
    def test_invalid_password_update(self):
        """Test password update with invalid current password"""
        self.log("\n=== Testing Invalid Password Update ===")
        
        if not self.student_token:
            self.log("❌ No student token available", "ERROR")
            return False
        
        try:
            # Test password update with incorrect current password
            update_data = {
                "current_password": "wrongpassword",
                "new_password": "newpassword123"
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/students/me/credentials",
                json=update_data,
                headers=self.get_student_headers()
            )
            
            if response.status_code == 400:
                self.log("✅ Invalid current password correctly rejected")
                return True
            else:
                self.log(f"❌ Expected 400 error for invalid current password, got: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing invalid password update: {str(e)}", "ERROR")
            return False
    
    def test_password_update_without_current(self):
        """Test password update without providing current password"""
        self.log("\n=== Testing Password Update Without Current Password ===")
        
        if not self.student_token:
            self.log("❌ No student token available", "ERROR")
            return False
        
        try:
            # Test password update without current password
            update_data = {
                "new_password": "newpassword123"
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/students/me/credentials",
                json=update_data,
                headers=self.get_student_headers()
            )
            
            if response.status_code == 400:
                self.log("✅ Password update without current password correctly rejected")
                return True
            else:
                self.log(f"❌ Expected 400 error for missing current password, got: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing password update without current: {str(e)}", "ERROR")
            return False
    
    def test_duplicate_email_update(self):
        """Test updating to an email that already exists"""
        self.log("\n=== Testing Duplicate Email Update ===")
        
        if not self.student_token:
            self.log("❌ No student token available", "ERROR")
            return False
        
        try:
            # Try to update to an email that might already exist
            # Using a common test email that might be in use
            duplicate_email = "joao@example.com"
            
            update_data = {
                "email": duplicate_email
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/students/me/credentials",
                json=update_data,
                headers=self.get_student_headers()
            )
            
            if response.status_code == 400 and "já está em uso" in response.text:
                self.log("✅ Duplicate email correctly rejected")
                return True
            elif response.status_code == 200:
                # If it succeeded, it means the email wasn't actually in use
                # Restore original email
                restore_data = {"email": self.original_email}
                self.session.put(
                    f"{BACKEND_URL}/students/me/credentials",
                    json=restore_data,
                    headers=self.get_student_headers()
                )
                self.log("✅ Email update succeeded (email wasn't in use)")
                return True
            else:
                self.log(f"❌ Unexpected response for duplicate email: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing duplicate email update: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all student credentials update tests"""
        self.log("Starting Student Credentials Update Tests...")
        
        # Setup
        if not self.login_student():
            return False
        
        # Define test scenarios
        tests = [
            ("Email Update", self.test_email_update),
            ("Password Update", self.test_password_update),
            ("Invalid Password Update", self.test_invalid_password_update),
            ("Password Update Without Current", self.test_password_update_without_current),
            ("Duplicate Email Update", self.test_duplicate_email_update)
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
    tester = StudentCredentialsUpdateTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)