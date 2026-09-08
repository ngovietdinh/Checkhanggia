import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Verify from './pages/Verify';
import Report from './pages/Report';
import ProductSearch from './pages/ProductSearch';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify/:publicId" element={<Verify />} />
        <Route path="/report" element={<Report />} />
        <Route path="/search" element={<ProductSearch />} />
      </Routes>
    </BrowserRouter>
  );
}
