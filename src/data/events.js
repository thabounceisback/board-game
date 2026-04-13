// src/data/events.js
export const EVENTS = {
  risk: [
    { text: "Material misstatement detected in revenue!", type: "risk_choice", quickGood: "False positive — advance 2!", quickBad: "Minor error — go back 1.", deepGood: "You traced it to fraud — advance 4!", deepBad: "Pervasive. Go back 4 while you expand testing." },
    { text: "Client changed ERP systems mid-year. How's your data extraction?", type: "risk_choice", quickGood: "Good enough for now — advance 2!", quickBad: "Schema mismatch. Go back 1.", deepGood: "CDM pipeline handles it perfectly — advance 4!", deepBad: "Full rebuild required. Go back 4." },
    { text: "Unusual journal entry patterns flagged by risk scoring.", type: "risk_choice", quickGood: "Probably fine — advance 2!", quickBad: "Worth noting. Go back 1.", deepGood: "Fraud confirmed and documented — advance 4!", deepBad: "Model misfire — wasted time. Go back 3." },
    { text: "Related party transactions surfaced in GL analysis.", type: "risk_choice", quickGood: "Likely disclosed — advance 2!", quickBad: "Need more info. Go back 1.", deepGood: "Fully substantiated — advance 4!", deepBad: "Undisclosed. Expand scope. Go back 4." },
  ],
  recon: [
    { text: "GL-to-TB reconciliation: Does your total match?", type: "recon_choice", manualGood: "Reconciled! Advance 2!", manualBad: "Off by $4.2M. Go back 1.", autoGood: "Pipeline ties perfectly — advance 4!", autoBad: "Automation missed FX adjustments. Go back 3." },
    { text: "Subledger-to-GL recon — can you tie it out?", type: "recon_choice", manualGood: "Manual tie-out complete — advance 2!", manualBad: "Currency gaps. Go back 1.", autoGood: "Script handles all entities — advance 4!", autoBad: "Timeout on large dataset. Go back 3." },
    { text: "Intercompany elimination check across entities.", type: "recon_choice", manualGood: "All eliminations balance — advance 2!", manualBad: "Orphaned entry in Entity 3. Go back 1.", autoGood: "Automated check passes all entities — advance 4!", autoBad: "Logic error in elimination script. Go back 3." },
  ],
  sampling: [
    { text: "Statistical sampling time — pick your confidence level.", type: "sampling_choice" },
    { text: "Testing disbursements — how deep are you going?", type: "sampling_choice" },
    { text: "Revenue sample selection — choose your approach.", type: "sampling_choice" },
  ],
  materiality: [
    { text: "Planning materiality recalculation triggered!", advance: 3 },
    { text: "Performance materiality vs. overall materiality check.", advance: 1 },
  ],
  data_quality: [
    { text: "Data completeness check on GL extract.", type: "dice", good: "100% complete — advance 2!", bad: "Missing 2 months. Go back 3 to re-extract." },
    { text: "Duplicate detection scan on journal entries.", type: "dice", good: "Clean data — advance 1!", bad: "15,000 duplicate rows. Go back 1." },
    { text: "Data type validation across CDM fields.", type: "dice", good: "All fields conform — advance 2!", bad: "Date fields stored as strings. Go back 1." },
  ],
  insight: [
    { text: "Your Claude API analysis surfaces a key finding!", advance: 3 },
    { text: "Automated trend analysis reveals a cost optimization. Client loves it!", advance: 2 },
    { text: "Your PySpark notebook runs 10x faster than last year's approach!", advance: 2 },
    { text: "Risk scoring model catches what manual review missed!", advance: 3 },
  ],
  shortcut: [
    { text: "You automated the entire procedure with pyod! Skip ahead!", advance: 4 },
    { text: "Databricks pipeline completes overnight. Jump forward!", advance: 3 },
    { text: "Reusable notebook from prior engagement saves days!", advance: 3 },
  ],
  setback: [
    { text: "Databricks cluster timed out during peak hours.", advance: -3 },
    { text: "Client sent wrong GL extract — back to data intake.", advance: -4 },
    { text: "Notebook code review found a PySpark anti-pattern.", advance: -2 },
  ],
  boss: [
    { text: "PARTNER REVIEW: Present your findings to the engagement partner!", type: "boss", pass: "Partner signs off — advance 4!", fail: "Partner has 12 review notes. Go back 3." },
  ],
};
