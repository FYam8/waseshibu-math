import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Years from './pages/Years'
import Practice from './pages/Practice'
import Report from './pages/Report'
import MultiPractice from './pages/MultiPractice'
import SyncSettings from './pages/SyncSettings'
import YearTraining from './pages/YearTraining'
import PastPapers from './pages/PastPapers'
import MistakeReview from './pages/MistakeReview'
import Remediation from './pages/Remediation'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/years" element={<Years />} />
        <Route path="/year-training" element={<YearTraining />} />
        <Route path="/past-papers" element={<PastPapers />} />
        <Route path="/mistakes" element={<MistakeReview />} />
        <Route path="/remediate" element={<Remediation />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/report" element={<Report />} />
        <Route path="/multi" element={<MultiPractice />} />
        <Route path="/sync" element={<SyncSettings />} />
      </Routes>
    </Layout>
  )
}
