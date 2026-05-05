import { BrowserRouter, Routes, Route } from 'react-router';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<div className="p-4 text-gray-500">Em construção</div>} />
      </Routes>
    </BrowserRouter>
  );
}
