import requests
import sys
import json
from datetime import datetime, timedelta

class SmartInterviewPlatformTester:
    def __init__(self, base_url="https://interview-smart.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'users': [],
            'candidates': [],
            'interviews': [],
            'feedbacks': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        return success

    def test_register_admin(self):
        """Test admin user registration"""
        admin_data = {
            "email": f"admin_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "AdminPass123!",
            "full_name": "Test Admin",
            "role": "ADMIN"
        }
        
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data=admin_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            self.created_resources['users'].append(admin_data['email'])
            print(f"   Admin registered: {admin_data['email']}")
            return True
        return False

    def test_register_interviewer(self):
        """Test interviewer user registration"""
        interviewer_data = {
            "email": f"interviewer_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "InterviewerPass123!",
            "full_name": "Test Interviewer",
            "role": "INTERVIEWER"
        }
        
        success, response = self.run_test(
            "Interviewer Registration",
            "POST",
            "auth/register",
            200,
            data=interviewer_data
        )
        
        if success:
            self.created_resources['users'].append(interviewer_data['email'])
            return True, interviewer_data
        return False, None

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            return True
        return False

    def test_get_current_user(self):
        """Test get current user endpoint"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_candidate(self):
        """Test candidate creation"""
        candidate_data = {
            "name": f"Test Candidate {datetime.now().strftime('%H%M%S')}",
            "email": f"candidate_{datetime.now().strftime('%H%M%S')}@test.com",
            "phone": "+1234567890",
            "position": "Software Engineer",
            "resume_link": "https://example.com/resume.pdf"
        }
        
        success, response = self.run_test(
            "Create Candidate",
            "POST",
            "candidates",
            200,
            data=candidate_data
        )
        
        if success and 'id' in response:
            self.created_resources['candidates'].append(response['id'])
            return True, response
        return False, None

    def test_get_candidates(self):
        """Test get all candidates"""
        success, response = self.run_test(
            "Get All Candidates",
            "GET",
            "candidates",
            200
        )
        return success, response if success else []

    def test_get_candidate_by_id(self, candidate_id):
        """Test get candidate by ID"""
        success, response = self.run_test(
            "Get Candidate by ID",
            "GET",
            f"candidates/{candidate_id}",
            200
        )
        return success

    def test_update_candidate(self, candidate_id):
        """Test candidate update"""
        update_data = {
            "status": "scheduled"
        }
        
        success, response = self.run_test(
            "Update Candidate",
            "PUT",
            f"candidates/{candidate_id}",
            200,
            data=update_data
        )
        return success

    def test_get_interviewers(self):
        """Test get interviewers"""
        success, response = self.run_test(
            "Get Interviewers",
            "GET",
            "users/interviewers",
            200
        )
        return success, response if success else []

    def test_schedule_interview(self, candidate_id, interviewer_id):
        """Test interview scheduling"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        schedule_data = {
            "candidate_id": candidate_id,
            "interviewer_id": interviewer_id,
            "preferred_date": tomorrow
        }
        
        success, response = self.run_test(
            "Schedule Interview",
            "POST",
            "interviews/schedule",
            200,
            data=schedule_data
        )
        
        if success and 'id' in response:
            self.created_resources['interviews'].append(response['id'])
            return True, response
        return False, None

    def test_get_interviews(self):
        """Test get interviews"""
        success, response = self.run_test(
            "Get Interviews",
            "GET",
            "interviews",
            200
        )
        return success, response if success else []

    def test_submit_feedback(self, interview_id, candidate_id):
        """Test feedback submission with AI sentiment analysis"""
        feedback_data = {
            "interview_id": interview_id,
            "candidate_id": candidate_id,
            "technical_score": 8.5,
            "communication_score": 7.0,
            "cultural_fit_score": 9.0,
            "feedback_comment": "Excellent technical skills and great communication. The candidate showed strong problem-solving abilities and would be a great fit for our team culture."
        }
        
        success, response = self.run_test(
            "Submit Feedback (AI Analysis)",
            "POST",
            "feedback",
            200,
            data=feedback_data
        )
        
        if success and 'id' in response:
            self.created_resources['feedbacks'].append(response['id'])
            # Check if AI sentiment analysis was performed
            if 'sentiment_type' in response and 'sentiment_score' in response:
                print(f"   AI Sentiment: {response['sentiment_type']} (score: {response['sentiment_score']})")
                print(f"   Final Score: {response['final_score']}")
            return True, response
        return False, None

    def test_get_candidate_feedback(self, candidate_id):
        """Test get feedback for candidate"""
        success, response = self.run_test(
            "Get Candidate Feedback",
            "GET",
            f"feedback/candidate/{candidate_id}",
            200
        )
        return success, response if success else []

    def test_get_rankings(self):
        """Test candidate rankings with bias detection"""
        success, response = self.run_test(
            "Get Candidate Rankings",
            "GET",
            "ranking",
            200
        )
        
        if success and response:
            print(f"   Found {len(response)} ranked candidates")
            for i, candidate in enumerate(response[:3]):  # Show top 3
                print(f"   #{i+1}: {candidate['candidate_name']} - Score: {candidate['final_score']}")
                if candidate.get('bias_warnings'):
                    print(f"      Bias warnings: {len(candidate['bias_warnings'])}")
        
        return success, response if success else []

    def test_calendar_availability(self, interviewer_id):
        """Test calendar availability (mock data expected)"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        success, response = self.run_test(
            "Get Calendar Availability",
            "GET",
            f"calendar/availability/{interviewer_id}?date={tomorrow}",
            200
        )
        
        if success and 'free_slots' in response:
            print(f"   Available slots: {len(response['free_slots'])}")
            if response.get('note'):
                print(f"   Note: {response['note']}")
        
        return success

def main():
    print("🚀 Starting Smart Interview Platform API Tests")
    print("=" * 60)
    
    tester = SmartInterviewPlatformTester()
    
    # Test 1: API Root
    if not tester.test_root_endpoint():
        print("❌ API not accessible, stopping tests")
        return 1

    # Test 2: User Registration & Authentication
    if not tester.test_register_admin():
        print("❌ Admin registration failed, stopping tests")
        return 1

    # Test 3: Authentication verification
    if not tester.test_get_current_user():
        print("❌ Authentication verification failed")
        return 1

    # Test 4: Register interviewer for later tests
    interviewer_success, interviewer_data = tester.test_register_interviewer()
    if not interviewer_success:
        print("❌ Interviewer registration failed")
        return 1

    # Test 5: Candidate Management
    candidate_success, candidate = tester.test_create_candidate()
    if not candidate_success:
        print("❌ Candidate creation failed")
        return 1

    candidate_id = candidate['id']
    
    # Test 6: Get candidates
    tester.test_get_candidates()
    
    # Test 7: Get candidate by ID
    tester.test_get_candidate_by_id(candidate_id)
    
    # Test 8: Update candidate
    tester.test_update_candidate(candidate_id)

    # Test 9: Get interviewers
    interviewer_list_success, interviewers = tester.test_get_interviewers()
    if not interviewer_list_success or not interviewers:
        print("❌ No interviewers found for scheduling")
        return 1

    interviewer_id = interviewers[0]['id']

    # Test 10: Calendar availability
    tester.test_calendar_availability(interviewer_id)

    # Test 11: Schedule interview
    interview_success, interview = tester.test_schedule_interview(candidate_id, interviewer_id)
    if not interview_success:
        print("❌ Interview scheduling failed")
        return 1

    interview_id = interview['id']

    # Test 12: Get interviews
    tester.test_get_interviews()

    # Test 13: Submit feedback with AI analysis
    feedback_success, feedback = tester.test_submit_feedback(interview_id, candidate_id)
    if not feedback_success:
        print("❌ Feedback submission failed")
        return 1

    # Test 14: Get candidate feedback
    tester.test_get_candidate_feedback(candidate_id)

    # Test 15: Get rankings with bias detection
    tester.test_get_rankings()

    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Smart Interview Platform is working correctly.")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())