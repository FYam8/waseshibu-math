import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Years from './pages/Years'
import Practice from './pages/Practice'
import Report from './pages/Report'
import MultiPractice from './pages/MultiPractice'
import SyncSettings from './pages/SyncSettings'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/years" element={<Years />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/report" element={<Report />} />
        <Route path="/multi" element={<MultiPractice />} />
        <Route path="/sync" element={<SyncSettings />} />
      </Routes>
    </Layout>
  )
}
