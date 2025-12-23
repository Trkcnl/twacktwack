import { useAuth } from "../context/AuthHook";

export const Dashboard = () => {
    // 1. Get the user data from the "Cloud" (Context)
    const { user, logout } = useAuth();

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Dashboard</h1>

            {/* 2. Debugging Section */}
            {/* It is very useful to print the raw data while developing */}
            {/* to see exactly what fields your backend is sending. */}
            <div
                style={{
                    background: "#f0f0f0",
                    padding: "1rem",
                    borderRadius: "8px",
                    margin: "1rem 0",
                }}
            >
                <h3>Debug Info:</h3>
                <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>

            {/* 3. The actual UI */}
            {user ? (
                <div>
                    <h2>Welcome back, {user.username || "User"}!</h2>
                    <p>Email: {user.email}</p>
                    {/* If you have a profile nested object, access it here */}
                    {/* <p>Bio: {user.profile?.bio}</p> */}
                </div>
            ) : (
                <p>Loading user profile...</p>
            )}

            {/* We are adding this temporary button just to test the logic. 
                We will remove it once we build the Navbar. */}
            <button
                onClick={logout}
                style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    cursor: "pointer",
                }}
            >
                Logout (Test)
            </button>
        </div>
    );
};
