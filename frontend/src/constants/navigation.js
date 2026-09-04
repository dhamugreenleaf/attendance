import { ROLES } from './roles';

export const BOTTOM_TABS = {
  [ROLES.ADMIN]: [
    { name: 'dashboard', title: 'Dashboard', icon: 'dashboard' },
    { name: 'employees', title: 'Employees', icon: 'people' },
    { name: 'teams', title: 'Teams', icon: 'groups' },
    { name: 'attendance', title: 'Attendance', icon: 'event-available' },
    { name: 'profile', title: 'Profile', icon: 'person' },
  ],
  [ROLES.HR]: [
    { name: 'dashboard', title: 'Dashboard', icon: 'dashboard' },
    { name: 'employees', title: 'Employees', icon: 'people' },
    { name: 'teams', title: 'Teams', icon: 'groups' },
    { name: 'attendance', title: 'Attendance', icon: 'event-available' },
    { name: 'profile', title: 'Profile', icon: 'person' },
  ],
  [ROLES.MANAGER]: [
    { name: 'dashboard', title: 'Dashboard', icon: 'dashboard' },
    { name: 'teams', title: 'Teams', icon: 'groups' },
    { name: 'attendance', title: 'Attendance', icon: 'event-available' },
    { name: 'profile', title: 'Profile', icon: 'person' },
  ],
  [ROLES.TL]: [
    { name: 'dashboard', title: 'Dashboard', icon: 'dashboard' },
    { name: 'team', title: 'My Team', icon: 'groups' },
    { name: 'attendance', title: 'Attendance', icon: 'check-circle' },
    { name: 'shift', title: 'Shifts', icon: 'schedule' },
    { name: 'profile', title: 'Profile', icon: 'person' },
  ],
  [ROLES.EMPLOYEE]: [
    { name: 'dashboard', title: 'Home', icon: 'home' },
    { name: 'attendance', title: 'Attendance', icon: 'event-available' },
    { name: 'leave', title: 'Leave', icon: 'event-busy' },
    { name: 'permission', title: 'Permission', icon: 'schedule' },
    { name: 'profile', title: 'Profile', icon: 'person' },
  ]
};

