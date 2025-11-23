import { TimelineData } from './types';

// Hardcoded data matching the provided image for the "Convert to Web Page" requirement
export const INITIAL_DATA: TimelineData = {
  title: "XX Product Development Plan",
  startDate: "2024-07-01",
  endDate: "2025-12-31",
  rows: [
    { id: "milestones", label: "里程碑 (Milestones)", height: 120 },
    { id: "dev_plan", label: "开发计划 (Dev Plan)", height: 100 },
    { id: "sample_plan", label: "制样计划 (Sample Plan)", height: 100 },
    { id: "verify_plan", label: "验证计划 (Validation)", height: 100 },
  ],
  items: [
    // Milestones
    { id: "m1", rowId: "milestones", label: "定点", date: "2024-07-22", type: "milestone" },
    { id: "m2", rowId: "milestones", label: "A1样", date: "2024-11-04", type: "milestone" },
    { id: "m3", rowId: "milestones", label: "A2样", date: "2025-02-01", type: "milestone" },
    { id: "m4", rowId: "milestones", label: "B样", date: "2025-04-28", type: "milestone" },
    { id: "m5", rowId: "milestones", label: "C样", date: "2025-06-09", type: "milestone" },
    { id: "m6", rowId: "milestones", label: "PPAP", date: "2025-10-27", type: "milestone", isCritical: true },

    // Dev Plan
    { id: "d1", rowId: "dev_plan", label: "项目启动", date: "2024-08-05", type: "milestone" },
    { id: "d2", rowId: "dev_plan", label: "TR-A", date: "2024-09-02", type: "milestone" },
    { id: "d3", rowId: "dev_plan", label: "DF-A", date: "2025-01-20", type: "milestone" },
    { id: "d4", rowId: "dev_plan", label: "TR-B", date: "2025-02-24", type: "milestone" },
    { id: "d5", rowId: "dev_plan", label: "DF-B", date: "2025-04-14", type: "milestone" },

    // Sample Plan (Ranges)
    { id: "s1", rowId: "sample_plan", label: "A1样生产", date: "2024-09-09", endDate: "2024-10-23", type: "range", color: "#84cc16" }, // Lime-500
    { id: "s2", rowId: "sample_plan", label: "A2样生产", date: "2024-12-16", endDate: "2025-01-13", type: "range", color: "#84cc16" },
    { id: "s3", rowId: "sample_plan", label: "B样生产", date: "2025-03-01", endDate: "2025-04-16", type: "range", color: "#84cc16" },

    // Verification Plan (Ranges)
    { id: "v1", rowId: "verify_plan", label: "A1样测试", date: "2024-10-28", endDate: "2024-12-02", type: "range", color: "#84cc16" },
    { id: "v2", rowId: "verify_plan", label: "DV & 强检测试", date: "2025-04-21", endDate: "2025-05-19", type: "range", color: "#84cc16" },
    { id: "v3", rowId: "verify_plan", label: "PV测试", date: "2025-07-01", endDate: "2025-10-20", type: "range", color: "#84cc16" },
  ]
};
