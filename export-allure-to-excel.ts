import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

interface AllureResult {
  uuid: string;
  name: string;
  status: "passed" | "failed" | "broken" | "skipped";
  stage: string;
  start: number;
  stop: number;
  fullName?: string;
  labels?: Array<{ name: string; value: string }>;
  statusDetails?: {
    message?: string;
    trace?: string;
  };
}

function exportAllureToExcel(
  resultsDir: string = "./allure-results",
  outputFile: string = "./test-results.xlsx"
) {
  // Read all result files
  const files = fs
    .readdirSync(resultsDir)
    .filter((f) => f.endsWith("-result.json"));

  console.log(`Found ${files.length} test result files`);

  const results: AllureResult[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(resultsDir, file), "utf-8");
      const result: AllureResult = JSON.parse(content);
      results.push(result);
    } catch (error) {
      console.warn(`Could not parse ${file}:`, error);
    }
  }

  // Sort by start time
  results.sort((a, b) => a.start - b.start);

  // Prepare test results data
  const testData = results.map((result) => {
    const duration = ((result.stop - result.start) / 1000).toFixed(2);
    const suite = result.labels?.find((l) => l.name === "suite")?.value || "";
    const feature =
      result.labels?.find((l) => l.name === "feature")?.value || "";

    return {
      "Test Name": result.name,
      Status: result.status.toUpperCase(),
      "Duration (s)": parseFloat(duration),
      Suite: suite,
      Feature: feature,
      "Start Time": new Date(result.start).toLocaleString(),
      "End Time": new Date(result.stop).toLocaleString(),
      "Error Message": result.statusDetails?.message || "",
    };
  });

  // Calculate summary
  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter(
    (r) => r.status === "failed" || r.status === "broken"
  ).length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const totalDuration =
    results.reduce((acc, r) => acc + (r.stop - r.start), 0) / 1000;
  const passRate =
    results.length > 0 ? ((passed / results.length) * 100).toFixed(1) : "0";

  const summaryData = [
    { Metric: "Total Tests", Value: results.length },
    { Metric: "Passed", Value: passed },
    { Metric: "Failed", Value: failed },
    { Metric: "Skipped", Value: skipped },
    { Metric: "Pass Rate", Value: `${passRate}%` },
    { Metric: "Total Duration (s)", Value: totalDuration.toFixed(2) },
    { Metric: "Report Generated", Value: new Date().toLocaleString() },
  ];

  // Create workbook and sheets
  const workbook = XLSX.utils.book_new();

  // Add Test Results sheet
  const testSheet = XLSX.utils.json_to_sheet(testData);

  // Set column widths
  testSheet["!cols"] = [
    { wch: 50 }, // Test Name
    { wch: 12 }, // Status
    { wch: 14 }, // Duration
    { wch: 30 }, // Suite
    { wch: 25 }, // Feature
    { wch: 22 }, // Start Time
    { wch: 22 }, // End Time
    { wch: 60 }, // Error Message
  ];

  XLSX.utils.book_append_sheet(workbook, testSheet, "Test Results");

  // Add Summary sheet
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Write file
  XLSX.writeFile(workbook, outputFile);
  console.log(`✅ Excel report saved to: ${outputFile}`);
}

// Run the export
const resultsDir = process.argv[2] || "./allure-results";
const outputFile = process.argv[3] || "./test-results.xlsx";

exportAllureToExcel(resultsDir, outputFile);
