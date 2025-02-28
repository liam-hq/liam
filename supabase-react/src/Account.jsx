import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Account({ session }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);
  const [website, setWebsite] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [githubUser, setGithubUser] = useState(null);
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    async function fetchProfileAndGitHubData() {
      setLoading(true);
      const { user, provider_token } = session;

      try {
        // 1. Get Supabase Profile
        const { data, error } = await supabase
          .from('profiles')
          .select(`username, website, avatar_url`)
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn('Error fetching profile:', error);
        } else if (data) {
          setUsername(data.username);
          setWebsite(data.website);
          setAvatarUrl(data.avatar_url);
        }

        // 2. Get GitHub User Info and Repos
        if (provider_token) {
          const userResponse = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${provider_token}` },
          });
          const userData = await userResponse.json();
          setGithubUser(userData);

          const reposResponse = await fetch('https://api.github.com/user/repos', {
            headers: { Authorization: `Bearer ${provider_token}` },
          });
          const reposData = await reposResponse.json();
          setRepos(reposData || []);
        } else {
          console.warn("No GitHub access token found.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }

      setLoading(false);
    }

    fetchProfileAndGitHubData();
  }, [session]);

  async function updateProfile(event) {
    event.preventDefault();
    setLoading(true);
    const { user } = session;

    const updates = {
      id: user.id,
      username,
      website,
      avatar_url: avatarUrl,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      alert(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="profile-container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* GitHub User Info */}
          {githubUser && (
            <div className="user-info">
              <img src={githubUser.avatar_url} alt="GitHub Avatar" width="80" />
              <h2>{githubUser.login}</h2>
            </div>
          )}

          {/* Supabase profiles */}
          <h3>Supabase-side profile:</h3>
          <form onSubmit={updateProfile} className="form-widget">
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="text" value={session.user.email} disabled />
            </div>
            <div>
              <label htmlFor="username">Name</label>
              <input
                id="username"
                type="text"
                required
                value={username || ''}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="url"
                value={website || ''}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div>
              <button className="button block primary" type="submit" disabled={loading}>
                {loading ? 'Loading ...' : 'Update'}
              </button>
            </div>
          </form>

          {/* GitHub repo list */}
          <h3>Repositories accessible via GitHub App:</h3>
          <ul>
            {repos.map((repo) => (
              <li key={repo.id}>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                  {repo.full_name}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Log Out */}
      <button className="button block" onClick={() => supabase.auth.signOut()}>
        Sign Out
      </button>
    </div>
  );
}
