import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Years from './pages/Years'
import Practice from './pages/Practice'
import Report from './pages/Report'
import PastPapers from './pages/PastPapers'
import MistakeReview from './pages/MistakeReview'
import Remediation from './pages/Remediation'
import Fields from './pages/Fields'
import Reinforcement from './pages/Reinforcement'
import GuidedReview from './pages/GuidedReview'
import DataManager from './pages/DataManager'
import PrepCheck from './pages/PrepCheck'

function PastPaperRoute(){
  const location=useLocation()
  return <PastPapers key={location.pathname+location.search} />
}
function GuidedReviewRoute(){
  const location=useLocation()
  return <GuidedReview key={location.pathname+location.search} />
}
function RemediationRoute(){
  const location=useLocation()
  return <Remediation key={location.pathname+location.search} />
}
function ReinforcementRoute(){
  const location=useLocation()
  return <Reinforcement key={location.pathname+location.search} />
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/years" element={<Years />} />
        <Route path="/past-papers" element={<PastPaperRoute />} />
        <Route path="/setup-check" element={<PrepCheck />} />
        <Route path="/fields" element={<Fields />} />
        <Route path="/mistakes" element={<MistakeReview />} />
        <Route path="/guided-review" element={<GuidedReviewRoute />} />
        <Route path="/remediate" element={<RemediationRoute />} />
        <Route path="/reinforce" element={<ReinforcementRoute />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/report" element={<Report />} />
        <Route path="/data" element={<DataManager />} />
        <Route path="/sync" element={<DataManager />} />
      </Routes>
    </Layout>
  )
}
