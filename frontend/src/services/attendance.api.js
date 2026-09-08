import api from './api';

export const attendanceApi = {
  punchIn: async (employeeId) => {
    const response = await api.post('/attendance/punch-in', { employeeId });
    return response.data;
  },

  punchOut: async (employeeId) => {
    const response = await api.post('/attendance/punch-out', { employeeId });
    return response.data;
  },

  getMyRecords: async () => {
    const response = await api.get('/attendance/my-records');
    return response.data;
  },

  getAllAttendance: async () => {
    const response = await api.get('/attendance');
    return response.data;
  },

  getTeamAttendance: async (teamId, date) => {
    const params = date ? { date } : {};
    const response = await api.get(`/attendance/team/${teamId}`, { params });
    return response.data;
  },

  bulkMark: async (date, records) => {
    const response = await api.post('/attendance/bulk-mark', { date, records });
    return response.data;
  },

  getEmployeeMonthlySummary: async (employeeId, year, month) => {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const response = await api.get(`/attendance/employee/${employeeId}/summary`, { params });
    return response.data;
  },

  markOvertime: async (employeeId, date, otStartTime, otEndTime) => {
    const response = await api.post('/attendance/overtime', { employeeId, date, otStartTime, otEndTime });
    return response.data;
  },

  markPermission: async (employeeId, date, permissionStartTime, permissionEndTime) => {
    const response = await api.post('/attendance/permission', { employeeId, date, permissionStartTime, permissionEndTime });
    return response.data;
  }
};
