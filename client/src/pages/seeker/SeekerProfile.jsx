import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const SeekerProfile = () => {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skillInput: '',
    skills: user?.skills || [],
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const avatarRef = useRef();
  const resumeRef = useRef();

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const addSkill = () => {
    const s = form.skillInput.trim();
    if (!s) return;
    if (form.skills.includes(s)) return toast.error('Skill already added');
    if (form.skills.length >= 15) return toast.error('Max 15 skills');
    set('skills', [...form.skills, s]);
    set('skillInput', '');
  };

  const removeSkill = (s) => set('skills', form.skills.filter((x) => x !== s));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', {
        name: form.name.trim(),
        bio: form.bio.trim(),
        skills: form.skills,
      });
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);
    try {
      const { data } = await api.put('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...user, avatar: data.avatar });
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    setUploadingResume(true);
    try {
      const { data } = await api.put('/users/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...user, resume: data.resume });
      toast.success('Resume uploaded');
    } catch {
      toast.error('Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Keep your profile up to date to improve your applications</p>
        </div>

        {/* Avatar card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Profile photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-gray-100" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <input ref={avatarRef} type="file" accept="image/*"
                onChange={handleAvatarUpload} className="hidden" />
              <button onClick={() => avatarRef.current.click()}
                disabled={uploadingAvatar}
                className="btn-secondary text-sm">
                {uploadingAvatar ? 'Uploading...' : 'Change photo'}
              </button>
              <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WebP. Max 2MB.</p>
            </div>
          </div>
        </div>

        {/* Resume card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-1">Resume / CV</h2>
          <p className="text-xs text-gray-400 mb-4">Uploaded resume is used as default when applying</p>

          <div className="flex items-center gap-4">
            {user?.resume?.url ? (
              <div className="flex-1 flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <svg className="w-8 h-8 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.resume.originalName || 'resume.pdf'}
                  </p>
                  <a href={user.resume.url} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline">View</a>
                </div>
              </div>
            ) : (
              <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 text-center">
                <p className="text-sm text-gray-400">No resume uploaded yet</p>
              </div>
            )}

            <div className="shrink-0">
              <input ref={resumeRef} type="file" accept=".pdf"
                onChange={handleResumeUpload} className="hidden" />
              <button onClick={() => resumeRef.current.click()}
                disabled={uploadingResume}
                className="btn-secondary text-sm">
                {uploadingResume ? 'Uploading...' : user?.resume?.url ? 'Replace' : 'Upload PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Personal details</h2>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name *</label>
              <input type="text" value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="input" maxLength={60} required />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={user?.email || ''} disabled
                className="input bg-gray-50 text-gray-400 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Bio <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                rows={3} maxLength={500} placeholder="A short intro about yourself..."
                className="input resize-none" />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/500</p>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Skills <span className="font-normal text-gray-400">({form.skills.length}/15)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text" value={form.skillInput}
                  onChange={(e) => set('skillInput', e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); }}}
                  className="input flex-1" placeholder="e.g. React, Node.js, MongoDB..."
                />
                <button type="button" onClick={addSkill}
                  className="btn-secondary px-4 text-sm shrink-0">Add</button>
              </div>
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-2.5 py-1 text-xs font-medium">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)}
                        className="hover:text-blue-900 transition-colors">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button type="submit" disabled={saving} className="btn-primary px-8 py-2.5">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-5">
          <h2 className="font-semibold text-gray-900 mb-3">Account</h2>
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">Account type</p>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role}</p>
            </div>
            <span className="badge bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2.5 py-1 rounded-full capitalize">
              {user?.role}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Member since</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SeekerProfile;
