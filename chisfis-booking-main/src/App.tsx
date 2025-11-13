import React from "react";
import MyRouter from "routers/index";
import { AuthProvider } from "contexts/AuthContext";
import { LanguageProvider } from "i18n/LanguageContext";

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="bg-white text-base dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">
          <MyRouter />
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
