export type MathAppProfile = {
  id: string
  schoolLabel: string
  brand: {
    title: string
    unofficialLabel: string
    subtitle: string
    footer: string
  }
  supportedYears: readonly number[]
  learningPhases: readonly {
    step: number
    title: string
    year?: number
    role: 'diagnostic' | 'remediation' | 'checkpoint' | 'practice' | 'final'
  }[]
  runtime: {
    storageNamespace: string
    eventNamespace: string
    updateChannel: string
    progressApiEnv: 'VITE_PROGRESS_API_BASE'
  }
}

/**
 * Current WaseShibu production identity expressed as data.
 *
 * This file is intentionally not wired into runtime yet. The first shared-engine
 * migration step is to make the existing production contract explicit without
 * changing behaviour, storage keys, routes, scoring, or learner data.
 */
export const WASESHIBU_APP_PROFILE = {
  id: 'waseshibu',
  schoolLabel: '早稲田渋谷シンガポール校',
  brand: {
    title: 'WaseShibu Math 70',
    unofficialLabel: '非公式',
    subtitle: '過去問の出題構造を参考にした学習用Webアプリ',
    footer: '非公式の学習支援アプリです。2019〜2026年度の過去問演習、学習記録、18分野の類題を掲載します。A/B/Cは学習上の優先度です。学習データはこの端末に保存されます。'
  },
  supportedYears: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  learningPhases: [
    { step: 1, title: '2024年度で診断', year: 2024, role: 'diagnostic' },
    { step: 2, title: '2024年度の弱点を修正・補強', year: 2024, role: 'remediation' },
    { step: 3, title: '2023年度で改善確認①', year: 2023, role: 'checkpoint' },
    { step: 4, title: '2022年度で改善確認②', year: 2022, role: 'checkpoint' },
    { step: 5, title: '2025年度で実戦確認', year: 2025, role: 'practice' },
    { step: 6, title: '2026年度で最終確認', year: 2026, role: 'final' }
  ],
  runtime: {
    storageNamespace: 'waseshibu-math',
    eventNamespace: 'waseshibu',
    updateChannel: 'waseshibu-math-updates',
    progressApiEnv: 'VITE_PROGRESS_API_BASE'
  }
} as const satisfies MathAppProfile

export const APP_PROFILE: MathAppProfile = WASESHIBU_APP_PROFILE
