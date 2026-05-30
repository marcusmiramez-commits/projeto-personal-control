#!/usr/bin/env python3
"""
Additional edge case tests for prepaid student class balance features
"""

import requests
import json
from datetime import datetime

BACKEND_URL = "https://plano-profissional.preview.emergentagent.com/api"

def test_edge_cases():
    """Test edge cases and error conditions"""
    
    # Login first
    login_data = {"email": "admin@test.com", "password": "admin123"}
    login_response = requests.post(f"{BACKEND_URL}/auth/login/professional", json=login_data)
    
    if login_response.status_code != 200:
        print("❌ Failed to login for edge case tests")
        return False
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("=== Testing Edge Cases ===")
    
    # Test 1: Payment with zero class_value (should not crash)
    print("\n1. Testing payment for student with zero class_value...")
    
    # Create student with zero class_value
    zero_value_student = {
        "name": "Zero Value Student",
        "email": "zero@test.com",
        "password": "test123",
        "phone": "+5511000000000",
        "contract_type": "prepaid",
        "class_value": 0.0,
        "class_balance": 0
    }
    
    try:
        student_response = requests.post(f"{BACKEND_URL}/students", json=zero_value_student, headers=headers)
        if student_response.status_code in [200, 201]:
            student_id = student_response.json()["id"]
            
            # Try payment
            payment_data = {
                "student_id": student_id,
                "amount": 100.0,
                "payment_date": datetime.now().strftime("%Y-%m-%d"),
                "reference_month": datetime.now().strftime("%Y-%m")
            }
            
            payment_response = requests.post(f"{BACKEND_URL}/payments", json=payment_data, headers=headers)
            if payment_response.status_code == 200:
                result = payment_response.json()
                if result.get("classes_added", 0) == 0:
                    print("✅ Zero class_value handled correctly (no division by zero)")
                else:
                    print(f"❌ Expected 0 classes added, got {result.get('classes_added')}")
            else:
                print(f"❌ Payment failed: {payment_response.status_code}")
        else:
            print("❌ Failed to create zero value student")
    except Exception as e:
        print(f"❌ Error in zero class_value test: {e}")
    
    # Test 2: Payment with fractional result
    print("\n2. Testing payment with fractional class calculation...")
    
    fractional_student = {
        "name": "Fractional Student", 
        "email": "fractional@test.com",
        "password": "test123",
        "phone": "+5511111111111",
        "contract_type": "prepaid",
        "class_value": 70.0,  # 500/70 = 7.14... should give 7 classes
        "class_balance": 0
    }
    
    try:
        student_response = requests.post(f"{BACKEND_URL}/students", json=fractional_student, headers=headers)
        if student_response.status_code in [200, 201]:
            student_id = student_response.json()["id"]
            
            payment_data = {
                "student_id": student_id,
                "amount": 500.0,
                "payment_date": datetime.now().strftime("%Y-%m-%d"),
                "reference_month": datetime.now().strftime("%Y-%m")
            }
            
            payment_response = requests.post(f"{BACKEND_URL}/payments", json=payment_data, headers=headers)
            if payment_response.status_code == 200:
                result = payment_response.json()
                expected_classes = int(500.0 / 70.0)  # Should be 7
                if result.get("classes_added") == expected_classes:
                    print(f"✅ Fractional calculation correct: {expected_classes} classes added")
                else:
                    print(f"❌ Expected {expected_classes} classes, got {result.get('classes_added')}")
            else:
                print(f"❌ Payment failed: {payment_response.status_code}")
        else:
            print("❌ Failed to create fractional student")
    except Exception as e:
        print(f"❌ Error in fractional test: {e}")
    
    # Test 3: Manual class addition with zero classes
    print("\n3. Testing manual class addition with zero classes...")
    
    try:
        # Get any prepaid student
        students_response = requests.get(f"{BACKEND_URL}/students", headers=headers)
        if students_response.status_code == 200:
            students = students_response.json()
            prepaid_student = None
            for student in students:
                if student.get("contract_type") == "prepaid":
                    prepaid_student = student
                    break
            
            if prepaid_student:
                zero_classes_data = {"classes": 0}
                response = requests.post(
                    f"{BACKEND_URL}/students/{prepaid_student['id']}/add-classes",
                    json=zero_classes_data,
                    headers=headers
                )
                
                if response.status_code == 400:
                    print("✅ Zero classes correctly rejected")
                else:
                    print(f"❌ Expected 400 error for zero classes, got {response.status_code}")
            else:
                print("❌ No prepaid student found for zero classes test")
        else:
            print("❌ Failed to get students for zero classes test")
    except Exception as e:
        print(f"❌ Error in zero classes test: {e}")
    
    # Test 4: Unauthorized access
    print("\n4. Testing unauthorized access...")
    
    try:
        # Try without token
        unauthorized_data = {"classes": 5}
        response = requests.post(f"{BACKEND_URL}/students/fake-id/add-classes", json=unauthorized_data)
        
        if response.status_code == 403 or response.status_code == 401:
            print("✅ Unauthorized access correctly rejected")
        else:
            print(f"❌ Expected 401/403 for unauthorized access, got {response.status_code}")
    except Exception as e:
        print(f"❌ Error in unauthorized test: {e}")
    
    print("\n=== Edge Case Tests Complete ===")
    return True

if __name__ == "__main__":
    test_edge_cases()