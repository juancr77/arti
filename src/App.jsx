import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FormPeticion from './components/peticiones/FormPeticion';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FormPeticion />} />
        <Route path="/registrar" element={<FormPeticion />} />
      </Routes>
    </BrowserRouter>
  );
}