const User = require('../models/user.model');
const Application = require('../models/application.model');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updateData = req.body;
    if (req.file) {
      updateData.resume_url = req.file.path;
    }
    await User.updateProfile(req.user.id, updateData);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [stats, user, recentApps] = await Promise.all([
      Application.getDashboardStatsForUser(req.user.id),
      User.findById(req.user.id),
      Application.findByUserId(req.user.id),
    ]);

    res.json({
      stats,
      profile: {
        name: user.name,
        email: user.email,
        title: user.title || null,
        bio: user.bio || null,
        skills: user.skills
          ? (typeof user.skills === 'string' ? JSON.parse(user.skills) : user.skills)
          : [],
        resume_url: user.resume_url || null,
      },
      recentApplications: recentApps.slice(0, 4).map(a => ({
        id: a.id,
        job_title: a.job_title,
        company_name: a.company_name,
        status: a.status,
        applied_at: a.applied_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, getDashboardStats };
