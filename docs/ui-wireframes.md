# UI Wireframes & Logic

## 1. Login Screen
- **Components**:
  - Email Input
  - Password Input
  - "Login" Button
  - "Forgot Password" Link
- **Logic**:
  - On submit -> POST /auth/login
  - On success -> Store token in LocalStorage, Redirect to Dashboard based on Role.

## 2. Employee Dashboard
- **Header**: User Avatar, Name, "Logout"
- **Summary Cards**:
  - Leave Balance (Planned, Sick, Casual)
  - Upcoming Holidays (Next 3)
- **Recent Activity**: List of recent leave requests with status badges (Green=Approved, Yellow=Pending).
- **Floating Action Button (FAB)**: "+ Apply Leave"

## 3. Apply Leave Modal/Page
- **Fields**:
  - Leave Type (Dropdown)
  - Date Range Picker (Start - End)
  - Reason (Textarea)
- **Display**:
  - Calculated number of days.
  - Warning if balance is insufficient.
- **Actions**:
  - "Submit" -> POST /leaves
  - "Cancel"

## 4. Manager Dashboard
- **Pending Approvals Section**:
  - List of pending requests from reportees.
  - Columns: Name, Type, Dates, Days, Reason.
  - Actions: "Approve" (Tick), "Reject" (Cross).
- **Team Calendar**:
  - Monthly view showing who is on leave.

## 5. HR Dashboard
- **Stats**: Total Employees, Leaves Today.
- **Policy Config**:
  - Edit Leave Types & Limits.
  - Manage Holidays (Add/Remove dates).
