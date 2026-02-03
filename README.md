## How to run

### To run tests
npx playwright test 

### To generate reports
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report

### To generate excel
npx tsx export-allure-to-excel.ts
