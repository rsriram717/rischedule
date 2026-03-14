# rischedule TODO

## Features
- [ ] Replace time-of-day dropdown with checkboxes (multi-select)
- [ ] Add ability to edit proposed event settings before creation with natural language
- [ ] Add ability to edit proposed event settings with manual config
- [ ] Availability should show time of day and date
- [ ] If event was created with specific participants then respondents should be limited to that set
---

## Test Scenarios

Run these manually during development to verify the full create → respond → results flow.

### 1. "dnd with aaron next tue-thu evening"
- [ ] Parses name as "DnD" (or similar), dates as the upcoming Tue/Wed/Thu, time as "evening"
- [ ] Event created, `/respond/{code}` link shown
- [ ] Respond page shows 3 date checkboxes with correct labels
- [ ] Submit availability → results page shows Aaron's response in heatmap

### 2. "movie night with pallavi one weekend night in the next 3 weeks"
- [ ] Parses name as "Movie Night", dates as 3–6 upcoming Fri/Sat/Sun evenings
- [ ] Respond page shows correct weekend dates
- [ ] Submit → heatmap updates correctly

### 3. "lunch with the team this friday or next friday"
- [ ] Parses exactly 2 dates (this Friday + next Friday)
- [ ] No time preference set (or "any")
- [ ] Both dates appear as checkboxes on respond page

### 4. "birthday drinks for sam, march 28 or 29"
- [ ] Parses specific dates March 28 and 29
- [ ] Multiple people can respond — submit 2 responses with different names
- [ ] Results page heatmap reflects both responses, best time highlights the date both are free

### 5. Expired event cleanup
- [ ] Create an event manually with past dates (edit blob or use a past-date input)
- [ ] Load `/{code}` → returns 404 with "Event has expired"
- [ ] Blob store no longer contains the event or responses files
