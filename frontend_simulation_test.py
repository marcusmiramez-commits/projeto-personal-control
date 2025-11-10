#!/usr/bin/env python3
"""
Frontend Simulation Test
Simulates the exact frontend behavior to identify the "Algo deu errado" error
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://fit-management.preview.emergentagent.com/api"

class FrontendSimulationTester:
    def __init__(self):
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def simulate_student_login_flow(self, email, password):
        """Simulate the exact student login flow as done by frontend"""
        self.log(f"\n=== SIMULATING FRONTEND LOGIN FLOW FOR: {email} ===")
        
        # Step 1: Login (exactly as frontend does)
        self.log("Step 1: Student Login")
        login_data = {
            "email": email.strip().lower(),  # Frontend does this
            "password": password
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login/student", json=login_data)
            
            if response.status_code != 200:
                self.log(f"❌ LOGIN FAILED: {response.status_code} - {response.text}", "ERROR")
                return False
            
            result = response.json()
            if not result.get("access_token") or not result.get("user"):
                self.log("❌ LOGIN RESPONSE INVALID: Missing token or user data", "ERROR")
                return False
            
            token = result["access_token"]
            user = result["user"]
            user_id = user["id"]
            
            self.log(f"✅ Login successful for {user['name']} (ID: {user_id})")
            
            # Step 2: Simulate StudentDashboard useEffect - fetch all data in parallel
            self.log("Step 2: Fetching StudentDashboard data (parallel requests)")
            
            headers = {"Authorization": f"Bearer {token}"}
            
            # These are the exact requests made by StudentDashboard useEffect
            requests_to_make = [
                ("Dashboard", f"{BACKEND_URL}/dashboard/student"),
                ("Workout Routines", f"{BACKEND_URL}/workout-routines/student/{user_id}"),
                ("Attendance", f"{BACKEND_URL}/attendance"),
                ("Payments", f"{BACKEND_URL}/payments")
            ]
            
            all_success = True
            responses = {}
            
            for name, url in requests_to_make:
                try:
                    self.log(f"  Fetching {name}: {url}")
                    resp = self.session.get(url, headers=headers)
                    
                    if resp.status_code == 200:
                        data = resp.json()
                        responses[name] = data
                        self.log(f"  ✅ {name}: Success ({len(str(data))} chars)")
                    else:
                        self.log(f"  ❌ {name}: Failed {resp.status_code} - {resp.text}", "ERROR")
                        all_success = False
                        
                except Exception as e:
                    self.log(f"  ❌ {name}: Exception - {str(e)}", "ERROR")
                    all_success = False
            
            if all_success:
                self.log("✅ ALL DASHBOARD REQUESTS SUCCESSFUL")
                
                # Step 3: Validate data structure (as frontend would)
                self.log("Step 3: Validating data structure")
                
                dashboard_data = responses.get("Dashboard", {})
                student_data = dashboard_data.get("student")
                
                if not student_data:
                    self.log("❌ VALIDATION FAILED: No student data in dashboard response", "ERROR")
                    return False
                
                # Check required fields that frontend uses
                required_fields = ["id", "name", "email", "contract_type"]
                for field in required_fields:
                    if field not in student_data:
                        self.log(f"❌ VALIDATION FAILED: Missing field '{field}' in student data", "ERROR")
                        return False
                
                self.log("✅ Data structure validation passed")
                
                # Step 4: Simulate contract-specific calculations
                self.log("Step 4: Simulating contract-specific calculations")
                
                contract_type = student_data.get("contract_type")
                self.log(f"  Contract type: {contract_type}")
                
                # Simulate the financial calculations that frontend does
                attendances = responses.get("Attendance", [])
                payments = responses.get("Payments", [])
                
                current_month = datetime.now().strftime("%Y-%m")
                month_attendances = [a for a in attendances if a.get("date", "").startswith(current_month)]
                present_count = len([a for a in month_attendances if a.get("present")])
                
                self.log(f"  Month attendances: {len(month_attendances)}")
                self.log(f"  Present count: {present_count}")
                
                if contract_type == "prepaid":
                    class_balance = student_data.get("class_balance", 0)
                    self.log(f"  Class balance: {class_balance}")
                elif contract_type == "postpaid":
                    class_value = student_data.get("class_value", 0)
                    amount_to_pay = present_count * class_value
                    self.log(f"  Class value: {class_value}")
                    self.log(f"  Amount to pay: {amount_to_pay}")
                elif contract_type == "monthly":
                    monthly_value = student_data.get("monthly_value", 0)
                    self.log(f"  Monthly value: {monthly_value}")
                
                self.log("✅ Contract calculations completed successfully")
                
                # Step 5: Check for any potential null/undefined issues
                self.log("Step 5: Checking for potential null/undefined issues")
                
                potential_issues = []
                
                # Check for null values that might cause frontend errors
                if student_data.get("age") is None:
                    potential_issues.append("age is null")
                if student_data.get("goal") is None:
                    potential_issues.append("goal is null")
                if student_data.get("anamnesis") is None:
                    potential_issues.append("anamnesis is null")
                if student_data.get("observations") is None:
                    potential_issues.append("observations is null")
                if student_data.get("photo_url") is None:
                    potential_issues.append("photo_url is null")
                
                if potential_issues:
                    self.log(f"  ⚠️  Potential null value issues: {', '.join(potential_issues)}")
                else:
                    self.log("  ✅ No null value issues detected")
                
                return True
            else:
                self.log("❌ SOME DASHBOARD REQUESTS FAILED", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ SIMULATION EXCEPTION: {str(e)}", "ERROR")
            return False
    
    def test_edge_cases(self):
        """Test edge cases that might cause frontend errors"""
        self.log("\n=== TESTING EDGE CASES ===")
        
        # Test with invalid token
        self.log("Testing with invalid token...")
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/student", 
                                      headers={"Authorization": "Bearer invalid_token"})
            self.log(f"Invalid token response: {response.status_code}")
        except Exception as e:
            self.log(f"Invalid token exception: {str(e)}")
        
        # Test with malformed requests
        self.log("Testing malformed requests...")
        try:
            response = self.session.get(f"{BACKEND_URL}/workout-routines/student/invalid_id")
            self.log(f"Invalid student ID response: {response.status_code}")
        except Exception as e:
            self.log(f"Invalid student ID exception: {str(e)}")
    
    def run_comprehensive_test(self):
        """Run comprehensive test of student login flow"""
        self.log("Starting Comprehensive Frontend Simulation Test...")
        
        # Test credentials
        test_credentials = [
            ("lucasmapel@gmail.com", "123456"),
            ("leticia@test.com", "leticia"),
            ("cassio@test.com", "cassio")
        ]
        
        success_count = 0
        
        for email, password in test_credentials:
            if self.simulate_student_login_flow(email, password):
                success_count += 1
        
        # Test edge cases
        self.test_edge_cases()
        
        # Final summary
        self.log(f"\n{'='*60}")
        self.log(f"COMPREHENSIVE TEST SUMMARY")
        self.log(f"{'='*60}")
        self.log(f"Successful simulations: {success_count}/{len(test_credentials)}")
        
        if success_count == len(test_credentials):
            self.log("🎉 ALL FRONTEND SIMULATIONS SUCCESSFUL")
            self.log("✅ BACKEND APIs ARE WORKING CORRECTLY")
            self.log("⚠️  'Algo deu errado' error is likely a FRONTEND-SPECIFIC issue")
            self.log("💡 Possible causes:")
            self.log("   - JavaScript runtime errors")
            self.log("   - React component rendering issues")
            self.log("   - State management problems")
            self.log("   - Browser-specific issues")
            self.log("   - Network connectivity issues from browser")
            return True
        else:
            self.log("❌ SOME SIMULATIONS FAILED - BACKEND ISSUES DETECTED")
            return False

if __name__ == "__main__":
    tester = FrontendSimulationTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)