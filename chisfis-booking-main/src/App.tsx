import React from "react";
import MyRouter from "routers/index";
import { AuthProvider } from "contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div className="bg-white text-base dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">
        <MyRouter />
      </div>
    </AuthProvider>
  );
}

export default App;
