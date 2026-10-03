/**
 * Microservice: Auth & User Profile Service
 * Dedicated to single authorized user: alejosierra656@gmail.com (Alejo Sierra)
 */

const USER_PROFILE = {
  id: 'usr-alejo-01',
  email: 'alejosierra656@gmail.com',
  name: 'Alejo Sierra',
  role: 'Estudiante de Ingeniería, Árbitro COARC & Tasker Outlier',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  currentPrimeScore: 88,
  streakDays: 5,
  statusMessage: 'Recuperando mi PRIME físico y académico',
  settings: {
    bedtimeHour: 22, // 10:00 PM
    bedtimeMinute: 0,
    dailyWaterGoalLiters: 2.5,
    glassSizeMl: 250,
    duolingoAlarmEnabled: true,
    alarmNagIntervalSeconds: 30,
    soundAlertsEnabled: true
  }
};

class AuthService {
  async getProfile(email) {
    if (email && email.toLowerCase() !== USER_PROFILE.email.toLowerCase()) {
      return { error: 'Acceso no autorizado. Este sistema es exclusivo para alejosierra656@gmail.com' };
    }
    return { success: true, profile: USER_PROFILE };
  }

  async updateSettings(newSettings) {
    USER_PROFILE.settings = { ...USER_PROFILE.settings, ...newSettings };
    return { success: true, settings: USER_PROFILE.settings };
  }
}

module.exports = new AuthService();
