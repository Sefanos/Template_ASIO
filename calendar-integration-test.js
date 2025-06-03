// Test script for Calendar Integration Phase 1
// Run this in browser console when the calendar component is loaded

console.log('=== Calendar Integration Phase 1 Test ===');

// Test 1: Check if services are properly injected
try {
  const calendarService = window.ng?.probe(document.querySelector('app-calendar-container'))?.componentInstance?.calendarService;
  console.log('✓ CalendarService found:', !!calendarService);
  
  if (calendarService) {
    // Test signals
    console.log('✓ Loading signal:', calendarService.loading());
    console.log('✓ Error signal:', calendarService.error());
    console.log('✓ Events count:', calendarService.events().length);
    console.log('✓ Resources count:', calendarService.resources().length);
  }
} catch (error) {
  console.error('✗ Service injection test failed:', error);
}

// Test 2: Check if appointment data is being loaded
try {
  const events = document.querySelectorAll('.fc-event');
  console.log('✓ Calendar events rendered:', events.length);
  
  if (events.length > 0) {
    console.log('✓ Sample event:', events[0].textContent);
  }
} catch (error) {
  console.error('✗ Event rendering test failed:', error);
}

// Test 3: Check if loading states are working
try {
  const loadingIndicator = document.querySelector('.animate-spin');
  const errorIndicator = document.querySelector('.bg-red-50');
  
  console.log('✓ Loading indicator present:', !!loadingIndicator);
  console.log('✓ Error indicator present:', !!errorIndicator);
} catch (error) {
  console.error('✗ UI state test failed:', error);
}

// Test 4: Check calendar configuration
try {
  const calendarEl = document.querySelector('.fc-container');
  console.log('✓ Calendar container found:', !!calendarEl);
  
  const calendarApi = window.fcCalendar; // This would need to be exposed for testing
  if (calendarApi) {
    console.log('✓ Calendar view:', calendarApi.view.type);
    console.log('✓ Calendar date:', calendarApi.getDate());
  }
} catch (error) {
  console.error('✗ Calendar configuration test failed:', error);
}

console.log('=== Test Complete ===');

// Helper function to trigger data refresh
window.testCalendarRefresh = function() {
  try {
    const component = window.ng?.probe(document.querySelector('app-calendar-container'))?.componentInstance;
    if (component) {
      component.retryLoadData();
      console.log('✓ Data refresh triggered');
    }
  } catch (error) {
    console.error('✗ Data refresh failed:', error);
  }
};

console.log('Use testCalendarRefresh() to test data loading');
