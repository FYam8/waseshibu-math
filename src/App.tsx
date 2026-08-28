import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Years from './pages/Years'
import Practice from './pages/Practice'
import Report from './pages/Report'
import SyncSettings from './pages/SyncSettings'
import PastPapers from './pages/PastPapers'
import MistakeReview from './pages/MistakeReview'
import Remediation from './pages/Remediation'
import Fields from './pages/Fields'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/years" element={<Years />} />
        <Route path="/past-papers" element={<PastPapers />} />
        <Route path="/fields" element={<Fields />} />
        <Route path="/mistakes" element={<MistakeReview />} />
        <Route path="/remediate" element={<Remediation />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/report" element={<Report />} />
        <Route path="/sync" element={<SyncSettings />} />
      </Routes>
    </Layout>
  )
}
