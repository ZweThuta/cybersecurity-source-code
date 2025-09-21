import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { store } from './store/store';
import { HomePage, LoginPage, RegisterPage, NotFound } from './pages';
import { GameToaster } from './components/animated-ui/GameToaster';

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <GameToaster />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<RegisterPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </Provider>
);

export default App;
