# Calendar Integration Testing Checklist

## Pre-Testing Setup
- [ ] Ensure backend API is running and accessible
- [ ] Verify authentication tokens are valid
- [ ] Check that DoctorAppointmentService endpoints are responding
- [ ] Start Angular development server (`ng serve`)

## Basic Functionality Tests

### Data Loading
- [ ] Calendar loads without errors
- [ ] Loading spinner appears during initial data fetch
- [ ] Real appointment data is displayed (not just mock data)
- [ ] Events show correct patient names and appointment details
- [ ] Resource (doctor) filtering works
- [ ] Date navigation loads appropriate data

### Error Handling
- [ ] Disconnect network and verify error message appears
- [ ] Click "Try Again" button and verify data reloads
- [ ] Check console for any unhandled errors
- [ ] Verify graceful fallback when API is unavailable

### Calendar Interactions
- [ ] Click on appointment to view details
- [ ] Drag appointment to new time slot
- [ ] Resize appointment duration
- [ ] Create new appointment by clicking empty time slot
- [ ] Create new blocked time
- [ ] Delete existing blocked time

### UI/UX
- [ ] Loading states provide clear feedback
- [ ] Error messages are user-friendly
- [ ] Calendar renders correctly on different screen sizes
- [ ] All buttons and controls work as expected

## Integration Tests

### Service Integration
- [ ] DoctorAppointmentService methods are called correctly
- [ ] AppointmentMapperService transforms data properly
- [ ] CalendarService signals update correctly
- [ ] Observable patterns work without memory leaks

### Data Flow
- [ ] API responses are properly mapped to CalendarEvents
- [ ] Signal changes trigger UI updates
- [ ] Error states propagate correctly
- [ ] Loading states manage correctly

## Performance Tests

### Load Times
- [ ] Initial calendar load < 3 seconds
- [ ] Date range changes < 1 second
- [ ] Filter changes < 1 second
- [ ] No unnecessary API calls on interactions

### Memory Usage
- [ ] No memory leaks after multiple interactions
- [ ] Calendar view changes don't accumulate memory
- [ ] Event handlers are properly cleaned up

## Browser Compatibility
- [ ] Works in Chrome (latest)
- [ ] Works in Firefox (latest)
- [ ] Works in Safari (latest)
- [ ] Works in Edge (latest)

## Edge Cases

### Data Scenarios
- [ ] Empty appointment list displays correctly
- [ ] Large number of appointments (100+) renders well
- [ ] Overlapping appointments display properly
- [ ] All-day events display correctly
- [ ] Multi-day events display correctly

### Error Scenarios
- [ ] Network timeout handling
- [ ] Invalid API responses
- [ ] Authentication failures
- [ ] Malformed appointment data

## Manual Test Scripts

### Test Real Data Loading
```javascript
// In browser console
const component = ng.probe(document.querySelector('app-calendar-container')).componentInstance;
component.calendarService.loadAppointments();
```

### Test Error Handling
```javascript
// In browser console
const component = ng.probe(document.querySelector('app-calendar-container')).componentInstance;
component.calendarService._error.set('Test error message');
```

### Test Loading State
```javascript
// In browser console
const component = ng.probe(document.querySelector('app-calendar-container')).componentInstance;
component.calendarService._loading.set(true);
```

## Debugging Tools

### Angular DevTools
- [ ] Check signal values in component state
- [ ] Monitor service injection
- [ ] Verify change detection cycles

### Browser DevTools
- [ ] Network tab shows correct API calls
- [ ] Console shows no errors
- [ ] Performance tab shows reasonable render times

### FullCalendar Debug
- [ ] Calendar events array is populated
- [ ] Event properties are correct
- [ ] Calendar configuration is applied

## Sign-off Criteria

### Must Have
- [ ] No console errors
- [ ] Real appointment data loads successfully
- [ ] All CRUD operations work
- [ ] Error handling works correctly
- [ ] Loading states work correctly

### Should Have
- [ ] Good performance (< 3s initial load)
- [ ] Responsive design works
- [ ] All planned features implemented
- [ ] User feedback for all actions

### Could Have
- [ ] Advanced filtering works
- [ ] Real-time updates (if implemented)
- [ ] Keyboard navigation
- [ ] Accessibility features

---

**Testing Status**: [ ] Not Started [ ] In Progress [ ] Complete
**Tester**: ________________
**Date**: ________________
**Issues Found**: ________________
