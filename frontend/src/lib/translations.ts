export const supportedLanguages = ["tr", "en"] as const;
export type LanguageCode = (typeof supportedLanguages)[number];

export type TranslationKey =
  | "common.dashboard"
  | "common.transactions"
  | "common.categories"
  | "common.budgets"
  | "common.reports"
  | "common.preferences"
  | "common.assistant"
  | "common.investmentSimulations"
  | "common.portfolioBacktest"
  | "common.strategyLab"
  | "common.crisisScenarios"
  | "common.loading"
  | "common.error"
  | "common.noData"
  | "common.refresh"
  | "common.month"
  | "common.all"
  | "common.income"
  | "common.expense"
  | "common.amount"
  | "common.date"
  | "common.description"
  | "common.category"
  | "common.type"
  | "common.action"
  | "common.noDescription"
  | "common.noCategory"
  | "common.openingNote"
  | "preferences.title"
  | "preferences.description"
  | "preferences.appearance"
  | "preferences.appearanceDescription"
  | "preferences.lightTheme"
  | "preferences.lightThemeDescription"
  | "preferences.darkTheme"
  | "preferences.darkThemeDescription"
  | "preferences.dashboardView"
  | "preferences.dashboardViewDescription"
  | "preferences.simple"
  | "preferences.simpleDescription"
  | "preferences.detailed"
  | "preferences.detailedDescription"
  | "preferences.currency"
  | "preferences.currencyDescription"
  | "preferences.try"
  | "preferences.tryDescription"
  | "preferences.usd"
  | "preferences.usdDescription"
  | "preferences.eur"
  | "preferences.eurDescription"
  | "preferences.language"
  | "preferences.languageDescription"
  | "preferences.turkish"
  | "preferences.english"
  | "preferences.rateLoading"
  | "preferences.rateError"
  | "preferences.rateDate"
  | "preferences.refreshRate"
  | "dashboard.eyebrow"
  | "dashboard.title"
  | "dashboard.description"
  | "dashboard.totalIncome"
  | "dashboard.totalExpense"
  | "dashboard.netBalance"
  | "dashboard.budgetUsage"
  | "dashboard.recentTransactions"
  | "dashboard.budgetStatus"
  | "dashboard.incomeDistribution"
  | "dashboard.expenseDistribution"
  | "dashboard.noIncomeCategory"
  | "dashboard.noExpenseCategory"
  | "dashboard.loading"
  | "dashboard.error"
  | "dashboard.noTransactions"
  | "dashboard.categoryHighlights"
  | "dashboard.categoryHighlightsDescription"
  | "dashboard.topExpenseCategory"
  | "dashboard.topIncomeCategory"
  | "dashboard.noDataThisMonth"
  | "dashboard.selectedMonthExpense"
  | "dashboard.selectedMonthIncome"
  | "dashboard.noComparison"
  | "dashboard.comparedToPreviousMonth"
  | "reports.eyebrow"
  | "reports.title"
  | "reports.description"
  | "reports.summary"
  | "reports.period"
  | "reports.totalIncome"
  | "reports.totalExpense"
  | "reports.netBalance"
  | "reports.transactionList"
  | "reports.incomeByCategory"
  | "reports.expensesByCategory"
  | "reports.downloadPdf"
  | "reports.downloadExcel"
  | "reports.preparingPdf"
  | "reports.preparingExcel"
  | "reports.exportError"
  | "reports.loading"
  | "reports.error"
  | "reports.noData"
  | "reports.noTransactions"
  | "reports.noIncomeCategory"
  | "reports.noExpenseCategory"
  | "transactions.eyebrow"
  | "transactions.title"
  | "transactions.description"
  | "categories.eyebrow"
  | "categories.title"
  | "categories.description"
  | "budgets.eyebrow"
  | "budgets.title"
  | "budgets.description"
  | "assistant.eyebrow"
  | "assistant.title"
  | "assistant.description"
  | "investment.eyebrow"
  | "investment.title"
  | "investment.description"
  | "portfolio.eyebrow"
  | "portfolio.title"
  | "portfolio.description"
  | "strategy.eyebrow"
  | "strategy.title"
  | "strategy.description"
  | "crisis.eyebrow"
  | "crisis.title"
  | "crisis.description";

type TranslationMap = Record<TranslationKey, string>;

export const translations: Record<LanguageCode, TranslationMap> = {
  tr: {
    "common.dashboard": "Dashboard",
    "common.transactions": "İşlemler",
    "common.categories": "Kategoriler",
    "common.budgets": "Bütçeler",
    "common.reports": "Raporlar",
    "common.preferences": "Tercihler",
    "common.assistant": "AI Asistan",
    "common.investmentSimulations": "Yatırım Simülasyonları",
    "common.portfolioBacktest": "Portföy Backtest",
    "common.strategyLab": "Strateji Laboratuvarı",
    "common.crisisScenarios": "Kriz Senaryosu",
    "common.loading": "Yükleniyor.",
    "common.error": "Bir sorun oluştu.",
    "common.noData": "Veri yok.",
    "common.refresh": "Yenile",
    "common.month": "Ay",
    "common.all": "Tümü",
    "common.income": "Gelir",
    "common.expense": "Gider",
    "common.amount": "Tutar",
    "common.date": "Tarih",
    "common.description": "Açıklama",
    "common.category": "Kategori",
    "common.type": "Tür",
    "common.action": "İşlem",
    "common.noDescription": "Açıklama yok",
    "common.noCategory": "Kategori yok",
    "common.openingNote": "Aylık bütçe kullanımı ve kategori dağılımı tek ekranda izlenir.",
    "preferences.title": "Uygulama ayarları",
    "preferences.description": "Credentia arayüzünü kullanım şekline göre düzenle.",
    "preferences.appearance": "Görünüm",
    "preferences.appearanceDescription": "Uygulama temasını seç. Tercihin bu tarayıcıda kalıcı olarak saklanır.",
    "preferences.lightTheme": "Açık tema",
    "preferences.lightThemeDescription": "Gündüz kullanımına uygun açık arayüz.",
    "preferences.darkTheme": "Koyu tema",
    "preferences.darkThemeDescription": "Daha düşük parlaklıkla koyu arayüz.",
    "preferences.dashboardView": "Dashboard Görünümü",
    "preferences.dashboardViewDescription": "Dashboard’da yalnızca temel finans özetini veya gelişmiş analiz kartlarını görüntüleyebilirsiniz.",
    "preferences.simple": "Sade",
    "preferences.simpleDescription": "Yalnızca temel finans özeti, son işlemler ve kategori grafiği.",
    "preferences.detailed": "Detaylı",
    "preferences.detailedDescription": "Temel özetlere ek olarak gelişmiş analytics kartları.",
    "preferences.currency": "Para Birimi",
    "preferences.currencyDescription": "TL olarak kaydedilen tutarlar, seçilen para birimine güncel TRY kuru ile çevrilerek gösterilir.",
    "preferences.try": "Türk Lirası (₺)",
    "preferences.tryDescription": "₺ sembolü ve Türkçe sayı formatı.",
    "preferences.usd": "Dolar ($)",
    "preferences.usdDescription": "$ sembolü ve dolar gösterimi.",
    "preferences.eur": "Euro (€)",
    "preferences.eurDescription": "€ sembolü ve euro gösterimi.",
    "preferences.language": "Dil",
    "preferences.languageDescription": "Uygulama arayüz dilini seçin.",
    "preferences.turkish": "Türkçe",
    "preferences.english": "English",
    "preferences.rateLoading": "Güncel kur alınıyor.",
    "preferences.rateError": "Güncel kur alınamadı; varsa son kayıtlı kur kullanılır.",
    "preferences.rateDate": "Kur tarihi",
    "preferences.refreshRate": "Kuru yenile",
    "dashboard.eyebrow": "Finans özeti",
    "dashboard.title": "Genel görünüm",
    "dashboard.description": "Gelir, gider, net bakiye, son işlemler ve kategori bazlı dağılımlar.",
    "dashboard.totalIncome": "Toplam gelir",
    "dashboard.totalExpense": "Toplam gider",
    "dashboard.netBalance": "Net bakiye",
    "dashboard.budgetUsage": "Bütçe kullanımı",
    "dashboard.recentTransactions": "Son işlemler",
    "dashboard.budgetStatus": "Bütçe durumu",
    "dashboard.incomeDistribution": "Kategori bazlı gelir dağılımı",
    "dashboard.expenseDistribution": "Kategori bazlı gider dağılımı",
    "dashboard.noIncomeCategory": "Henüz kategorili gelir işlemi yok.",
    "dashboard.noExpenseCategory": "Henüz kategorili gider işlemi yok.",
    "dashboard.loading": "Dashboard verileri yükleniyor.",
    "dashboard.error": "Dashboard verileri alınamadı. Backend çalışıyor mu?",
    "dashboard.noTransactions": "Henüz işlem yok. İlk gelir veya giderini İşlemler sayfasından ekleyebilirsin.",
    "dashboard.categoryHighlights": "Kategori öne çıkanları",
    "dashboard.categoryHighlightsDescription": "İşlemler sayfasındaki kayıtlar seçilen aya göre toplanır.",
    "dashboard.topExpenseCategory": "En Çok Harcanan Kategori",
    "dashboard.topIncomeCategory": "En Çok Gelir Gelen Kategori",
    "dashboard.noDataThisMonth": "Bu ay veri yok",
    "dashboard.selectedMonthExpense": "gideri",
    "dashboard.selectedMonthIncome": "geliri",
    "dashboard.noComparison": "Karşılaştırma verisi yok",
    "dashboard.comparedToPreviousMonth": "geçen aya göre",
    "reports.eyebrow": "Rapor",
    "reports.title": "Aylık rapor",
    "reports.description": "Gelir, gider, kategori kırılımı ve işlem dökümünü tek ekranda incele.",
    "reports.summary": "Özet",
    "reports.period": "Dönem",
    "reports.totalIncome": "Toplam gelir",
    "reports.totalExpense": "Toplam gider",
    "reports.netBalance": "Net bakiye",
    "reports.transactionList": "İşlem dökümü",
    "reports.incomeByCategory": "Kategori bazlı gelirler",
    "reports.expensesByCategory": "Kategori bazlı giderler",
    "reports.downloadPdf": "PDF indir",
    "reports.downloadExcel": "Excel indir",
    "reports.preparingPdf": "PDF hazırlanıyor",
    "reports.preparingExcel": "Excel hazırlanıyor",
    "reports.exportError": "Rapor dışa aktarılırken bir sorun oluştu.",
    "reports.loading": "Rapor verileri yükleniyor.",
    "reports.error": "Rapor verileri alınamadı. Backend çalışıyor mu?",
    "reports.noData": "Bu dönemde kayıtlı veri bulunamadı.",
    "reports.noTransactions": "Bu dönemde kayıtlı işlem yok.",
    "reports.noIncomeCategory": "Bu dönemde kategorili gelir işlemi yok.",
    "reports.noExpenseCategory": "Bu dönemde kategorili gider işlemi yok.",
    "transactions.eyebrow": "İşlem yönetimi",
    "transactions.title": "Gelir ve giderler",
    "transactions.description": "Gelir ve gider kayıtlarını ekle, düzenle, filtrele ve takip et.",
    "categories.eyebrow": "Kategori yönetimi",
    "categories.title": "Kategoriler",
    "categories.description": "Gelir ve gider kategorilerini oluştur, düzenle ve yönet.",
    "budgets.eyebrow": "Bütçe yönetimi",
    "budgets.title": "Bütçeler",
    "budgets.description": "Kategori bazlı aylık bütçe limitleri belirle ve harcama durumunu izle.",
    "assistant.eyebrow": "Asistan",
    "assistant.title": "AI Asistan",
    "assistant.description": "Finans verilerin ve uygulama kullanımı hakkında serbestçe sohbet et.",
    "investment.eyebrow": "Simülasyon",
    "investment.title": "Yatırım Simülasyonları",
    "investment.description": "Kullanmak istediğin simülasyon türünü seç.",
    "portfolio.eyebrow": "Simülasyon",
    "portfolio.title": "Portföy Backtest",
    "portfolio.description": "Risk, vade ve tutara göre geçmiş fiyat verileriyle teorik portföy performansını incele.",
    "strategy.eyebrow": "Simülasyon",
    "strategy.title": "Strateji Laboratuvarı",
    "strategy.description": "Stratejileri aynı dönemde karşılaştır ve farklı risk profillerini analiz et.",
    "crisis.eyebrow": "Simülasyon",
    "crisis.title": "Kriz Senaryosu",
    "crisis.description": "Kriz dönemlerinde seçili varlığın teorik performansını incele."
  },
  en: {
    "common.dashboard": "Dashboard",
    "common.transactions": "Transactions",
    "common.categories": "Categories",
    "common.budgets": "Budgets",
    "common.reports": "Reports",
    "common.preferences": "Preferences",
    "common.assistant": "AI Assistant",
    "common.investmentSimulations": "Investment Simulations",
    "common.portfolioBacktest": "Portfolio Backtest",
    "common.strategyLab": "Strategy Lab",
    "common.crisisScenarios": "Crisis Scenarios",
    "common.loading": "Loading.",
    "common.error": "Something went wrong.",
    "common.noData": "No data.",
    "common.refresh": "Refresh",
    "common.month": "Month",
    "common.all": "All",
    "common.income": "Income",
    "common.expense": "Expense",
    "common.amount": "Amount",
    "common.date": "Date",
    "common.description": "Description",
    "common.category": "Category",
    "common.type": "Type",
    "common.action": "Action",
    "common.noDescription": "No description",
    "common.noCategory": "No category",
    "common.openingNote": "Track monthly budget usage and category distribution in one view.",
    "preferences.title": "Application settings",
    "preferences.description": "Adjust the Credentia interface to match how you use it.",
    "preferences.appearance": "Appearance",
    "preferences.appearanceDescription": "Choose the application theme. Your preference is saved in this browser.",
    "preferences.lightTheme": "Light theme",
    "preferences.lightThemeDescription": "A bright interface suitable for daytime use.",
    "preferences.darkTheme": "Dark theme",
    "preferences.darkThemeDescription": "A darker interface with lower brightness.",
    "preferences.dashboardView": "Dashboard View",
    "preferences.dashboardViewDescription": "Show only the core financial summary or include advanced analytics cards.",
    "preferences.simple": "Simple",
    "preferences.simpleDescription": "Only the core financial summary, recent transactions and category chart.",
    "preferences.detailed": "Detailed",
    "preferences.detailedDescription": "Advanced analytics cards in addition to the core summary.",
    "preferences.currency": "Currency",
    "preferences.currencyDescription": "Amounts saved in TRY are displayed in the selected currency using the current TRY rate.",
    "preferences.try": "Turkish Lira (₺)",
    "preferences.tryDescription": "₺ symbol and Turkish number format.",
    "preferences.usd": "Dollar ($)",
    "preferences.usdDescription": "$ symbol and dollar display.",
    "preferences.eur": "Euro (€)",
    "preferences.eurDescription": "€ symbol and euro display.",
    "preferences.language": "Language",
    "preferences.languageDescription": "Choose the application interface language.",
    "preferences.turkish": "Türkçe",
    "preferences.english": "English",
    "preferences.rateLoading": "Fetching the latest rate.",
    "preferences.rateError": "Latest rate could not be fetched; the last saved rate is used if available.",
    "preferences.rateDate": "Rate date",
    "preferences.refreshRate": "Refresh rate",
    "dashboard.eyebrow": "Financial summary",
    "dashboard.title": "Overview",
    "dashboard.description": "Income, expenses, net balance, recent transactions and category distributions.",
    "dashboard.totalIncome": "Total income",
    "dashboard.totalExpense": "Total expense",
    "dashboard.netBalance": "Net balance",
    "dashboard.budgetUsage": "Budget usage",
    "dashboard.recentTransactions": "Recent transactions",
    "dashboard.budgetStatus": "Budget status",
    "dashboard.incomeDistribution": "Income distribution by category",
    "dashboard.expenseDistribution": "Expense distribution by category",
    "dashboard.noIncomeCategory": "No categorized income transactions yet.",
    "dashboard.noExpenseCategory": "No categorized expense transactions yet.",
    "dashboard.loading": "Dashboard data is loading.",
    "dashboard.error": "Dashboard data could not be loaded. Is the backend running?",
    "dashboard.noTransactions": "No transactions yet. Add your first income or expense from the Transactions page.",
    "dashboard.categoryHighlights": "Category highlights",
    "dashboard.categoryHighlightsDescription": "Records from the Transactions page are grouped by the selected month.",
    "dashboard.topExpenseCategory": "Top Expense Category",
    "dashboard.topIncomeCategory": "Top Income Category",
    "dashboard.noDataThisMonth": "No data this month",
    "dashboard.selectedMonthExpense": "expenses",
    "dashboard.selectedMonthIncome": "income",
    "dashboard.noComparison": "No comparison data",
    "dashboard.comparedToPreviousMonth": "compared to previous month",
    "reports.eyebrow": "Report",
    "reports.title": "Monthly report",
    "reports.description": "Review income, expenses, category breakdowns and transaction details in one place.",
    "reports.summary": "Summary",
    "reports.period": "Period",
    "reports.totalIncome": "Total income",
    "reports.totalExpense": "Total expense",
    "reports.netBalance": "Net balance",
    "reports.transactionList": "Transaction list",
    "reports.incomeByCategory": "Income by category",
    "reports.expensesByCategory": "Expenses by category",
    "reports.downloadPdf": "Download PDF",
    "reports.downloadExcel": "Download Excel",
    "reports.preparingPdf": "Preparing PDF",
    "reports.preparingExcel": "Preparing Excel",
    "reports.exportError": "A problem occurred while exporting the report.",
    "reports.loading": "Report data is loading.",
    "reports.error": "Report data could not be loaded. Is the backend running?",
    "reports.noData": "No records found for this period.",
    "reports.noTransactions": "No transactions found for this period.",
    "reports.noIncomeCategory": "No categorized income transactions for this period.",
    "reports.noExpenseCategory": "No categorized expense transactions for this period.",
    "transactions.eyebrow": "Transaction management",
    "transactions.title": "Income and expenses",
    "transactions.description": "Add, edit, filter and track income and expense records.",
    "categories.eyebrow": "Category management",
    "categories.title": "Categories",
    "categories.description": "Create, edit and manage income and expense categories.",
    "budgets.eyebrow": "Budget management",
    "budgets.title": "Budgets",
    "budgets.description": "Set category-based monthly budget limits and track spending status.",
    "assistant.eyebrow": "Assistant",
    "assistant.title": "AI Assistant",
    "assistant.description": "Chat freely about your finance data and application usage.",
    "investment.eyebrow": "Simulation",
    "investment.title": "Investment Simulations",
    "investment.description": "Choose the simulation type you want to use.",
    "portfolio.eyebrow": "Simulation",
    "portfolio.title": "Portfolio Backtest",
    "portfolio.description": "Review theoretical portfolio performance using historical price data by risk, period and amount.",
    "strategy.eyebrow": "Simulation",
    "strategy.title": "Strategy Lab",
    "strategy.description": "Compare strategies across the same period and analyze different risk profiles.",
    "crisis.eyebrow": "Simulation",
    "crisis.title": "Crisis Scenarios",
    "crisis.description": "Review the theoretical performance of the selected asset during crisis periods."
  }
};

export function normalizeLanguage(value: string | null | undefined): LanguageCode {
  return value === "en" ? "en" : "tr";
}

export function translate(language: LanguageCode, key: TranslationKey): string {
  return translations[language]?.[key] ?? translations.tr[key] ?? key;
}
