# Debug Authentication Status

## Steps to Debug Calendar Not Loading Issue

1. **Open Browser Developer Tools**
   - Open your calendar page in the browser
   - Press F12 to open Developer Tools
   - Go to Console tab

2. **Check Console Output**
   Look for these specific console messages in order:

   ```
   FullCalendar requesting events for: {startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD"}
   CalendarService: Starting to load appointments for date range: {startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD"}  
   DoctorAppointmentService: Making API call for date range: {startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD"}
   API URL: http://localhost:8000/api/doctor/appointments
   Auth token exists: true/false
   Current user exists: true/false
   ```

3. **Check Network Tab**
   - Go to Network tab in Developer Tools
   - Look for any HTTP requests to `/api/doctor/appointments`
   - Check if the request is made and what the response is

4. **Authentication Issues to Look For**
   - If `Auth token exists: false` - User is not logged in
   - If `Auth token exists: true` but request fails with 401 - Token expired
   - If no network request is made - Check for JavaScript errors

5. **Possible Solutions**

   **If not authenticated:**
   - Navigate to `/login` and log in first
   - Ensure you're logging in as a user with 'doctor' role

   **If authenticated but getting 401:**
   - Try refreshing the page
   - Log out and log back in

   **If JavaScript errors:**
   - Look for any red error messages in console
   - Check if all dependencies are loaded

## Test Commands

To quickly test authentication status, run these in browser console:

```javascript
// Check if user is logged in
console.log('Token:', localStorage.getItem('auth_token'));
console.log('User:', localStorage.getItem('currentUser'));

// Parse user data
try {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  console.log('User role:', user?.roles?.[0]?.code);
} catch(e) {
  console.log('No valid user data');
}
```

## Expected Behavior

1. FullCalendar should automatically call the events function when it initializes
2. This should trigger the appointment service to make an HTTP request
3. The request should include Authorization header with Bearer token
4. Backend should return appointment data
5. Data should be mapped and displayed on calendar
6. Loading spinner should disappear

## Common Issues

1. **Not logged in** - Calendar won't load without authentication
2. **Wrong user role** - Doctor endpoints require doctor role
3. **Backend not running** - Check if Laravel backend is running on port 8000
4. **CORS issues** - Check browser console for CORS errors
5. **Token expired** - Try logging out and back in
