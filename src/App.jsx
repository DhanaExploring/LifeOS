import { useAuth } from "./AuthScreen";
import AuthScreen from "./AuthScreen";
import LifeOS from "./LifeOS_preview";

export default function App() {
  const { user, signOut } = useAuth();

  // Loading — still checking session
  if (user === undefined) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#faf7f2",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        <span style={{ color: "#7a9e7e", fontSize: 36, animation: "pulse 1.2s ease infinite" }}>✦</span>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <AuthScreen />;
  }

  // Authenticated
  return <LifeOS signOut={signOut} userEmail={user.email} />;
}
