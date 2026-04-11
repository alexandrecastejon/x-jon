import { Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import FollowersPage from "./pages/FollowersPage.jsx";
import FollowingPage from "./pages/FollowingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PostPage from "./pages/PostPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/feed"
        element={
          <PrivateRoute>
            <FeedPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/explorar"
        element={
          <PrivateRoute>
            <ExplorePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        }
      />
      <Route path="/u/:username" element={<ProfilePage />} />
      <Route path="/u/:username/followers" element={<FollowersPage />} />
      <Route path="/u/:username/following" element={<FollowingPage />} />
      <Route path="/post/:id" element={<PostPage />} />
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}
